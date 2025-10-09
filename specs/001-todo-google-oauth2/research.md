# Research: TODO Management Application

**Feature**: 001-todo-google-oauth2
**Date**: 2025-10-09
**Purpose**: Resolve technical uncertainties and establish best practices for implementation

## Resolved Clarifications

### 1. Expected Concurrent Users

**Decision**: Start with 100-1000 concurrent users as initial target

**Rationale**:
- Personal TODO application typical usage patterns: low concurrent access per user
- Google OAuth2 session management handles auth scalability
- PostgreSQL + Rails can handle 1000 concurrent users with standard configuration
- React SPA reduces server load (API-only backend)
- Can scale horizontally if needed (add app servers, DB read replicas)

**Alternatives Considered**:
- 10,000+ users: Over-engineering for MVP, would require load balancing, caching layer (Redis), CDN setup
- <100 users: Under-specifies scalability, wouldn't validate performance under realistic load

**Impact on Architecture**:
- Single PostgreSQL instance sufficient
- Connection pooling: 25-50 connections (Rails default acceptable)
- No immediate need for caching layer (can add later if needed)
- Standard Puma/Unicorn server configuration

---

## Technology Best Practices

### Google OAuth2 Integration (Rails)

**Decision**: Use `omniauth-google-oauth2` gem with JWT token-based authentication

**Architecture Change**: After OAuth2 callback, issue JWT tokens instead of session cookies

**Best Practices**:
- Store only Google user ID + email in database (no password fields)
- **OAuth callback issues JWT access token + refresh token**
- Frontend stores JWT in memory/localStorage (access) and httpOnly cookie (refresh)
- CSRF protection via JWT signature verification
- Access token expiration: 15 minutes (short-lived for security)
- Refresh token expiration: 7 days (long-lived, stored in httpOnly cookie)
- Callback URL whitelisting in Google Cloud Console

**Key Configuration**:
```ruby
# config/initializers/omniauth.rb
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2, ENV['GOOGLE_CLIENT_ID'], ENV['GOOGLE_CLIENT_SECRET'],
    {
      scope: 'email,profile',
      prompt: 'select_account',
      image_aspect_ratio: 'square',
      image_size: 50
    }
end

# JWT token generation (using jwt gem)
# config/initializers/jwt.rb
JWT_SECRET = Rails.application.credentials.jwt_secret_key || ENV['JWT_SECRET_KEY']
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRATION = 15.minutes
REFRESH_TOKEN_EXPIRATION = 7.days
```

**Token Flow**:
1. User authenticates via Google OAuth2
2. Backend receives OAuth callback with user info
3. Backend creates/updates User record
4. Backend generates JWT access token (15min) + refresh token (7d)
5. Backend returns tokens to frontend (access in JSON, refresh in httpOnly cookie)
6. Frontend stores access token in memory/localStorage
7. Frontend includes `Authorization: Bearer <token>` on all API requests
8. Backend verifies JWT signature on each request
9. When access token expires (401), frontend calls `/auth/refresh` with refresh token
10. Backend issues new access token if refresh token valid

**Security Considerations**:
- Client ID/secret in environment variables (never committed)
- JWT secret key in Rails credentials or environment variable
- SSL/TLS required in production for token transmission
- CORS configuration for frontend domain only
- Refresh token rotation: issue new refresh token on each refresh (optional)
- Token revocation: blacklist tokens in Redis/database (optional for MVP)

---

### React + Rails API Integration

**Decision**: Axios for HTTP client with JWT bearer token authentication

**Best Practices**:
- API base URL from environment variable (`REACT_APP_API_URL`)
- Axios interceptors for:
  - **JWT Bearer token injection in Authorization header**
  - **Automatic token refresh on 401 responses**
  - Global error handling (401 after refresh fails → login redirect)
  - Request/response logging (dev only)
- Service layer pattern: `todoService.js`, `authService.js`, `tokenService.js`
- React Query or SWR for data fetching/caching (optional, improves UX)

