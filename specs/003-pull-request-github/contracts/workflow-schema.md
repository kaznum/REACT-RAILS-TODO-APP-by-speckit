# GitHub Actions Workflow Contract

**Feature**: 003-pull-request-github
**File**: `.github/workflows/ci.yml`
**Date**: 2025-10-10

## Overview

This document defines the contract for the GitHub Actions CI workflow. Since this is infrastructure code (YAML configuration), the "contract" describes the expected workflow structure, triggers, jobs, and outputs rather than traditional API requests/responses.

---

## Workflow Metadata

```yaml
name: CI
description: Run tests and linting on pull requests
```

**Contract**:
- Workflow name MUST be "CI" for clear identification in GitHub UI
- Workflow MUST be located at `.github/workflows/ci.yml`

---

## Triggers

```yaml
on:
  pull_request:
    types:
      - opened
      - synchronize
      - reopened
```

**Contract**:
- Workflow MUST trigger on pull request events only
- MUST trigger when PR is opened (initial creation)
- MUST trigger when PR is synchronized (new commits pushed)
- MUST trigger when PR is reopened (after being closed)
- MUST NOT trigger on push to main/master (not a PR event)
- MUST NOT trigger on issue comments or other non-PR events

**Validation**:
- GitHub validates trigger configuration on workflow file commit
- Invalid triggers cause workflow to be disabled with error

---

## Concurrency Control

```yaml
concurrency:
  group: ci-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

**Contract**:
- Concurrency group MUST be unique per pull request number
- In-progress runs MUST be cancelled when new commits are pushed
- Multiple PRs MUST be able to run workflows concurrently

**Expected Behavior**:
- PR #123 pushes commit A → Workflow starts
- PR #123 pushes commit B → Workflow for commit A is cancelled, B starts
- PR #456 pushes commit C → Runs independently (different group)

---

## Jobs

### Job: backend-test

```yaml
backend-test:
  name: "Backend Tests (RSpec)"
  runs-on: ubuntu-latest
  timeout-minutes: 15
  steps: [...]
```

**Contract**:
- Job ID MUST be `backend-test`
- Display name MUST be "Backend Tests (RSpec)"
- MUST run on `ubuntu-latest` GitHub-hosted runner
- MUST complete within 15 minutes or be terminated
- MUST create a Check Run named "Backend Tests (RSpec)" on the PR

**Expected Outputs**:
- Exit code 0: All tests passed → Check status: success
- Exit code non-zero: Tests failed → Check status: failure
- Timeout: → Check status: failure with timeout message

**Steps Contract**:
1. Checkout repository code
2. Set up Docker Buildx for caching
3. Build backend Docker image with docker compose
4. Start services with docker compose
5. Run `docker compose exec -T backend bundle exec rspec`
6. Clean up with docker compose down

---

### Job: backend-lint

```yaml
backend-lint:
  name: "Backend Lint (RuboCop)"
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps: [...]
```

**Contract**:
- Job ID MUST be `backend-lint`
- Display name MUST be "Backend Lint (RuboCop)"
- MUST run on `ubuntu-latest` GitHub-hosted runner
- MUST complete within 10 minutes or be terminated
- MUST create a Check Run named "Backend Lint (RuboCop)" on the PR

**Expected Outputs**:
- Exit code 0: No linting violations → Check status: success
- Exit code non-zero: Linting violations found → Check status: failure

**Steps Contract**:
1. Checkout repository code
2. Set up Docker Buildx for caching
3. Build backend Docker image with docker compose
4. Start services with docker compose
5. Run `docker compose exec -T backend bundle exec rubocop`
6. Clean up with docker compose down

---

### Job: frontend-test

```yaml
frontend-test:
  name: "Frontend Tests (Jest)"
  runs-on: ubuntu-latest
  timeout-minutes: 15
  steps: [...]
