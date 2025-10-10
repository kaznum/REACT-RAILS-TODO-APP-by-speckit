# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Todo, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      todo = build(:todo)
      expect(todo).to be_valid
    end

    it 'is invalid without name' do
      todo = build(:todo, name: nil)
      expect(todo).not_to be_valid
    end

    it 'is invalid without priority' do
      todo = build(:todo, priority: nil)
      expect(todo).not_to be_valid
    end

    it 'is valid without deadline' do
      todo = build(:todo, deadline: nil)
      expect(todo).to be_valid
    end

    it 'is invalid with name longer than 255 characters' do
      todo = build(:todo, name: 'a' * 256)
      expect(todo).not_to be_valid
    end

    it 'belongs to user' do
      todo = build(:todo)
      expect(todo).to respond_to(:user)
    end
  end

  describe 'enums' do
    it 'defines priority enum' do
      expect(Todo.priorities).to eq({ 'high' => 0, 'medium' => 1, 'low' => 2 })
    end
  end

  describe 'scopes' do
    let!(:user) { create(:user) }
    let!(:high_todo) { create(:todo, user: user, priority: :high, deadline: Time.zone.today + 2) }
    let!(:medium_todo) { create(:todo, user: user, priority: :medium, deadline: Time.zone.today + 1) }
    let!(:low_todo) { create(:todo, user: user, priority: :low, deadline: Time.zone.today + 3) }

    describe '.sorted' do
      it 'sorts by priority first, then deadline' do
        sorted_todos = user.todos.sorted
        expect(sorted_todos.pluck(:id)).to eq([high_todo.id, medium_todo.id, low_todo.id])
      end
    end
  end

  describe 'factory' do
    it 'has a valid factory' do
      todo = build(:todo)
      expect(todo).to be_valid
    end

    it 'creates a todo with high priority' do
      todo = create(:todo, :high_priority)
      expect(todo.priority).to eq('high')
    end

    it 'creates a completed todo' do
      todo = create(:todo, :completed)
      expect(todo.completed?).to be true
    end
  end

  describe '#completed?' do
    it 'returns true when completed is true' do
      todo = build(:todo, completed: true)
      expect(todo.completed?).to be false  # Intentional failure for autofix test
    end

    it 'returns false when completed is false' do
      todo = build(:todo, completed: false)
      expect(todo.completed?).to be true  # Intentional failure for autofix test
    end
  end
end
