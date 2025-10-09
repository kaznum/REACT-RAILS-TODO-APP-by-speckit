# Data Model: TODO Management Application

**Feature**: 001-todo-google-oauth2
**Date**: 2025-10-09
**Database**: SQLite 3.x (embedded in backend container)

## Entity Relationship Diagram

```
┌─────────────────────────┐
│        User             │
├─────────────────────────┤
│ id: bigint (PK)         │
│ google_id: string       │◄───┐
│ email: string           │    │
│ name: string            │    │
│ created_at: timestamp   │    │
│ updated_at: timestamp   │    │
└─────────────────────────┘    │
                               │
                               │ user_id (FK)
                               │
┌─────────────────────────┐    │
│        Todo             │    │
├─────────────────────────┤    │
│ id: bigint (PK)         │    │
│ user_id: bigint (FK)    │────┘
│ name: string(255)       │
│ priority: enum          │
│ deadline: date          │
│ completed: boolean      │
│ created_at: timestamp   │
│ updated_at: timestamp   │
└─────────────────────────┘

Relationship: One User has many Todos (1:N)
```

---

## Entity: User

**Purpose**: Represents an authenticated user via Google OAuth2

### Attributes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique user identifier |
| google_id | string (255) | NOT NULL, UNIQUE | Google account unique ID (sub claim from OAuth token) |
| email | string (255) | NOT NULL, UNIQUE | User's email from Google account |
| name | string (255) | NOT NULL | User's display name from Google account |
| created_at | timestamp | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Record last update timestamp |

### Validations

**Rails Model Validations**:
```ruby
class User < ApplicationRecord
  has_many :todos, dependent: :destroy

  validates :google_id, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true, length: { maximum: 255 }
end
```

### Indexes

```sql
CREATE UNIQUE INDEX index_users_on_google_id ON users(google_id);
CREATE UNIQUE INDEX index_users_on_email ON users(email);
```

**Rationale**:
- `google_id`: Ensures one user per Google account, fast lookup during auth
- `email`: Ensures uniqueness, supports potential "find user by email" feature

### Lifecycle

1. **Creation**: User signs in via Google OAuth2 for the first time
   - `google_id`, `email`, `name` extracted from OAuth response
   - Record created in database
   - Session created with user ID

2. **Update**: User signs in again with updated Google profile
   - Lookup by `google_id`
   - Update `email` and `name` if changed in Google account
   - Refresh session

3. **Deletion**: Not implemented in MVP (users remain in database even after sign-out)

---

## Entity: Todo

**Purpose**: Represents a single TODO item with priority, deadline, and completion status

### Attributes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | Unique TODO identifier |
| user_id | integer | NOT NULL, FOREIGN KEY → users(id) | Owner of this TODO item |
| name | text (255) | NOT NULL | TODO description (1-255 characters) |
| priority | integer | NOT NULL, DEFAULT 1, CHECK (0-2) | Urgency level (0=high, 1=medium, 2=low) |
| deadline | text (DATE) | NOT NULL | Target completion date in ISO 8601 format (YYYY-MM-DD) |
| completed | integer (boolean) | NOT NULL, DEFAULT 0 | Completion status (0=false/incomplete, 1=true/complete) |
| created_at | text (DATETIME) | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation timestamp (ISO 8601) |
| updated_at | text (DATETIME) | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record last update timestamp (ISO 8601) |

### Priority Storage (SQLite)

**SQLite Implementation**: No native ENUM type, using INTEGER with CHECK constraint

**Rails Enum Mapping**:
```ruby
enum priority: { high: 0, medium: 1, low: 2 }
```

**Sort Order**: Integer values 0 → 1 → 2 (high → medium → low)

### Validations

**Rails Model Validations**:
```ruby
class Todo < ApplicationRecord
  belongs_to :user

  enum priority: { high: 'high', medium: 'medium', low: 'low' }

  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :priority, presence: true, inclusion: { in: priorities.keys }
  validates :deadline, presence: true
  validates :completed, inclusion: { in: [true, false] }
  validates :user_id, presence: true

  # Default scope for list display: sort by priority (high → medium → low), then deadline (earliest first), then created_at (oldest first)
  scope :sorted, -> { order(priority: :asc, deadline: :asc, created_at: :asc) }

  # Filter scopes
  scope :by_priority, ->(priority) { where(priority: priority) if priority.present? }
  scope :completed, -> { where(completed: true) }
  scope :incomplete, -> { where(completed: false) }
end
```

