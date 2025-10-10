# Implementation Plan: GitHub Actions CI Autofix Workflow

**Branch**: `004-github-actions-ci` | **Date**: 2025-10-10 | **Spec**: [spec.md](spec.md)

## Summary

This feature implements an automated CI failure remediation system using `openai/codex-action@main`. When all CI jobs complete with failures, the autofix workflow triggers, uses natural language prompts to generate fixes via Codex, and commits corrections directly to the failing PR's branch. The entire implementation is self-contained in autofix.yml with no external scripts.

## Technical Context

**Language/Version**: YAML (GitHub Actions workflow definitions)
**Primary Dependencies**:
- GitHub Actions runtime environment
- `openai/codex-action@main` (AI code generation via natural language prompts)
- Git operations (built-in GitHub Actions)
- Existing CI workflow (.github/workflows/ci.yml)

**Storage**: N/A (workflow definitions, no persistent storage)

**Testing**: Manual verification with intentionally failing PRs (workflow testing not required per user guidance)

**Target Platform**: GitHub Actions runners (Ubuntu latest)

**Project Type**: CI/CD automation (single self-contained workflow file)

**Performance Goals**:
- Autofix workflow completes within 5 minutes of CI job completion
- Codex API response time expected <60 seconds per fix generation

**Constraints**:
- **CRITICAL**: All logic in autofix.yml - no external shell scripts or programs
- GitHub Actions execution time limits (max 6 hours per workflow, targeting <5 minutes)
- OpenAI Codex API rate limits
- Must not expose OPENAI_API_KEY in logs or commits
- Uses natural language prompts only (no OpenAI API programming)

**Scale/Scope**:
- Handles backend (RSpec) and frontend (Jest) test failures
- Handles backend (RuboCop) and frontend (ESLint) linting errors
- Processes failure logs (Codex handles token limits internally)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Evaluation

**I. Code Quality (NON-NEGOTIABLE)**
- ✅ **PASS**: Workflow YAML follows GitHub Actions best practices
- ✅ **PASS**: Clear naming conventions for workflow steps and jobs
- ✅ **PASS**: Separation of concerns: autofix workflow separate from CI workflow

**II. Test-First Development (NON-NEGOTIABLE)**
- ✅ **PASS**: Will verify workflow behavior with intentionally failing PRs
- N/A: Automated workflow testing not required per user guidance

**III. UX Consistency**
- ✅ **PASS**: Autofix commit messages follow conventional commit format
- ✅ **PASS**: Error messages and workflow outputs are user-friendly

**IV. Automated Testing & CI/CD**
- ✅ **PASS**: Enhances CI/CD capabilities
- ✅ **PASS**: Integrates with existing CI pipeline
- ✅ **PASS**: Prevents infinite loops

**V. API Contract Stability**
- N/A: No API contracts (workflow-only feature)

### Quality Standards

**Code Review Requirements**
- ✅ **PASS**: All workflow changes go through PR review
- ✅ **PASS**: Verifies workflow doesn't expose secrets

**Performance Targets**
- ✅ **PASS**: Workflow completes within 5 minutes

**Security Standards**
- ✅ **PASS**: OPENAI_API_KEY stored in GitHub Secrets
- ✅ **PASS**: Workflow permissions scoped (write access to PR branch)
- ✅ **PASS**: No secrets exposed in logs or commits

### Gate Status: ✅ PASS

All applicable constitution requirements satisfied.

## Project Structure

### Documentation (this feature)

```
specs/004-github-actions-ci/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── workflow-interface.md
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
.github/workflows/
├── ci.yml               # Existing: 4 jobs (backend-test, frontend-test, backend-lint, frontend-lint)
└── autofix.yml          # NEW: Self-contained autofix workflow
```

**Structure Decision**: Single workflow file (autofix.yml) added to .github/workflows/. Entirely self-contained using GitHub Actions YAML and `openai/codex-action@main` with natural language prompts.

## Complexity Tracking

*No violations - Constitution Check passed without exceptions*

## Phase 0: Research (Completed)

All research areas have been resolved. See [research.md](research.md) for details:

✅ **OpenAI Codex Integration**: Using `openai/codex-action@main` with natural language prompts
✅ **Workflow Trigger Mechanism**: Using `workflow_run` event with `completed` type
✅ **Loop Prevention Strategy**: Commit message prefix detection (`fix(autofix):`)
✅ **Failure Log Capture**: GitHub Actions API via `actions/github-script@v7`
✅ **Commit Creation**: Standard git commands with conventional commit format
✅ **Partial Fix Handling**: Document limitations in commit message
✅ **Error Handling**: Graceful failures with `continue-on-error`

## Phase 1: Design & Contracts (Completed)

All design artifacts have been created:

✅ **Data Model**: See [data-model.md](data-model.md)
- Defined 5 key entities: CI Workflow Run, Job Failure Details, Autofix Request, Codex Generation Result, Autofix Commit
- Documented state transitions and validation rules
- Created workflow state machine diagram

✅ **Contracts**: See [contracts/workflow-interface.md](contracts/workflow-interface.md)
- Defined workflow trigger contract (`workflow_run` event)
- Specified inputs (OPENAI_API_KEY, GITHUB_TOKEN)
- Documented outputs (step outputs, commit format)
- Defined permissions required
- Mapped success criteria to contract elements

✅ **Quickstart Guide**: See [quickstart.md](quickstart.md)
- Setup instructions (API key configuration, workflow file creation)
- Usage examples (linting errors, partial fixes)
- Troubleshooting guide
- Best practices for developers and administrators

✅ **Agent Context Updated**: CLAUDE.md updated with new technologies

### Re-evaluation: Constitution Check (Post-Design)

**Status**: ✅ PASS (no changes from initial check)

All design decisions align with constitution requirements:
- Quality: Workflow follows GitHub Actions best practices
- Testing: Manual verification approach documented
- UX: Conventional commit format for all autofix commits
- CI/CD: Enhances existing pipeline without breaking changes
- Security: Secrets properly managed, no exposure in logs

## Next Steps

**Planning Complete** ✅

Proceed to Phase 2 (Task Generation):

```bash
/speckit.tasks
```

This will generate `tasks.md` with implementation tasks ordered by:
1. Test scenarios (setup intentionally failing PRs)
2. Workflow implementation (autofix.yml)
3. Verification (test with real failures)
4. Documentation updates

**Key Implementation Points**:
- Single file: `.github/workflows/autofix.yml`
- Uses `openai/codex-action@main` for AI code generation
- No external scripts (fully self-contained workflow)
- Triggers via `workflow_run` event after CI completes
- Commits directly to PR branch with conventional commit format
