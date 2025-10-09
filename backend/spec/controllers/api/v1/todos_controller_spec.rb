# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V1::TodosController, type: :controller do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:access_token) { JwtService.encode_access_token(user.id) }

  before do
    request.headers['Authorization'] = "Bearer #{access_token}"
  end

  describe 'GET #index' do
    let!(:user_todos) { create_list(:todo, 3, user: user) }
    let!(:other_user_todos) { create_list(:todo, 2, user: other_user) }

    it 'returns todos for the current user only' do
      get :index
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json['todos'].length).to eq(user.todos.count)
    end

    it 'filters todos by priority' do
      high_todo = create(:todo, :high_priority, user: user)
      get :index, params: { priority: 'high' }
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json['todos'].length).to eq(1)
      expect(json['todos'].first['id']).to eq(high_todo.id)
    end

    it 'sorts todos by priority and deadline' do
      # Clean up any existing todos first
      user.todos.destroy_all

      high_todo = create(:todo, priority: :high, deadline: Time.zone.today + 2, user: user)
      medium_todo = create(:todo, priority: :medium, deadline: Time.zone.today + 1, user: user)
      low_todo = create(:todo, priority: :low, deadline: Time.zone.today + 3, user: user)

      get :index
      json = response.parsed_body
      ids = json['todos'].pluck('id')
      expect(ids).to eq([high_todo.id, medium_todo.id, low_todo.id])
    end

    it 'returns 401 without authentication' do
      request.headers['Authorization'] = nil
      get :index
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'POST #create' do
    let(:valid_attributes) do
      {
        name: 'New Todo',
        priority: 'high',
        deadline: Time.zone.today + 7,
        completed: false
      }
    end

    it 'creates a new todo' do
      expect do
        post :create, params: { todo: valid_attributes }
      end.to change(Todo, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it 'associates the todo with the current user' do
      post :create, params: { todo: valid_attributes }
      json = response.parsed_body
      expect(json['todo']['user_id']).to eq(user.id)
    end

    it 'returns validation errors for invalid data' do
      post :create, params: { todo: { name: '' } }
      expect(response).to have_http_status(:unprocessable_entity)
      json = response.parsed_body
      expect(json['errors']).to be_present
    end
  end

  describe 'PATCH #update' do
    let(:todo) { create(:todo, user: user) }

    it 'updates the todo' do
      patch :update, params: { id: todo.id, todo: { name: 'Updated Name' } }
      expect(response).to have_http_status(:ok)
      expect(todo.reload.name).to eq('Updated Name')
    end

    it 'returns validation errors for invalid data' do
      patch :update, params: { id: todo.id, todo: { name: '' } }
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'returns 404 for non-existent todo' do
      patch :update, params: { id: 99_999, todo: { name: 'Test' } }
      expect(response).to have_http_status(:not_found)
    end

    it 'cannot update another user\'s todo' do
      other_todo = create(:todo, user: other_user)
      patch :update, params: { id: other_todo.id, todo: { name: 'Hacked' } }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'DELETE #destroy' do
    let!(:todo) { create(:todo, user: user) }

    it 'deletes the todo' do
      expect do
        delete :destroy, params: { id: todo.id }
      end.to change(Todo, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end

    it 'cannot delete another user\'s todo' do
      other_todo = create(:todo, user: other_user)
      delete :destroy, params: { id: other_todo.id }
      expect(response).to have_http_status(:not_found)
    end
  end
end
