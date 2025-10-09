import api from './api';

const todoService = {
  /**
   * Fetch all todos for the current user
   * @param {string} priority - Optional priority filter ('high', 'medium', 'low')
   * @returns {Promise<Array>} - Array of todo objects
   */
  async fetchTodos(priority = null) {
    try {
      const params = priority ? { priority } : {};
      const response = await api.get('/todos', { params });
      return response.data.todos;
    } catch (error) {
      console.error('Fetch todos error:', error);
      throw error;
    }
  },

  /**
   * Create a new todo
   * @param {Object} todoData - Todo data {name, priority, deadline}
   * @returns {Promise<Object>} - Created todo object
   */
  async createTodo(todoData) {
    try {
      const response = await api.post('/todos', { todo: todoData });
      return response.data.todo;
    } catch (error) {
      console.error('Create todo error:', error);
      throw error;
    }
  },

  /**
   * Update an existing todo
   * @param {number} id - Todo ID
   * @param {Object} todoData - Updated todo data
   * @returns {Promise<Object>} - Updated todo object
   */
  async updateTodo(id, todoData) {
    try {
      const response = await api.patch(`/todos/${id}`, { todo: todoData });
      return response.data.todo;
    } catch (error) {
      console.error('Update todo error:', error);
      throw error;
    }
  },

  /**
   * Delete a todo
   * @param {number} id - Todo ID
   * @returns {Promise<void>}
   */
  async deleteTodo(id) {
    try {
      await api.delete(`/todos/${id}`);
    } catch (error) {
      console.error('Delete todo error:', error);
      throw error;
    }
  },

  /**
   * Toggle todo completed status
   * @param {number} id - Todo ID
   * @param {boolean} completed - New completed status
   * @returns {Promise<Object>} - Updated todo object
   */
  async toggleComplete(id, completed) {
    return this.updateTodo(id, { completed });
  }
};

export default todoService;
