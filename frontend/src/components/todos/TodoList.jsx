import React, { useState } from 'react';
import useTodos from '../../hooks/useTodos';
import TodoItem from './TodoItem';
import EmptyState from './EmptyState';
import TodoForm from './TodoForm';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { MESSAGES } from '../../constants/messages';
import './TodoList.css';

const TodoList = () => {
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const { todos, loading, error, createTodo, updateTodo, toggleComplete, deleteTodo } = useTodos(priorityFilter);

  const handleFilterChange = (priority) => {
    setPriorityFilter(priority === priorityFilter ? null : priority);
  };

  const handleOpenModal = () => {
    setEditingTodo(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
  };

  const handleCreateTodo = async (todoData) => {
    await createTodo(todoData);
    setIsModalOpen(false);
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const handleUpdateTodo = async (todoData) => {
    await updateTodo(editingTodo.id, todoData);
    setIsModalOpen(false);
    setEditingTodo(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm(MESSAGES.actions.confirmDelete)) {
      try {
        await deleteTodo(id);
      } catch (error) {
        alert(MESSAGES.errors.deleteFailed);
      }
    }
  };

  const handleToggleComplete = async (id, completed) => {
    try {
      await toggleComplete(id, completed);
    } catch (error) {
      alert(MESSAGES.errors.toggleFailed);
    }
  };

  if (loading) {
    return (
      <div className="todo-list-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{MESSAGES.dashboard.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="todo-list-container">
        <div className="error-state">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-list-container">
      <div className="todo-list-header">
        <div className="header-top">
          <h2>{MESSAGES.dashboard.myTodos}</h2>
          <Button variant="primary" onClick={handleOpenModal}>
            + {MESSAGES.dashboard.addTodo}
          </Button>
        </div>
        <div className="priority-filters">
          <button
            className={`filter-btn ${priorityFilter === null ? 'active' : ''}`}
            onClick={() => setPriorityFilter(null)}
          >
            {MESSAGES.filters.all}
          </button>
          <button
            className={`filter-btn priority-high ${priorityFilter === 'high' ? 'active' : ''}`}
            onClick={() => handleFilterChange('high')}
          >
            {MESSAGES.filters.high}
          </button>
          <button
            className={`filter-btn priority-medium ${priorityFilter === 'medium' ? 'active' : ''}`}
            onClick={() => handleFilterChange('medium')}
          >
            {MESSAGES.filters.medium}
          </button>
          <button
            className={`filter-btn priority-low ${priorityFilter === 'low' ? 'active' : ''}`}
            onClick={() => handleFilterChange('low')}
          >
            {MESSAGES.filters.low}
          </button>
        </div>
      </div>

      {todos.length === 0 ? (
        <EmptyState onCreateClick={handleOpenModal} />
      ) : (
        <div className="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTodo ? MESSAGES.todoForm.editTitle : MESSAGES.todoForm.createTitle}
      >
        <TodoForm
          onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo}
          onCancel={handleCloseModal}
          initialData={editingTodo}
        />
      </Modal>
    </div>
  );
};

export default TodoList;
