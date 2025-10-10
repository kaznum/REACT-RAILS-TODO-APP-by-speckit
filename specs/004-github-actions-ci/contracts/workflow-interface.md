# Workflow Interface Contract: GitHub Actions CI Autofix

**Date**: 2025-10-10
**Feature**: 004-github-actions-ci
**Phase**: 1 (Design & Contracts)

## Overview

This document defines the interface contract for the `autofix.yml` GitHub Actions workflow, including triggers, inputs, outputs, permissions, and integration points.

## Workflow Metadata

| Property | Value |
|----------|-------|
| **Name** | `CI Autofix` |
| **File** | `.github/workflows/autofix.yml` |
| **Type** | Reactive (event-driven) |
| **Concurrency Group** | `autofix-${{ github.event.workflow_run.pull_requests[0].number }}` |
| **Concurrency Strategy** | `cancel-in-progress: true` |

## Trigger Contract

### Event: `workflow_run`

```yaml
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches-ignore:
      - main
      - master
```

**Trigger Conditions**:

| Condition | Requirement | Validation |
|-----------|-------------|------------|
| Workflow Name | Must be "CI" | `github.event.workflow_run.name == "CI"` |
| Event Type | Must be "completed" | Event fires only when CI finishes |
| Conclusion | Must be "failure" | Checked in workflow steps |
| Branch | Must NOT be main/master | `branches-ignore` filter |
| PR Association | Must have associated PR | `github.event.workflow_run.pull_requests` not empty |

**Event Payload** (subset used by autofix):

```json
{
  "workflow_run": {
    "id": 123456789,
    "name": "CI",
    "conclusion": "failure",
    "head_branch": "feature/my-branch",
    "head_sha": "abc123def456",
    "pull_requests": [
      {
        "number": 42,
        "head": {
          "ref": "feature/my-branch",
          "sha": "abc123def456"
        }
      }
    ]
  }
}
```

## Inputs

### Environment Variables (Required)

| Variable | Source | Description | Example |
|----------|--------|-------------|---------|
| `OPENAI_API_KEY` | Repository Secret | OpenAI API authentication key | `sk-...` |
| `GITHUB_TOKEN` | Automatic | GitHub Actions token for API calls | Auto-provided |

### Workflow Inputs (Derived from Event)

| Input | Type | Description | Extracted From |
|-------|------|-------------|----------------|
| `workflow_run_id` | Integer | ID of the failed CI run | `github.event.workflow_run.id` |
| `pr_number` | Integer | Pull request number | `github.event.workflow_run.pull_requests[0].number` |
| `pr_branch` | String | PR source branch name | `github.event.workflow_run.head_branch` |
| `pr_sha` | String | Commit SHA that triggered CI | `github.event.workflow_run.head_sha` |

## Outputs

### Step Outputs

#### Step: `check-autofix`
```yaml
outputs:
  is_autofix: "true" | "false"  # Whether last commit is an autofix commit
```

#### Step: `capture-failures`
```yaml
outputs:
  failure_logs: String          # Aggregated logs from all failed jobs
  has_failures: "true" | "false" # Whether any failures were found
  failure_count: Integer        # Number of failed jobs
```

#### Step: `categorize-failures`
```yaml
outputs:
  has_test_failures: "true" | "false"
  has_lint_failures: "true" | "false"
  failure_types: String  # Comma-separated: "test,lint" or "test" or "lint"
```

#### Step: `codex-generate`
```yaml
outputs:
  fixed_files: String           # Newline-separated list of fixed file paths
  fixed_summary: String         # Description of what was fixed
  remaining_summary: String     # Description of remaining issues (empty if all fixed)
  generation_status: "success" | "partial" | "failed"
```

### Workflow Artifacts

**None** - This workflow does not produce artifacts. Changes are committed directly to the PR branch.

### Commit Output

| Property | Format | Example |
|----------|--------|---------|
| **Author** | `github-actions[bot] <github-actions[bot]@users.noreply.github.com>` | Auto-configured |
| **Message** | Conventional Commits format | See "Commit Message Contract" below |
| **Files** | Modified files from Codex output | Varies by failures |
| **Branch** | PR source branch | `feature/my-branch` |

## Permissions

### Required Permissions

```yaml
permissions:
  contents: write          # Push commits to PR branch
  actions: read           # Read workflow run details and logs
  pull-requests: read     # Access PR metadata
```

### Permission Justifications

| Permission | Scope | Justification |
|------------|-------|---------------|
| `contents: write` | Repository | Create and push autofix commits to PR branch |
| `actions: read` | Workflow runs | Query CI workflow run details and download job logs |
| `pull-requests: read` | Pull requests | Extract PR number and branch information |

## Commit Message Contract

### Format (Conventional Commits)

```
fix(autofix): <one-line summary>

<multi-line detailed description>

[Optional: Remaining issues section]

🤖 Generated with GitHub Actions Autofix
```

### Examples

#### Full Fix (All failures resolved)

```
fix(autofix): Resolve RSpec test failures and ESLint violations

Fixed:
- backend/spec/models/todo_spec.rb: Corrected assertion for completed status
- frontend/src/components/TodoList.jsx: Removed unused import
- frontend/src/utils/helpers.js: Fixed indentation to match ESLint rules

🤖 Generated with GitHub Actions Autofix
```

