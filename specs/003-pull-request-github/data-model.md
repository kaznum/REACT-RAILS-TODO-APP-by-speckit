# Data Model: GitHub Actions CI/CD Workflow

**Feature**: 003-pull-request-github
**Date**: 2025-10-10

## Overview

This feature is infrastructure-focused (CI/CD automation) and does not introduce new application data models or database entities. This document describes the conceptual entities involved in the CI workflow for reference.

---

## Conceptual Entities

### Pull Request (GitHub Entity)

**Description**: A GitHub pull request that triggers the CI workflow.

**Key Attributes**:
- `number`: Integer - PR number
- `head_sha`: String - SHA of the latest commit
- `base_branch`: String - Target branch (typically 'main' or 'master')
- `head_branch`: String - Source branch being merged
- `author`: String - GitHub username who created the PR
- `status`: Enum - open, closed, merged
- `checks`: Array<CheckRun> - CI status checks associated with this PR

**Relationships**:
- Has many `CheckRun` entities (one per CI job)
- Belongs to a GitHub repository

**State Transitions**:
- Draft → Open → Merged/Closed
- Each state change with new commits triggers CI workflow

**Validation Rules** (GitHub-enforced):
- Must have at least one commit
- Base and head branches must exist
- Cannot merge if required status checks are failing (when branch protection enabled)

---

### CI Workflow (GitHub Actions Entity)

**Description**: The automated workflow defined in `.github/workflows/ci.yml` that runs on pull request events.

**Key Attributes**:
- `workflow_id`: String - Unique identifier for workflow instance
- `name`: String - "CI" (workflow name)
- `trigger_event`: Enum - pull_request (opened, synchronize, reopened)
- `commit_sha`: String - SHA that triggered the workflow
- `status`: Enum - queued, in_progress, completed
- `conclusion`: Enum - success, failure, cancelled, skipped
- `jobs`: Array<Job> - backend-test, backend-lint, frontend-test, frontend-lint
- `started_at`: Timestamp
- `completed_at`: Timestamp

**Relationships**:
- Belongs to a Pull Request
- Has many Job entities (4 jobs per workflow run)

**State Transitions**:
```
queued → in_progress → completed
                    ↓
         (success | failure | cancelled)
```

**Validation Rules**:
- Workflow file must be valid YAML
- All required fields must be present in workflow configuration
- Jobs must have unique IDs within workflow

---

### Check Run (GitHub API Entity)

**Description**: Individual CI job execution result displayed on PR status checks.

**Key Attributes**:
- `id`: Integer - GitHub check run ID
- `name`: String - Job display name (e.g., "Backend Tests (RSpec)")
- `status`: Enum - queued, in_progress, completed
- `conclusion`: Enum - success, failure, cancelled, skipped, neutral
- `started_at`: Timestamp
- `completed_at`: Timestamp
- `details_url`: URL - Link to GitHub Actions log
- `output`: Object - Title, summary, and annotations

**Output Structure**:
```
output:
  title: String - "74 tests passed" or "3 tests failed"
  summary: String - Brief description of results
  annotations: Array<Annotation> - Specific errors/warnings
```

**Relationships**:
- Belongs to a Pull Request
- Belongs to a CI Workflow
- Corresponds to one Job in the workflow

**State Transitions**:
```
queued → in_progress → completed
                    ↓
         (success | failure | cancelled | skipped)
```

**Validation Rules**:
- Status must transition in order (cannot go from completed back to queued)
- Conclusion only set when status is completed
- Details URL must be valid GitHub Actions run URL

---

### Job (GitHub Actions Entity)

**Description**: Individual unit of work within a CI workflow (test or lint execution).

**Key Attributes**:
- `id`: String - Job identifier (backend-test, backend-lint, frontend-test, frontend-lint)
- `name`: String - Display name shown in UI
- `runs-on`: String - GitHub runner OS (ubuntu-latest)
- `steps`: Array<Step> - Sequential steps to execute
- `status`: Enum - queued, in_progress, completed
- `conclusion`: Enum - success, failure, cancelled, skipped
- `duration`: Integer - Execution time in seconds

**Steps Array** (example for backend-test):
1. Checkout code
2. Set up Docker Buildx
3. Cache Docker layers
4. Build Docker images with docker compose
5. Start services with docker compose up
6. Run tests with docker compose exec
7. Stop services with docker compose down

**Relationships**:
- Belongs to a CI Workflow
- Creates one Check Run on the Pull Request

