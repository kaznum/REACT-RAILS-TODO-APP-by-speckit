# frozen_string_literal: true

Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get 'up' => 'rails/health#show', as: :rails_health_check

  # API routes
  namespace :api do
    namespace :v1 do
      # Authentication routes
      get 'auth/google', to: 'auth#google_login'
      get 'auth/google_oauth2/callback', to: 'auth#google_oauth2_callback'
      post 'auth/refresh', to: 'auth#refresh'
      delete 'auth/sign_out', to: 'auth#sign_out'
      get 'auth/current_user', to: 'auth#current_user'

      # Todo routes
      resources :todos, only: %i[index create update destroy]
    end
  end

  # OmniAuth callback route (for OAuth flow) - redirect to API endpoint
  get '/auth/google_oauth2/callback', to: 'api/v1/auth#google_oauth2_callback'
  get '/auth/failure', to: 'api/v1/auth#failure'
end