```

**Contract**:
- Job ID MUST be `frontend-test`
- Display name MUST be "Frontend Tests (Jest)"
- MUST run on `ubuntu-latest` GitHub-hosted runner
- MUST complete within 15 minutes or be terminated
- MUST create a Check Run named "Frontend Tests (Jest)" on the PR

**Expected Outputs**:
- Exit code 0: All tests passed → Check status: success
- Exit code non-zero: Tests failed → Check status: failure

**Steps Contract**:
1. Checkout repository code
2. Set up Docker Buildx for caching
3. Build frontend Docker image with docker compose
4. Start services with docker compose
5. Run `docker compose exec -T frontend npm test -- --watchAll=false`
6. Clean up with docker compose down

---

### Job: frontend-lint

```yaml
frontend-lint:
  name: "Frontend Lint (ESLint)"
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps: [...]
```

**Contract**:
- Job ID MUST be `frontend-lint`
- Display name MUST be "Frontend Lint (ESLint)"
- MUST run on `ubuntu-latest` GitHub-hosted runner
- MUST complete within 10 minutes or be terminated
- MUST create a Check Run named "Frontend Lint (ESLint)" on the PR

**Expected Outputs**:
- Exit code 0: No linting violations → Check status: success
- Exit code non-zero: Linting violations found → Check status: failure

**Steps Contract**:
1. Checkout repository code
2. Set up Docker Buildx for caching
3. Build frontend Docker image with docker compose
4. Start services with docker compose
5. Run `docker compose exec -T frontend npm run lint`
6. Clean up with docker compose down

---

## Parallel Execution

**Contract**:
- All 4 jobs (backend-test, backend-lint, frontend-test, frontend-lint) MUST run in parallel
- No job dependencies defined (no `needs:` relationships)
- Each job operates independently

**Expected Behavior**:
- When workflow triggered, all 4 jobs queued simultaneously
- Jobs may start at different times depending on runner availability
- One job failure does NOT cancel other running jobs
- Workflow marked as failed if ANY job fails

---

## Caching

### Docker Layer Cache

```yaml
- uses: docker/setup-buildx-action@v2
- uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

**Contract**:
- Docker layers MUST be cached between runs
- Cache key MUST include runner OS and commit SHA
- Restore keys MUST allow fallback to previous builds
- Cache MUST be scoped to repository (not accessible cross-repo)

**Expected Behavior**:
- First run: No cache hit, builds from scratch (~8-10 minutes)
- Subsequent runs: Cache hit, only rebuilds changed layers (~2-4 minutes)
- Cache expires after 7 days of no access

### Dependency Cache (Optional Enhancement)

```yaml
- uses: actions/cache@v3
  with:
    path: |
      backend/.bundle
      frontend/node_modules
    key: deps-${{ hashFiles('**/Gemfile.lock', '**/package-lock.json') }}
```

**Contract** (if implemented):
- Ruby gems and npm packages MAY be cached
- Cache key MUST be based on lockfile hashes
- Cache invalidated when Gemfile.lock or package-lock.json changes

---

## Environment Variables

**Contract**:
- No sensitive environment variables required (tests use test database)
- GitHub-provided environment variables available:
  - `GITHUB_SHA`: Commit SHA being tested
  - `GITHUB_REF`: Git ref (branch name)
  - `GITHUB_REPOSITORY`: Repository name
  - `GITHUB_EVENT_NAME`: pull_request
  - `GITHUB_WORKSPACE`: Workspace directory path

**Docker Compose Environment**:
- Workflow MUST NOT modify `docker-compose.yml` environment variables
- Workflow MUST use existing environment configurations

---

## Check Run Results

### Success State

**Contract**:
- Check run status MUST be "success" when job exit code is 0
- Check run title SHOULD include test/lint count (e.g., "74 tests passed")
- Check run summary SHOULD be empty or brief confirmation message
- Details URL MUST link to GitHub Actions job log

**Example Output**:
```
✓ Backend Tests (RSpec)
  74 examples, 0 failures
  Finished in 6.5 seconds
```

### Failure State

**Contract**:
- Check run status MUST be "failure" when job exit code is non-zero
- Check run title SHOULD include failure count (e.g., "3 tests failed")
- Check run summary SHOULD include first error message
- Details URL MUST link to GitHub Actions job log showing failure

**Example Output**:
```
✗ Backend Tests (RSpec)
  74 examples, 3 failures

  Failures:
  1) TodosController DELETE #destroy deletes the todo
     Failure/Error: expect(response).to have_http_status(:ok)
  ...
```

### Cancelled State

**Contract**:
- Check run status MUST be "cancelled" when:
  - New commit pushed (concurrency cancellation)
  - User manually cancels workflow
  - Job timeout exceeded
- Check run summary SHOULD indicate reason for cancellation

---

## Failure Modes

### Workflow File Syntax Error

**Contract**:
- GitHub MUST reject invalid YAML syntax on commit
- Workflow MUST NOT run if syntax is invalid
- Error message MUST appear in repository Actions tab

