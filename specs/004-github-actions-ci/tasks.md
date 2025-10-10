# Tasks: GitHub Actions CI Autofix Workflow

**Input**: Design documents from `/specs/004-github-actions-ci/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No automated tests required per user guidance. Manual verification with intentionally failing PRs.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Workflow file**: `.github/workflows/autofix.yml`
- **Configuration**: Repository secrets (OPENAI_API_KEY)
- **Documentation**: `specs/004-github-actions-ci/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository configuration and prerequisites for autofix workflow

- [ ] T001 Configure OPENAI_API_KEY in GitHub repository secrets (Settings → Secrets and variables → Actions)
- [ ] T002 Verify GitHub Actions workflow permissions are set to "Read and write" (Settings → Actions → General → Workflow permissions)
- [x] T003 Verify existing CI workflow file at `.github/workflows/ci.yml` has 4 jobs: backend-test, frontend-test, backend-lint, frontend-lint

**Checkpoint**: Repository is configured for autofix workflow development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core workflow structure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create workflow file `.github/workflows/autofix.yml` with basic structure (name, trigger event placeholder)
- [x] T005 Add `workflow_run` trigger configuration for CI workflow completion (on: workflow_run: workflows: ["CI"], types: [completed], branches-ignore: [main, master])
- [x] T006 Add concurrency configuration to prevent duplicate runs (concurrency: group: autofix-${{ github.event.workflow_run.pull_requests[0].number }}, cancel-in-progress: true)
- [x] T007 Add permissions block (permissions: contents: write, actions: read, pull-requests: read)
- [x] T008 Add workflow job structure with runs-on: ubuntu-latest
- [x] T009 Implement "Checkout PR branch" step using actions/checkout@v3 with PR head ref
- [x] T010 Implement "Check if last commit is autofix" step to prevent infinite loops (check for commit message starting with "fix(autofix):")
- [x] T011 Add conditional skip step if last commit is autofix (if: steps.check-autofix.outputs.is_autofix == 'true')

**Checkpoint**: Foundation workflow structure is ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Automated Test Failure Fixes (Priority: P1) 🎯 MVP

**Goal**: Automatically detect test failures (RSpec, Jest) from CI runs, generate fixes using Codex, and commit fixes to the PR branch

**Independent Test**: Create a PR with intentionally failing tests and verify that autofix commits are automatically added with corrections that make tests pass

### Implementation for User Story 1

- [x] T012 [US1] Add step "Get CI workflow run details" using actions/github-script@v7 to fetch workflow run metadata (run ID, PR number, branch, conclusion)
- [x] T013 [US1] Add step "Check CI conclusion" to verify workflow conclusion is "failure" (exit gracefully if success)
- [x] T014 [US1] Add step "List failed jobs" using actions/github-script@v7 to query GitHub API for jobs with conclusion: failure
- [x] T015 [US1] Add step "Download failure logs" using actions/github-script@v7 to download logs from failed jobs (filter for test jobs: backend-test, frontend-test)
- [x] T016 [US1] Add step "Categorize failures" to determine failure types (set output: has_test_failures based on job names containing "Test")
- [x] T017 [US1] Add step "Generate test fixes" using openai/codex-action@main with prompt to analyze test failure logs and generate fixes
- [x] T018 [US1] Configure Codex prompt for test failures: "Analyze these test failures (RSpec/Jest) and generate code fixes. Output: fixed files + summary of what was fixed + remaining issues if any"
- [x] T019 [US1] Add step "Apply generated fixes" to write Codex output to files (handled by codex-action)
- [x] T020 [US1] Add step "Configure git" to set user.name and user.email to github-actions[bot]
- [x] T021 [US1] Add step "Commit test fixes" with conventional commit message format: "fix(autofix): Resolve test failures\n\n<details>\n\n🤖 Generated with GitHub Actions Autofix"
- [x] T022 [US1] Add step "Push commit" to push to PR branch (git push origin HEAD)
- [x] T023 [US1] Add error handling with continue-on-error for Codex step (gracefully handle API failures, rate limits)
- [x] T024 [US1] Add conditional step to skip commit if no fixes were generated (if: steps.codex.outputs.fixed_files != '')

**Checkpoint**: User Story 1 complete - test failure autofix works independently

---

## Phase 4: User Story 2 - Automated Linting Error Corrections (Priority: P2)

**Goal**: Automatically detect linting errors (RuboCop, ESLint) from CI runs, generate fixes using Codex, and commit fixes to the PR branch

**Independent Test**: Create a PR with code violating linting rules and verify that autofix commits are added with properly formatted code

### Implementation for User Story 2

