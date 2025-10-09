# frozen_string_literal: true

module Api
  module V1
    class TodosController < ApplicationController
      # GET /api/v1/todos
      def index
        # Get todos for current user
        todos = current_user.todos

        # Apply priority filter if provided
        todos = todos.where(priority: params[:priority]) if params[:priority].present?

        # Sort by priority (high=0, medium=1, low=2), then by deadline (ascending)
        # Priority is already stored as integer, so we can sort directly
        todos = todos.order(priority: :asc, deadline: :asc, created_at: :desc)

        render json: {
          todos: todos.map { |todo| TodoSerializer.serialize(todo) }
        }, status: :ok
      end

      # POST /api/v1/todos
      def create
        todo = current_user.todos.build(todo_params)

        if todo.save
          render json: {
            todo: TodoSerializer.serialize(todo)
          }, status: :created
        else
          render json: {
            errors: todo.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/todos/:id
      def update
        todo = current_user.todos.find(params[:id])

        if todo.update(todo_params)
          render json: {
            todo: TodoSerializer.serialize(todo)
          }, status: :ok
        else
          render json: {
            errors: todo.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/todos/:id
      def destroy
        todo = current_user.todos.find(params[:id])
        todo.destroy

        render json: {
          message: 'Todo deleted successfully'
        }, status: :ok
      end

      private

      def todo_params
        params.require(:todo).permit(:name, :priority, :deadline, :completed)
      end
    end
  end
end