**JWT Token Management**:
```javascript
// services/tokenService.js
export const getAccessToken = () => localStorage.getItem('access_token');
export const setAccessToken = (token) => localStorage.setItem('access_token', token);
export const clearTokens = () => localStorage.removeItem('access_token');

// services/api.js
import { getAccessToken, setAccessToken } from './tokenService';

// Request interceptor: inject JWT token
api.interceptors.request.use(
  config => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and not already retried, try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token stored in httpOnly cookie, sent automatically
        const { data } = await axios.post('/api/v1/auth/refresh');
        setAccessToken(data.access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

### Database Choice: SQLite vs PostgreSQL/MySQL

**Decision**: Use SQLite 3.x as embedded database in backend container

**Rationale**:
- **Simplicity**: No separate database container needed, reduces Docker Compose complexity
- **Development parity**: Same database used in dev/test/production (if deploying to single server)
- **Zero configuration**: Works out of the box with Rails, no connection pooling setup needed
- **File-based**: Database stored as single file, easy to backup/restore
- **Performance**: Sufficient for 100-1000 concurrent users with proper indexing
- **Lightweight**: Minimal resource overhead compared to PostgreSQL server process

**Limitations Acknowledged**:
- **Concurrent writes**: SQLite uses database-level locking (not ideal for high write concurrency)
- **Horizontal scaling**: Cannot scale database across multiple servers
- **Advanced features**: No stored procedures, limited full-text search

**Mitigation**:
- Write concurrency: Acceptable for personal TODO app (mostly reads, occasional writes)
- Scaling: If growth exceeds single-server capacity, can migrate to PostgreSQL later
- Features: None of the advanced features needed for MVP

**Alternatives Considered**:
- **PostgreSQL**: More robust, better concurrency, but requires separate container and more complex setup
- **MySQL**: Similar to PostgreSQL, adds unnecessary complexity for this use case
- **In-memory (Redis)**: Not suitable for persistent TODO data

**Migration Path**: If needed, Rails makes it straightforward to switch from SQLite to PostgreSQL by changing `database.yml` and re-running migrations.

---

### Database Indexing Strategy (SQLite)

**Decision**: Index on foreign keys, filter columns, and sort columns

**Required Indexes**:
```sql
-- todos table
CREATE INDEX index_todos_on_user_id ON todos(user_id);
CREATE INDEX index_todos_on_user_id_and_priority_and_deadline
  ON todos(user_id, priority, deadline);
CREATE INDEX index_todos_on_user_id_and_created_at
  ON todos(user_id, created_at);  -- for tie-breaking
```

**Rationale**:
- `user_id`: Foreign key for user isolation queries
- `user_id + priority + deadline`: Composite index for default sort order
- `user_id + created_at`: Tie-breaking when priority/deadline match
- No index on completion_flag: Not used in WHERE clauses (only display)

**Performance Impact (SQLite)**:
- Query time with 5000 items: <50ms (well under 200ms target)
- Index overhead: ~10-15% storage increase (acceptable)
- SQLite query planner efficiently uses composite indexes

---

### Pagination vs. Full List Load

**Decision**: Load full TODO list (no pagination) given 5000 item constraint

**Rationale**:
- Spec requires <2s list load with 5000 items
- 5000 records * ~200 bytes JSON = ~1MB payload (acceptable for modern browsers)
- Frontend filtering/sorting happens instantly (no server round-trip)
- Simplifies implementation (no pagination UI/logic)
- Aligns with "personal TODO list" use case (users want to see all items)

**Alternatives Considered**:
- Pagination (20-50 items/page): Adds complexity, worse UX for power users, breaks "view all" requirement
- Virtual scrolling: Adds complexity, only needed for 10k+ items

**If Scaling Needed**:
- Implement pagination when users regularly exceed 2000 items
- Add search/filtering to backend to reduce payload size

---

### Priority Storage Implementation (SQLite)

**Decision**: String column with CHECK constraint for type safety

**Implementation**:
```ruby
# db/migrate/xxx_create_todos.rb
create_table :todos do |t|
  t.string :priority, null: false, default: 'medium'
  # Add CHECK constraint for valid values
end

# In migration, add:
execute <<-SQL
  CREATE TABLE todos (
    ...
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
    ...
  );
SQL
```

**Rationale**:
- **SQLite limitation**: No native ENUM type (unlike PostgreSQL)
- **CHECK constraint**: Database-level validation prevents invalid values
- **String storage**: Simple, compatible with Rails ActiveRecord enums
- **Sort order**: Use Rails enum integer mapping for sorting (high=0, medium=1, low=2)

**Rails Model**:
```ruby
class Todo < ApplicationRecord
  enum priority: { high: 0, medium: 1, low: 2 }

  # Scopes use integer values internally for efficient sorting
  scope :sorted, -> { order(priority: :asc, deadline: :asc, created_at: :asc) }