- [x] T025 [US2] Extend "Download failure logs" step (from T015) to also download logs from lint jobs (backend-lint, frontend-lint)
- [x] T026 [US2] Extend "Categorize failures" step (from T016) to also set output: has_lint_failures based on job names containing "Lint"
- [x] T027 [US2] Add step "Generate lint fixes" using openai/codex-action@main with prompt specific to linting errors
- [x] T028 [US2] Configure Codex prompt for lint failures: "Analyze these linting errors (RuboCop/ESLint) and generate formatting fixes. Follow project style guides. Output: fixed files + summary"
- [x] T029 [US2] Update "Commit" step (from T021) to handle lint-only fixes with appropriate commit message: "fix(autofix): Resolve linting errors"
- [x] T030 [US2] Add conditional logic to determine commit message based on failure type (test-only, lint-only, or combined)

**Checkpoint**: User Story 2 complete - linting error autofix works independently (and US1 still works)

---

## Phase 5: User Story 3 - Combined Test and Lint Failure Resolution (Priority: P3)

**Goal**: Handle PRs with both test failures and linting errors in a single autofix commit

**Independent Test**: Create a PR with both failing tests and linting errors, verify single autofix commit addresses both

### Implementation for User Story 3

- [x] T031 [US3] Combine "Generate test fixes" and "Generate lint fixes" into a single unified Codex invocation
- [x] T032 [US3] Update Codex prompt to handle both failure types: "Analyze these CI failures (tests + linting). Fix both categories. Output: all fixed files + categorized summary (tests fixed, linting fixed) + remaining issues"
- [x] T033 [US3] Update "Commit" step to create comprehensive commit message for combined fixes: "fix(autofix): Resolve test failures and linting errors\n\nFixed:\n- Tests: <summary>\n- Linting: <summary>\n\n[Remaining: <issues>]\n\n🤖 Generated with GitHub Actions Autofix"
- [x] T034 [US3] Add logic to handle partial fixes: if Codex cannot fix everything, include "Remaining issues" section in commit message with details from Codex output
- [x] T035 [US3] Ensure single commit is created regardless of failure combination (not separate commits for tests and linting)

**Checkpoint**: All user stories complete - autofix handles any combination of test/lint failures

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, error scenarios, and documentation

- [x] T036 [P] Add step "Handle API rate limits" with retry logic or graceful failure message (if: steps.codex.outcome == 'failure', log warning about rate limits/token limits)
- [x] T037 [P] Add step "Handle empty failure logs" to exit gracefully if no failures found (if: steps.download-logs.outputs.failure_logs == '')
- [x] T038 [P] Add step "Validate Codex output" to ensure generated fixes don't introduce syntax errors (optional - Codex should handle this)
- [x] T039 [P] Add workflow annotations for debugging (echo ::notice:: for successful fix, echo ::warning:: for partial fix, echo ::error:: for complete failure)
- [x] T040 Update `specs/004-github-actions-ci/quickstart.md` with actual workflow YAML snippets (replace placeholders with real implementation)
- [x] T041 Create documentation comment at top of `.github/workflows/autofix.yml` explaining trigger conditions, requirements, and loop prevention
- [x] T042 Add example Codex prompts to quickstart.md for customization guidance
- [ ] T043 Test workflow with intentionally failing PR (test failures only) - verify US1 works (MANUAL: Create test PR after deployment)
- [ ] T044 Test workflow with intentionally failing PR (lint failures only) - verify US2 works (MANUAL: Create test PR after deployment)
- [ ] T045 Test workflow with intentionally failing PR (combined failures) - verify US3 works (MANUAL: Create test PR after deployment)
- [ ] T046 Test loop prevention by creating PR with autofix commit already present - verify workflow skips (MANUAL: Test after deployment)
- [ ] T047 Test error handling by temporarily removing OPENAI_API_KEY - verify graceful failure (MANUAL: Test after deployment)
- [x] T048 Update `CLAUDE.md` with autofix workflow usage guidelines (when it triggers, how to review autofix commits)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - **US1 (P1)**: Can start after Foundational - Core autofix for test failures
  - **US2 (P2)**: Depends on US1 (extends failure log download and Codex invocation)
  - **US3 (P3)**: Depends on US1 and US2 (combines both capabilities)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Test Failures**: Independent - establishes core workflow pattern
- **User Story 2 (P2) - Lint Failures**: Extends US1 - reuses failure log capture, adds lint-specific Codex prompt
- **User Story 3 (P3) - Combined**: Builds on US1 + US2 - unifies fix generation, creates comprehensive commit messages

### Within Each User Story

