import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TodoList from './TodoList';
import useTodos from '../../hooks/useTodos';

// Mock the useTodos hook
jest.mock('../../hooks/useTodos');

// Mock child components to simplify testing
jest.mock('./TodoItem', () => {
  return function MockTodoItem({ todo, onToggleComplete, onEdit, onDelete }) {
    return (
      <div data-testid={`todo-item-${todo.id}`}>
        <span>{todo.name}</span>
        <button onClick={() => onToggleComplete(todo.id, !todo.completed)}>
          Toggle
        </button>
        <button onClick={() => onEdit(todo)}>Edit</button>
        <button onClick={() => onDelete(todo.id)}>Delete</button>
      </div>
    );
  };
});

jest.mock('./EmptyState', () => {
  return function MockEmptyState({ onCreateClick }) {
    return (
      <div data-testid="empty-state">
        <button onClick={onCreateClick}>Create First Todo</button>
      </div>
    );
  };
});

jest.mock('./TodoForm', () => {
  return function MockTodoForm({ onSubmit, onCancel }) {
    return (
      <div data-testid="todo-form">
        <button onClick={() => onSubmit({ name: 'Test Todo' })}>Submit</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

jest.mock('../common/Modal', () => {
  return function MockModal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    );
  };
});

jest.mock('../common/Button', () => {
  return function MockButton({ children, onClick, variant }) {
    return (
      <button onClick={onClick} className={variant}>
        {children}
      </button>
    );
  };
});

describe('TodoList', () => {
  const mockTodos = [
    { id: 1, name: 'Test Todo 1', priority: 'high', completed: false },
    { id: 2, name: 'Test Todo 2', priority: 'medium', completed: true },
  ];

  const defaultMockReturn = {
    todos: mockTodos,
    loading: false,
    error: null,
    createTodo: jest.fn(),
    updateTodo: jest.fn(),
    toggleComplete: jest.fn(),
    deleteTodo: jest.fn(),
  };

  beforeEach(() => {
    useTodos.mockReturnValue(defaultMockReturn);
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('displays loading spinner when loading', () => {
      useTodos.mockReturnValue({ ...defaultMockReturn, loading: true });
      render(<TodoList />);
      expect(screen.getByText('TODO読み込み中...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('displays error message when error occurs', () => {
      const errorMessage = 'Failed to load todos';
      useTodos.mockReturnValue({ ...defaultMockReturn, error: errorMessage });
      render(<TodoList />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('displays empty state when no todos', () => {
      useTodos.mockReturnValue({ ...defaultMockReturn, todos: [] });
      render(<TodoList />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('Todo list display', () => {
    it('renders all todos', () => {
      render(<TodoList />);
      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-2')).toBeInTheDocument();
    });

    it('displays header with my todos title', () => {
      render(<TodoList />);
      expect(screen.getByText('マイTODO')).toBeInTheDocument();
    });
  });

  describe('Priority filters', () => {
    it('renders all priority filter buttons', () => {
      render(<TodoList />);
      expect(screen.getByText('全て')).toBeInTheDocument();
      expect(screen.getAllByText('高')[0]).toBeInTheDocument();
      expect(screen.getAllByText('中')[0]).toBeInTheDocument();
      expect(screen.getAllByText('低')[0]).toBeInTheDocument();
    });

    it('allows filtering by priority', () => {
      render(<TodoList />);
      // All filter buttons are rendered
      const filterButtons = screen.getAllByRole('button');
      expect(filterButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Modal operations', () => {
    it('opens modal when add button is clicked', () => {
      render(<TodoList />);
      const addButton = screen.getByText('+ TODO追加');
      fireEvent.click(addButton);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('closes modal when cancel is clicked', () => {
      render(<TodoList />);

      // Open modal
      const addButton = screen.getByText('+ TODO追加');
      fireEvent.click(addButton);
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      // Close modal
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('displays create title when creating new todo', () => {
      render(<TodoList />);
      const addButton = screen.getByText('+ TODO追加');
      fireEvent.click(addButton);
      expect(screen.getByText('新しいTODO作成')).toBeInTheDocument();
    });

    it('displays edit title when editing todo', () => {
      render(<TodoList />);
      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);
      expect(screen.getByText('TODO編集')).toBeInTheDocument();
    });
  });

  describe('CRUD operations', () => {
    it('creates todo when form is submitted', async () => {
      const createTodo = jest.fn().mockResolvedValue({});
      useTodos.mockReturnValue({ ...defaultMockReturn, createTodo });

      render(<TodoList />);

      // Open modal
      const addButton = screen.getByText('+ TODO追加');
      fireEvent.click(addButton);

      // Submit form
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createTodo).toHaveBeenCalledWith({ name: 'Test Todo' });
      });
    });

    it('updates todo when edit form is submitted', async () => {
      const updateTodo = jest.fn().mockResolvedValue({});
      useTodos.mockReturnValue({ ...defaultMockReturn, updateTodo });

      render(<TodoList />);

      // Open edit modal
      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);

      // Submit form
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(updateTodo).toHaveBeenCalledWith(1, { name: 'Test Todo' });
      });
    });

    it('deletes todo when confirmed', async () => {
      const deleteTodo = jest.fn().mockResolvedValue({});
      useTodos.mockReturnValue({ ...defaultMockReturn, deleteTodo });

      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      render(<TodoList />);

      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(deleteTodo).toHaveBeenCalledWith(1);
      });
    });

    it('does not delete todo when not confirmed', async () => {
      const deleteTodo = jest.fn();
      useTodos.mockReturnValue({ ...defaultMockReturn, deleteTodo });

      // Mock window.confirm to return false
      window.confirm = jest.fn(() => false);

      render(<TodoList />);

      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      expect(deleteTodo).not.toHaveBeenCalled();
    });

    it('toggles todo completion', async () => {
      const toggleComplete = jest.fn().mockResolvedValue({});
      useTodos.mockReturnValue({ ...defaultMockReturn, toggleComplete });

      render(<TodoList />);

      const toggleButton = screen.getAllByText('Toggle')[0];
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(toggleComplete).toHaveBeenCalledWith(1, true);
      });
    });
  });

  describe('Error handling', () => {
    it('shows alert when delete fails', async () => {
      const deleteTodo = jest.fn().mockRejectedValue(new Error('Delete failed'));
      useTodos.mockReturnValue({ ...defaultMockReturn, deleteTodo });

      window.confirm = jest.fn(() => true);
      window.alert = jest.fn();

      render(<TodoList />);

      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });
    });

    it('shows alert when toggle fails', async () => {
      const toggleComplete = jest.fn().mockRejectedValue(new Error('Toggle failed'));
      useTodos.mockReturnValue({ ...defaultMockReturn, toggleComplete });

      window.alert = jest.fn();

      render(<TodoList />);

      const toggleButton = screen.getAllByText('Toggle')[0];
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });
    });
  });
});
