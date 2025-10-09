# Tasks: TODO Management Application with Priority and Deadline

**Input**: Design documents from `/specs/001-todo-google-oauth2/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Tests are OPTIONAL and not included in these tasks (not explicitly requested in spec)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- Web app structure: `backend/` and `frontend/` at repository root
- Backend (Rails API): `backend/app/`, `backend/config/`, `backend/db/`
- Frontend (React SPA): `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, Docker Compose setup, and basic structure

- [X] T001 Copy `specs/001-todo-google-oauth2/contracts/docker-compose.example.yml` to repository root as `docker-compose.yml`
- [X] T002 [P] Create Rails API project in `backend/` directory with API-only mode and SQLite database
- [X] T003 [P] Create React project in `frontend/` directory using Create React App or Vite
- [X] T004 [P] Create backend Dockerfile in `backend/Dockerfile` (Ruby 3.2-alpine base, bundle install, Rails server)
- [X] T005 [P] Create frontend Dockerfile in `frontend/Dockerfile` (Node 18-alpine base, npm install, npm start)
- [X] T006 [P] Create `backend/.env.example` file with Google OAuth2 placeholders and database URL
- [X] T007 [P] Create `frontend/.env.example` file with API URL and frontend URL placeholders
- [X] T008 [P] Configure ESLint for React in `frontend/.eslintrc.json`
- [X] T009 [P] Configure RuboCop for Rails in `backend/.rubocop.yml`
- [X] T010 Add CORS configuration in `backend/config/initializers/cors.rb` to allow frontend domain

**Checkpoint**: Docker Compose and project structure ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 [P] Install omniauth-google-oauth2 gem in `backend/Gemfile`
- [X] T012 [P] Install jwt gem in `backend/Gemfile` for JWT token generation/verification
- [X] T013 Configure OmniAuth in `backend/config/initializers/omniauth.rb` with Google OAuth2 provider
- [X] T014 Configure JWT settings in `backend/config/initializers/jwt.rb` (secret key, expiration times, algorithm)
- [X] T015 Create JwtService in `backend/app/services/jwt_service.rb` with methods: encode_access_token, encode_refresh_token, decode_token
- [X] T016 Create User model migration in `backend/db/migrate/YYYYMMDDHHMMSS_create_users.rb` (id INTEGER PRIMARY KEY AUTOINCREMENT, google_id TEXT UNIQUE, email TEXT UNIQUE, name TEXT, timestamps TEXT)
- [X] T017 Create Todo model migration in `backend/db/migrate/YYYYMMDDHHMMSS_create_todos.rb` (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER FK, name TEXT, priority INTEGER, deadline TEXT, completed INTEGER, timestamps TEXT, CHECK constraints)
- [X] T018 Create indexes migration in `backend/db/migrate/YYYYMMDDHHMMSS_add_indexes.rb` (user_id, user_id+priority+deadline composite, user_id+created_at)
- [X] T019 Run database migrations: `docker-compose exec backend rails db:create db:migrate`
- [X] T020 Create User model in `backend/app/models/user.rb` with validations (google_id, email, name) and `has_many :todos` association
- [X] T021 Create Todo model in `backend/app/models/todo.rb` with enum priority (high: 0, medium: 1, low: 2), validations, `belongs_to :user`, and sorted scope
- [X] T022 Create ApplicationController in `backend/app/controllers/application_controller.rb` with `current_user` helper (JWT-based), `authorize_request` before_action, and JWT verification
- [X] T023 [P] Create UserSerializer in `backend/app/serializers/user_serializer.rb` (id, email, name, created_at)
- [X] T024 [P] Create TodoSerializer in `backend/app/serializers/todo_serializer.rb` (id, user_id, name, priority, deadline, completed, timestamps)
- [X] T025 Setup API routing structure in `backend/config/routes.rb` with `/api/v1` namespace
- [X] T026 [P] Create tokenService in `frontend/src/services/tokenService.js` with getAccessToken, setAccessToken, clearTokens functions
- [X] T027 [P] Create Axios API client in `frontend/src/services/api.js` with Bearer token injection, automatic token refresh on 401, and retry logic
- [X] T028 [P] Create shared Button component in `frontend/src/components/common/Button.jsx`
- [X] T029 [P] Create shared Checkbox component in `frontend/src/components/common/Checkbox.jsx`
- [X] T030 [P] Create shared Modal component in `frontend/src/components/common/Modal.jsx`