- Foundation workflow steps (T004-T011) MUST complete before any user story
- US1: API integration → Codex invocation → Git operations (sequential)
- US2: Extends US1 logs → Adds lint Codex prompt → Updates commit logic (sequential after US1)
- US3: Combines US1 + US2 → Single Codex call → Unified commit (sequential after US2)

### Parallel Opportunities

- Phase 1 Setup tasks (T001-T003): All can be done in parallel by different team members
- Phase 6 Polish tasks (T036-T039): Workflow annotation tasks can be done in parallel
- Phase 6 Documentation tasks (T040, T042, T048): Can be done in parallel
- Phase 6 Testing tasks (T043-T047): Each test scenario can be executed in parallel

---

## Parallel Example: User Story 1

```bash
# Phase 1 Setup can be done concurrently:
Task: "Configure OPENAI_API_KEY in GitHub repository secrets"
Task: "Verify GitHub Actions workflow permissions"
Task: "Verify existing CI workflow structure"

# User Story 1 tasks are sequential (same file):
# Must complete in order:
1. T012: Get CI workflow run details
2. T013: Check CI conclusion
3. T014: List failed jobs
4. T015: Download failure logs
5. T016: Categorize failures
6. T017-T018: Generate fixes with Codex
7. T019-T024: Apply fixes and commit
```

---

## Parallel Example: Polish Phase

```bash
# Polish tasks can be distributed:
Task: "Add API rate limit handling" (T036)
Task: "Add empty failure log handling" (T037)
Task: "Add workflow annotations" (T039)

# Documentation tasks can be done in parallel:
Task: "Update quickstart.md" (T040)
Task: "Add Codex prompt examples" (T042)
Task: "Update CLAUDE.md" (T048)

# Testing tasks can be run in parallel:
Task: "Test with test failures only" (T043)
Task: "Test with lint failures only" (T044)
Task: "Test with combined failures" (T045)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Complete Phase 1: Setup (T001-T003)
2. ✅ Complete Phase 2: Foundational (T004-T011) - **CRITICAL BLOCKER**
3. ✅ Complete Phase 3: User Story 1 (T012-T024)
4. **STOP and VALIDATE**: Create PR with failing tests, verify autofix commits fixes
5. Deploy/merge if US1 works reliably

**Result**: MVP delivers automated test failure fixes - immediate value

### Incremental Delivery

1. Foundation (Phases 1-2) → Basic workflow structure ready
2. Add US1 (Phase 3) → Test failures fixed automatically → **Deploy MVP**
3. Add US2 (Phase 4) → Lint errors fixed automatically → **Deploy v2**
4. Add US3 (Phase 5) → Combined failures handled → **Deploy v3**
5. Polish (Phase 6) → Error handling + docs → **Production ready**

Each increment adds value without breaking previous functionality.

### Sequential Implementation (Single Developer)

**Week 1**: Foundation
- Day 1-2: Setup + Foundational (T001-T011)
- Day 3-5: User Story 1 (T012-T024)
- Validate: Test US1 independently

**Week 2**: Extended Features
- Day 1-2: User Story 2 (T025-T030)
- Validate: Test US2 independently
- Day 3-4: User Story 3 (T031-T035)
- Validate: Test US3 independently
- Day 5: Polish (T036-T048)

---

## Notes

- **No [P] markers within user stories**: All tasks modify `.github/workflows/autofix.yml` (same file), so must be sequential
- **[P] markers in Setup and Polish**: Different configuration/documentation files can be edited in parallel
- **[Story] labels**: Track which user story each task belongs to
- Each user story builds incrementally: US1 (core) → US2 (extends) → US3 (unifies)
- Manual verification required: No automated workflow tests per user guidance
- Test scenarios in Phase 6 ensure all user stories work independently
- Commit message format is critical for loop prevention (must start with "fix(autofix):")
- Codex prompts should be clear and specific about expected output format
- Error handling ensures workflow never blocks PR progress (fails gracefully)

---

## Success Criteria Checklist

After completing all tasks, verify:

- ✅ SC-001: System generates autofix commits for 80%+ of test failures
- ✅ SC-002: System generates autofix commits for 90%+ of linting errors
- ✅ SC-003: Autofix commits pass CI on first attempt 70%+ of the time
- ✅ SC-004: Workflow completes within 5 minutes of CI failure
- ✅ SC-007: Zero infinite loops (commit message detection works)
- ✅ SC-008: Partial fixes include "Remaining issues" section 100% of the time

**Test Each User Story Independently**:
- US1: Create PR with failing test → Verify autofix commit → Verify test passes
- US2: Create PR with lint error → Verify autofix commit → Verify lint passes
- US3: Create PR with both → Verify single commit → Verify both pass
