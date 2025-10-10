# Research: GitHub Actions CI/CD Workflow Implementation

**Feature**: 003-pull-request-github
**Date**: 2025-10-10
**Status**: Complete

## Overview

This document captures research findings for implementing GitHub Actions CI workflow that runs tests and linting using docker compose for a React + Rails application.

---

## Decision 1: GitHub Actions Workflow Structure

**Decision**: Use a single workflow file (`.github/workflows/ci.yml`) with multiple parallel jobs

**Rationale**:
- GitHub Actions allows parallel job execution within a single workflow
- Simplifies management (one file vs. multiple workflow files)
- Provides unified PR status check display
- Easier to share setup steps (checkout, docker setup) across jobs

**Alternatives Considered**:
1. **Separate workflow files per check** (ci-backend-test.yml, ci-frontend-test.yml, etc.)
   - Rejected: Creates maintenance overhead, harder to coordinate dependency caching
2. **Single job with sequential steps**
   - Rejected: Slower execution time, no parallelization benefits
3. **Matrix strategy for test/lint**
   - Rejected: Overcomplicates for just 4 distinct jobs (backend vs frontend, test vs lint)

**Implementation Notes**:
- Use `jobs.<job_id>.needs` for any job dependencies
- Set `concurrency` group to cancel outdated runs when new commits pushed
- Use `pull_request` trigger for events: `[opened, synchronize, reopened]`

---

## Decision 2: Docker Compose Integration in CI

**Decision**: Use `docker compose` commands directly in GitHub Actions with service-level testing

**Rationale**:
- Matches local development environment exactly (parity)
- Leverages existing `docker-compose.yml` configuration
- GitHub Actions runners support Docker and Docker Compose natively
- Avoids maintaining separate CI-specific Docker setup

**Alternatives Considered**:
1. **Native GitHub Actions containers** (container: image in workflow)
   - Rejected: Would require maintaining separate Dockerfiles for CI, breaks dev/CI parity
2. **Docker-in-Docker (DinD)**
   - Rejected: Unnecessary complexity, docker compose is sufficient
3. **Install dependencies directly on runner** (no Docker)
   - Rejected: Violates requirement to use docker compose, inconsistent with local dev

**Implementation Notes**:
- Run `docker compose up -d` to start services
- Execute tests/lints with `docker compose exec -T <service> <command>`
- Use `-T` flag to disable TTY (required in CI environment)
- Clean up with `docker compose down` in post-job cleanup

---

## Decision 3: Dependency Caching Strategy

**Decision**: Use GitHub Actions cache action for Docker layers and language-specific dependencies

**Rationale**:
- Reduces CI run time by ~60-70% after first run
- Docker layer caching is supported via buildx cache backend
- Language-specific caches (bundler, npm) further speed up builds
- GitHub provides generous cache storage (10GB per repository)

**Alternatives Considered**:
1. **No caching**
   - Rejected: CI runs would be 8-10 minutes, exceeds performance goals
2. **Only language dependency caching** (gems, node_modules)
   - Rejected: Missing Docker layer cache means rebuilding images every time
3. **Docker registry cache** (push/pull from GHCR)
   - Rejected: Adds complexity, Actions cache is simpler and faster for this use case

**Implementation Notes**:
```yaml
- uses: docker/setup-buildx-action@v2
- uses: docker/build-push-action@v4
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

For bundle/npm caching inside containers:
```yaml
- uses: actions/cache@v3
  with:
    path: |
      backend/.bundle
      frontend/node_modules
    key: ${{ runner.os }}-deps-${{ hashFiles('**/Gemfile.lock', '**/package-lock.json') }}
```

---

## Decision 4: Job Naming and Status Check Configuration

**Decision**: Use descriptive job IDs that match PR status check display

**Rationale**:
- Clear job names help developers quickly identify which check failed
- GitHub displays job ID as the status check name by default
- Follows GitHub Actions best practices for PR checks

**Implementation**:
```yaml
jobs:
  backend-test:
    name: "Backend Tests (RSpec)"
  backend-lint:
    name: "Backend Lint (RuboCop)"
  frontend-test:
    name: "Frontend Tests (Jest)"
  frontend-lint:
    name: "Frontend Lint (ESLint)"
```

**Alternatives Considered**:
1. **Generic names** (test-1, test-2)
   - Rejected: Poor developer experience, unclear what failed
2. **Very long descriptive names**
   - Rejected: Clutters PR UI, makes status checks hard to scan

---

## Decision 5: Failure Handling and Log Output

**Decision**: Let jobs fail fast and preserve full log output in GitHub Actions UI

**Rationale**:
- Developers need detailed error messages to fix issues
- GitHub Actions provides excellent log viewing with collapsible sections
- Fast failure saves CI minutes when multiple jobs would fail

**Implementation Notes**:
- Use `set -e` in shell steps to fail on first error
- Don't suppress error output (let RSpec/Jest/RuboCop print full details)
- Use `continue-on-error: false` (default) for critical checks

**Alternatives Considered**:
1. **Capture and parse error output**
   - Rejected: GitHub Actions already provides this, unnecessary duplication
2. **Continue on error and summarize failures**
   - Rejected: Would delay feedback, developers want immediate failure notice
3. **Upload artifacts for failures**
   - Considered but not required: Logs are already in GitHub Actions UI

---

## Decision 6: Concurrency Control

**Decision**: Cancel in-progress runs when new commits are pushed to the same PR

**Rationale**:
- Saves CI minutes (cost optimization)
- Developers only care about latest commit results
- Prevents queue buildup on rapidly updated PRs

**Implementation**:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

**Alternatives Considered**:
1. **Let all runs complete**
   - Rejected: Wastes CI minutes and developer time reviewing outdated results
2. **Queue runs** (cancel-in-progress: false)
   - Rejected: Creates delays when developers push frequent updates

---

## Best Practices Applied

### GitHub Actions Specific
1. **Pin action versions** to major version (e.g., `@v3`) for stability with auto-updates
2. **Use environment files** (`$GITHUB_OUTPUT`) instead of deprecated set-output
3. **Minimize secret usage** - not needed for public test/lint operations
4. **Set timeouts** on jobs to prevent runaway processes

### Docker Compose Best Practices
1. **Health checks** - ensure services are ready before running tests
2. **Resource limits** - prevent CI runner resource exhaustion
3. **Cleanup** - always run `docker compose down` even on failure

### Performance Optimization
1. **Parallel execution** - all 4 jobs run simultaneously
2. **Layered caching** - Docker layers + dependency directories
3. **Fail fast** - stop immediately on first error per job

---

## Open Questions & Future Enhancements

### Resolved
- ✅ How to handle docker compose in CI? → Use `docker compose exec -T`
- ✅ How to cache dependencies? → Actions cache + Docker buildx cache
- ✅ How to name status checks? → Use descriptive job IDs

### Future Enhancements (Out of Scope)
- **Code coverage reporting**: Could add coverage collection and upload to Codecov
- **Parallel test execution**: Could split RSpec/Jest tests into multiple jobs
- **Performance tracking**: Could track and alert on CI run time trends
- **Deployment automation**: CD pipeline for staging/production

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose in GitHub Actions](https://docs.docker.com/compose/github-actions/)
- [Actions Cache](https://github.com/actions/cache)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- Existing project: `docker-compose.yml`, `backend/.rubocop.yml`, `frontend/.eslintrc.json`
