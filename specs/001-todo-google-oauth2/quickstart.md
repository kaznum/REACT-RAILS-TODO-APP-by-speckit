# Quickstart Guide: TODO Management Application (Docker Compose)

**Feature**: 001-todo-google-oauth2
**Last Updated**: 2025-10-09
**Target Audience**: Developers setting up Docker-based development environment

## Prerequisites

### Required Software

- **Docker**: 20.10+ (check: `docker --version`)
- **Docker Compose**: 2.0+ (check: `docker-compose --version`)
- **Git**: 2.x+ (check: `git --version`)

**Note**: You do NOT need Ruby, Node.js, or PostgreSQL installed locally. Everything runs in containers.

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable **Google+ API** (required for OAuth2)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - Scopes: email, profile
6. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/api/v1/auth/google_oauth2/callback`
     - Production: `https://your-api-domain.com/api/v1/auth/google_oauth2/callback`
7. Save **Client ID** and **Client Secret** (you'll need these for `.env` file)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd REACT-RAILS-TODO-APP-by-speckit
git checkout 001-todo-google-oauth2
```

### 2. Environment Configuration

#### Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```bash
# Google OAuth2
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# Database (SQLite embedded in container)
DATABASE_URL=sqlite3:db/development.sqlite3

# Rails
SECRET_KEY_BASE=<generate with: docker-compose run --rm backend rails secret>
RAILS_ENV=development

# JWT Authentication
JWT_SECRET_KEY=<generate with: docker-compose run --rm backend rails secret>
JWT_ACCESS_TOKEN_EXPIRATION=900      # 15 minutes in seconds
JWT_REFRESH_TOKEN_EXPIRATION=604800  # 7 days in seconds
```

#### Frontend Environment

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```bash
# API URL (backend container)
REACT_APP_API_URL=http://localhost:3000/api/v1

# Frontend URL (for OAuth redirect)
REACT_APP_FRONTEND_URL=http://localhost:3001

# Optional: Feature flags
REACT_APP_ENABLE_DEBUG_MODE=true
```

### 3. Start All Containers

From repository root:

```bash
# Build and start all containers (first time)
docker-compose up --build

# OR start in detached mode (background)
docker-compose up -d --build
```

**What happens**:
1. Builds backend container (Ruby 3.2 + Rails dependencies + SQLite)
2. Builds frontend container (Node 18 + npm dependencies)
3. Creates Docker network for inter-container communication
4. Creates named volume for SQLite database persistence
5. Starts backend, then frontend
6. Backend runs on `http://localhost:3000` (SQLite embedded)
7. Frontend runs on `http://localhost:3001`

**Expected output**:
```
Creating network "react-rails-todo-app_default" ...
Creating volume "react-rails-todo-app_sqlite_data" ...
Creating react-rails-todo-app_backend_1 ... done
Creating react-rails-todo-app_frontend_1 ... done
```

### 4. Setup Database (First Time Only)

```bash
# Create database
docker-compose exec backend rails db:create

# Run migrations
docker-compose exec backend rails db:migrate

# (Optional) Load seed data
docker-compose exec backend rails db:seed
```

### 5. Verify Setup

1. Open browser to `http://localhost:3001`
2. Click "Sign in with Google"
3. Authenticate with Google account
4. You should be redirected to TODO list page
5. Try creating a TODO item

---

## Daily Development Workflow

### Starting Development

```bash
# Start all containers (if not already running)
docker-compose up

# OR start in background and follow logs
docker-compose up -d
docker-compose logs -f
```

### Stopping Development

```bash
# Stop containers (preserve data)
docker-compose stop

# OR stop and remove containers (preserve volumes)
docker-compose down

# OR stop and remove everything including database data (⚠️ DESTRUCTIVE)
docker-compose down -v
```

---

## Running Commands in Containers

**All development commands run inside containers**. Use `docker-compose exec <service> <command>`.

### Backend Commands (Rails)

```bash
# Rails console
docker-compose exec backend rails console

# Run migrations
docker-compose exec backend rails db:migrate

# Rollback migration
docker-compose exec backend rails db:rollback

# Generate migration
docker-compose exec backend rails generate migration AddFieldToTodos field:string

# View routes
docker-compose exec backend rails routes

# Install new gem
# 1. Add to backend/Gemfile
# 2. Run:
docker-compose exec backend bundle install
# 3. Rebuild container:
docker-compose up -d --build backend

# Rails server (already running via docker-compose)
# To restart:
docker-compose restart backend
```

### Frontend Commands (React)

```bash
# Install new npm package
# 1. Add to frontend/package.json
# 2. Run:
docker-compose exec frontend npm install
# OR rebuild container:
docker-compose up -d --build frontend

# Run npm scripts
docker-compose exec frontend npm run lint
docker-compose exec frontend npm run build

# Interactive shell in frontend container
docker-compose exec frontend sh
```

### Database Commands (SQLite)

```bash
# SQLite shell (from backend container)
docker-compose exec backend sqlite3 db/development.sqlite3

# Backup database (copy file from container)
docker cp todo_app_backend:/app/db/development.sqlite3 ./backup.sqlite3

# Restore database (copy file to container)
docker cp ./backup.sqlite3 todo_app_backend:/app/db/development.sqlite3

# View database file info
docker-compose exec backend ls -lh db/
```

---

## Running Tests

### Backend Tests (RSpec)

```bash
# Run all tests
docker-compose exec backend bundle exec rspec

# Run specific test file
docker-compose exec backend bundle exec rspec spec/models/todo_spec.rb

# Run with coverage
docker-compose exec backend COVERAGE=true bundle exec rspec
# Coverage report saved to backend/coverage/index.html

# Check linting
docker-compose exec backend bundle exec rubocop

# Fix linting issues
docker-compose exec backend bundle exec rubocop --auto-correct
```

### Frontend Tests (Jest + Cypress)

```bash
# Run unit/integration tests (Jest)
docker-compose exec frontend npm test

# Run tests with coverage
docker-compose exec frontend npm test -- --coverage

# Run linting
docker-compose exec frontend npm run lint

# Fix linting issues
docker-compose exec frontend npm run lint:fix

# Run E2E tests (Cypress)
# Note: Requires X11 forwarding or run in CI
docker-compose exec frontend npm run cypress:run
```

**For Cypress interactive mode** (requires local Cypress installation):
```bash
# Install Cypress locally (one time)
cd frontend
npm install cypress --save-dev

# Run Cypress UI (from frontend directory)
npx cypress open --config baseUrl=http://localhost:3001
```

---

## Development Tasks

### Add New API Endpoint

1. **Define route** (`backend/config/routes.rb`):
   ```ruby
   namespace :api do
     namespace :v1 do
       resources :todos do
         member do
           patch :toggle_complete
         end
       end
     end
   end
   ```

2. **Add controller action** (`backend/app/controllers/api/v1/todos_controller.rb`):
   ```ruby
   def toggle_complete
     @todo = current_user.todos.find(params[:id])
     @todo.update!(completed: !@todo.completed)
     render json: TodoSerializer.new(@todo), status: :ok
   end
   ```

3. **Write tests** (`backend/spec/requests/api/v1/todos_spec.rb`):
   ```ruby
   describe 'PATCH /api/v1/todos/:id/toggle_complete' do
     it 'toggles completion status' do
       todo = create(:todo, user: current_user, completed: false)
       patch "/api/v1/todos/#{todo.id}/toggle_complete"
       expect(response).to have_http_status(:ok)
       expect(todo.reload.completed).to be true
     end
   end
   ```

4. **Run tests**:
   ```bash
   docker-compose exec backend bundle exec rspec spec/requests/api/v1/todos_spec.rb
   ```

5. **Update OpenAPI spec** (`specs/001-todo-google-oauth2/contracts/openapi.yaml`)

6. **Add frontend service method** (`frontend/src/services/todoService.js`):
   ```javascript
   export const toggleComplete = async (todoId) => {
     const response = await api.patch(`/todos/${todoId}/toggle_complete`);
     return response.data;
   };
   ```

### Add New React Component

1. **Create component** (`frontend/src/components/todos/TodoStats.jsx`):
   ```jsx
   export const TodoStats = ({ todos }) => {
     const completed = todos.filter(t => t.completed).length;
     return <div>Completed: {completed}/{todos.length}</div>;
   };
   ```

2. **Add tests** (`frontend/tests/components/todos/TodoStats.test.js`):
   ```javascript
   import { render, screen } from '@testing-library/react';
   import { TodoStats } from '../../../src/components/todos/TodoStats';

   test('displays completion stats', () => {
     const todos = [
       { id: 1, completed: true },
       { id: 2, completed: false }
     ];
     render(<TodoStats todos={todos} />);
     expect(screen.getByText('Completed: 1/2')).toBeInTheDocument();
   });
   ```

3. **Run tests**:
   ```bash
   docker-compose exec frontend npm test TodoStats.test.js
   ```

4. **Import and use** in parent component

### Database Migration

```bash
# Generate migration
docker-compose exec backend rails generate migration AddDescriptionToTodos description:text

# Edit migration file in backend/db/migrate/
# Add indexes, constraints, etc.

# Run migration
docker-compose exec backend rails db:migrate

# If migration fails, rollback:
docker-compose exec backend rails db:rollback

# Update model validations in backend/app/models/todo.rb
# Update tests
docker-compose exec backend bundle exec rspec spec/models/todo_spec.rb
```

---

## Debugging

### View Container Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Interactive Shell Access

```bash
# Backend (Rails) shell
docker-compose exec backend sh

# Frontend (Node) shell
docker-compose exec frontend sh

# PostgreSQL shell
docker-compose exec db psql -U postgres -d todo_app_development
```

### Rails Console Debugging

```bash
docker-compose exec backend rails console

# Example queries:
user = User.find_by(email: 'dev@example.com')
user.todos.sorted
user.todos.by_priority('high')

# Test OAuth flow:
User.all
Todo.all
```

### Debug Frontend API Calls

```bash
# View network requests in browser DevTools
# Or add logging in service files:
```

Edit `frontend/src/services/api.js`:
```javascript
api.interceptors.request.use(config => {
  console.log('Request:', config.method.toUpperCase(), config.url, config.data);
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);
```

### Rebuild Containers

If dependencies change or containers behave unexpectedly:

```bash
# Rebuild specific container
docker-compose up -d --build backend

# Rebuild all containers
docker-compose up -d --build

# Clean rebuild (removes cached layers)
docker-compose build --no-cache
docker-compose up -d
```

---

## Troubleshooting

### "OAuth2 Error: redirect_uri_mismatch"

**Problem**: Google OAuth callback URL mismatch

**Solution**:
1. Check Google Cloud Console → Credentials → OAuth 2.0 Client ID
2. Ensure redirect URI exactly matches: `http://localhost:3000/api/v1/auth/google_oauth2/callback`
3. Restart backend container: `docker-compose restart backend`

### "SQLite3::CantOpenException: unable to open database file"

**Problem**: Backend can't open SQLite database file

**Solution**:
```bash
# Check if database directory exists
docker-compose exec backend ls -la db/

# Ensure volume is mounted correctly
docker-compose down
docker-compose up -d

# Check DATABASE_URL in backend/.env
# Should be: sqlite3:db/development.sqlite3

# Recreate database if needed
docker-compose exec backend rails db:create
docker-compose exec backend rails db:migrate
```

### "Cannot read property of undefined" in React

**Problem**: Accessing nested property before data loads

**Solution**:
```javascript
// Use optional chaining:
const email = user?.email || 'Loading...';

// Or check before rendering:
if (!user) return <Loading />;
return <div>{user.email}</div>;
```

### "401 Unauthorized" on API calls

**Problem**: JWT token expired, invalid, or missing

**Solution**:
```bash
# Check if access token is stored:
# Browser DevTools → Application → Local Storage → http://localhost:3001
# Look for 'access_token' key

# Check if Authorization header is sent:
# Browser DevTools → Network → Select API request → Headers
# Look for: Authorization: Bearer eyJhbGc...

# Verify axios includes Bearer token (frontend/src/services/api.js):
config.headers.Authorization = `Bearer ${getAccessToken()}`;

# Test token refresh flow:
# 1. Clear localStorage: localStorage.clear()
# 2. Sign in again via Google OAuth2
# 3. Verify new token appears in localStorage

# Restart containers
docker-compose restart backend frontend
```

### Container Won't Start / Port Already in Use

**Problem**: Port 3000 or 3001 already in use on host

**Solution**:
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Kill the process or change port in docker-compose.yml:
services:
  backend:
    ports:
      - "3002:3000"  # Change host port to 3002
```

### Database Data Lost After `docker-compose down -v`

**Problem**: `-v` flag removes volumes including SQLite database file

**Solution**:
```bash
# Use 'stop' instead of 'down' to preserve data:
docker-compose stop

# OR use 'down' without -v flag:
docker-compose down  # Preserves named volumes (sqlite_data)

# To persist data across 'down -v', backup SQLite file:
docker cp todo_app_backend:/app/db/development.sqlite3 ./backup.sqlite3

# Restore after rebuild:
docker cp ./backup.sqlite3 todo_app_backend:/app/db/development.sqlite3
```

---

## Environment Variables Reference

### Backend (`.env`)

```bash
# Google OAuth2 (required)
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# Database (SQLite embedded in container)
DATABASE_URL=sqlite3:db/development.sqlite3

# Rails (required)
SECRET_KEY_BASE=<generate with: docker-compose run --rm backend rails secret>
RAILS_ENV=development

# JWT Authentication (required)
JWT_SECRET_KEY=<generate with: docker-compose run --rm backend rails secret>
JWT_ACCESS_TOKEN_EXPIRATION=900      # 15 minutes in seconds
JWT_REFRESH_TOKEN_EXPIRATION=604800  # 7 days in seconds
```

### Frontend (`.env.local`)

```bash
# API URL (backend container, accessed via host)
REACT_APP_API_URL=http://localhost:3000/api/v1

# Frontend URL (for OAuth redirect)
REACT_APP_FRONTEND_URL=http://localhost:3001

# Optional
REACT_APP_ENABLE_DEBUG_MODE=true
```

---

## Docker Compose Commands Cheat Sheet

```bash
# Start all containers
docker-compose up

# Start in background
docker-compose up -d

# Stop containers (preserve data)
docker-compose stop

# Stop and remove containers (preserve volumes)
docker-compose down

# Stop and remove everything (⚠️ includes database data)
docker-compose down -v

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Execute command in running container
docker-compose exec backend rails console
docker-compose exec frontend npm test

# Run one-off command (creates temporary container)
docker-compose run --rm backend rails db:migrate

# Rebuild containers
docker-compose up -d --build

# View running containers
docker-compose ps

# Restart specific service
docker-compose restart backend
```

---

## Container Development Tips

### Hot Reload / File Watching

Both frontend and backend support hot reload via volume mounts:

- **Backend**: Edit files in `backend/` → Rails auto-reloads (in development mode)
- **Frontend**: Edit files in `frontend/` → React dev server auto-reloads

**No container rebuild needed** for code changes!

### Installing Dependencies

**Backend** (add gem):
```bash
# 1. Add to backend/Gemfile
# 2. Install in container:
docker-compose exec backend bundle install
# 3. Restart if needed:
docker-compose restart backend
```

**Frontend** (add npm package):
```bash
# 1. Add to frontend/package.json
# 2. Install in container:
docker-compose exec frontend npm install
# 3. Restart if needed:
docker-compose restart frontend
```

### Performance Optimization

**For faster container builds**:
- Use `.dockerignore` to exclude `node_modules`, `.git`, `tmp/`
- Use multi-stage builds for production images
- Cache bundle/npm install layers

**For faster file sync**:
- Use Docker Desktop (better performance on macOS/Windows)
- Consider `cached` or `delegated` volume options in `docker-compose.yml`

---

## Localization

**Note**: The UI is fully localized in Japanese (feature 002-japanese-ui).

All user-facing text displays in Japanese:
- Login/authentication screens
- Dashboard and navigation
- TODO forms and lists
- Error messages and validation
- Dates in Japanese format (YYYY年MM月DD日)

Backend API messages remain in English for technical consistency.

## Next Steps

- Review [spec.md](./spec.md) for feature requirements
- Review [data-model.md](./data-model.md) for database schema
- Review [contracts/openapi.yaml](./contracts/openapi.yaml) for API endpoints
- Review [research.md](./research.md) for technical decisions
- Review [tasks.md](./tasks.md) for implementation checklist
- For Japanese UI: See `/specs/002-japanese-ui/` documentation

## Support

- **Docker Issues**: Check Docker Desktop is running, try `docker-compose down && docker-compose up --build`
- **Specification Questions**: Review docs in `/specs/001-todo-google-oauth2/`
- **Constitution/Coding Standards**: See `.specify/memory/constitution.md`
- **Project Issues**: File issues in project repository
