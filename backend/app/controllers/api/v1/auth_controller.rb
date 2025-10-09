# frozen_string_literal: true

module Api
  module V1
    class AuthController < ApplicationController
      include ActionController::Cookies

      skip_before_action :authorize_request, only: %i[google_oauth2_callback refresh google_login current_user]

      # GET /api/v1/auth/google
      # Initiates Google OAuth2 flow
      def google_login
        redirect_to '/auth/google_oauth2', allow_other_host: true
      end

      # GET /api/v1/auth/google_oauth2/callback
      def google_oauth2_callback
        auth_hash = request.env['omniauth.auth']

        unless auth_hash
          redirect_to "#{ENV.fetch('REACT_APP_FRONTEND_URL', nil)}/login?error=authentication_failed"
          return
        end

        user = GoogleOauthService.find_or_create_from_oauth(auth_hash)

        if user.persisted?
          access_token = JwtService.encode_access_token(user.id)
          refresh_token = JwtService.encode_refresh_token(user.id)

          # Set refresh token in httpOnly cookie
          cookies.signed[:refresh_token] = {
            value: refresh_token,
            httponly: true,
            secure: Rails.env.production?,
            same_site: :lax,
            expires: 7.days.from_now
          }

          # Redirect to frontend with access token
          redirect_to "#{ENV.fetch('REACT_APP_FRONTEND_URL', nil)}/auth/callback?access_token=#{access_token}"
        else
          redirect_to "#{ENV.fetch('REACT_APP_FRONTEND_URL', nil)}/login?error=user_creation_failed"
        end
      rescue StandardError => e
        Rails.logger.error("OAuth callback error: #{e.message}")
        redirect_to "#{ENV.fetch('REACT_APP_FRONTEND_URL', nil)}/login?error=server_error"
      end

      # POST /api/v1/auth/refresh
      def refresh
        refresh_token = cookies.signed[:refresh_token]

        unless refresh_token
          render json: { error: 'Refresh token not found' }, status: :unauthorized
          return
        end

        user_id = JwtService.user_id_from_token(refresh_token)

        if user_id
          user = User.find_by(id: user_id)

          if user
            new_access_token = JwtService.encode_access_token(user.id)
            new_refresh_token = JwtService.encode_refresh_token(user.id)

            # Update refresh token cookie
            cookies.signed[:refresh_token] = {
              value: new_refresh_token,
              httponly: true,
              secure: Rails.env.production?,
              same_site: :lax,
              expires: 7.days.from_now
            }

            render json: {
              access_token: new_access_token,
              user: UserSerializer.serialize(user)
            }, status: :ok
          else
            render json: { error: 'User not found' }, status: :unauthorized
          end
        else
          render json: { error: 'Invalid refresh token' }, status: :unauthorized
        end
      rescue StandardError => e
        Rails.logger.error("Token refresh error: #{e.message}")
        render json: { error: 'Token refresh failed' }, status: :unauthorized
      end

      # DELETE /api/v1/auth/sign_out
      def sign_out
        cookies.delete(:refresh_token)
        render json: { message: 'Signed out successfully' }, status: :ok
      end

      # GET /api/v1/auth/current_user
      def current_user
        user = super # Call ApplicationController's current_user method

        if user
          render json: {
            user: UserSerializer.serialize(user)
          }, status: :ok
        else
          render json: { error: 'Not authenticated' }, status: :unauthorized
        end
      end
    end
  end
end
