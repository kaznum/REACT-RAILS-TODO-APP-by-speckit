# Feature Specification: GitHub Actions CI/CD Workflow for Pull Requests

**Feature Branch**: `003-pull-request-github`
**Created**: 2025-10-10
**Status**: Draft
**Input**: User description: "pull requestの作成、更新時にGitHub ActionsのWorkflowでbackend, frontendのテストと構文チェックが実行される"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Testing on Pull Request Creation (Priority: P1)

Developers need automated test execution when creating a pull request to catch bugs and regressions before code review, ensuring code quality and reducing manual testing effort.

**Why this priority**: This is the core value of CI - preventing broken code from being merged. Without this, all other CI features have no foundation.

**Independent Test**: A developer creates a pull request with new code changes. The CI system automatically runs all backend and frontend tests, and the PR shows test results within 5 minutes.

**Acceptance Scenarios**:

1. **Given** a developer creates a new pull request, **When** the PR is opened, **Then** GitHub Actions workflow is automatically triggered
2. **Given** the CI workflow is triggered, **When** backend tests are executed, **Then** all RSpec tests run and results are reported on the PR
3. **Given** the CI workflow is triggered, **When** frontend tests are executed, **Then** all Jest tests run and results are reported on the PR
4. **Given** all tests pass, **When** results are reported, **Then** the PR shows a green checkmark indicating tests passed
5. **Given** any test fails, **When** results are reported, **Then** the PR shows a red X with details about which tests failed
6. **Given** tests are running, **When** viewing the PR, **Then** the status shows "in progress" with a yellow indicator

---

### User Story 2 - Automated Linting on Pull Request Creation (Priority: P2)

Developers need automated code quality checks (linting) when creating a pull request to maintain consistent code style and catch common errors, reducing code review time spent on style issues.

**Why this priority**: Linting ensures code quality but is less critical than functional tests. Code can work even with style violations, but tests verify correctness.

**Independent Test**: A developer creates a pull request with code that has style violations. The CI system runs linters and reports style issues on the PR.

**Acceptance Scenarios**:

1. **Given** a pull request is created, **When** the CI workflow runs, **Then** RuboCop linter runs on backend code
2. **Given** a pull request is created, **When** the CI workflow runs, **Then** ESLint runs on frontend code
3. **Given** linting passes, **When** results are reported, **Then** the PR shows a green checkmark for lint checks
4. **Given** linting finds violations, **When** results are reported, **Then** the PR shows a red X with details about which files have violations
5. **Given** lint checks are running, **When** viewing the PR, **Then** the status shows "in progress" for lint checks

---

### User Story 3 - Automated Testing on Pull Request Updates (Priority: P3)

Developers need tests to re-run automatically when pushing new commits to an existing pull request, ensuring that each iteration of code changes maintains quality without manual re-testing.

**Why this priority**: This is an extension of P1 for iterative development. It's important but the core value is already delivered by P1.

**Independent Test**: A developer pushes new commits to an existing pull request. The CI system automatically re-runs all tests and linting for the updated code.

**Acceptance Scenarios**:

1. **Given** an existing pull request, **When** a developer pushes new commits, **Then** the CI workflow is automatically re-triggered
2. **Given** the CI workflow is re-triggered, **When** tests run, **Then** previous test results are replaced with new results
3. **Given** tests were passing before, **When** new commits introduce failures, **Then** the PR status changes from green to red
4. **Given** tests were failing before, **When** new commits fix the issues, **Then** the PR status changes from red to green
5. **Given** multiple commits are pushed rapidly, **When** CI runs, **Then** only the most recent commit is tested (earlier runs are cancelled)

---

### User Story 4 - CI Status Visibility on Pull Request (Priority: P4)

Developers and reviewers need clear visibility of CI status directly on the pull request page to make informed decisions about code review and merging without leaving GitHub.

**Why this priority**: This enhances the developer experience but doesn't add new functional capability beyond what P1-P3 provide.

**Independent Test**: Viewing a pull request shows clear status indicators for all CI checks with links to detailed logs.

**Acceptance Scenarios**:

1. **Given** a pull request with running CI, **When** viewing the PR, **Then** all checks (backend tests, frontend tests, backend lint, frontend lint) are listed with their current status
2. **Given** a CI check fails, **When** viewing the PR, **Then** the failure is clearly visible with a link to the detailed log
3. **Given** all CI checks pass, **When** viewing the PR, **Then** a summary message indicates "All checks have passed"
4. **Given** CI checks are in progress, **When** viewing the PR, **Then** an estimated time remaining is shown (if available)
5. **Given** a CI check fails, **When** clicking on the failure, **Then** the developer is taken to the specific log output showing the error

---

### Edge Cases

