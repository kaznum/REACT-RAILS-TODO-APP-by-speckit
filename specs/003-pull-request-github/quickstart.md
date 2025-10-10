# Quickstart: GitHub Actions CI Workflow

**Feature**: 003-pull-request-github
**Target Audience**: Developers setting up or using the CI workflow
**Estimated Time**: 10 minutes for setup, immediate for daily use

## Overview

This guide helps you set up and use the GitHub Actions CI workflow that automatically runs tests and linting on every pull request.

---

## Prerequisites

Before starting, ensure you have:

✅ **Repository Access**:
- GitHub repository with Actions enabled
- Permission to create/modify workflows (write access)

✅ **Local Development Setup**:
- Docker and Docker Compose installed
- Existing `docker-compose.yml` configured
- Backend and frontend tests passing locally

✅ **Existing Test Suites**:
- Backend: RSpec tests in `backend/spec/`
- Frontend: Jest tests in `frontend/src/`
- Backend linter: RuboCop config in `backend/.rubocop.yml`
- Frontend linter: ESLint config in `frontend/.eslintrc.json`

---

## Quick Start (5 Minutes)

### Step 1: Create Workflow File

Create the GitHub Actions workflow configuration:

```bash
# From repository root
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml` with this content:

```yaml
name: CI

on:
  pull_request:
    types: [opened, synchronize, reopened]

concurrency:
  group: ci-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  backend-test:
    name: "Backend Tests (RSpec)"
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build and start services
        run: docker compose up -d backend

      - name: Run backend tests
        run: docker compose exec -T backend bundle exec rspec

      - name: Cleanup
        if: always()
        run: docker compose down -v

  backend-lint:
    name: "Backend Lint (RuboCop)"
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build and start services
        run: docker compose up -d backend

      - name: Run backend linting
        run: docker compose exec -T backend bundle exec rubocop

      - name: Cleanup
        if: always()
        run: docker compose down -v

  frontend-test:
    name: "Frontend Tests (Jest)"
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build and start services
        run: docker compose up -d frontend

      - name: Run frontend tests
        run: docker compose exec -T frontend npm test -- --watchAll=false

      - name: Cleanup
        if: always()
        run: docker compose down -v

  frontend-lint:
    name: "Frontend Lint (ESLint)"
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build and start services
        run: docker compose up -d frontend

      - name: Run frontend linting
        run: docker compose exec -T frontend npm run lint

      - name: Cleanup
        if: always()
        run: docker compose down -v
```

### Step 2: Commit and Push

```bash
git add .github/workflows/ci.yml
git commit -m "ci: Add GitHub Actions workflow for tests and linting"
git push origin main
```

### Step 3: Verify Setup

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Verify the "CI" workflow appears in the list
4. No runs yet (workflow only triggers on PRs)

**That's it!** Your CI is now set up. ✅

---

## Daily Usage

### Creating a Pull Request

When you create a PR, CI automatically runs:

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: Add new feature"
git push origin feature/my-feature

# Create PR on GitHub
# CI will automatically start within seconds
```

### Viewing CI Results

1. **On Pull Request Page**:
   - Scroll to "Checks" section
   - See 4 status checks:
     - ✓ Backend Tests (RSpec)
     - ✓ Frontend Tests (Jest)
     - ✓ Backend Lint (RuboCop)
     - ✓ Frontend Lint (ESLint)

2. **Click on a Check**:
   - View detailed logs
   - See exactly which test failed
   - Get error messages and stack traces

3. **Status Indicators**:
   - 🟡 Yellow circle: CI running
   - ✅ Green checkmark: All checks passed
   - ❌ Red X: At least one check failed
   - ⚪ Grey circle: Check not run yet

### Fixing Failing Checks

If CI fails:

```bash
# See which check failed on PR page
# Example: "Backend Tests (RSpec)" failed

# Run tests locally to reproduce
docker compose exec backend bundle exec rspec

# Fix the failing test
# Make changes...

# Verify fix locally
docker compose exec backend bundle exec rspec

# Commit and push
git add .
git commit -m "fix: Resolve failing test"
git push origin feature/my-feature

# CI automatically re-runs on push
# PR updates with new status
```

### Rapid Iteration

When you push multiple commits quickly:

```bash
# Push commit 1
git push origin feature/my-feature
# CI starts for commit 1

# Push commit 2 (while commit 1 CI is still running)
git push origin feature/my-feature
# CI for commit 1 is automatically cancelled
# CI starts for commit 2

# Only the latest commit's CI matters
```

---

## Advanced Configuration (Optional)

### Add Dependency Caching

Speed up CI by caching gems and npm packages:

```yaml
# Add to each job after checkout:
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: |
      backend/.bundle
      frontend/node_modules
    key: deps-${{ runner.os }}-${{ hashFiles('**/Gemfile.lock', '**/package-lock.json') }}
    restore-keys: |
      deps-${{ runner.os }}-
```

### Add Docker Layer Caching

Further speed up CI by caching Docker layers:

```yaml
# Add to each job after "Set up Docker Buildx":
- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

### Require Status Checks Before Merge

Set up branch protection to enforce CI:

1. Go to Settings → Branches
2. Add branch protection rule for `main`
3. Enable "Require status checks to pass before merging"
4. Select all 4 checks:
   - Backend Tests (RSpec)
   - Backend Lint (RuboCop)
   - Frontend Tests (Jest)
   - Frontend Lint (ESLint)
5. Save

Now PRs cannot be merged if any check fails! 🔒

---

## Troubleshooting

### Problem: Workflow doesn't trigger

**Symptoms**: Created PR but no CI checks appear