end
```

**Frontend Mapping**:
```javascript
const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', sortOrder: 0 },
  { value: 'medium', label: 'Medium', sortOrder: 1 },
  { value: 'low', label: 'Low', sortOrder: 2 }
];
```

**Note**: Rails `enum` stores integers in database but exposes as strings in API/code. SQLite stores as INTEGER (0, 1, 2) for efficient sorting.

---

### Date Handling

**Decision**:
- Database: `DATE` type (not `TIMESTAMP`)
- Backend: Ruby `Date` class
- Frontend: `date-fns` library for formatting/parsing

**Best Practices**:
- Store dates in UTC (PostgreSQL default)
- Frontend displays in user's local timezone (browser handles conversion)
- API format: ISO 8601 date strings (`YYYY-MM-DD`)
- Calendar picker: HTML5 `<input type="date">` or library (react-datepicker)

**Validation**:
- Backend: Date format validation in Rails model
- Frontend: Native HTML5 validation + custom logic for past dates (allowed per spec)

---

### Session Expiration Handling

**Decision**: JWT token refresh flow with automatic retry

**Implementation Strategy**:
1. Backend: Access tokens expire after 15 minutes, refresh tokens after 7 days
2. Frontend: Axios interceptor catches 401 responses
3. On 401: Automatically attempt token refresh using refresh token (httpOnly cookie)
4. If refresh succeeds: Retry original request with new access token
5. If refresh fails (expired/invalid): Clear tokens, redirect to login

**Token Storage**:
- **Access Token**: localStorage (15min lifetime, included in Authorization header)
- **Refresh Token**: httpOnly cookie (7 day lifetime, auto-sent on /auth/refresh)

**User Experience**:
- Seamless: Token refresh happens automatically in background
- No interruption: User doesn't see errors during valid refresh
- Clean logout: When refresh token expires, user redirected to login
- Any form data in progress is lost if refresh fails (per clarification decision)

**Security Improvements over Session-Based**:
- Stateless: No server-side session storage needed (scales horizontally)
- Short-lived access tokens: Reduced window for token theft
- HttpOnly refresh tokens: Protected from XSS attacks
- Can implement token revocation list if needed (optional for MVP)

---

## Testing Strategy

### Test Data Generation

**Decision**: FactoryBot for backend, MSW (Mock Service Worker) for frontend

**Backend Factories**:
```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    google_id { SecureRandom.uuid }
    email { Faker::Internet.email }
    name { Faker::Name.name }
  end
end

# spec/factories/todos.rb
FactoryBot.define do
  factory :todo do
    association :user
    name { Faker::Lorem.sentence(word_count: 3) }
    priority { %w[high medium low].sample }
    deadline { Faker::Date.forward(days: 30) }
    completed { false }
  end
end
```

**Frontend Mocks**:
- MSW intercepts API calls in tests
- Returns consistent mock data matching OpenAPI schema
- Enables testing without backend running

### Performance Testing

**Tools**:
- Backend: `rack-mini-profiler`, `bullet` (N+1 detection)
- Frontend: Lighthouse CI, Chrome DevTools
- Load testing: Apache Bench or k6 for API endpoint stress tests

**Target Metrics** (from spec):
- API p95: <200ms
- List load (5000 items): <2s
- Frontend FCP: <1.5s, TTI: <3s

---

## Accessibility Implementation

**WCAG 2.1 AA Requirements**:

1. **Semantic HTML**:
   - `<button>` for actions, `<input type="checkbox">` for completion
   - `<main>`, `<nav>`, `<form>` landmarks
   - Proper heading hierarchy (`<h1>` → `<h2>` → `<h3>`)

2. **ARIA Labels**:
   - Checkbox: `aria-label="Mark TODO as complete"`
   - Date picker: `aria-label="Select deadline"`
   - Priority dropdown: `aria-label="Select priority level"`
   - Filter: `aria-label="Filter by priority"`

3. **Keyboard Navigation**:
   - Tab order: Login → TODO list → Filter → Create button → Form fields
   - Enter key: Submit forms, toggle checkboxes
   - Escape key: Close modals
   - Arrow keys: Navigate calendar picker

4. **Color Contrast**:
   - Text: 4.5:1 minimum ratio
   - Interactive elements: 3:1 minimum ratio
   - Visual indicators beyond color (icons, text labels)

5. **Focus Indicators**:
   - Visible focus ring on all interactive elements
   - `:focus-visible` for keyboard-only focus styling

**Testing**:
- axe-core automated accessibility testing in CI
- Manual keyboard navigation testing
- Screen reader testing (VoiceOver/NVDA)

---

## Docker Compose Architecture

### Decision: Containerized Development Environment

**Decision**: Use Docker Compose for all development with separate containers for frontend, backend, and database

**Rationale**:
- **Local environment independence**: No need to install Ruby, Node.js, PostgreSQL locally
- **Consistency**: All developers use identical environment (same Ruby version, same Node version, same PostgreSQL version)
- **Easy onboarding**: `docker-compose up` starts entire stack
- **Production parity**: Development containers match production runtime closely
- **Isolation**: Dependencies don't pollute host machine

**Container Architecture**:
```
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │   Backend    │   │
│  │   (React)    │  │   (Rails)    │   │
│  │   Node 18    │  │   Ruby 3.x   │   │
│  │   Port 3001  │  │   Port 3000  │   │
│  └──────────────┘  │   + SQLite   │   │
│         │          └──────────────┘   │
│         └──────────┬                   │
│                    ▼                   │
│         (API calls over HTTP)          │
│                                        │
│  Volumes:                              │
│  - ./backend → /app (backend)          │
│  - ./frontend → /app (frontend)        │
│  - sqlite_data → /app/db (DB file)     │
└────────────────────────────────────────┘
```

**Container Definitions**:

1. **Backend Container**:
   - Base image: `ruby:3.2-alpine`
   - Working directory: `/app`
   - Volume: `./backend:/app` (bind mount for hot reload)
   - Volume: `sqlite_data:/app/db` (persistent SQLite database file)
   - Exposed port: 3000 (maps to host 3000)
   - Database: SQLite embedded (no separate container)
   - Command: `bundle exec rails server -b 0.0.0.0`

2. **Frontend Container**:
   - Base image: `node:18-alpine`
   - Working directory: `/app`
   - Volume: `./frontend:/app` (bind mount for hot reload)
   - Exposed port: 3001 (maps to host 3001)
   - Dependencies: Backend container
   - Command: `npm start`

**Development Workflow**:
```bash
# Start all containers
docker-compose up

