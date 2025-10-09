# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    sequence(:google_id) { |n| "google_id_#{n}" }
    sequence(:email) { |n| "user#{n}@example.com" }
    name { 'Test User' }

    trait :with_todos do
      after(:create) do |user|
        create_list(:todo, 3, user: user)
      end
    end
  end
end
