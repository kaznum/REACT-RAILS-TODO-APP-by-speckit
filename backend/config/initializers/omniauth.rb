# frozen_string_literal: true

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
           ENV.fetch('GOOGLE_CLIENT_ID', nil),
           ENV.fetch('GOOGLE_CLIENT_SECRET', nil),
           {
             scope: 'email,profile',
             prompt: 'select_account',
             image_aspect_ratio: 'square',
             image_size: 50
           }
end

# Silence OmniAuth logger in development to reduce noise
OmniAuth.config.logger = Rails.logger if Rails.env.development?

# Allow dangerous request methods for OmniAuth (required for POST requests in development)
OmniAuth.config.allowed_request_methods = %i[get post]

# Handle failure redirects
OmniAuth.config.on_failure = proc { |env|
  message = env['omniauth.error.type']
  Rails.logger.error("OmniAuth failure: #{message}")
  frontend_url = ENV.fetch('REACT_APP_FRONTEND_URL', nil)
  redirect_url = "#{frontend_url}/login?error=#{message}"
  [302, { 'Location' => redirect_url, 'Content-Type' => 'text/html' }, []]
}