- What happens when GitHub Actions service is temporarily unavailable?
- How does the system handle PRs with merge conflicts during CI execution?
- What happens if CI runs exceed the maximum allowed execution time?
- How are flaky tests (tests that intermittently fail) handled?
- What happens when Docker build fails during CI setup?
- How does the system handle PRs that modify the CI workflow file itself?
- What happens when multiple developers push to the same PR simultaneously?
- How are CI results handled for draft pull requests?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically trigger CI workflow when a new pull request is created
- **FR-002**: System MUST automatically trigger CI workflow when commits are pushed to an existing pull request
- **FR-003**: System MUST execute all backend tests (RSpec) as part of the CI workflow
- **FR-004**: System MUST execute all frontend tests (Jest) as part of the CI workflow
- **FR-005**: System MUST execute backend linting (RuboCop) as part of the CI workflow
- **FR-006**: System MUST execute frontend linting (ESLint) as part of the CI workflow
- **FR-007**: System MUST report test results on the pull request status checks
- **FR-008**: System MUST report linting results on the pull request status checks
- **FR-009**: System MUST indicate whether each check (tests and linting) passed or failed
- **FR-010**: System MUST provide detailed logs for each CI check
- **FR-011**: System MUST run CI checks in parallel where possible to minimize total execution time
- **FR-012**: System MUST use Docker containers for consistent CI environment matching development environment
- **FR-013**: System MUST cache dependencies (Ruby gems, npm packages) to speed up subsequent CI runs
- **FR-014**: System MUST cancel in-progress CI runs when new commits are pushed to the same PR
- **FR-015**: System MUST prevent merging of pull requests when CI checks are failing
- **FR-016**: CI workflow MUST complete within 10 minutes under normal conditions
- **FR-017**: System MUST store CI logs for at least 90 days for debugging and audit purposes

### Key Entities

- **Pull Request**: A proposed code change that triggers CI workflows. Contains source branch, target branch, commits, and status checks.
- **CI Workflow**: An automated process that runs tests and linting. Contains multiple jobs (backend tests, frontend tests, backend lint, frontend lint).
- **Check Run**: A single CI job execution with status (pending, success, failure), logs, and completion time.
- **Workflow Configuration**: YAML file defining CI steps, triggers, and environment setup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: CI workflow completes execution within 10 minutes for 95% of pull requests
- **SC-002**: Developers see CI status updates on pull requests within 30 seconds of triggering
- **SC-003**: CI catches 100% of test failures before code review begins
- **SC-004**: CI catches 100% of linting violations before code review begins
- **SC-005**: Zero pull requests with failing tests are merged to main branch
- **SC-006**: Code review time is reduced by 30% due to automated style checking
- **SC-007**: CI workflow has 99% success rate (not counting legitimate test failures)
- **SC-008**: Developers can identify the specific failing test or lint rule from PR status page within 1 minute
- **SC-009**: 90% of pull requests pass all CI checks on first attempt
- **SC-010**: CI infrastructure costs remain under $50/month for the project

## Assumptions

1. **GitHub Actions Availability**: GitHub Actions service is available and accessible for the repository
2. **Repository Permissions**: The repository has GitHub Actions enabled with appropriate permissions
3. **Docker Environment**: CI runners have sufficient resources to run Docker containers
4. **Test Suite Stability**: Existing tests are deterministic and not flaky
5. **Development Environment Parity**: Docker setup in CI matches local development environment
6. **Branch Protection**: Main branch has branch protection rules requiring CI checks to pass
7. **Concurrent Workflows**: GitHub Actions allows concurrent workflow runs for different PRs
8. **Workflow Triggers**: Pull request events (opened, synchronize) reliably trigger workflows
9. **Log Retention**: GitHub Actions retains logs for the standard retention period
10. **Dependency Caching**: GitHub Actions cache is available and reliable
11. **Resource Limits**: CI jobs complete within GitHub Actions' time and resource limits
12. **Network Access**: CI runners have internet access for downloading dependencies
13. **Secrets Management**: Necessary secrets (if any) are configured in repository settings

## Out of Scope

The following features are explicitly excluded from this specification:

- Deployment automation (CD - Continuous Deployment)
- Performance testing or load testing in CI
- Security scanning or vulnerability detection
- Code coverage reporting or enforcement
- Automated dependency updates (Dependabot)
- Integration testing with external services
- Database migration testing
- Cross-browser testing for frontend
- Mobile app builds
- Manual approval steps in CI workflow
- Notifications to Slack or other communication tools
- Custom badges or status indicators beyond GitHub's default
- Parallel testing across multiple Ruby/Node versions
- Scheduled CI runs (only PR-triggered)
- Custom lint rule configuration (use existing project settings)
