# Quickstart Guide: GitHub Actions CI Autofix

**Date**: 2025-10-10
**Feature**: 004-github-actions-ci
**Audience**: Developers and repository administrators

## Overview

This guide walks you through setting up and using the GitHub Actions CI Autofix workflow in your repository. The autofix workflow automatically generates and commits fixes for test failures and linting errors detected in pull requests.

## Prerequisites

- Repository with existing CI workflow (`.github/workflows/ci.yml`)
- GitHub repository with Actions enabled
- OpenAI API key with access to Codex
- Repository administrator access (to configure secrets)

## Setup (One-Time Configuration)

### Step 1: Configure OpenAI API Key

1. **Obtain OpenAI API Key**:
   - Visit [platform.openai.com](https://platform.openai.com)
   - Navigate to API Keys section
   - Create a new API key with Codex access
   - Copy the key (starts with `sk-...`)

2. **Add to GitHub Secrets**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `OPENAI_API_KEY`
   - Value: Paste your OpenAI API key
   - Click **Add secret**

### Step 2: Create Autofix Workflow File

1. **Create the workflow file**:
   ```bash
   # From repository root
   touch .github/workflows/autofix.yml
   ```

2. **Add workflow content**:
   - See `tasks.md` (created by `/speckit.tasks` command) for implementation tasks
   - Workflow will be implemented as part of feature development

3. **Commit and push**:
   ```bash
   git add .github/workflows/autofix.yml
   git commit -m "feat: Add CI autofix workflow"
   git push origin 004-github-actions-ci
   ```

### Step 3: Verify Workflow Permissions

1. **Check workflow permissions** (required for writing commits):
   - Go to **Settings** → **Actions** → **General**
   - Scroll to **Workflow permissions**
   - Select **Read and write permissions**
   - Check **Allow GitHub Actions to create and approve pull requests**
   - Click **Save**

## Usage

### How It Works

1. **Developer creates a PR** with code changes
2. **CI workflow runs** automatically on the PR
3. **If CI fails** (tests or linting):
   - Autofix workflow triggers automatically
   - Analyzes failure logs using OpenAI Codex
   - Generates fixes for the failures
   - Commits fixes directly to the PR branch
4. **Developer reviews** the autofix commit
5. **CI runs again** on the updated code
6. **If successful**, developer merges the PR

### Workflow Trigger Conditions

The autofix workflow triggers **only when**:
- ✅ CI workflow completes with failures
- ✅ The failing workflow run is associated with a pull request
- ✅ The PR branch is NOT `main` or `master`
- ✅ The latest commit is NOT already an autofix commit

### What Gets Fixed

**Automatically Fixed** (high success rate):
- ✅ Linting errors (RuboCop, ESLint)
- ✅ Simple test failures (incorrect assertions, typos)
- ✅ Formatting issues
- ✅ Missing imports or require statements

**May Require Manual Review** (partial fixes):
- ⚠️ Complex logic errors
- ⚠️ Architectural changes
- ⚠️ Test failures requiring new test data
- ⚠️ Multi-step refactoring

**Not Fixed** (out of scope):
- ❌ Build/compilation errors
- ❌ Dependency issues
- ❌ Security vulnerabilities
- ❌ Database migration conflicts

## Example Workflow

### Scenario: Linting Errors in Pull Request

1. **Developer creates PR #45**:
   ```bash
   git checkout -b feature/new-todo-filter
   # ... make changes ...
   git push origin feature/new-todo-filter
   # Create PR on GitHub
   ```

2. **CI runs and fails** with ESLint errors:
   ```
   frontend/src/components/TodoFilter.jsx
     12:5   error  'React' is defined but never used  no-unused-vars
     24:10  error  Missing semicolon                  semi
   ```

3. **Autofix workflow triggers**:
   - Detects ESLint failures
   - Generates fix using Codex
   - Commits fix to `feature/new-todo-filter`

4. **Developer sees new commit** in PR timeline:
   ```
   fix(autofix): Resolve ESLint violations in TodoFilter.jsx

   Fixed:
   - Removed unused React import
   - Added missing semicolon on line 24

   🤖 Generated with GitHub Actions Autofix
   ```

5. **CI runs again** on the autofix commit:
   - ✅ All ESLint checks pass
   - ✅ All tests pass

6. **Developer reviews and merges** the PR

### Scenario: Partial Fix (Test Failure)

1. **PR #46 created** with failing RSpec test

2. **CI fails** with test error:
   ```
   Failures:
     1) Todo#complete marks todo as completed
        expected: true
        got: false
   ```

3. **Autofix workflow triggers**:
   - Attempts to fix test failure
   - Fixes logic error in `app/models/todo.rb`
   - Another test still fails (requires manual review)

4. **Developer sees autofix commit**:
   ```
   fix(autofix): Apply partial fixes for CI failures

   Fixed:
   - app/models/todo.rb: Corrected completed status logic

   Remaining issues (manual review needed):
   - spec/models/todo_spec.rb: Test expects different behavior for
     'completed_at' timestamp - requires clarification of business logic

   🤖 Generated with GitHub Actions Autofix
   ```

5. **Developer reviews**:
   - Examines autofix changes
   - Manually fixes remaining test issue
   - Pushes final commit

6. **CI passes**, PR is merged

## Monitoring and Debugging

### View Workflow Runs

1. Go to **Actions** tab in your repository
2. Select **CI Autofix** workflow
3. View run history and logs

### Check Autofix Commit

Autofix commits are identifiable by:
- **Commit message prefix**: `fix(autofix):`
- **Author**: `github-actions[bot]`
- **Commit footer**: `🤖 Generated with GitHub Actions Autofix`

### Common Issues and Solutions

#### Issue: Workflow doesn't trigger

**Symptoms**: CI fails but no autofix commit appears

**Solutions**:
- ✅ Check that `OPENAI_API_KEY` is configured in repository secrets
- ✅ Verify workflow permissions are set to "Read and write"
- ✅ Ensure PR is not targeting `main`/`master` branch
- ✅ Check if last commit is already an autofix commit (loop prevention)
- ✅ View workflow logs in Actions tab for errors

#### Issue: Fixes don't resolve failures

**Symptoms**: Autofix commits created but CI still fails

**Solutions**:
- ✅ Review autofix commit message for "Remaining issues" section
- ✅ Complex failures may require manual review
- ✅ Check if Codex misunderstood the failure context
- ✅ Manually fix remaining issues and push

#### Issue: Rate limit errors

**Symptoms**: Workflow fails with OpenAI API rate limit error

**Solutions**:
- ✅ Wait for rate limit to reset (typically 1 minute to 1 hour)
- ✅ Consider upgrading OpenAI API plan for higher limits
- ✅ Workflow will skip gracefully and log a warning

#### Issue: Infinite loops (should not occur)

**Symptoms**: Multiple autofix commits in quick succession

**Solutions**:
- ✅ Check commit message format - should start with `fix(autofix):`
- ✅ Verify loop prevention logic in workflow
- ✅ Manually disable workflow if needed (Settings → Actions → Disable workflow)

## Best Practices

### For Developers

1. **Review autofix commits carefully**: AI-generated fixes may not always be correct
2. **Check "Remaining issues" section**: Manual fixes may be needed
3. **Test locally before merging**: Don't rely solely on CI + autofix
4. **Provide feedback**: If autofix consistently fails for certain errors, consider manual fixes

### For Repository Administrators

1. **Monitor API usage**: Track OpenAI API costs and rate limits
2. **Review autofix success rate**: Check how often fixes resolve all failures
3. **Adjust prompts if needed**: Update Codex prompts in workflow for better results
4. **Set up notifications**: Configure alerts for workflow failures

## Advanced Configuration

### Customizing Codex Prompts

Edit `.github/workflows/autofix.yml` and modify the `prompt:` section:

```yaml
- uses: openai/codex-action@main
  with:
    prompt: |
      # Customize this prompt for your project's specific needs
      You are fixing CI failures for a React/Rails todo app.

      Project context:
      - Backend: Rails 7.1 with RSpec tests
      - Frontend: React 18.2 with Jest tests
      - Coding style: Follow RuboCop and ESLint rules

      Failure logs:
      ${{ steps.capture-failures.outputs.failure_logs }}

      Instructions:
      [Add project-specific instructions here]
```

### Excluding Specific Jobs

To skip autofix for specific CI jobs, modify the failure categorization:

```yaml
- name: Categorize failures
  run: |
    # Filter out jobs you don't want to autofix
    FILTERED_LOGS=$(echo "${{ steps.capture-failures.outputs.failure_logs }}" | grep -v "security-scan")
```

### Adding Notifications

Send notifications when autofix succeeds or fails:

```yaml
- name: Notify on Slack
  if: steps.commit.outcome == 'success'
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Autofix applied to PR #${{ steps.pr.outputs.number }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Troubleshooting

### Enable Debug Logging

Add to workflow file:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
```

Then re-run workflow to see detailed logs.

### Test Workflow Locally

Use [act](https://github.com/nektos/act) to run GitHub Actions locally:

```bash
# Install act
brew install act

# Run autofix workflow
act workflow_run -e test-event.json
```

### Disable Autofix Temporarily

**Option 1**: Add `[skip autofix]` to commit message
- Modify workflow to check for this marker

**Option 2**: Disable workflow in GitHub UI
- Settings → Actions → Select workflow → Disable

## Support and Feedback

### Getting Help

- **Documentation**: See `specs/004-github-actions-ci/` for design details
- **Issues**: Report bugs or request features in repository issues
- **Logs**: Check Actions tab for workflow run logs

### Contributing Improvements

To improve the autofix workflow:

1. Fork repository and create feature branch
2. Modify `.github/workflows/autofix.yml`
3. Test with intentionally failing PRs
4. Submit pull request with description of improvement

## Next Steps

After setup is complete:

1. ✅ Create a test PR with intentional failures
2. ✅ Verify autofix workflow triggers and commits fixes
3. ✅ Review autofix commit quality
4. ✅ Adjust Codex prompts if needed
5. ✅ Monitor API usage and costs
6. ✅ Train team on reviewing autofix commits

**Implementation**: See `tasks.md` (generated by `/speckit.tasks`) for detailed implementation tasks.
