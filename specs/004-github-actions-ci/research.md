# Research: GitHub Actions CI Autofix Workflow

**Date**: 2025-10-10
**Feature**: 004-github-actions-ci
**Phase**: 0 (Research & Technology Decisions)

## Overview

This document consolidates research findings and technology decisions for implementing an automated CI failure remediation system using GitHub Actions and OpenAI Codex.

## Research Areas

### 1. OpenAI Codex Integration

**Decision**: Use `openai/codex-action@main` with natural language prompts

**Rationale**:
- Declarative approach via `prompt:` parameter eliminates need for OpenAI API programming
- GitHub Action handles authentication, retries, and error handling internally
- Natural language prompts make the workflow maintainable and self-documenting
- Action integrates seamlessly with GitHub Actions workflow syntax

**Alternatives Considered**:
- **Direct OpenAI API calls via curl**: Rejected - requires programming HTTP requests, handling authentication, parsing responses, which violates the "no external scripts/programs" constraint
- **Custom GitHub Action**: Rejected - requires creating and maintaining a separate action repository
- **Third-party AI services**: Rejected - Codex is specifically designed for code generation tasks

**Implementation Details**:
```yaml
- uses: openai/codex-action@main
  with:
    prompt: |
      Analyze the following test failures and generate fixes:
      ${{ steps.capture-failures.outputs.failure_logs }}
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### 2. Workflow Trigger Mechanism

**Decision**: Use `workflow_run` event with `completed` status and `conclusion: failure`

**Rationale**:
- `workflow_run` event fires only after the specified workflow (ci.yml) completes entirely
- Ensures all 4 CI jobs (backend-test, frontend-test, backend-lint, frontend-lint) finish before autofix triggers
- Supports filtering by conclusion (failure) to trigger only when fixes are needed
- Provides access to the triggering workflow's run ID and associated pull request

**Alternatives Considered**:
- **Pull request event**: Rejected - triggers immediately on PR open/sync, not after CI completion
- **Scheduled event**: Rejected - not responsive to CI failures, adds unnecessary delay
- **Repository dispatch**: Rejected - requires external trigger mechanism

**Implementation Details**:
```yaml
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches-ignore:
      - main
```

### 3. Loop Prevention Strategy

**Decision**: Detect autofix commits by checking commit message prefix and skip workflow

**Rationale**:
- Commit messages starting with `fix(autofix):` are marked as autofix commits
- Workflow can check the latest commit message and skip if it's an autofix commit
- Simple, reliable, and doesn't require maintaining state or using external services
- Aligns with conventional commit format already used in the project

**Alternatives Considered**:
- **Bot user attribution**: Rejected - requires creating a bot account and managing credentials
- **Branch name patterns**: Rejected - autofix commits go to the original PR branch, not separate branches
- **GitHub App**: Rejected - adds deployment complexity and external dependencies

**Implementation Details**:
```yaml
- name: Check if last commit is autofix
  id: check-autofix
  run: |
    LAST_COMMIT_MSG=$(git log -1 --pretty=%B)
    if [[ "$LAST_COMMIT_MSG" == fix\(autofix\):* ]]; then
      echo "is_autofix=true" >> $GITHUB_OUTPUT
    else
      echo "is_autofix=false" >> $GITHUB_OUTPUT
    fi

- name: Skip if autofix commit
  if: steps.check-autofix.outputs.is_autofix == 'true'
  run: |
    echo "Skipping autofix - last commit is already an autofix"
    exit 0
```

### 4. Failure Log Capture and Processing

**Decision**: Capture failure logs from workflow_run API and pass to Codex as context

**Rationale**:
- GitHub Actions API provides access to job logs from the triggering workflow
- Logs contain detailed failure information (test output, lint violations)
- Codex can analyze raw logs and understand context for fix generation
- No preprocessing needed - Codex handles natural language and log formats

**Alternatives Considered**:
- **Artifacts**: Rejected - requires CI workflow to upload failure logs as artifacts, modifies existing workflow
- **Job summaries**: Rejected - limited information, doesn't contain full failure context
- **Manual log parsing**: Rejected - complex, error-prone, requires external scripts

**Implementation Details**:
```yaml
- name: Get CI workflow run details
  id: ci-run
  uses: actions/github-script@v7
  with:
    script: |
      const run = await github.rest.actions.getWorkflowRun({
        owner: context.repo.owner,
        repo: context.repo.repo,
        run_id: context.payload.workflow_run.id
      });
      return run.data;

- name: Capture failure logs
  id: capture-failures
  uses: actions/github-script@v7
  with:
    script: |
      const jobs = await github.rest.actions.listJobsForWorkflowRun({
        owner: context.repo.owner,
        repo: context.repo.repo,
        run_id: context.payload.workflow_run.id,
        filter: 'latest'
      });

      let failureLogs = '';
      for (const job of jobs.data.jobs) {
        if (job.conclusion === 'failure') {
          const log = await github.rest.actions.downloadJobLogsForWorkflowRun({
            owner: context.repo.owner,
            repo: context.repo.repo,
            job_id: job.id
          });
          failureLogs += `\n\n=== Job: ${job.name} ===\n${log.data}\n`;
        }
      }

      core.setOutput('failure_logs', failureLogs);
      core.setOutput('has_failures', failureLogs.length > 0);