**Checkpoint**: Foundation ready - database schema, models, serializers, base API client, and shared components complete. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - User Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can securely sign in with Google OAuth2, see personalized welcome screen, and sign out

**Independent Test**: User can click "Sign in with Google", authenticate via Google, see their name/email on dashboard, and sign out successfully

### Implementation for User Story 1

- [X] T031 [P] [US1] Create AuthController in `backend/app/controllers/api/v1/auth_controller.rb` with actions: google_oauth2_callback (issues JWT tokens), refresh (refreshes access token), sign_out, current_user
- [X] T032 [P] [US1] Create GoogleOAuthService in `backend/app/services/google_oauth_service.rb` to handle user creation/update from OAuth response
- [X] T033 [US1] Add authentication routes in `backend/config/routes.rb`: GET /auth/google_oauth2/callback, POST /auth/refresh, DELETE /auth/sign_out, GET /auth/current_user
- [X] T034 [US1] Implement OAuth callback to return JWT access token in redirect URL query param and refresh token in httpOnly cookie
- [X] T035 [P] [US1] Create authService in `frontend/src/services/authService.js` with functions: handleOAuthCallback (extracts token from URL), getCurrentUser, signOut, getGoogleAuthUrl
- [X] T036 [P] [US1] Create useAuth custom hook in `frontend/src/hooks/useAuth.js` for managing auth state with JWT token
- [X] T037 [US1] Create LoginPage component in `frontend/src/components/auth/LoginPage.jsx` with "Sign in with Google" button
- [X] T038 [US1] Create OAuth callback handler page in `frontend/src/components/auth/OAuthCallback.jsx` to extract and store access token from URL
- [X] T039 [US1] Create App.jsx in `frontend/src/App.jsx` with React Router, auth context provider, and route protection
- [X] T040 [US1] Verify Axios interceptor in `frontend/src/services/api.js` handles automatic token refresh (already implemented in T027)

**Checkpoint**: Users can authenticate with Google OAuth2, see their identity, and sign out. This is the MVP foundation.

---

## Phase 4: User Story 2 - View TODO List with Priority Sorting (Priority: P2)

**Goal**: Users can see all their TODO items sorted by priority (High, Medium, Low) and deadline

**Independent Test**: Authenticated user with existing TODO items sees complete list sorted by priority first, then deadline, with all details visible

### Implementation for User Story 2

- [X] T041 [P] [US2] Create TodosController in `backend/app/controllers/api/v1/todos_controller.rb` with index action
- [X] T042 [US2] Add GET /api/v1/todos route in `backend/config/routes.rb`
- [X] T043 [US2] Implement index action to return `current_user.todos.sorted` with optional priority filter query param (user extracted from JWT token)
- [X] T044 [P] [US2] Create todoService in `frontend/src/services/todoService.js` with fetchTodos function (uses Bearer token auth)
- [X] T045 [P] [US2] Create useTodos custom hook in `frontend/src/hooks/useTodos.js` for managing TODO list state
- [X] T046 [US2] Create TodoList component in `frontend/src/components/todos/TodoList.jsx` to display sorted TODO items
- [X] T047 [US2] Create TodoItem component in `frontend/src/components/todos/TodoItem.jsx` with checkbox, name, priority, deadline display
- [X] T048 [US2] Create EmptyState component in `frontend/src/components/todos/EmptyState.jsx` for when user has no TODOs
- [X] T049 [US2] Add visual styling for completed items (checkbox checked, different styling/strikethrough) in TodoItem component
- [X] T050 [US2] Create dashboard route in `frontend/src/App.jsx` that renders TodoList with user isolation

**Checkpoint**: Users can view their TODO list sorted correctly. Empty state works. Completed items are visually distinct.

---

## Phase 5: User Story 3 - Filter TODOs by Priority (Priority: P3)

**Goal**: Users can filter their TODO list by priority level (High, Medium, Low, or All)

**Independent Test**: User can select a priority filter and see only matching TODO items

### Implementation for User Story 3

- [X] T051 [US3] Update TodosController index action in `backend/app/controllers/api/v1/todos_controller.rb` to handle priority query param with filtering logic
- [X] T052 [US3] Create PriorityFilter component in `frontend/src/components/todos/PriorityFilter.jsx` with dropdown/buttons for High, Medium, Low, All (integrated into TodoList)
- [X] T053 [US3] Add filter state management to useTodos hook in `frontend/src/hooks/useTodos.js`
- [X] T054 [US3] Update todoService.fetchTodos in `frontend/src/services/todoService.js` to accept priority parameter
- [X] T055 [US3] Integrate PriorityFilter component into TodoList in `frontend/src/components/todos/TodoList.jsx`
- [X] T056 [US3] Display "no items found" message in EmptyState component when filter returns no results

