import todoService from './todoService';
import api from './api';

jest.mock('./api');

describe('todoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTodos', () => {
    it('fetches all todos without filter', async () => {
      const mockTodos = [
        { id: 1, name: 'Todo 1', priority: 'high' },
        { id: 2, name: 'Todo 2', priority: 'medium' },
      ];
      api.get.mockResolvedValue({ data: { todos: mockTodos } });

      const todos = await todoService.fetchTodos();

      expect(api.get).toHaveBeenCalledWith('/todos', { params: {} });
      expect(todos).toEqual(mockTodos);
    });

    it('fetches todos with priority filter', async () => {
      const mockTodos = [{ id: 1, name: 'High Priority Todo', priority: 'high' }];
      api.get.mockResolvedValue({ data: { todos: mockTodos } });

      const todos = await todoService.fetchTodos('high');

      expect(api.get).toHaveBeenCalledWith('/todos', { params: { priority: 'high' } });
      expect(todos).toEqual(mockTodos);
    });

    it('throws error when fetch fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Network error');
      api.get.mockRejectedValue(error);

      await expect(todoService.fetchTodos()).rejects.toThrow('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Fetch todos error:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('createTodo', () => {
    it('creates a new todo', async () => {
      const todoData = {
        name: 'New Todo',
        priority: 'high',
        deadline: '2025-12-31',
      };
      const createdTodo = { id: 1, ...todoData };
      api.post.mockResolvedValue({ data: { todo: createdTodo } });

      const result = await todoService.createTodo(todoData);

      expect(api.post).toHaveBeenCalledWith('/todos', { todo: todoData });
      expect(result).toEqual(createdTodo);
    });

    it('throws error when create fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Validation error');
      api.post.mockRejectedValue(error);

      await expect(todoService.createTodo({})).rejects.toThrow('Validation error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Create todo error:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateTodo', () => {
    it('updates an existing todo', async () => {
      const todoData = { name: 'Updated Todo', priority: 'medium' };
      const updatedTodo = { id: 1, ...todoData };
      api.patch.mockResolvedValue({ data: { todo: updatedTodo } });

      const result = await todoService.updateTodo(1, todoData);

      expect(api.patch).toHaveBeenCalledWith('/todos/1', { todo: todoData });
      expect(result).toEqual(updatedTodo);
    });

    it('throws error when update fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Not found');
      api.patch.mockRejectedValue(error);

      await expect(todoService.updateTodo(999, {})).rejects.toThrow('Not found');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Update todo error:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteTodo', () => {
    it('deletes a todo', async () => {
      api.delete.mockResolvedValue({});

      await todoService.deleteTodo(1);

      expect(api.delete).toHaveBeenCalledWith('/todos/1');
    });

    it('throws error when delete fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Not found');
      api.delete.mockRejectedValue(error);

      await expect(todoService.deleteTodo(999)).rejects.toThrow('Not found');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Delete todo error:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('toggleComplete', () => {
    it('toggles todo completion to true', async () => {
      const updatedTodo = { id: 1, name: 'Todo 1', completed: true };
      api.patch.mockResolvedValue({ data: { todo: updatedTodo } });

      const result = await todoService.toggleComplete(1, true);

      expect(api.patch).toHaveBeenCalledWith('/todos/1', { todo: { completed: true } });
      expect(result).toEqual(updatedTodo);
    });

    it('toggles todo completion to false', async () => {
      const updatedTodo = { id: 1, name: 'Todo 1', completed: false };
      api.patch.mockResolvedValue({ data: { todo: updatedTodo } });

      const result = await todoService.toggleComplete(1, false);

      expect(api.patch).toHaveBeenCalledWith('/todos/1', { todo: { completed: false } });
      expect(result).toEqual(updatedTodo);
    });
  });
});
