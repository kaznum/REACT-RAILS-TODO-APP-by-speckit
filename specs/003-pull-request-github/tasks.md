# Tasks: GitHub Actions CI/CD Workflow

**Input**: Design documents from `/specs/003-pull-request-github/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workflow-schema.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions
- Web app structure: `backend/`, `frontend/`, `.github/workflows/`
- Infrastructure file: `.github/workflows/ci.yml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare GitHub Actions workflow directory

- [x] T001 Create `.github/workflows/` directory at repository root
- [x] T002 Verify `docker-compose.yml` exists and is functional
- [x] T003 Verify backend test command works: `docker compose exec -T backend bundle exec rspec`
- [x] T004 Verify frontend test command works: `docker compose exec -T frontend npm test -- --watchAll=false`
- [x] T005 Verify backend lint command works: `docker compose exec -T backend bundle exec rubocop`
- [x] T006 Verify frontend lint command works: `docker compose exec -T frontend npm run lint`

**Checkpoint**: Local docker compose commands verified - ready to translate to CI workflow

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create base GitHub Actions workflow structure

**⚠️ CRITICAL**: This phase must be complete before any user story features can be added

- [x] T007 Create `.github/workflows/ci.yml` with basic workflow structure (name, triggers, concurrency)
- [x] T008 Add pull_request trigger configuration for events: opened, synchronize, reopened
- [x] T009 Add concurrency control to cancel in-progress runs: group by PR number, cancel-in-progress: true
- [x] T010 Define shared steps template (checkout, Docker Buildx setup) to be reused across jobs

**Checkpoint**: Base workflow file created with triggers and concurrency - ready for job definitions

---

## Phase 3: User Story 1 - Automated Testing on Pull Request Creation (Priority: P1) 🎯 MVP

**Goal**: Implement backend and frontend test execution in CI when PR is created

**Independent Test**: Create a test PR with code changes → CI automatically runs RSpec and Jest tests → Results appear on PR status checks within 5 minutes

### Implementation for User Story 1

- [x] T011 [P] [US1] Add `backend-test` job definition in `.github/workflows/ci.yml`
  - Job ID: backend-test
  - Display name: "Backend Tests (RSpec)"
  - Runs-on: ubuntu-latest
  - Timeout: 15 minutes

- [x] T012 [P] [US1] Add `frontend-test` job definition in `.github/workflows/ci.yml`
  - Job ID: frontend-test
  - Display name: "Frontend Tests (Jest)"
  - Runs-on: ubuntu-latest
  - Timeout: 15 minutes

- [x] T013 [US1] Implement backend-test job steps in `.github/workflows/ci.yml`:
  1. Checkout code (actions/checkout@v3)
  2. Set up Docker Buildx (docker/setup-buildx-action@v2)
  3. Build and start backend service: `docker compose up -d backend`
  4. Run tests: `docker compose exec -T backend bundle exec rspec`
  5. Cleanup (always run): `docker compose down -v`

- [x] T014 [US1] Implement frontend-test job steps in `.github/workflows/ci.yml`:
  1. Checkout code (actions/checkout@v3)
  2. Set up Docker Buildx (docker/setup-buildx-action@v2)
  3. Build and start frontend service: `docker compose up -d frontend`
  4. Run tests: `docker compose exec -T frontend npm test -- --watchAll=false`
  5. Cleanup (always run): `docker compose down -v`

- [x] T015 [US1] Test workflow by creating a test PR:
  - Create branch `test/ci-backend-test`
  - Make trivial change to trigger CI
  - Verify backend-test job runs and passes
  - Verify frontend-test job runs and passes
  - Check status checks appear on PR page
  - Verify logs are accessible

- [x] T016 [US1] Test workflow with failing tests:
  - Create branch `test/ci-failing-test`
  - Introduce intentional test failure
  - Verify job status shows failure (red X)
  - Verify error details are in logs
  - Revert failure and verify status turns green

**Checkpoint**: Backend and frontend tests run automatically on PR creation - MVP deliverable achieved

---

## Phase 4: User Story 2 - Automated Linting on Pull Request Creation (Priority: P2)

**Goal**: Add automated code quality checks (linting) to CI workflow

**Independent Test**: Create a test PR with code style violations → CI runs RuboCop and ESLint → Lint failures appear as separate status checks on PR

### Implementation for User Story 2

- [x] T017 [P] [US2] Add `backend-lint` job definition in `.github/workflows/ci.yml`
  - Job ID: backend-lint
  - Display name: "Backend Lint (RuboCop)"
  - Runs-on: ubuntu-latest
  - Timeout: 10 minutes

