# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V1::AuthController, type: :controller do
  let(:user) { create(:user) }
  let(:frontend_url) { ENV.fetch('REACT_APP_FRONTEND_URL', 'http://localhost:3001') }

  describe 'GET #google_login' do
    it 'redirects to Google OAuth' do
      get :google_login
      expect(response).to redirect_to('/auth/google_oauth2')
    end
  end

  describe 'GET #google_oauth2_callback' do
    let(:auth_hash) do
      {
        'uid' => 'google_123',
        'info' => {
          'email' => 'test@example.com',
          'name' => 'Test User'
        }
      }
    end

    before do
      allow(ENV).to receive(:fetch).with('REACT_APP_FRONTEND_URL', anything).and_return(frontend_url)
    end

    context 'when auth_hash is present' do
      before do
        request.env['omniauth.auth'] = auth_hash
      end

      context 'when user is created successfully' do
        it 'redirects to frontend with access token in URL fragment' do
          get :google_oauth2_callback
          expect(response).to redirect_to(%r{#{frontend_url}/auth/callback#access_token=})
        end

        it 'sets refresh token cookie' do
          get :google_oauth2_callback
          expect(cookies.signed[:refresh_token]).to be_present
        end

        it 'creates a new user' do
          expect do
            get :google_oauth2_callback
          end.to change(User, :count).by(1)
        end
      end

      context 'when user creation fails' do
        before do
          allow(GoogleOauthService).to receive(:find_or_create_from_oauth).and_return(User.new)
        end

        it 'redirects to login with error' do
          get :google_oauth2_callback
          expect(response).to redirect_to("#{frontend_url}/login?error=user_creation_failed")
        end
      end
    end

    context 'when auth_hash is missing' do
      before do
        request.env['omniauth.auth'] = nil
      end

      it 'redirects to login with error' do
        get :google_oauth2_callback
        expect(response).to redirect_to("#{frontend_url}/login?error=authentication_failed")
      end
    end

    context 'when an exception occurs' do
      before do
        request.env['omniauth.auth'] = auth_hash
        allow(GoogleOauthService).to receive(:find_or_create_from_oauth).and_raise(StandardError.new('Test error'))
      end

      it 'redirects to login with server error' do
        get :google_oauth2_callback
        expect(response).to redirect_to("#{frontend_url}/login?error=server_error")
      end
    end
  end

  describe 'POST #refresh' do
    let(:refresh_token) { JwtService.encode_refresh_token(user.id) }

    context 'when refresh token is valid' do
      before do
        cookies.signed[:refresh_token] = refresh_token
      end

      it 'returns new access token' do
        post :refresh
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json['access_token']).to be_present
      end

      it 'returns user data' do
        post :refresh
        json = response.parsed_body
        expect(json['user']['id']).to eq(user.id)
        expect(json['user']['email']).to eq(user.email)
      end

      it 'sets new refresh token cookie' do
        post :refresh
        # Check that a new cookie was set in the response
        expect(response.cookies['refresh_token']).to be_present
      end
    end

    context 'when refresh token is missing' do
      it 'returns unauthorized' do
        post :refresh
        expect(response).to have_http_status(:unauthorized)
        json = response.parsed_body
        expect(json['error']).to eq('Refresh token not found')
      end
    end

    context 'when refresh token is invalid' do
      before do
        cookies.signed[:refresh_token] = 'invalid.token.here'
      end

      it 'returns unauthorized' do
        post :refresh
        expect(response).to have_http_status(:unauthorized)
        json = response.parsed_body
        expect(json['error']).to eq('Invalid refresh token')
      end
    end

    context 'when user does not exist' do
      before do
        cookies.signed[:refresh_token] = JwtService.encode_refresh_token(99_999)
      end

      it 'returns unauthorized' do
        post :refresh
        expect(response).to have_http_status(:unauthorized)
        json = response.parsed_body
        expect(json['error']).to eq('User not found')
      end
    end
  end

  describe 'DELETE #sign_out' do
    let(:access_token) { JwtService.encode_access_token(user.id) }

    before do
      request.headers['Authorization'] = "Bearer #{access_token}"
      cookies.signed[:refresh_token] = JwtService.encode_refresh_token(user.id)
    end

    it 'returns success status' do
      delete :sign_out
      expect(response).to have_http_status(:ok)
    end

    it 'instructs browser to delete refresh token cookie' do
      delete :sign_out
      # Check that the cookie was marked for deletion (value is empty string or similar)
      expect(response.cookies['refresh_token']).to be_blank
    end
  end

  describe 'GET #current_user' do
    let(:access_token) { JwtService.encode_access_token(user.id) }

    context 'when authenticated' do
      before do
        request.headers['Authorization'] = "Bearer #{access_token}"
      end

      it 'returns current user data' do
        get :current_user
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json['user']['id']).to eq(user.id)
        expect(json['user']['email']).to eq(user.email)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        get :current_user
        expect(response).to have_http_status(:unauthorized)
        json = response.parsed_body
        expect(json['error']).to eq('Not authenticated')
      end
    end
  end
end