#### Partial Fix (Some failures remain)

```
fix(autofix): Apply partial fixes for CI failures

Fixed:
- frontend/src/components/TodoList.jsx: Removed unused import
- frontend/src/utils/helpers.js: Fixed ESLint indentation errors

Remaining issues (manual review needed):
- backend/spec/models/todo_spec.rb: Complex logic error requires manual debugging
- backend/app/models/todo.rb: Architectural change needed (cannot be automated)

🤖 Generated with GitHub Actions Autofix
```

### Commit Message Detection (Loop Prevention)

**Pattern**: `^fix\(autofix\):.*`

**Usage**: Workflow checks if the latest commit message matches this pattern. If true, workflow skips execution to prevent infinite loops.

## Integration Points

### 1. CI Workflow Integration

**Dependency**: Existing `.github/workflows/ci.yml`

**Integration Method**: `workflow_run` event triggers after CI completes

**Expected CI Jobs**:
- `backend-test` (RSpec)
- `frontend-test` (Jest)
- `backend-lint` (RuboCop)
- `frontend-lint` (ESLint)

**Assumption**: CI job names remain stable (used for failure type categorization)

### 2. OpenAI Codex Integration

**Action**: `openai/codex-action@main`

**Integration Contract**:

```yaml
- uses: openai/codex-action@main
  with:
    prompt: |
      You are a code fix automation system. Analyze the following CI failure logs and generate fixes.

      Failure logs:
      {{ failure_logs }}

      Instructions:
      1. Fix test failures by correcting the code to pass the tests
      2. Fix linting errors by reformatting code to comply with linting rules
      3. If you cannot fix everything, fix what you can and list remaining issues

      Output format:
      FIXED:
      - List each file and what was fixed

      REMAINING (if any):
      - List issues that could not be fixed and why
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**Expected Response** (conceptual - action handles file writing):
- Modified files written to workspace
- Outputs set for `fixed_summary` and `remaining_summary`

### 3. GitHub API Integration

**Used For**:
- Querying workflow run details
- Downloading job logs for failed jobs
- Extracting PR metadata

**Actions Used**:
- `actions/github-script@v7` for API calls

**API Endpoints** (via Octokit):
- `GET /repos/{owner}/{repo}/actions/runs/{run_id}`
- `GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs`
- `GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs`

## Error Scenarios

### Scenario 1: Loop Detection (Autofix Commit Found)

**Detection**: Latest commit message starts with `fix(autofix):`

**Behavior**:
```yaml
- if: steps.check-autofix.outputs.is_autofix == 'true'
  run: |
    echo "Skipping: last commit is already an autofix"
    exit 0
```

**Result**: Workflow exits successfully with no action taken

### Scenario 2: No Failures Detected

**Detection**: `steps.capture-failures.outputs.has_failures == 'false'`

**Behavior**:
```yaml
- if: steps.capture-failures.outputs.has_failures == 'false'
  run: |
    echo "No failures found despite workflow conclusion: failure"
    exit 0
```

**Result**: Workflow exits successfully with warning logged

### Scenario 3: Codex Generation Failure

**Detection**: `steps.codex-generate.outcome == 'failure'`

**Behavior**:
```yaml
- if: steps.codex-generate.outcome == 'failure'
  run: |
    echo "::warning::Autofix generation failed (API error, rate limit, or token limit)"
    exit 0
```

**Result**: Workflow exits successfully with warning annotation

### Scenario 4: Empty Fix (No Files Changed)

**Detection**: `steps.codex-generate.outputs.fixed_files == ''`

**Behavior**:
```yaml
- if: steps.codex-generate.outputs.fixed_files == ''
  run: |
    echo "::notice::No fixes generated - failures may be too complex for automation"
    exit 0
```

**Result**: Workflow exits successfully with notice annotation

### Scenario 5: Push Failure

**Detection**: Git push command fails

**Behavior**:
```yaml
- name: Push commit
  run: git push origin HEAD || { echo "::error::Push failed - check branch permissions"; exit 1; }
```

**Result**: Workflow fails with error annotation

## Versioning and Compatibility

### Workflow Version

**Current**: 1.0.0

**Breaking Changes Require**:
- Major version bump
- Update to this contract document
- Migration plan for existing PRs

### Dependencies

| Dependency | Version | Stability |
|------------|---------|-----------|
| `openai/codex-action` | `@main` | External (unstable - tracks main branch) |
| `actions/github-script` | `@v7` | Stable |
| `actions/checkout` | `@v3` | Stable |

**Recommendation**: Pin `openai/codex-action` to a specific commit SHA once workflow is stable to prevent breaking changes.

## Success Criteria Mapping

| Success Criterion (from spec.md) | Contract Element |
|----------------------------------|------------------|
| SC-001: 80% test fix success | Codex generation with test failure logs |
| SC-002: 90% lint fix success | Codex generation with lint failure logs |
| SC-003: 70% first-attempt pass | Commit quality depends on Codex accuracy |
| SC-004: Complete in <5 minutes | No timeout specified (default 6h max, actual <5min expected) |
| SC-007: Zero infinite loops | Loop prevention via commit message detection |
| SC-008: 100% partial fix docs | Commit message includes `remaining_summary` |

## Next Steps

Proceed to `quickstart.md` for repository setup instructions and usage guide.