### Docker Build Failure

**Contract**:
- Job MUST fail if docker compose build fails
- Exit code MUST be non-zero
- Full docker build log MUST be available in job log

### Service Start Failure

**Contract**:
- Job MUST fail if docker compose up fails
- Job MUST fail if services don't become healthy within timeout
- Error log MUST show service startup error

### Test/Lint Failure

**Contract**:
- Job MUST fail if test command exits with non-zero code
- Full test output MUST be captured in job log
- Job MUST fail if lint command exits with non-zero code
- Full lint output MUST be captured in job log

### Timeout Failure

**Contract**:
- Job MUST be terminated if execution exceeds timeout
- Check run MUST show "timeout" as failure reason
- Partial logs MUST be available up to timeout point

---

## Performance Requirements

**Contract**:
- Total workflow execution MUST complete within 10 minutes (95th percentile)
- With cache: Target 3-5 minutes
- Without cache (first run): Target 8-10 minutes
- Individual jobs MUST NOT exceed their timeout (10-15 minutes)

**Measurement**:
- Timing reported in GitHub Actions UI
- Each step shows individual duration
- Total job duration calculated automatically

---

## Cleanup

**Contract**:
- Docker compose down MUST run even if tests fail (using `if: always()`)
- Docker containers MUST be stopped and removed
- Docker networks MUST be removed
- No persistent state MUST remain on runner after job completion

**Implementation**:
```yaml
- name: Cleanup
  if: always()
  run: docker compose down -v
```

---

## Integration Points

### Repository Requirements

**Contract**:
- Repository MUST have `docker-compose.yml` at root
- Repository MUST have `backend/` directory with RSpec tests
- Repository MUST have `frontend/` directory with Jest tests
- Backend MUST have `.rubocop.yml` configuration
- Frontend MUST have `.eslintrc.json` configuration

### Branch Protection (Optional)

**Contract** (if branch protection enabled):
- Main branch MUST require "Backend Tests (RSpec)" to pass
- Main branch MUST require "Frontend Tests (Jest)" to pass
- Main branch MUST require "Backend Lint (RuboCop)" to pass
- Main branch MUST require "Frontend Lint (ESLint)" to pass
- Merge button MUST be disabled if any required check fails

---

## Version Compatibility

**Contract**:
- Workflow MUST be compatible with GitHub Actions runner version
- Actions used MUST pin to major version (e.g., `@v3`)
- Docker Compose MUST use version compatible with runner
- Ruby/Node versions determined by Dockerfile (not workflow)

**Action Versions**:
- `actions/checkout@v3` - Repository checkout
- `docker/setup-buildx-action@v2` - Docker Buildx setup
- `docker/build-push-action@v4` - Docker image building
- `actions/cache@v3` - Dependency caching

---

## Security Considerations

**Contract**:
- Workflow MUST NOT expose secrets in logs
- Workflow MUST NOT allow arbitrary code execution from PR
- Workflow MUST run in isolated environment per job
- Pull requests from forks MUST NOT have access to repository secrets

**GitHub Actions Security**:
- GitHub enforces isolation between workflows
- Forked PRs run with restricted permissions
- Workflow cannot modify repository without explicit permission

---

## Success Criteria Validation

This workflow contract ensures the following success criteria from the specification:

- **SC-001**: CI completion < 10 minutes → Enforced by job timeouts and caching
- **SC-002**: Status updates < 30 seconds → GitHub Actions automatic behavior
- **SC-003**: Catches 100% test failures → All tests executed, exit code checked
- **SC-004**: Catches 100% lint violations → All linters executed, exit code checked
- **SC-005**: Zero failing PRs merged → Enabled via branch protection rules
- **SC-007**: 99% CI success rate → Monitored via GitHub Actions metrics
- **SC-008**: Identify failures < 1 minute → Direct links to logs in check runs

---

## Contract Validation

**How to validate**:
1. Commit workflow file to repository
2. GitHub validates YAML syntax automatically
3. Create test PR to trigger workflow
4. Verify all 4 jobs appear in PR status checks
5. Verify jobs run in parallel
6. Verify logs are accessible from check runs
7. Verify concurrency cancellation works

**Contract testing**:
- Test with passing code → All checks green
- Test with failing tests → Test checks red, lint checks green
- Test with lint violations → Lint checks red, test checks green
- Test with rapid commits → Verify cancellation occurs
- Test with timeout code → Verify timeout termination