# Run Rails commands in container
docker-compose exec backend rails db:migrate
docker-compose exec backend rails console
docker-compose exec backend bundle exec rspec

# Run npm commands in container
docker-compose exec frontend npm install
docker-compose exec frontend npm test
docker-compose exec frontend npm run lint

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop containers (preserve volumes)
docker-compose stop

# Stop and remove containers + volumes
docker-compose down -v
```

**Alternatives Considered**:
- **Local installation**: Rejected due to environment inconsistency, complex setup, version conflicts
- **Vagrant**: Rejected due to heavier resource usage, slower than Docker
- **Dev containers (VS Code)**: Could be added later, but Docker Compose provides IDE-agnostic solution

---

## Deployment Considerations

### Environment Setup

**Development** (Docker Compose):
- 2 containers: frontend, backend (SQLite embedded in backend)
- `.env` files for configuration (gitignored)
- Seed data script for local testing
- Volume mounts for hot reload
- Named volume for SQLite database file persistence

**Production** (assumed Heroku or similar PaaS):
- Rails: Puma server, 2-4 dynos
- PostgreSQL: Standard plan (10M rows, 64GB storage)
- Frontend: Netlify/Vercel or S3 + CloudFront
- Environment variables: Set in platform dashboard

### CI/CD Pipeline

**GitHub Actions Workflow**:
1. Linting (ESLint, RuboCop)
2. Unit tests (Jest, RSpec)
3. Integration tests (React Testing Library, RSpec requests)
4. E2E tests (Cypress) - on staging environment
5. Build (Rails assets, React production build)
6. Deploy (if all tests pass)

---

## Summary

All technical uncertainties resolved. Key decisions:
- **Development Environment**: Docker Compose with 2 containers (frontend, backend with embedded SQLite)
- **Database**: SQLite 3.x embedded in backend container (no separate DB container)
- **Concurrent users**: 100-1000 initial target (SQLite handles this well)
- **Auth**: omniauth-google-oauth2 with **JWT token-based authentication**
  - OAuth2 callback issues JWT access token (15min) + refresh token (7d)
  - Frontend uses Bearer token authentication
  - Automatic token refresh on expiration
- **Data loading**: Full list load (no pagination) for 5000 items
- **Priority storage**: Rails enum with INTEGER column (0=high, 1=medium, 2=low)
- **Testing**: FactoryBot + MSW, comprehensive coverage (unit/integration/E2E)
- **Accessibility**: WCAG 2.1 AA compliance with semantic HTML + ARIA
- **Local Dependencies**: None required (Ruby, Node, SQLite all in containers)

Ready to proceed to Phase 1: Data Model and API Contracts.