- [x] T018 [P] [US2] Add `frontend-lint` job definition in `.github/workflows/ci.yml`
  - Job ID: frontend-lint
  - Display name: "Frontend Lint (ESLint)"
  - Runs-on: ubuntu-latest
  - Timeout: 10 minutes

- [x] T019 [US2] Implement backend-lint job steps in `.github/workflows/ci.yml`:
  1. Checkout code (actions/checkout@v3)
  2. Set up Docker Buildx (docker/setup-buildx-action@v2)
  3. Build and start backend service: `docker compose up -d backend`
  4. Run linter: `docker compose exec -T backend bundle exec rubocop`
  5. Cleanup (always run): `docker compose down -v`

- [x] T020 [US2] Implement frontend-lint job steps in `.github/workflows/ci.yml`:
  1. Checkout code (actions/checkout@v3)
  2. Set up Docker Buildx (docker/setup-buildx-action@v2)
  3. Build and start frontend service: `docker compose up -d frontend`
  4. Run linter: `docker compose exec -T frontend npm run lint`
  5. Cleanup (always run): `docker compose down -v`

- [x] T021 [US2] Test linting workflow:
  - Create branch `test/ci-lint-violation`
  - Introduce style violation (e.g., missing semicolon in JS, wrong indentation in Ruby)
  - Verify backend-lint and/or frontend-lint jobs fail
  - Verify lint error details in logs
  - Fix violations and verify jobs pass

- [x] T022 [US2] Verify all 4 jobs run in parallel:
  - Create test PR
  - Check GitHub Actions UI shows all 4 jobs running simultaneously
  - Verify total workflow time ≈ slowest job time (not sum of all jobs)

**Checkpoint**: All 4 CI checks (2 tests + 2 lints) run automatically on PR creation

---

## Phase 5: User Story 3 - Automated Testing on Pull Request Updates (Priority: P3)

**Goal**: Ensure CI re-runs automatically when new commits are pushed to existing PR

**Independent Test**: Create PR → Push new commit → CI automatically re-runs → Old results replaced with new results

### Implementation for User Story 3

- [x] T023 [US3] Verify `synchronize` trigger is included in pull_request events in `.github/workflows/ci.yml`
  - Already added in T008 - double-check it's present

- [x] T024 [US3] Verify concurrency cancellation works:
  - Create test PR
  - Wait for CI to start
  - Push new commit immediately
  - Verify first run is cancelled (shows "Cancelled" status)
  - Verify second run starts for new commit
  - Check only latest commit results are shown on PR

- [ ] T025 [US3] Test rapid commit scenario:
  - Create test PR
  - Push 3 commits in quick succession (within 1 minute)
  - Verify only the last commit's CI run completes
  - Verify earlier runs are cancelled
  - Check PR shows correct status for latest commit

- [ ] T026 [US3] Test status change scenario (pass → fail):
  - Create PR with passing tests
  - Verify all checks green
  - Push commit with failing test
  - Verify checks change to red
  - Check PR merge button is disabled (if branch protection enabled)

- [ ] T027 [US3] Test status change scenario (fail → pass):
  - Create PR with failing test
  - Verify checks are red
  - Push commit that fixes the test
  - Verify checks change to green
  - Check PR merge button is enabled

**Checkpoint**: CI automatically re-runs on every commit to PR, with proper cancellation of outdated runs

---

## Phase 6: User Story 4 - CI Status Visibility on Pull Request (Priority: P4)

**Goal**: Ensure CI status is clearly visible and accessible on PR page

**Independent Test**: View any PR with CI running/complete → All 4 check statuses visible → Click on failure shows detailed logs

### Implementation for User Story 4

- [ ] T028 [US4] Verify job display names appear correctly on PR:
  - Create test PR
  - Check PR "Checks" section shows:
    - "Backend Tests (RSpec)"
    - "Backend Lint (RuboCop)"
    - "Frontend Tests (Jest)"
    - "Frontend Lint (ESLint)"

- [ ] T029 [US4] Verify check status indicators:
  - While CI is running: Yellow circle with "in progress"
  - When all pass: Green checkmark with "All checks have passed"
  - When any fails: Red X with "Some checks were not successful"

- [ ] T030 [US4] Verify detailed logs are accessible:
  - Create PR with failing check
  - Click on failed check name
  - Verify redirects to GitHub Actions log page
  - Verify log shows full output (test errors, stack traces, etc.)
  - Verify log sections are collapsible/expandable

- [ ] T031 [US4] Test log output quality:
  - Intentionally fail each job type once (test, lint, build error)
  - Verify error messages are clear and actionable:
    - Test failures show which test failed and why
    - Lint failures show which file and which rule violated
    - Build errors show Docker/dependency error details

- [ ] T032 [US4] Verify status check summary:
  - Create PR with mixed results (2 pass, 2 fail)
  - Check PR summary shows count of passing/failing checks
  - Verify developers can quickly identify which checks failed

