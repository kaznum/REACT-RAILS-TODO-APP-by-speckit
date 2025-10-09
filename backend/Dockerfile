FROM ruby:3.2-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    sqlite-dev \
    sqlite \
    tzdata \
    nodejs \
    yarn \
    yaml-dev

# Set working directory
WORKDIR /app

# Copy Gemfile and install gems
COPY Gemfile Gemfile.lock* ./
RUN bundle config set --local force_ruby_platform true && \
    bundle install

# Copy application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start Rails server
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
