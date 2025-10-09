# frozen_string_literal: true

class TodoSerializer
  def initialize(todo)
    @todo = todo
  end

  def as_json
    {
      id: @todo.id,
      user_id: @todo.user_id,
      name: @todo.name,
      priority: @todo.priority,
      deadline: @todo.deadline,
      completed: @todo.completed,
      created_at: @todo.created_at,
      updated_at: @todo.updated_at
    }
  end

  def self.serialize(todo)
    new(todo).as_json
  end

  def self.serialize_collection(todos)
    todos.map { |todo| new(todo).as_json }
  end
end