**Solutions**:
1. Check workflow file is committed to `main` branch
2. Verify file is at `.github/workflows/ci.yml` (exact path)
3. Check GitHub Actions is enabled (Settings → Actions)
4. Ensure PR is not a draft (convert to regular PR)

### Problem: "docker compose: command not found"

**Symptoms**: CI fails with error about docker compose

**Solutions**:
1. Update workflow to use `docker-compose` (hyphenated) if using older runner image
2. Or update docker-compose.yml to use v3 format
3. Check Compose version compatibility with runner

### Problem: Tests pass locally but fail in CI

**Symptoms**: Local tests green, CI tests red

**Common Causes**:
1. **Environment differences**: CI uses different env vars
   - Solution: Check `.env.example` matches CI needs
2. **Timezone differences**: CI runs in UTC
   - Solution: Use `Time.zone.now` not `Time.now`
3. **Flaky tests**: Tests depend on timing/order
   - Solution: Fix test isolation
4. **Database state**: Tests assume specific data exists
   - Solution: Use factories, clean between tests

**Debug Steps**:
```bash
# Reproduce CI environment locally
docker compose down -v  # Clean slate
docker compose build --no-cache
docker compose up -d
docker compose exec backend bundle exec rspec

# Check for warnings
docker compose exec backend bundle exec rspec --warnings
```

### Problem: CI takes too long (> 10 minutes)

**Symptoms**: Jobs timeout or take forever

**Solutions**:
1. **Enable caching** (see Advanced Configuration above)
2. **Reduce test database size**:
   ```ruby
   # In rails_helper.rb
   config.before(:suite) do
     DatabaseCleaner.clean_with(:truncation)
   end
   ```
3. **Parallelize tests** (advanced):
   - Split RSpec tests across multiple jobs
   - Use parallel_tests gem

### Problem: Lint fails with "unknown cop"

**Symptoms**: RuboCop or ESLint errors about rules

**Solutions**:
1. Ensure `.rubocop.yml` / `.eslintrc.json` committed
2. Check gem/package versions match local
3. Run `bundle exec rubocop --auto-gen-config` to update config

### Problem: Can't merge PR despite passing checks

**Symptoms**: Merge button disabled, checks all green

**Solutions**:
1. Check branch protection rules allow merging
2. Ensure you have permission to merge
3. Check PR has no merge conflicts
4. Ensure PR is not a draft

---

## Performance Expectations

With caching enabled:

| Run Type | Expected Duration |
|----------|-------------------|
| First run (no cache) | 8-10 minutes |
| Subsequent runs (cache hit) | 3-5 minutes |
| Fast feedback (first failure) | 1-3 minutes |

Without caching:

| Run Type | Expected Duration |
|----------|-------------------|
| Every run | 8-10 minutes |

**Parallel Execution**:
- All 4 jobs run simultaneously
- Total time = slowest job duration
- Typically: tests take longer than linting

---

## Cost Estimation

**GitHub Actions Free Tier**:
- Public repos: Unlimited minutes ✅
- Private repos: 2000 minutes/month

**Estimated Usage**:
- Per PR run: ~20 minutes total (4 jobs × 5 minutes each, but parallel)
- Actual wall clock time: ~5 minutes (parallel execution)
- Assumed: 50 PRs/month with 3 runs each (initial + 2 updates)

**Total monthly usage**:
- 50 PRs × 3 runs × 5 minutes = **750 minutes/month**
- Well within free tier limit ✅

**Tips to reduce usage**:
1. Enable concurrency cancellation (already in template)
2. Use caching to reduce run time
3. Only run on PR events, not every push

---

## Best Practices

### Writing CI-Friendly Tests

✅ **DO**:
- Use factories for test data
- Clean database between tests
- Mock external API calls
- Use time freezing for time-dependent tests
- Make tests deterministic (no random data)

❌ **DON'T**:
- Depend on specific database state
- Use real external services
- Write tests that depend on test order
- Use actual delays (`sleep 5`)
- Hardcode URLs or credentials

### Debugging Failed CI

1. **Check the logs first**:
   - Click on failed check
   - Expand failed step
   - Read error message carefully

2. **Reproduce locally**:
   ```bash
   # Exact CI environment
   docker compose down -v
   docker compose build --no-cache
   docker compose up -d
   docker compose exec -T backend bundle exec rspec
   ```

3. **Fix iteratively**:
   - Fix one failure at a time
   - Verify locally before pushing
   - Use `git commit --amend` for quick fixes

### Monitoring CI Health

Track these metrics:

- **Success rate**: Aim for > 90% first-run success
- **Run duration**: Keep under 5 minutes with caching
- **Flaky test rate**: Should be near 0%
- **Timeout rate**: Should be 0%

View in GitHub:
- Actions tab → CI workflow → Filter by branch
- See trends over time
- Identify problematic tests

---

## Next Steps

After CI is set up:

1. **Enable branch protection** (see Advanced Configuration)
2. **Add caching** to speed up runs
3. **Monitor success rates** to catch flaky tests
4. **Consider adding**:
   - Code coverage reporting
   - Performance benchmarks
   - Security scanning

---

## Getting Help

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Docker Compose in CI**: https://docs.docker.com/compose/github-actions/
- **RSpec Best Practices**: https://rspec.info/documentation/
- **Jest CI Configuration**: https://jestjs.io/docs/configuration#ci-boolean

**Internal Resources**:
- Specification: `specs/003-pull-request-github/spec.md`
- Implementation Plan: `specs/003-pull-request-github/plan.md`
- Workflow Contract: `specs/003-pull-request-github/contracts/workflow-schema.md`
