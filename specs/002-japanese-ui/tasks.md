# Tasks: Japanese UI Localization

**Input**: Design documents from `/specs/002-japanese-ui/`
**Prerequisites**: plan.md, spec.md
**Parent Feature**: 001-todo-google-oauth2

**Tests**: Tests are OPTIONAL and not included in these tasks (not explicitly requested in spec)

**Organization**: Tasks are organized by implementation phase

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)

## Path Conventions
- Frontend (React SPA): `frontend/src/`

---

## Phase 1: Create Localization Infrastructure

**Purpose**: Create message constants and date formatting utilities

- [X] T001 [P] Create messages.js in `frontend/src/constants/messages.js` with ~52 Japanese message strings organized by category (auth, dashboard, todoForm, priority, validation, actions, status, filters, emptyState, errors)
- [X] T002 [P] Create dateFormat.js in `frontend/src/utils/dateFormat.js` with formatJapaneseDate (returns "YYYY年MM月DD日") and formatDateForInput (returns "YYYY-MM-DD") functions

**Checkpoint**: Localization infrastructure ready

---

## Phase 2: Update Authentication Components

**Purpose**: Localize login and OAuth callback screens

- [X] T003 Update LoginPage.jsx in `frontend/src/components/auth/LoginPage.jsx` to import MESSAGES and replace English strings with Japanese (title, button text, description)
- [X] T004 Update OAuthCallback.jsx in `frontend/src/components/auth/OAuthCallback.jsx` to import MESSAGES and replace English strings with Japanese (loading message, error messages)

**Checkpoint**: Authentication screens fully localized

---

## Phase 3: Update Dashboard Component

**Purpose**: Localize main dashboard header and navigation

- [X] T005 Update Dashboard.jsx in `frontend/src/components/dashboard/Dashboard.jsx` to import MESSAGES and replace English strings with Japanese (title, welcome message, sign out button)

**Checkpoint**: Dashboard header fully localized

---

## Phase 4: Update TODO Components

**Purpose**: Localize all TODO-related components

- [X] T006 [P] Update EmptyState.jsx in `frontend/src/components/todos/EmptyState.jsx` to import MESSAGES and replace English strings with Japanese (no todos message, get started message, create button)
- [X] T007 [P] Update TodoForm.jsx in `frontend/src/components/todos/TodoForm.jsx` to:
  - Import MESSAGES and formatDateForInput
  - Replace form labels with Japanese (name, priority, deadline)
  - Replace placeholder text with Japanese
  - Replace validation messages with Japanese
  - Replace button text with Japanese (save, cancel, create, update)
  - Replace priority options with Japanese (high→高, medium→中, low→低)
- [X] T008 [P] Update TodoItem.jsx in `frontend/src/components/todos/TodoItem.jsx` to:
  - Import MESSAGES and formatJapaneseDate
  - Replace formatDate function with formatJapaneseDate
  - Create getPriorityLabel function to map priority to Japanese labels
  - Update aria-labels with Japanese text
- [X] T009 Update TodoList.jsx in `frontend/src/components/todos/TodoList.jsx` to:
  - Import MESSAGES
  - Replace header text with Japanese (My TODOs → マイTODO, Add TODO → TODO追加)
  - Replace filter button text with Japanese (All → 全て, High → 高, Medium → 中, Low → 低)
  - Replace loading message with Japanese
  - Replace modal title with Japanese (Create/Edit TODO)
  - Replace error alert messages with Japanese

**Checkpoint**: All TODO components fully localized

---

## Phase 5: Update Common Components

**Purpose**: Localize shared components that use labels

- [X] T010 Verify DatePicker.jsx in `frontend/src/components/common/DatePicker.jsx` receives label prop from parent components (no changes needed - label comes from TodoForm)

**Checkpoint**: Common components verified

---

## Phase 6: Update Hooks

**Purpose**: Localize error messages in custom hooks

- [X] T011 Update useTodos.js in `frontend/src/hooks/useTodos.js` to import MESSAGES and replace error message 'Failed to load todos' with Japanese MESSAGES.errors.loadFailed

**Checkpoint**: All hooks localized

---

## Phase 7: Testing & Verification

**Purpose**: Verify all UI elements display correctly in Japanese

- [X] T012 Manual test login page - verify "Googleでログイン" button and Japanese description
- [X] T013 Manual test OAuth flow - verify "ログイン中..." and Japanese error messages
- [X] T014 Manual test dashboard - verify "TODOマネージャー" title, "ようこそ" message, "ログアウト" button
- [X] T015 Manual test TODO list - verify "マイTODO", "TODO追加" button, filter buttons (全て/高/中/低)
- [X] T016 Manual test TODO creation - verify form labels in Japanese, priority dropdown in Japanese, validation messages in Japanese
- [X] T017 Manual test TODO display - verify priority badges show 高/中/低, dates show YYYY年MM月DD日 format
- [X] T018 Manual test TODO editing - verify edit form pre-fills with Japanese labels and values
- [X] T019 Manual test TODO deletion - verify confirmation dialog in Japanese
- [X] T020 Manual test empty state - verify "まだTODOがありません" message
- [X] T021 Manual test error states - verify error messages display in Japanese
- [X] T022 Verify no English text remains in UI (除外: console logs, code comments, backend error messages)

**Checkpoint**: All UI verified to be in Japanese

---

## Summary

**Total Tasks**: 22
**Completed**: 22
**Status**: ✅ All tasks completed

### Files Created:
- `frontend/src/constants/messages.js` (52 Japanese strings)
- `frontend/src/utils/dateFormat.js` (2 utility functions)

### Files Modified:
- `frontend/src/components/auth/LoginPage.jsx`
- `frontend/src/components/auth/OAuthCallback.jsx`
- `frontend/src/components/dashboard/Dashboard.jsx`
- `frontend/src/components/todos/EmptyState.jsx`
- `frontend/src/components/todos/TodoForm.jsx`
- `frontend/src/components/todos/TodoItem.jsx`
- `frontend/src/components/todos/TodoList.jsx`
- `frontend/src/hooks/useTodos.js`

### Out of Scope:
- Backend API error messages (remain in English)
- Console logs and debug messages
- Code comments
- Multi-language switching functionality
- Browser language detection

---

## Implementation Notes

- Approach: Simple constants file (no i18n library) for single-language app
- Date format: Japanese standard "YYYY年MM月DD日" (e.g., "2025年10月10日")
- Priority mapping: high→高, medium→中, low→低 (backend still uses English enum values)
- All user-facing text localized, technical/debug text remains English
- Manual testing completed successfully per spec.md acceptance scenarios