**Checkpoint**: Users can filter by priority and see only matching items. Filter maintains sort order.

---

## Phase 6: User Story 4 - Create TODO Items (Priority: P4)

**Goal**: Users can add new tasks with name, priority, and deadline

**Independent Test**: User can create a new TODO with all required information and immediately see it in the list in correct sorted position

### Implementation for User Story 4

- [X] T057 [US4] Add create action to TodosController in `backend/app/controllers/api/v1/todos_controller.rb` with validation
- [X] T058 [US4] Add POST /api/v1/todos route in `backend/config/routes.rb`
- [X] T059 [P] [US4] Create DatePicker component in `frontend/src/components/common/DatePicker.jsx` using HTML5 date input or library
- [X] T060 [P] [US4] Create TodoForm component in `frontend/src/components/todos/TodoForm.jsx` with fields: name (text), priority (dropdown), deadline (DatePicker)
- [X] T061 [US4] Add createTodo function to todoService in `frontend/src/services/todoService.js` (uses Bearer token auth)
- [X] T062 [US4] Add create functionality to useTodos hook in `frontend/src/hooks/useTodos.js`
- [X] T063 [US4] Add "Add TODO" button and form modal to TodoList component in `frontend/src/components/todos/TodoList.jsx`
- [X] T064 [US4] Implement client-side validation in TodoForm: name required (1-255 chars), priority required, deadline required
- [X] T065 [US4] Handle validation errors from backend and display field-level error messages in TodoForm
- [X] T066 [US4] Set completed default to false in form and verify new TODO appears as incomplete

**Checkpoint**: Users can create TODOs with all validations working. New items appear in correct sorted position.

---

## Phase 7: User Story 5 - Edit TODO Items (Priority: P5)

**Goal**: Users can modify existing TODO items including name, priority, deadline, and completion status

**Independent Test**: User can modify a TODO's attributes and see changes persist with proper re-sorting

### Implementation for User Story 5

- [X] T067 [US5] Add update action to TodosController in `backend/app/controllers/api/v1/todos_controller.rb` with validation
- [X] T068 [US5] Add PATCH /api/v1/todos/:id route in `backend/config/routes.rb`
- [X] T069 [US5] Update TodoForm component in `frontend/src/components/todos/TodoForm.jsx` to support edit mode with pre-filled values
- [X] T070 [US5] Add updateTodo function to todoService in `frontend/src/services/todoService.js` (uses Bearer token auth)
- [X] T071 [US5] Add update functionality to useTodos hook in `frontend/src/hooks/useTodos.js`
- [X] T072 [US5] Add "Edit" button to TodoItem component in `frontend/src/components/todos/TodoItem.jsx`
- [X] T073 [US5] Implement checkbox click handler in TodoItem to toggle completion status via PATCH request
- [X] T074 [US5] Ensure list re-sorts automatically when priority or deadline changes after edit
- [X] T075 [US5] Handle validation errors and display in TodoForm during edit

**Checkpoint**: Users can edit all TODO attributes. Completion toggles work via checkbox. List re-sorts correctly.

---

## Phase 8: User Story 6 - Delete TODO Items (Priority: P6)

**Goal**: Users can remove TODO items with confirmation

**Independent Test**: User can delete a TODO with confirmation, and item is permanently removed

### Implementation for User Story 6

- [X] T076 [US6] Add destroy action to TodosController in `backend/app/controllers/api/v1/todos_controller.rb`
- [X] T077 [US6] Add DELETE /api/v1/todos/:id route in `backend/config/routes.rb`
- [X] T078 [US6] Add deleteTodo function to todoService in `frontend/src/services/todoService.js` (uses Bearer token auth)
- [X] T079 [US6] Add delete functionality to useTodos hook in `frontend/src/hooks/useTodos.js`
- [X] T080 [US6] Add "Delete" button to TodoItem component in `frontend/src/components/todos/TodoItem.jsx`
- [X] T081 [US6] Implement confirmation modal using shared Modal component before deletion (using window.confirm)
- [X] T082 [US6] Show EmptyState component when last TODO is deleted

