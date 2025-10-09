import React from 'react';
import Checkbox from '../common/Checkbox';
import { MESSAGES } from '../../constants/messages';
import { formatJapaneseDate } from '../../utils/dateFormat';
import './TodoItem.css';

const TodoItem = ({ todo, onToggleComplete, onEdit, onDelete }) => {
  const handleCheckboxChange = () => {
    onToggleComplete(todo.id, !todo.completed);
  };

  const getPriorityLabel = (priority) => {
    return MESSAGES.priority[priority] || priority;
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  const isOverdue = (deadline) => {
    if (!deadline || todo.completed) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdue(todo.deadline) ? 'overdue' : ''}`}>
      <div className="todo-checkbox">
        <Checkbox
          checked={todo.completed}
          onChange={handleCheckboxChange}
          aria-label={`"${todo.name}"を${todo.completed ? '未完了' : '完了'}にする`}
        />
      </div>

      <div className="todo-content">
        <div className="todo-header">
          <h3 className="todo-name">{todo.name}</h3>
          <span className={`todo-priority ${getPriorityClass(todo.priority)}`}>
            {getPriorityLabel(todo.priority)}
          </span>
        </div>

        <div className="todo-footer">
          <span className="todo-deadline">
            {isOverdue(todo.deadline) && <span className="overdue-indicator">⚠️ </span>}
            {formatJapaneseDate(todo.deadline)}
          </span>
        </div>
      </div>

      <div className="todo-actions">
        {onEdit && (
          <button
            className="todo-action-btn edit"
            onClick={() => onEdit(todo)}
            aria-label={`"${todo.name}"を${MESSAGES.actions.edit}`}
          >
            ✏️
          </button>
        )}
        {onDelete && (
          <button
            className="todo-action-btn delete"
            onClick={() => onDelete(todo.id)}
            aria-label={`"${todo.name}"を${MESSAGES.actions.delete}`}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

export default TodoItem;
