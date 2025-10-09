# frozen_string_literal: true

class JwtService
  class << self
    # Encode an access token with user information
    # @param user_id [Integer] The user's ID
    # @return [String] The encoded JWT token
    def encode_access_token(user_id)
      payload = {
        user_id: user_id,
        exp: (Time.zone.now + JwtConfig::ACCESS_TOKEN_EXPIRATION).to_i,
        iat: Time.now.to_i,
        type: 'access'
      }
      encode(payload)
    end

    # Encode a refresh token with user information
    # @param user_id [Integer] The user's ID
    # @return [String] The encoded JWT token
    def encode_refresh_token(user_id)
      payload = {
        user_id: user_id,
        exp: (Time.zone.now + JwtConfig::REFRESH_TOKEN_EXPIRATION).to_i,
        iat: Time.now.to_i,
        type: 'refresh'
      }
      encode(payload)
    end

    # Decode a JWT token
    # @param token [String] The JWT token to decode
    # @return [Hash, nil] The decoded payload or nil if invalid/expired
    def decode_token(token)
      decoded = JWT.decode(
        token,
        JwtConfig::JWT_SECRET,
        true,
        { algorithm: JwtConfig::ALGORITHM }
      )
      decoded[0] # Return the payload (first element of the array)
    rescue JWT::DecodeError => e
      Rails.logger.error "JWT Decode Error: #{e.message}"
      nil
    rescue JWT::ExpiredSignature => e
      Rails.logger.error "JWT Expired: #{e.message}"
      nil
    end

    # Verify if a token is valid and not expired
    # @param token [String] The JWT token to verify
    # @return [Boolean] True if valid, false otherwise
    def valid_token?(token)
      decode_token(token).present?
    end

    # Extract user_id from a token
    # @param token [String] The JWT token
    # @return [Integer, nil] The user_id or nil if invalid
    def user_id_from_token(token)
      payload = decode_token(token)
      payload&.dig('user_id')
    end

    private

    # Encode a payload into a JWT token
    # @param payload [Hash] The payload to encode
    # @return [String] The encoded JWT token
    def encode(payload)
      JWT.encode(payload, JwtConfig::JWT_SECRET, JwtConfig::ALGORITHM)
    end
  end
end
