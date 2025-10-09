# frozen_string_literal: true

class GoogleOauthService
  def self.find_or_create_from_oauth(auth_hash)
    google_id = auth_hash['uid']
    email = auth_hash['info']['email']
    name = auth_hash['info']['name']

    user = User.find_by(google_id: google_id)

    if user
      # Update user info if it has changed
      user.update(email: email, name: name)
      user
    else
      # Create new user
      User.create(
        google_id: google_id,
        email: email,
        name: name
      )
    end
  rescue StandardError => e
    Rails.logger.error("GoogleOauthService error: #{e.message}")
    User.new # Return unsaved user to trigger error handling
  end
end
