import React from 'react';
import { MESSAGES } from '../../constants/messages';
import './EmptyState.css';

const EmptyState = ({ onCreateClick }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <h2 className="empty-state-title">{MESSAGES.emptyState.noTodos}</h2>
      <p className="empty-state-description">
        {MESSAGES.emptyState.getStarted}
      </p>
      {onCreateClick && (
        <button
          className="empty-state-button"
          onClick={onCreateClick}
          aria-label={MESSAGES.emptyState.createFirst}
        >
          {MESSAGES.emptyState.createFirst}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
