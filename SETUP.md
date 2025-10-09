# TODO App Setup Instructions

This document provides instructions to initialize the Rails backend and React frontend projects using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Git repository cloned

## Initial Setup Steps

### Step 1: Generate Rails API Backend

Run this command from the repository root to generate the Rails API application:

```bash
docker run --rm -v "$(pwd)/backend:/app" -w /app ruby:3.2-alpine sh -c "
  apk add --no-cache build-base sqlite-dev nodejs yarn &&
  gem install rails -v 7.1.0 &&
  rails new . --api --database=sqlite3 --skip-test --force
"
```

### Step 2: Update Backend Gemfile

After Rails generation, update `backend/Gemfile` to add required gems:

```ruby
# Add these gems to the Gemfile:
gem 'rack-cors'
gem 'omniauth-google-oauth2', '~> 1.1'
gem 'omniauth-rails_csrf_protection', '~> 1.0'
gem 'jwt', '~> 2.7'

# In the development/test group:
gem 'rspec-rails', '~> 6.0'
gem 'factory_bot_rails', '~> 6.2'
gem 'faker', '~> 3.2'
gem 'rubocop', '~> 1.56', require: false
gem 'rubocop-rails', '~> 2.21', require: false
```

Then run: `docker-compose run --rm backend bundle install`

### Step 3: Generate React Frontend

```bash
docker run --rm -v "$(pwd)/frontend:/app" -w /app node:18-alpine sh -c "
  npx create-react-app . --template cra-template
"
```

### Step 4: Install Frontend Dependencies

Add required packages to `frontend/package.json`:

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react-router-dom": "^6.20.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "eslint": "^8.54.0",
    "eslint-config-react-app": "^7.0.1"
  }
}
```

Then run: `docker-compose run --rm frontend npm install`

### Step 5: Environment Configuration

Create environment files:

**backend/.env**:
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
DATABASE_URL=sqlite3:db/development.sqlite3
SECRET_KEY_BASE=$(docker-compose run --rm backend rails secret)
JWT_SECRET_KEY=$(docker-compose run --rm backend rails secret)
RAILS_ENV=development
JWT_ACCESS_TOKEN_EXPIRATION=900
JWT_REFRESH_TOKEN_EXPIRATION=604800
```

**frontend/.env.local**:
```bash
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_FRONTEND_URL=http://localhost:3001
REACT_APP_ENABLE_DEBUG_MODE=true
```

### Step 6: Start Docker Compose

```bash
docker-compose up --build
```

### Step 7: Initialize Database

In a new terminal:

```bash
docker-compose exec backend rails db:create
docker-compose exec backend rails db:migrate
```

## Next Steps

After setup is complete, continue with the implementation tasks in `specs/001-todo-google-oauth2/tasks.md` starting from **Phase 2: Foundational**.

## Troubleshooting

### Port Already in Use
If ports 3000 or 3001 are in use:
```bash
lsof -i :3000
lsof -i :3001
# Kill the process or change ports in docker-compose.yml
```

### Docker Build Fails
```bash
# Clean Docker cache
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Gem Installation Fails
```bash
# Rebuild backend container
docker-compose build --no-cache backend
```
