# frozen_string_literal: true

class AddIndexes < ActiveRecord::Migration[7.1]
  def change
    # Index on user_id for efficient user-based queries
    add_index :todos, :user_id unless index_exists?(:todos, :user_id)

    # Composite index for sorting todos by priority and deadline
    add_index :todos, [:user_id, :priority, :deadline], name: 'index_todos_on_user_priority_deadline'

    # Index for ordering by creation time
    add_index :todos, [:user_id, :created_at], name: 'index_todos_on_user_created_at'
  end
end
