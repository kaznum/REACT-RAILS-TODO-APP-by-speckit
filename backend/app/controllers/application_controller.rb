# frozen_string_literal: true

class ApplicationController < ActionController::API
  include ActionController::Cookies

  before_action :authorize_request

  # Exception handlers
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid

  private

  # Get the current authenticated user
  # @return [User, nil] The current user or nil
  def current_user
    @current_user ||= (User.find_by(id: decoded_token['user_id']) if decoded_token)
  end

  # Authorize the request by verifying the JWT token
  # Only accepts access tokens, not refresh tokens
  def authorize_request
    unless current_user && valid_access_token?
      render json: { error: 'Unauthorized' }, status: :unauthorized
      return nil
    end

    true
  end

  # Extract token from Authorization header
  # @return [String, nil] The token or nil
  def auth_token
    @auth_token ||= begin
      header = request.headers['Authorization']
      header.split.last if header.present? && header.start_with?('Bearer ')
    end
  end

  # Decode the JWT token
  # @return [Hash, nil] The decoded payload or nil
  def decoded_token
    @decoded_token ||= (JwtService.decode_token(auth_token) if auth_token)
  end

  # Verify that the token is an access token (not a refresh token)
  # @return [Boolean] True if token type is 'access'
  def valid_access_token?
    decoded_token&.dig('type') == 'access'
  end

  # Handle record not found errors
  def record_not_found(exception)
    render json: { error: exception.message }, status: :not_found
  end

  # Handle record invalid errors
  def record_invalid(exception)
    render json: { errors: exception.record.errors.full_messages }, status: :unprocessable_entity
  end
end
