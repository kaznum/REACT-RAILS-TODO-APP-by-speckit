# Data Model: GitHub Actions CI Autofix Workflow

**Date**: 2025-10-10
**Feature**: 004-github-actions-ci
**Phase**: 1 (Design & Contracts)

## Overview

This document defines the data structures and state transitions for the GitHub Actions CI Autofix workflow. Since this is a workflow-only feature with no persistent storage, the "data model" describes the runtime state, workflow inputs/outputs, and event-driven transitions.

## Entities

### 1. CI Workflow Run

**Description**: Represents a completed CI workflow execution that may trigger autofix

**Attributes**:
| Attribute | Type | Description | Source |
|-----------|------|-------------|--------|
| `run_id` | Integer | Unique identifier for the workflow run | `github.event.workflow_run.id` |
| `workflow_name` | String | Name of the workflow ("CI") | `github.event.workflow_run.name` |
| `conclusion` | Enum | Final status: "success", "failure", "cancelled" | `github.event.workflow_run.conclusion` |
| `pr_number` | Integer | Associated pull request number | `github.event.workflow_run.pull_requests[0].number` |
| `pr_head_sha` | String | Commit SHA that triggered CI | `github.event.workflow_run.head_sha` |
| `pr_branch` | String | Pull request source branch name | `github.event.workflow_run.head_branch` |

**State Transitions**:
```
[CI Workflow Triggered] → [Jobs Running] → [Jobs Completed] → [conclusion: failure] → [Autofix Triggered]
                                                             → [conclusion: success] → [No Autofix]
```

**Validation Rules**:
- `conclusion` must be "failure" for autofix to trigger
- `pr_number` must exist (workflow run must be associated with a PR)
- `workflow_name` must be "CI" (only trigger on main CI workflow)

---

### 2. Job Failure Details

**Description**: Represents a specific failed job within the CI workflow run

**Attributes**:
| Attribute | Type | Description | Source |
|-----------|------|-------------|--------|
| `job_id` | Integer | Unique identifier for the job | `jobs.data.jobs[i].id` |
| `job_name` | String | Job name (e.g., "Backend Tests (RSpec)") | `jobs.data.jobs[i].name` |
| `conclusion` | Enum | Job result: "failure", "success", etc. | `jobs.data.jobs[i].conclusion` |
| `failure_logs` | String | Complete log output from failed job | Downloaded via API |
| `failure_type` | Enum | Categorized as: "test", "lint", "unknown" | Derived from `job_name` |

**Categorization Logic**:
```yaml
failure_type:
  - "test" if job_name contains "Test"
  - "lint" if job_name contains "Lint"
  - "unknown" otherwise
```

**Relationships**:
- One CI Workflow Run has many Job Failure Details (1:N)
- Jobs are filtered to only include those with `conclusion: failure`

---

### 3. Autofix Request

**Description**: Represents a triggered autofix operation with context for fix generation

**Attributes**:
| Attribute | Type | Description | Source |
|-----------|------|-------------|--------|
| `workflow_run_id` | Integer | Reference to triggering CI run | `github.event.workflow_run.id` |
| `pr_number` | Integer | Target pull request | Extracted from workflow run |
| `pr_branch` | String | Branch to commit fixes to | `github.event.workflow_run.head_branch` |
| `failure_logs` | String | Aggregated logs from all failed jobs | Captured from Job Failure Details |
| `failure_count` | Integer | Number of failed jobs | Count of jobs with `conclusion: failure` |
| `has_test_failures` | Boolean | Whether test jobs failed | Derived from failure_type |
| `has_lint_failures` | Boolean | Whether lint jobs failed | Derived from failure_type |

**Derivation**:
```yaml
has_test_failures: count(failure_type == "test") > 0
has_lint_failures: count(failure_type == "lint") > 0
```

**State Transitions**:
```
[Autofix Triggered] → [Logs Captured] → [Codex Invoked] → [Fixes Generated] → [Commit Created]
                                                         → [Generation Failed] → [Error Logged]
```

---

### 4. Codex Generation Result

**Description**: Output from OpenAI Codex action with generated fixes

**Attributes**:
| Attribute | Type | Description | Source |
|-----------|------|-------------|--------|
| `fixed_files` | Array[String] | List of file paths that were fixed | Codex action output |
| `fixed_summary` | String | Description of what was fixed | Extracted from Codex output |
| `remaining_issues` | String (nullable) | Description of unfixed issues | Extracted from Codex output |
| `generation_status` | Enum | "success", "partial", "failed" | Derived from output |

**Status Derivation**:
```yaml
generation_status:
  - "success" if remaining_issues is empty
  - "partial" if remaining_issues is not empty but fixed_files has items
  - "failed" if fixed_files is empty
```

**Relationships**:
- One Autofix Request produces one Codex Generation Result (1:1)

---

### 5. Autofix Commit

**Description**: Commit created with AI-generated fixes

