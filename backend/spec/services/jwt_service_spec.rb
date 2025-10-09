# frozen_string_literal: true

require 'rails_helper'

RSpec.describe JwtService do
  let(:user_id) { 123 }

  describe '.encode_access_token' do
    it 'generates a valid JWT token' do
      token = described_class.encode_access_token(user_id)
      expect(token).to be_a(String)
      expect(token.split('.').length).to eq(3) # JWT format: header.payload.signature
    end

    it 'includes user_id in payload' do
      token = described_class.encode_access_token(user_id)
      decoded = described_class.decode_token(token)
      expect(decoded['user_id']).to eq(user_id)
    end

    it 'includes exp (expiration) in payload' do
      token = described_class.encode_access_token(user_id)
      decoded = described_class.decode_token(token)
      expect(decoded['exp']).to be_present
      expect(decoded['exp']).to be > Time.now.to_i
    end

    it 'sets expiration to ACCESS_TOKEN_EXPIRATION' do
      token = described_class.encode_access_token(user_id)
      decoded = described_class.decode_token(token)
      expected_exp = Time.now.to_i + JwtConfig::ACCESS_TOKEN_EXPIRATION
      expect(decoded['exp']).to be_within(5).of(expected_exp)
    end
  end

  describe '.encode_refresh_token' do
    it 'generates a valid JWT token' do
      token = described_class.encode_refresh_token(user_id)
      expect(token).to be_a(String)
      expect(token.split('.').length).to eq(3)
    end

    it 'includes user_id in payload' do
      token = described_class.encode_refresh_token(user_id)
      decoded = described_class.decode_token(token)
      expect(decoded['user_id']).to eq(user_id)
    end

    it 'sets expiration to REFRESH_TOKEN_EXPIRATION' do
      token = described_class.encode_refresh_token(user_id)
      decoded = described_class.decode_token(token)
      expected_exp = Time.now.to_i + JwtConfig::REFRESH_TOKEN_EXPIRATION
      expect(decoded['exp']).to be_within(5).of(expected_exp)
    end
  end

  describe '.decode_token' do
    it 'decodes a valid token' do
      token = described_class.encode_access_token(user_id)
      decoded = described_class.decode_token(token)
      expect(decoded).to be_a(Hash)
      expect(decoded['user_id']).to eq(user_id)
    end

    it 'returns nil for invalid token' do
      decoded = described_class.decode_token('invalid.token.here')
      expect(decoded).to be_nil
    end

    it 'returns nil for expired token' do
      # Create token with negative expiration (already expired)
      payload = {
        user_id: user_id,
        exp: 1.hour.ago.to_i
      }
      expired_token = JWT.encode(payload, JwtConfig::JWT_SECRET, JwtConfig::ALGORITHM)
      decoded = described_class.decode_token(expired_token)
      expect(decoded).to be_nil
    end

    it 'returns nil for nil token' do
      decoded = described_class.decode_token(nil)
      expect(decoded).to be_nil
    end

    it 'returns nil for empty token' do
      decoded = described_class.decode_token('')
      expect(decoded).to be_nil
    end
  end

  describe 'token interoperability' do
    it 'access and refresh tokens use the same secret' do
      access_token = described_class.encode_access_token(user_id)
      refresh_token = described_class.encode_refresh_token(user_id)

      access_decoded = described_class.decode_token(access_token)
      refresh_decoded = described_class.decode_token(refresh_token)

      expect(access_decoded['user_id']).to eq(refresh_decoded['user_id'])
    end
  end
end