**Checkpoint**: All CI status information is clearly visible and accessible from PR page

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Optimizations and documentation that benefit all user stories

- [ ] T033 [P] Add dependency caching to speed up CI in `.github/workflows/ci.yml`:
  - Add Docker layer caching using actions/cache@v3
  - Cache key based on Dockerfile and docker-compose.yml changes
  - Add Ruby gems cache (backend/.bundle) if applicable
  - Add npm packages cache (frontend/node_modules) if applicable

- [ ] T034 [P] Add workflow performance monitoring:
  - Document baseline CI run times (first run, cached run)
  - Verify 95% of runs complete within 10 minutes
  - Check GitHub Actions minutes usage

- [ ] T035 [P] Update documentation in `README.md`:
  - Add "Continuous Integration" section
  - Document CI workflow triggers (PR events)
  - Explain status check requirements
  - Link to troubleshooting guide

- [ ] T036 [P] Update documentation in `IMPLEMENTATION_STATUS.md`:
  - Add note about CI/CD implementation
  - Update "Development Workflow" section
  - Document that CI is required for PR merges

- [ ] T037 Test edge cases documented in spec.md:
  - Test draft PR (verify CI runs or doesn't run based on config)
  - Test PR with merge conflicts (verify CI still runs)
  - Test workflow file modification (PR that changes ci.yml itself)

- [ ] T038 [Optional] Configure branch protection rules on GitHub:
  - Go to Settings → Branches → Add rule for `main`
  - Enable "Require status checks to pass before merging"
  - Select all 4 checks as required:
    - Backend Tests (RSpec)
    - Backend Lint (RuboCop)
    - Frontend Tests (Jest)
    - Frontend Lint (ESLint)
  - Enable "Require branches to be up to date before merging"
  - Save

- [ ] T039 [Optional] Add workflow status badge to README.md:
  - Get badge markdown from GitHub Actions tab
  - Add to top of README: `![CI](https://github.com/user/repo/workflows/CI/badge.svg)`

- [ ] T040 Clean up test branches used for validation:
  - Delete `test/ci-backend-test`, `test/ci-failing-test`, etc.
  - Close test PRs

**Checkpoint**: CI workflow is optimized, documented, and production-ready

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T006) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T007-T010) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (T007-T010) completion - Can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on US1 (T011-T016) completion (needs working CI to test re-runs)
- **User Story 4 (Phase 6)**: Depends on US1 (T011-T016) completion (needs working checks to test visibility)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - only depends on Foundational phase
- **User Story 2 (P2)**: Independent - only depends on Foundational phase (can be developed in parallel with US1)
- **User Story 3 (P3)**: Depends on US1 (needs working CI to test update behavior)
- **User Story 4 (P4)**: Depends on US1 (needs working checks to test visibility)

### Within Each User Story

- **US1 Tasks T011-T012**: Can run in parallel (different job definitions)
- **US1 Tasks T013-T014**: Can run in parallel (different job implementations)
- **US1 Task T015**: Depends on T011-T014 (needs complete jobs to test)
- **US1 Task T016**: Depends on T015 (needs working workflow to test failures)
- **US2 Tasks T017-T018**: Can run in parallel (different job definitions)
- **US2 Tasks T019-T020**: Can run in parallel (different job implementations)
- **US2 Task T021**: Depends on T017-T020 (needs complete jobs to test)
- **US2 Task T022**: Depends on US1 and US2 completion (tests all jobs together)

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T006 can run in parallel (different test commands)
- **Phase 2**: T008, T009, T010 can run in parallel (different sections of workflow file)
- **Phase 3 (US1)**: T011 and T012 can run in parallel (different job definitions)
- **Phase 3 (US1)**: T013 and T014 can run in parallel (different job implementations)
- **Phase 4 (US2)**: T017 and T018 can run in parallel (different job definitions)
- **Phase 4 (US2)**: T019 and T020 can run in parallel (different job implementations)
- **Phase 7**: T033, T034, T035, T036 can run in parallel (different files/tasks)
- **User Story 1 and User Story 2**: Can be developed in parallel after Foundational phase

---

## Parallel Example: User Story 1 (Backend & Frontend Test Jobs)

```bash
# Launch test job definitions in parallel:
Task T011: "Add backend-test job definition in .github/workflows/ci.yml"
Task T012: "Add frontend-test job definition in .github/workflows/ci.yml"

# Launch test job implementations in parallel:
Task T013: "Implement backend-test job steps"
Task T014: "Implement frontend-test job steps"
```

---

## Parallel Example: User Story 2 (Backend & Frontend Lint Jobs)