```

### 5. Commit Creation with Fixes

**Decision**: Use git commands to apply fixes, commit with conventional format, and push

**Rationale**:
- Codex action outputs generated code that can be written to files
- Standard git commands handle commit creation and push
- Conventional commit format `fix(autofix): <description>` maintains project standards
- Push to PR branch requires GITHUB_TOKEN with appropriate permissions

**Alternatives Considered**:
- **GitHub API for file updates**: Rejected - complex for multi-file changes, requires knowing all file paths upfront
- **Pull request creation**: Rejected - user specified fixes should commit to original PR branch, not create separate PR

**Implementation Details**:
```yaml
- name: Apply fixes
  run: |
    # Codex action writes fixes to files (handled by action)
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"

- name: Commit and push
  run: |
    git add .
    git commit -m "fix(autofix): Apply automated fixes for CI failures

    - Fixed test failures
    - Fixed linting errors

    🤖 Generated with GitHub Actions Autofix"
    git push origin HEAD

permissions:
  contents: write  # Required for pushing commits
```

### 6. Partial Fix Handling

**Decision**: Generate fixes even if not all failures can be resolved, document limitations in commit message

**Rationale**:
- Provides value even when full automation isn't possible
- Commit message clearly states what was fixed and what remains
- Developers see progress and can build on partial fixes
- Aligns with feature requirement FR-011

**Alternatives Considered**:
- **Abort on partial failure**: Rejected - misses opportunity to provide partial value
- **Separate commits per fix**: Rejected - creates noise, single commit preferred per clarification

**Implementation Details**:
```yaml
- uses: openai/codex-action@main
  with:
    prompt: |
      Analyze these CI failures and generate fixes:
      ${{ steps.capture-failures.outputs.failure_logs }}

      If you cannot fix all failures, fix what you can and list remaining issues.
      Output:
      1. Fixed code for all files you can repair
      2. A summary of what was fixed
      3. A summary of what could not be fixed and why

- name: Create commit message
  id: commit-msg
  run: |
    # Extract summaries from Codex output
    FIXED_SUMMARY="${{ steps.codex.outputs.fixed_summary }}"
    REMAINING_SUMMARY="${{ steps.codex.outputs.remaining_summary }}"

    if [ -n "$REMAINING_SUMMARY" ]; then
      COMMIT_MSG="fix(autofix): Apply partial fixes for CI failures

    Fixed:
    ${FIXED_SUMMARY}

    Remaining issues (manual review needed):
    ${REMAINING_SUMMARY}

    🤖 Generated with GitHub Actions Autofix"
    else
      COMMIT_MSG="fix(autofix): Apply automated fixes for CI failures

    ${FIXED_SUMMARY}

    🤖 Generated with GitHub Actions Autofix"
    fi

    echo "message<<EOF" >> $GITHUB_OUTPUT
    echo "$COMMIT_MSG" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
```

### 7. Error Handling and Rate Limiting

**Decision**: Use workflow conditional steps and continue-on-error for graceful failures

**Rationale**:
- GitHub Actions provides built-in error handling mechanisms
- Codex action failures shouldn't break the entire workflow
- Rate limit errors from OpenAI API handled by action internally with retries
- Failed autofix attempts logged but don't block developer workflow

**Alternatives Considered**:
- **Custom retry logic**: Rejected - Codex action handles retries internally
- **Circuit breaker pattern**: Rejected - overly complex for workflow use case

**Implementation Details**:
```yaml
- name: Generate fixes
  id: codex
  uses: openai/codex-action@main
  continue-on-error: true
  with:
    prompt: ...

- name: Check if fixes were generated
  if: steps.codex.outcome == 'failure'
  run: |
    echo "::warning::Autofix generation failed. This may be due to:"
    echo "  - OpenAI API rate limits"
    echo "  - Failure logs exceeding token limits"
    echo "  - Complex failures requiring manual review"
    exit 0  # Don't fail the workflow
```

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Workflow Engine | GitHub Actions | N/A | Orchestration and execution |
| AI Code Generation | OpenAI Codex | `openai/codex-action@main` | Fix generation via natural language prompts |
| Version Control | Git | Built-in runner | Commit and push operations |
| API Integration | GitHub Actions API | v7 (actions/github-script) | Workflow run and log access |
| Authentication | GitHub Secrets | N/A | OPENAI_API_KEY storage |

## Best Practices Applied

1. **Security**:
   - OPENAI_API_KEY stored in repository secrets, never exposed in logs
   - Minimal workflow permissions (contents: write only)
   - No sensitive data in commit messages

2. **Reliability**:
   - Explicit loop prevention via commit message detection
   - Graceful error handling with continue-on-error
   - Workflow skips cleanly when no action needed

3. **Maintainability**:
   - Self-documenting natural language prompts
   - Clear step names and descriptions
   - Conventional commit format for traceability

4. **Performance**:
   - workflow_run event ensures efficient triggering (only after CI completion)
   - Single commit per autofix (no excessive PR noise)
   - Timeout limits prevent runaway workflows

## Open Questions Resolved

All NEEDS CLARIFICATION items from Technical Context have been resolved:

✅ **Specific action/integration method**: `openai/codex-action@main` with `prompt:` parameter
✅ **Testing strategy**: Manual verification with intentionally failing PRs (workflow testing not required)
✅ **Expected AI service latency**: Codex typically responds in <60 seconds, action handles retries
✅ **Token limit handling strategy**: Codex action handles internally, gracefully fails if exceeded

## Next Steps

Proceed to Phase 1 (Design & Contracts):
- Define data model (workflow states, job statuses, failure types)
- Document workflow interface (inputs, outputs, events)
- Create quickstart guide for repository setup
