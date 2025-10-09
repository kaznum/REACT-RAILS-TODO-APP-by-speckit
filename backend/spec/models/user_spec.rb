# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      user = build(:user)
      expect(user).to be_valid
    end

    it 'is invalid without google_id' do
      user = build(:user, google_id: nil)
      expect(user).not_to be_valid
    end

    it 'is invalid without email' do
      user = build(:user, email: nil)
      expect(user).not_to be_valid
    end

    it 'is invalid without name' do
      user = build(:user, name: nil)
      expect(user).not_to be_valid
    end

    it 'is invalid with duplicate google_id' do
      create(:user, google_id: 'duplicate')
      user = build(:user, google_id: 'duplicate')
      expect(user).not_to be_valid
    end

    it 'is invalid with duplicate email' do
      create(:user, email: 'duplicate@example.com')
      user = build(:user, email: 'duplicate@example.com')
      expect(user).not_to be_valid
    end
  end

  describe 'associations' do
    it 'has many todos' do
      user = create(:user)
      expect(user).to respond_to(:todos)
    end
  end

  describe 'factory' do
    it 'has a valid factory' do
      user = build(:user)
      expect(user).to be_valid
    end

    it 'creates a user with todos' do
      user = create(:user, :with_todos)
      expect(user.todos.count).to eq(3)
    end
  end

  describe '#destroy' do
    it 'destroys associated todos' do
      user = create(:user, :with_todos)
      expect { user.destroy }.to change { Todo.count }.by(-3)
    end
  end
end
