# frozen_string_literal: true

# JWT Configuration
module JwtConfig
  # Secret key for JWT encoding/decoding
  # In production, this should be stored in Rails credentials
  # For development/test, we'll use ENV variable or Rails secret_key_base
  JWT_SECRET = ENV['JWT_SECRET_KEY'] || Rails.application.credentials.secret_key_base

  # Token expiration times
  ACCESS_TOKEN_EXPIRATION = 15.minutes
  REFRESH_TOKEN_EXPIRATION = 7.days

  # Algorithm for JWT encoding/decoding
  ALGORITHM = 'HS256'
end