**Checkpoint**: Users can delete TODOs with confirmation. Empty state appears when all TODOs are deleted.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T083 [P] Add loading spinners to TodoList component during fetch operations
- [X] T084 [P] Add error boundary component in `frontend/src/components/common/ErrorBoundary.jsx`
- [X] T085 [P] Implement responsive design styling for mobile/tablet viewports
- [X] T086 [P] Add ARIA labels to all interactive elements for WCAG 2.1 AA compliance
- [X] T087 [P] Add keyboard navigation support (Tab, Enter, Escape keys)
- [X] T088 [P] Implement focus indicators for all interactive elements
- [X] T089 Test application startup using `docker-compose up --build` per quickstart.md
- [X] T090 Verify JWT authentication flow: OAuth callback → token storage → Bearer token in requests → token refresh
- [X] T091 Verify all user stories work end-to-end following quickstart.md test scenarios
- [X] T092 [P] Add seed data script in `backend/db/seeds.rb` for development
- [X] T093 [P] Create production build configurations for frontend (npm run build) - created .env.production
- [X] T094 Run linters: `docker-compose exec backend bundle exec rubocop` and `docker-compose exec frontend npm run lint` - all passing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if multiple developers)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Requires User Story 1 for authentication
- **User Story 3 (P3)**: Can start after User Story 2 (depends on TODO list view)
- **User Story 4 (P4)**: Can start after User Story 2 (depends on TODO list view)
- **User Story 5 (P5)**: Can start after User Story 2 (depends on TODO list view and display)
- **User Story 6 (P6)**: Can start after User Story 2 (depends on TODO list view)

### Within Each User Story

- Backend models/controllers before frontend services
- Services before components
- Core components before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Within each user story: Tasks marked [P] can run in parallel (different files)
- Stories 3, 4, 5, 6 can be worked on in parallel by different team members (all depend on Story 1 + 2)

---

## Parallel Example: Foundational Phase

```bash
# Launch these foundational tasks together (different files):
Task T021: "Create UserSerializer in backend/app/serializers/user_serializer.rb"
Task T022: "Create TodoSerializer in backend/app/serializers/todo_serializer.rb"
Task T024: "Create Axios API client in frontend/src/services/api.js"
Task T025: "Create shared Button component in frontend/src/components/common/Button.jsx"
Task T026: "Create shared Checkbox component in frontend/src/components/common/Checkbox.jsx"
Task T027: "Create shared Modal component in frontend/src/components/common/Modal.jsx"
```

## Parallel Example: User Story 1

```bash
# Launch these User Story 1 tasks together (different files):
Task T028: "Create AuthController in backend/app/controllers/api/v1/auth_controller.rb"
Task T029: "Create GoogleOAuthService in backend/app/services/google_oauth_service.rb"
Task T031: "Create authService in frontend/src/services/authService.js"
Task T032: "Create useAuth custom hook in frontend/src/hooks/useAuth.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (View TODO List)
5. **STOP and VALIDATE**: Test authentication and viewing independently
6. Deploy/demo MVP (users can sign in and see their TODOs)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Authentication works
3. Add User Story 2 → Test independently → Viewing works (MVP!)
4. Add User Story 3 → Test independently → Filtering works
5. Add User Story 4 → Test independently → Creating works
6. Add User Story 5 → Test independently → Editing works
7. Add User Story 6 → Test independently → Deleting works (Full CRUD complete)
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Authentication)
3. Once User Story 1 is done:
   - Developer A: User Story 2 (View TODO List)
4. Once User Story 2 is done (authentication + viewing working):
   - Developer A: User Story 3 (Filter)
   - Developer B: User Story 4 (Create)
   - Developer C: User Story 5 (Edit)
   - Developer D: User Story 6 (Delete)
5. Stories 3-6 complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All commands run in Docker containers per quickstart.md
- **Authentication**: JWT tokens (access: 15min, refresh: 7d) instead of sessions
- **Authorization**: Bearer token in `Authorization` header on all API requests
- **Token Storage**: Access token in localStorage, refresh token in httpOnly cookie
- **Token Refresh**: Automatic retry on 401 via Axios interceptor
- Database is SQLite 3.x embedded in backend container
- Priority stored as INTEGER (0=high, 1=medium, 2=low) with Rails enum
- Completion status stored as INTEGER (0=incomplete, 1=complete)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No tests included (not requested in spec)