### Indexes

```sql
-- Foreign key index
CREATE INDEX index_todos_on_user_id ON todos(user_id);

-- Composite index for default sort (user_id + priority + deadline)
CREATE INDEX index_todos_on_user_id_and_priority_and_deadline
  ON todos(user_id, priority, deadline);

-- Tie-breaker index (user_id + created_at)
CREATE INDEX index_todos_on_user_id_and_created_at
  ON todos(user_id, created_at);
```

**Rationale**:
- `user_id`: Fast lookup for "get all TODOs for user" query
- `user_id + priority + deadline`: Optimizes default sort query (covers 99% of list views)
- `user_id + created_at`: Tie-breaking when priority and deadline are identical

### Lifecycle

1. **Creation** (User Story 4: Create TODO):
   - User submits form with name, priority, deadline
   - `completed` defaults to `false`
   - `created_at` set to current timestamp
   - Record saved to database
   - Frontend receives new TODO and inserts into sorted list

2. **Update** (User Story 5: Edit TODO):
   - User modifies name, priority, deadline, or completion status
   - `updated_at` timestamp refreshed
   - If priority or deadline changed: Frontend re-sorts list
   - If completion toggled: Frontend updates visual styling

3. **Deletion** (User Story 6: Delete TODO):
   - User confirms deletion
   - Record removed from database (hard delete, not soft delete)
   - Frontend removes item from list

### State Transitions

```
[NEW TODO]
    ↓
[completed: false] ←──────┐
    ↓                     │
    ↓ (user checks box)   │ (user unchecks box)
    ↓                     │
[completed: true] ─────────┘
    ↓
    ↓ (user clicks delete)
    ↓
[DELETED]
```

**Rules**:
- No automatic transitions (all state changes user-initiated)
- Completion status can toggle freely (no one-way enforcement)
- Deletion is permanent (no "undo" or "archive" in MVP)

---

## Database Schema (SQLite)

### Migration: Create Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX index_users_on_google_id ON users(google_id);
CREATE UNIQUE INDEX index_users_on_email ON users(email);
```

### Migration: Create Todos Table

```sql
-- Create table with CHECK constraints (SQLite has no ENUM type)
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 255),
  priority INTEGER NOT NULL DEFAULT 1 CHECK(priority IN (0, 1, 2)),
  deadline TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX index_todos_on_user_id ON todos(user_id);
CREATE INDEX index_todos_on_user_id_and_priority_and_deadline
  ON todos(user_id, priority, deadline);
CREATE INDEX index_todos_on_user_id_and_created_at
  ON todos(user_id, created_at);