**Validation Rules**:
- Job ID must be unique within workflow
- At least one step must be defined
- Steps execute sequentially

---

### Workflow Configuration (YAML File)

**Description**: The `.github/workflows/ci.yml` file that defines CI behavior.

**Key Attributes**:
- `name`: String - Workflow name
- `on`: Object - Trigger events configuration
- `concurrency`: Object - Concurrency control settings
- `jobs`: Object - Map of job definitions
- `env`: Object - Environment variables (optional)

**Structure**:
```yaml
name: CI
on:
  pull_request:
    types: [opened, synchronize, reopened]
concurrency:
  group: ci-${{ github.event.pull_request.number }}
  cancel-in-progress: true
jobs:
  backend-test: { ... }
  backend-lint: { ... }
  frontend-test: { ... }
  frontend-lint: { ... }
```

**Validation Rules** (GitHub-enforced):
- Must be valid YAML syntax
- Must be located in `.github/workflows/` directory
- Trigger events must be valid GitHub event types
- Job steps must reference valid GitHub Actions or shell commands

---

## State Diagrams

### Pull Request CI Flow

```
PR Created/Updated
    ↓
Workflow Triggered (queued)
    ↓
Workflow Running (in_progress)
    ↓
Jobs Execute in Parallel
    ├── backend-test
    ├── backend-lint
    ├── frontend-test
    └── frontend-lint
    ↓
All Jobs Complete
    ↓
Workflow Conclusion
    ├── success (all jobs passed)
    ├── failure (any job failed)
    └── cancelled (new commit pushed)
    ↓
PR Status Updated
```

### Check Run Lifecycle

```
Check Queued
    ↓
Check In Progress
    ↓
Executing Steps
    ├── Step 1 → Success
    ├── Step 2 → Success
    ├── Step 3 → Failure → Check Failed
    └── ...
    ↓
Check Completed
    ├── Success (all steps passed)
    ├── Failure (any step failed)
    └── Cancelled (workflow cancelled)
```

---

## Data Flow

### Trigger Flow
```
1. Developer pushes commit to PR branch
2. GitHub detects pull_request event
3. GitHub Actions reads .github/workflows/ci.yml
4. Workflow instance created with unique ID
5. Jobs queued on GitHub Actions runners
6. Check runs created on PR for each job
```

### Execution Flow
```
1. Runner checks out repository code
2. Runner sets up Docker environment
3. Docker compose builds images (with caching)
4. Docker compose starts services
5. Runner executes test/lint command in container
6. Command output captured to logs
7. Exit code determines success/failure
8. Check run updated with result
9. Docker compose stops services
10. Runner cleans up
```

### Result Flow
```
1. Each job updates its Check Run status
2. GitHub aggregates all Check Run results
3. PR status checks section updated
4. If branch protection enabled:
   - Merge button disabled on failure
   - Merge button enabled on success
5. Developers view detailed logs via check run links
```

---

## Non-Persistent Data

The CI workflow does not persist data beyond GitHub's own storage:

- **Workflow runs**: Stored by GitHub for 90 days (logs, status, artifacts)
- **Check run results**: Associated with PR, retained as long as PR exists
- **Cache**: GitHub Actions cache (10GB limit, expires after 7 days unused)
- **Docker layers**: Cached in GitHub Actions cache, not pushed to registry

No application database changes are required for this feature.

---

## Integration Points

### Existing System Integration

**docker-compose.yml**:
- Read by CI workflow
- Defines service configurations
- Provides test/lint execution environment

**Test Suites**:
- Backend: `bundle exec rspec` (74 tests)
- Frontend: `npm test -- --watchAll=false` (55 tests)

**Lint Configurations**:
- Backend: `.rubocop.yml`
- Frontend: `.eslintrc.json`

### GitHub Integration

**Pull Request API**:
- CI workflow triggered by PR webhook events
- Check runs created via GitHub Checks API
- Status displayed in PR UI

**Actions API**:
- Workflow configuration read from repository
- Runner provisioned for job execution
- Logs streamed to GitHub Actions UI

---

## Summary

This feature introduces no new application data models. All entities are GitHub platform concepts (Pull Requests, Workflows, Check Runs, Jobs) that are managed by GitHub Actions. The workflow configuration (`.github/workflows/ci.yml`) is the only new artifact added to the repository, and it orchestrates existing test and lint processes using docker compose.
