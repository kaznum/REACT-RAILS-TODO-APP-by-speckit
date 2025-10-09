<!--
Sync Impact Report:
Version: 1.0.0 (Initial constitution)
Modified Principles: None (new creation)
Added Sections:
  - Core Principles (I-V)
  - Quality Standards
  - Development Workflow
  - Governance
Removed Sections: None
Templates Status:
  ✅ plan-template.md - Constitution Check section compatible
  ✅ spec-template.md - Requirements and user story structure aligned
  ✅ tasks-template.md - Test-first and quality task types supported
Follow-up TODOs: None
-->

# REACT-RAILS-TODO-APP Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

All code MUST meet the following quality standards:
- Code reviews are mandatory before merging
- No warnings or errors from linters (ESLint for React, RuboCop for Rails)
- Code coverage targets: minimum 80% for critical business logic
- Clear naming conventions: descriptive variable/function names, no single-letter names except loop counters
- Separation of concerns: Business logic separate from presentation, API layer separate from database layer

**Rationale**: High code quality reduces bugs, improves maintainability, and enables team scalability. Quality gates prevent technical debt accumulation.

### II. Test-First Development (NON-NEGOTIABLE)

Testing discipline MUST be followed:
- Tests written BEFORE implementation (Red-Green-Refactor cycle)
- User approval of test scenarios before writing tests
- All tests MUST fail initially, then pass after implementation
- Test categories required:
  - Unit tests: Individual components/functions
  - Integration tests: API endpoints, database interactions
  - E2E tests: Critical user journeys (login, create/edit/delete todos)

**Rationale**: Test-first development ensures requirements are clear, prevents regression, and provides living documentation. Automated tests enable confident refactoring and rapid deployment.

### III. UX Consistency

User experience MUST be uniform across the application:
- Component library: Reusable UI components with consistent styling
- Design system: Standardized colors, typography, spacing, and interaction patterns
- Accessibility: WCAG 2.1 Level AA compliance (semantic HTML, ARIA labels, keyboard navigation)
- Responsive design: Mobile-first approach, tested on common viewport sizes
- Error handling: User-friendly error messages, loading states, empty states

**Rationale**: Consistent UX reduces cognitive load, improves user satisfaction, and accelerates development through component reuse.

### IV. Automated Testing & CI/CD

Automation MUST be integrated into the development workflow:
- Continuous Integration: All tests run automatically on every push
- Pre-commit hooks: Linters and formatters run before commit
- Deployment gates: Tests must pass before deployment to staging/production
- Test data management: Factories/fixtures for consistent test data
- Performance benchmarks: Automated checks for page load times and API response times

**Rationale**: Automation catches errors early, ensures consistency, and enables rapid iteration without manual QA bottlenecks.

### V. API Contract Stability

Backend-frontend integration MUST be reliable:
- API versioning: `/api/v1/` prefix, backward compatibility required
- Schema validation: Request/response schemas documented and validated (JSON Schema or OpenAPI)
- Contract tests: Frontend tests verify expected API responses, backend tests verify endpoint contracts
- Breaking changes: Require MAJOR version bump and migration plan
- Error responses: Standardized format with error codes, messages, and field-level validation errors

**Rationale**: Stable API contracts enable frontend and backend teams to work independently and reduce integration issues.

## Quality Standards

### Code Review Requirements
- All PRs require at least one approval
- Reviewers MUST verify:
  - Tests are present and passing
  - Code follows style guide
  - No hardcoded secrets or sensitive data
  - UX patterns match design system
  - API changes include migration plan

### Performance Targets
- Frontend: First Contentful Paint < 1.5s, Time to Interactive < 3s
- Backend: API endpoints respond in < 200ms (p95), < 500ms (p99)
- Database: N+1 queries prohibited, use eager loading or batch queries

### Security Standards
- Authentication: Secure session management, CSRF protection
- Authorization: Role-based access control, validated on every request
- Data validation: Server-side validation for all user inputs
- Dependencies: Automated vulnerability scanning (Dependabot, Bundler Audit)

## Development Workflow

### Feature Development Process
1. Spec creation: Define user stories with acceptance criteria
2. Test design: Write test scenarios, get user approval
3. Test implementation: Write failing tests (Red)
4. Implementation: Make tests pass (Green)
5. Refactor: Improve code quality while keeping tests green
6. Code review: Address feedback, merge to main
7. Deploy: Automated deployment after tests pass

### Branching Strategy
- `main`: Always deployable, protected branch
- Feature branches: `feature/###-description` format
- No direct commits to main, all changes via PR

### Test Execution
- Local: Run tests before committing (`npm test`, `bundle exec rspec`)
- CI: Full test suite on every push
- Pre-deployment: Integration and E2E tests in staging environment

## Governance

### Amendment Process
1. Propose change: Document rationale and impact
2. Review: Team discussion and approval required
3. Update: Increment constitution version, update related templates
4. Migrate: Update existing code/tests to comply with new rules

### Versioning Policy
- **MAJOR**: Breaking changes to principles, removed requirements
- **MINOR**: New principles added, expanded guidance
- **PATCH**: Clarifications, typo fixes, non-semantic changes

### Compliance Review
- All PRs MUST pass constitution check before merge
- Violations MUST be justified in plan.md complexity tracking table
- Quarterly review: Assess if constitution needs updates based on project evolution

### Complexity Justification
Any violation of core principles MUST document:
- Why the violation is necessary
- What simpler alternative was considered and rejected
- Plan to resolve the violation in future iterations

---

**Version**: 1.0.0 | **Ratified**: 2025-10-09 | **Last Amended**: 2025-10-09
