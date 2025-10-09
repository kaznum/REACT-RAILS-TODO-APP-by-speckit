import { useState, useEffect, useCallback } from 'react';
import todoService from '../services/todoService';
import { MESSAGES } from '../constants/messages';

const useTodos = (priorityFilter = null) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch todos from API
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoService.fetchTodos(priorityFilter);
      setTodos(data);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
      setError(MESSAGES.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [priorityFilter]);

  // Load todos on mount and when priority filter changes
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Create a new todo
  const createTodo = async (todoData) => {
    try {
      const newTodo = await todoService.createTodo(todoData);
      // Re-fetch the list to get proper sorting from backend
      await fetchTodos();
      return newTodo;
    } catch (err) {
      console.error('Failed to create todo:', err);
      throw err;
    }
  };

  // Update an existing todo
  const updateTodo = async (id, todoData) => {
    try {
      const updatedTodo = await todoService.updateTodo(id, todoData);
      // Re-fetch the list to get proper sorting from backend
      await fetchTodos();
      return updatedTodo;
    } catch (err) {
      console.error('Failed to update todo:', err);
      throw err;
    }
  };

  // Delete a todo
  const deleteTodo = async (id) => {
    try {
      await todoService.deleteTodo(id);
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    } catch (err) {
      console.error('Failed to delete todo:', err);
      throw err;
    }
  };

  // Toggle todo completed status
  const toggleComplete = async (id, completed) => {
    try {
      const updatedTodo = await todoService.toggleComplete(id, completed);
      // Update local state immediately for better UX, but don't re-fetch
      // (completion status doesn't affect sorting)
      setTodos((prevTodos) =>
        prevTodos.map((todo) => (todo.id === id ? updatedTodo : todo))
      );
      return updatedTodo;
    } catch (err) {
      console.error('Failed to toggle todo:', err);
      throw err;
    }
  };

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    refetch: fetchTodos
  };
};

export default useTodos;
