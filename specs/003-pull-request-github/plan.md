# Implementation Plan: GitHub Actions CI/CD Workflow

**Branch**: `003-pull-request-github` | **Date**: 2025-10-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-pull-request-github/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement automated Continuous Integration (CI) using GitHub Actions to run tests and linting checks on every pull request. The CI workflow will execute backend tests (RSpec), frontend tests (Jest), backend linting (RuboCop), and frontend linting (ESLint) within Docker containers using docker compose, matching the local development environment. This ensures code quality before review and prevents broken code from being merged.

## Technical Context

**CI Platform**: GitHub Actions (YAML workflow configuration)
**Language/Version**:
- Backend: Ruby 3.x (Rails 7.1 API)
- Frontend: JavaScript/ES6+ (React 18.2)
- CI Configuration: YAML

**Primary Dependencies**:
- Docker & Docker Compose (container orchestration)
- GitHub Actions runners (ubuntu-latest)
- Existing test suites: RSpec (backend), Jest (frontend)
- Existing linters: RuboCop (backend), ESLint (frontend)

**Storage**: N/A (CI workflow only, no data storage)

**Testing**:
- Backend: RSpec (74 tests)
- Frontend: Jest (55 tests)
- All tests run via docker compose in CI

**Target Platform**: GitHub Actions runners (Linux-based, ubuntu-latest)

**Project Type**: Web application (existing backend + frontend structure)

**Performance Goals**:
- CI workflow completion < 10 minutes (95th percentile)
- Parallel job execution where possible
- Dependency caching to reduce run time

**Constraints**:
- Must use docker compose (maintain parity with local dev environment)
- Free tier GitHub Actions limits (2000 minutes/month for private repos)
- Workflow must match existing docker-compose.yml configuration

**Scale/Scope**:
- Single repository with backend/ and frontend/ directories
- 4 CI jobs: backend-test, frontend-test, backend-lint, frontend-lint
- Triggered on pull_request events (opened, synchronize, reopened)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality ✅ PASS
- Code reviews: ✅ PR-based workflow enables mandatory reviews
- Linters: ✅ RuboCop and ESLint automated in CI
- Code coverage: N/A (this feature adds CI, doesn't change coverage)
- Naming conventions: ✅ YAML workflow follows GitHub Actions standards
- Separation of concerns: ✅ Each CI job handles one responsibility

### II. Test-First Development ✅ PASS
- Tests before implementation: ✅ Will write workflow tests (validate YAML syntax)
- User approval: ✅ Spec approved before implementation
- Tests fail then pass: ✅ Workflow validation will follow TDD
- Test categories: ✅ CI workflow tests are integration tests

**Note**: This feature implements the CI/CD automation required by Constitution Principle IV

### III. UX Consistency N/A
- This is an infrastructure feature with no user-facing UI

### IV. Automated Testing & CI/CD ✅ PASS
- **This feature IMPLEMENTS this principle**
- Continuous Integration: ✅ Core requirement of this feature
- Pre-commit hooks: Out of scope (addressed separately)
- Deployment gates: ✅ Branch protection with required status checks
- Test data management: ✅ Uses existing factories/fixtures
- Performance benchmarks: Future enhancement (out of scope)

### V. API Contract Stability N/A
- This feature doesn't modify any APIs

**GATE RESULT**: ✅ PASS - All applicable principles satisfied

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
.github/
└── workflows/
    └── ci.yml              # NEW: GitHub Actions CI workflow

backend/                    # Existing
├── app/
├── spec/                   # 74 RSpec tests
├── .rubocop.yml           # Existing linter config
├── Dockerfile             # Used by CI
└── ...

frontend/                   # Existing
├── src/
├── package.json           # Contains test & lint scripts
├── .eslintrc.json        # Existing linter config
├── Dockerfile            # Used by CI
└── ...

docker-compose.yml          # Existing - used by CI
```

**Structure Decision**: This feature adds a single GitHub Actions workflow file (`.github/workflows/ci.yml`) to the existing web application structure. The workflow leverages the existing Docker configuration (`docker-compose.yml`) and test/lint configurations in both `backend/` and `frontend/` directories. No changes to application code structure are required.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No violations. All Constitution principles are satisfied or not applicable to this infrastructure feature.

---

## Post-Design Constitution Re-Check

**Status**: ✅ PASS (re-evaluated after Phase 1 design completion)

### Design Artifacts Created
1. ✅ `research.md` - CI/CD workflow design decisions documented
2. ✅ `data-model.md` - GitHub Actions entities and state diagrams defined
3. ✅ `contracts/workflow-schema.md` - Workflow contract and expected behaviors specified
4. ✅ `quickstart.md` - Setup and usage guide created

### Constitution Compliance After Design

**I. Code Quality** ✅ PASS
- Workflow YAML follows GitHub Actions best practices
- Clear job naming and structure
- Proper error handling and cleanup steps

**II. Test-First Development** ✅ PASS
- Workflow validation will test YAML syntax before deployment
- Workflow tests check run behavior (create test PR to verify)
- Follows TDD approach: define contract → implement → verify

**III. UX Consistency** N/A
- Infrastructure feature, no UI changes

**IV. Automated Testing & CI/CD** ✅ PASS
- **This feature implements the Constitution's CI/CD requirement**
- Ensures all future code changes have automated quality checks
- Enables the "Deployment gates" principle

**V. API Contract Stability** N/A
- No API changes

**Final Gate Result**: ✅ PASS - Ready for implementation (`/speckit.tasks`)
