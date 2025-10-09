# frozen_string_literal: true

require 'rails_helper'

RSpec.describe GoogleOauthService do
  let(:auth_hash) do
    {
      'uid' => 'google_123',
      'info' => {
        'email' => 'test@example.com',
        'name' => 'Test User'
      }
    }
  end

  describe '.find_or_create_from_oauth' do
    context 'when user does not exist' do
      it 'creates a new user' do
        expect do
          described_class.find_or_create_from_oauth(auth_hash)
        end.to change(User, :count).by(1)
      end

      it 'creates user with correct attributes' do
        user = described_class.find_or_create_from_oauth(auth_hash)
        expect(user.google_id).to eq('google_123')
        expect(user.email).to eq('test@example.com')
        expect(user.name).to eq('Test User')
      end

      it 'persists the user' do
        user = described_class.find_or_create_from_oauth(auth_hash)
        expect(user).to be_persisted
      end
    end

    context 'when user already exists' do
      let!(:existing_user) do
        create(:user,
               google_id: 'google_123',
               email: 'old@example.com',
               name: 'Old Name')
      end

      it 'does not create a new user' do
        expect do
          described_class.find_or_create_from_oauth(auth_hash)
        end.not_to change(User, :count)
      end

      it 'returns the existing user' do
        user = described_class.find_or_create_from_oauth(auth_hash)
        expect(user.id).to eq(existing_user.id)
      end

      it 'updates user email and name' do
        user = described_class.find_or_create_from_oauth(auth_hash)
        expect(user.email).to eq('test@example.com')
        expect(user.name).to eq('Test User')
      end
    end

    context 'with error handling' do
      it 'returns unsaved user on exception' do
        allow(User).to receive(:find_by).and_raise(StandardError.new('Database error'))
        user = described_class.find_or_create_from_oauth(auth_hash)
        expect(user).to be_a(User)
        expect(user).not_to be_persisted
      end
    end
  end
end
