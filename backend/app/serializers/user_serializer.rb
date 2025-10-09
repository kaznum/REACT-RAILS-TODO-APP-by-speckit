# frozen_string_literal: true

class UserSerializer
  def initialize(user)
    @user = user
  end

  def as_json
    {
      id: @user.id,
      email: @user.email,
      name: @user.name,
      google_id: @user.google_id,
      created_at: @user.created_at,
      updated_at: @user.updated_at
    }
  end

  def self.serialize(user)
    new(user).as_json
  end
end