**Attributes**:
| Attribute | Type | Description | Source |
|-----------|------|-------------|--------|
| `commit_sha` | String | Commit hash | Generated by git |
| `commit_message` | String | Conventional commit message | Formatted from Codex result |
| `author_name` | String | "github-actions[bot]" | Git config |
| `author_email` | String | "github-actions[bot]@users.noreply.github.com" | Git config |
| `branch` | String | Target branch (PR source branch) | From Autofix Request |
| `files_changed` | Array[String] | List of modified files | From Codex Generation Result |
| `is_partial_fix` | Boolean | Whether unfixed issues remain | `remaining_issues != null` |

**Commit Message Format**:
```
fix(autofix): <one-line summary>

<detailed description of fixes>

[Optional: Remaining issues section if is_partial_fix == true]

🤖 Generated with GitHub Actions Autofix
```

**Relationships**:
- One Codex Generation Result produces one Autofix Commit (1:1)

---

## Workflow State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│ Trigger: workflow_run (CI) completed with conclusion: failure   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Check Latest Commit   │
                   │   Message Prefix      │
                   └──────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
          ▼ [autofix commit]        ▼ [not autofix]
    ┌──────────┐              ┌──────────────────┐
    │   SKIP   │              │  Checkout PR      │
    │ Workflow │              │     Branch        │
    └──────────┘              └──────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Capture Failure  │
                              │  Logs from Jobs  │
                              └──────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  Invoke Codex    │
                              │  with Prompt     │
                              └──────────────────┘
                                       │
                      ┌────────────────┼────────────────┐
                      │                │                │
               ▼ [success]      ▼ [partial]      ▼ [failed]
         ┌──────────┐      ┌──────────┐      ┌──────────┐
         │  Apply   │      │  Apply   │      │   Log    │
         │  Fixes   │      │ Partial  │      │  Error   │
         │          │      │  Fixes   │      │   Exit   │
         └──────────┘      └──────────┘      └──────────┘
               │                 │
               └────────┬────────┘
                        ▼
                ┌──────────────────┐
                │  Commit Changes  │
                │ (Conventional Fmt)│
                └──────────────────┘
                        │
                        ▼
                ┌──────────────────┐
                │   Push to PR     │
                │     Branch       │
                └──────────────────┘
                        │
                        ▼
                  ┌──────────┐
                  │   DONE   │
                  └──────────┘
```

## Data Flow Diagram

```
┌──────────────────┐
│  GitHub Event:   │
│  workflow_run    │
│   (CI failed)    │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Autofix Workflow: Extract CI Workflow Run metadata         │
│  - run_id, pr_number, pr_branch, head_sha                   │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Query GitHub API: Get job details for workflow run         │
│  - Filter jobs where conclusion == 'failure'                │
│  - Download logs for each failed job                        │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Construct Autofix Request:                                 │
│  - Aggregate failure logs                                   │
│  - Determine failure types (test/lint)                      │
│  - Prepare context for Codex                                │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Codex Action: Generate fixes via natural language prompt   │
│  Input: failure_logs + instructions                         │
│  Output: fixed_files + summaries                            │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Create Autofix Commit:                                     │
│  - Apply file changes                                       │
│  - Format commit message (conventional commits)             │
│  - Include partial fix details if applicable                │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Push Commit to PR Branch:                                  │
│  - Developer sees autofix commit in PR timeline             │
│  - CI runs again on new commit                              │
└─────────────────────────────────────────────────────────────┘
```

## Validation Rules

### Trigger Conditions
1. `workflow_run.conclusion == "failure"` (CI must have failed)
2. `workflow_run.name == "CI"` (only trigger on main CI workflow)
3. `workflow_run.pull_requests` is not empty (must be associated with a PR)
4. Latest commit message does NOT start with `fix(autofix):` (prevent loops)

### Fix Generation
1. `failure_logs` must not be empty
2. Codex action must complete without errors
3. At least one file must be modified (either success or partial)

### Commit Creation
1. `files_changed` must not be empty
2. `commit_message` must follow conventional commit format
3. Commit must be pushed to the PR's source branch (not main/master)

## Error Handling

### Scenario 1: No Failures Found
- **Condition**: `failure_logs` is empty despite conclusion: failure
- **Action**: Log warning, skip autofix, exit gracefully

### Scenario 2: Codex API Failure
- **Condition**: `openai/codex-action` step fails (rate limit, API error)
- **Action**: Log error with details, do not create commit, exit gracefully

### Scenario 3: Empty Fix Generation
- **Condition**: Codex returns no file changes
- **Action**: Log info (issues too complex for automation), exit gracefully

### Scenario 4: Git Push Failure
- **Condition**: Push to PR branch fails (permissions, conflicts)
- **Action**: Log error, notify via workflow annotation, exit with failure

## Next Steps

Proceed to contracts/ to define the workflow interface formally (inputs, outputs, events).
