# frozen_string_literal: true

class Todo < ApplicationRecord
  # Associations
  belongs_to :user

  # Enums
  # Priority levels: high (0), medium (1), low (2)
  enum :priority, { high: 0, medium: 1, low: 2 }

  # Validations
  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :priority, presence: true, inclusion: { in: priorities.keys }
  validate :deadline_format

  # Scopes
  # Sort by priority (ASC), deadline (ASC), created_at (ASC)
  scope :sorted, -> { order(priority: :asc, deadline: :asc, created_at: :asc) }
  scope :completed, -> { where(completed: 1) }
  scope :active, -> { where(completed: 0) }

  # Instance methods
  def completed?
    completed == 1
  end

  def mark_as_completed
    update(completed: 1)
  end

  def mark_as_active
    update(completed: 0)
  end

  private

  # Validate deadline format (YYYY-MM-DD)
  def deadline_format
    return if deadline.blank?

    unless deadline.match?(/^\d{4}-\d{2}-\d{2}$/)
      errors.add(:deadline, 'must be in YYYY-MM-DD format')
      return
    end

    begin
      Date.parse(deadline)
    rescue ArgumentError
      errors.add(:deadline, 'is not a valid date')
    end
  end
end