```

**Notes**:
- **INTEGER for enums**: Priority stored as 0 (high), 1 (medium), 2 (low)
- **INTEGER for booleans**: SQLite has no native BOOLEAN type; 0=false, 1=true
- **TEXT for timestamps**: SQLite stores dates/times as TEXT in ISO 8601 format
- **CHECK constraints**: Database-level validation for priority (0-2) and completed (0-1)
- **Cascade Delete**: When a user is deleted, all associated TODOs are automatically deleted (`ON DELETE CASCADE`)

---

## Data Volume & Performance

### Expected Data Volume

- **Users**: 100-1000 concurrent, 10,000 total (estimated)
- **TODOs per user**: Average 50, Maximum 5000 (per spec)
- **Total TODOs**: ~500,000 (10k users * 50 avg)
- **Database size**: ~100MB (users + TODOs + indexes)

### Query Performance Targets

**List all TODOs for user (sorted)**:
```sql
SELECT * FROM todos
WHERE user_id = $1
ORDER BY priority ASC, deadline ASC, created_at ASC;
```
- **Expected rows**: 50-5000
- **Target time**: <50ms (well under 200ms API target)
- **Index used**: `index_todos_on_user_id_and_priority_and_deadline`

**Filter by priority**:
```sql
SELECT * FROM todos
WHERE user_id = $1 AND priority = $2
ORDER BY deadline ASC, created_at ASC;
```
- **Expected rows**: 15-1500 (assuming ~30% per priority)
- **Target time**: <30ms
- **Index used**: Partial scan of composite index

**Create TODO**:
```sql
INSERT INTO todos (user_id, name, priority, deadline, completed)
VALUES ($1, $2, $3, $4, false);
```
- **Target time**: <10ms

**Update TODO**:
```sql
UPDATE todos SET name = $1, priority = $2, deadline = $3, completed = $4, updated_at = NOW()
WHERE id = $5 AND user_id = $6;
```
- **Target time**: <10ms

**Delete TODO**:
```sql
DELETE FROM todos WHERE id = $1 AND user_id = $2;
```
- **Target time**: <5ms

---

## Data Integrity Rules

### Referential Integrity

- **User ↔ Todos**: Foreign key constraint ensures every TODO belongs to valid user
- **Cascade delete**: Deleting user removes all their TODOs
- **No orphaned TODOs**: Database enforces referential integrity

### Business Rules

1. **User Isolation**: Users can only access their own TODOs
   - Enforced in API layer: `current_user.todos.find(params[:id])`
   - Never query `Todo.find(id)` without user scope

2. **Name Length**: 1-255 characters
   - Database constraint: `CHECK (char_length(name) >= 1 AND char_length(name) <= 255)`
   - Rails validation: `validates :name, length: { minimum: 1, maximum: 255 }`

3. **Priority Values**: Must be 'high', 'medium', or 'low'
   - Database constraint: ENUM type
   - Rails validation: `inclusion: { in: priorities.keys }`

4. **Deadline Required**: Cannot be NULL
   - Database constraint: `NOT NULL`
   - Rails validation: `validates :deadline, presence: true`

5. **Completion Default**: New TODOs are incomplete
   - Database default: `DEFAULT false`
   - Rails default: `attribute :completed, :boolean, default: false`

---

## Serialization Format

### User JSON

```json
{
  "id": 123,
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Notes**:
- `google_id` not exposed in API (internal only)
- Timestamps in ISO 8601 format with timezone

### Todo JSON

```json
{
  "id": 456,
  "user_id": 123,
  "name": "Finish project proposal",
  "priority": "high",
  "deadline": "2025-10-15",
  "completed": false,
  "created_at": "2025-10-09T14:22:00Z",
  "updated_at": "2025-10-09T14:22:00Z"
}
```

**Notes**:
- `priority`: Lowercase enum value ("high", "medium", "low")
- `deadline`: ISO 8601 date format (YYYY-MM-DD, no time component)
- `completed`: Boolean (true/false)
- Timestamps in ISO 8601 format with timezone

---

## Migration Strategy

### Initial Setup

1. Create users table
2. Create priority_level enum
3. Create todos table with foreign key
4. Create indexes

### Seed Data (Development Only)

```ruby
# db/seeds.rb
user = User.create!(
  google_id: 'dev-user-123',
  email: 'dev@example.com',
  name: 'Dev User'
)

Todo.create!([
  { user: user, name: 'High priority task', priority: :high, deadline: Date.today + 1 },
  { user: user, name: 'Medium priority task', priority: :medium, deadline: Date.today + 7 },
  { user: user, name: 'Low priority task', priority: :low, deadline: Date.today + 14, completed: true }
])
```

### Rollback Plan

```sql
DROP TABLE IF EXISTS todos;
DROP TABLE IF EXISTS users;
```

**Note**: SQLite automatically removes indexes when dropping tables. No CASCADE needed for SQLite (foreign keys handled automatically).

---

## Summary

- **2 entities**: User (auth), Todo (core domain model)
- **1:N relationship**: One user has many TODOs
- **PostgreSQL enums**: Type-safe priority values
- **Composite indexes**: Optimized for default sort order (priority → deadline → created_at)
- **Cascade delete**: User deletion removes all associated TODOs
- **Data volume**: Supports 5000 TODOs per user with <50ms query times
- **Validation**: Database constraints + Rails model validations for defense in depth