```bash
# Launch lint job definitions in parallel:
Task T017: "Add backend-lint job definition in .github/workflows/ci.yml"
Task T018: "Add frontend-lint job definition in .github/workflows/ci.yml"

# Launch lint job implementations in parallel:
Task T019: "Implement backend-lint job steps"
Task T020: "Implement frontend-lint job steps"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006) - Verify local docker commands work
2. Complete Phase 2: Foundational (T007-T010) - Create base workflow structure
3. Complete Phase 3: User Story 1 (T011-T016) - Add test jobs
4. **STOP and VALIDATE**: Create test PR, verify backend and frontend tests run automatically
5. Deploy to production (merge to main) - CI now active for tests only

**Estimated Time**: 2-3 hours for MVP (assuming docker compose already works)

### Incremental Delivery

1. Complete Setup + Foundational → Base workflow ready (30 min)
2. Add User Story 1 → Test jobs working → **Deploy (MVP!)** (1-2 hours)
3. Add User Story 2 → Lint jobs working → Deploy (1 hour)
4. Add User Story 3 → Update behavior verified → Deploy (30 min)
5. Add User Story 4 → Status visibility confirmed → Deploy (30 min)
6. Add Polish → Caching, docs, branch protection → Deploy (1 hour)

**Total Estimated Time**: 4-6 hours for complete implementation

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together (30 min)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Test jobs)
   - **Developer B**: User Story 2 (Lint jobs)
3. After US1 completes:
   - **Developer A**: User Story 3 (Update behavior)
   - **Developer B**: User Story 4 (Status visibility)
4. Both tackle Polish tasks in parallel

**Total Estimated Time**: 3-4 hours with 2 developers

---

## Testing Strategy

### Workflow Validation (No Traditional Tests)

This feature is infrastructure code (GitHub Actions YAML). Instead of traditional unit/integration tests, validation is performed by:

1. **YAML Syntax Validation**: GitHub validates workflow file syntax automatically on commit
2. **Test PR Creation**: Create real PRs to verify workflow triggers and runs correctly
3. **Failure Testing**: Intentionally introduce failures to verify error reporting
4. **Manual Verification**: Check PR status checks, logs, and behavior

### Test PRs to Create

- [ ] Test PR 1: Clean code (all checks pass) - Verify green checkmarks
- [ ] Test PR 2: Failing RSpec test - Verify backend-test job fails
- [ ] Test PR 3: Failing Jest test - Verify frontend-test job fails
- [ ] Test PR 4: RuboCop violation - Verify backend-lint job fails
- [ ] Test PR 5: ESLint violation - Verify frontend-lint job fails
- [ ] Test PR 6: Multiple failures - Verify all failing checks show correctly
- [ ] Test PR 7: Rapid commits - Verify concurrency cancellation works
- [ ] Test PR 8: Workflow file change - Verify workflow updates work

---

## Notes

- [P] tasks = different files/sections, no dependencies
- [Story] label maps task to specific user story (US1, US2, US3, US4) for traceability
- Each user story should be independently completable and testable
- Workflow YAML is validated by GitHub on commit
- Use test PRs to verify behavior instead of traditional tests
- Commit after each task or logical group (T011-T012, T013-T014, etc.)
- Stop at any checkpoint to validate story independently
- This is infrastructure code - validation is manual testing with real PRs
- Keep workflow simple and maintainable - avoid over-optimization in initial implementation

---

## Success Criteria Validation

After all tasks complete, verify these success criteria from spec.md:

- [ ] **SC-001**: CI completes within 10 minutes for 95% of PRs (measure actual run times)
- [ ] **SC-002**: Status updates appear within 30 seconds (observe on test PR)
- [ ] **SC-003**: 100% of test failures caught (create failing test, verify it's caught)
- [ ] **SC-004**: 100% of lint violations caught (create violation, verify it's caught)
- [ ] **SC-005**: Zero failing PRs merged (enable branch protection, try to merge failing PR)
- [ ] **SC-007**: 99% CI success rate (monitor over time after deployment)
- [ ] **SC-008**: Failures identifiable in < 1 minute (click failed check, verify log is clear)
- [ ] **SC-010**: Cost under $50/month (check GitHub Actions usage after 1 month)

---

## Rollback Plan

If CI workflow causes issues:

1. **Disable workflow**: Rename `ci.yml` to `ci.yml.disabled` and commit
2. **Remove from branch protection**: Remove required status checks from main branch settings
3. **Fix issues**: Debug workflow file, fix problems
4. **Re-enable**: Rename back to `ci.yml` and restore branch protection

**Emergency disable command**:
```bash
git mv .github/workflows/ci.yml .github/workflows/ci.yml.disabled
git commit -m "ci: Temporarily disable CI workflow"
git push origin main
```
