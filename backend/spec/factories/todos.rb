# frozen_string_literal: true

FactoryBot.define do
  factory :todo do
    association :user
    sequence(:name) { |n| "Todo #{n}" }
    priority { :medium }
    deadline { Time.zone.today + 7.days }
    completed { false }

    trait :high_priority do
      priority { :high }
    end

    trait :low_priority do
      priority { :low }
    end

    trait :completed do
      completed { true }
    end

    trait :overdue do
      deadline { Date.yesterday }
    end
  end
end
