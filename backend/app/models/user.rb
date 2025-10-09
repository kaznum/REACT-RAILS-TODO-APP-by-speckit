# frozen_string_literal: true

class User < ApplicationRecord
  # Associations
  has_many :todos, dependent: :destroy

  # Validations
  validates :google_id, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true

  # Find or create user from OAuth data
  # @param auth_hash [Hash] The OAuth authentication hash from Google
  # @return [User] The found or created user
  def self.from_omniauth(auth_hash)
    where(google_id: auth_hash['uid']).first_or_create do |user|
      user.email = auth_hash.dig('info', 'email')
      user.name = auth_hash.dig('info', 'name')
    end
  end
end
