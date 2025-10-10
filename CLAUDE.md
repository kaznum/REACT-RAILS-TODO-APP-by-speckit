# REACT-RAILS-TODO-APP-by-speckit Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-10

## Active Technologies
- **Backend**: Ruby 3.x, Rails 7.1 (001-todo-google-oauth2)
- **Frontend**: JavaScript/ES6+, React 18.2 (001-todo-google-oauth2)
- **CI/CD**: GitHub Actions, Docker Compose (003-pull-request-github)
- YAML (GitHub Actions workflow definitions) (004-github-actions-ci)
- N/A (workflow definitions, no persistent storage) (004-github-actions-ci)

## Project Structure
```
.
├── .github/workflows/      # CI/CD configuration
├── backend/                # Rails API (Ruby 3.x, Rails 7.1)
│   ├── app/               # Application code
│   ├── spec/              # RSpec tests (74 tests)
│   └── db/                # Database files (SQLite)
├── frontend/              # React SPA (React 18.2)
│   └── src/              # Source code (Jest tests: 55 tests)
├── specs/                 # Feature specifications
│   ├── 001-todo-google-oauth2/
│   ├── 002-japanese-ui/
│   └── 003-pull-request-github/
└── docker-compose.yml     # Docker configuration
```

## Commands

### Testing
```bash
# Backend (RSpec)
docker compose exec backend bundle exec rspec

# Frontend (Jest)
docker compose exec frontend npm test -- --watchAll=false
```

### Linting
```bash
# Backend (RuboCop)
docker compose exec backend bundle exec rubocop
docker compose exec backend bundle exec rubocop -a  # Auto-fix

# Frontend (ESLint)
docker compose exec frontend npm run lint
docker compose exec frontend npm run lint:fix  # Auto-fix
```

### Database
```bash
docker compose exec backend rails db:create
docker compose exec backend rails db:migrate
docker compose exec backend rails db:reset
```

## Code Style
- **Ruby**: Follow RuboCop standards, use Rails logger instead of puts
- **JavaScript/React**: Follow ESLint standards, functional components with hooks
- **Git Commits**: Conventional Commits format (feat:, fix:, docs:, etc.)

## CI/CD
- **Trigger**: On pull request (opened, synchronize, reopened)
- **Jobs**: 4 parallel jobs (backend-test, frontend-test, backend-lint, frontend-lint)
- **Environment**: Docker Compose (matches local development)
- **Auto-setup**: Environment files created from .env.example, DB migrations run automatically
- **Autofix**: GitHub Actions autofix workflow automatically generates and commits fixes for test/lint failures

## Autofix Workflow (004-github-actions-ci)
- **When it triggers**: Automatically after CI completes with failures (not on main/master branches)
- **What it fixes**: Test failures (RSpec, Jest) and linting errors (RuboCop, ESLint)
- **How it works**: Uses OpenAI Codex to analyze failure logs and generate code fixes
- **Commits**: Fixes committed directly to PR branch with `fix(autofix):` prefix
- **Loop prevention**: Skips if last commit is already an autofix commit
- **Partial fixes**: Creates commit even if not all failures resolved, documents remaining issues
- **Manual review**: Always review autofix commits before merging - AI may not fix everything correctly
- **Requirements**: OPENAI_API_KEY must be configured in repository secrets

## Recent Changes
- 004-github-actions-ci: Added YAML (GitHub Actions workflow definitions)
- 003-pull-request-github: Added GitHub Actions CI/CD workflow (2025-10-10)
- 002-japanese-ui: Implemented Japanese UI localization (2025-10-09)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
