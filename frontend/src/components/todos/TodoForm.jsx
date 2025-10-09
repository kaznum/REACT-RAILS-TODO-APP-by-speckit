import React, { useState } from 'react';
import Button from '../common/Button';
import DatePicker from '../common/DatePicker';
import { MESSAGES } from '../../constants/messages';
import { formatDateForInput } from '../../utils/dateFormat';
import './TodoForm.css';

const TodoForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    priority: initialData?.priority || 'medium',
    deadline: formatDateForInput(initialData?.deadline) || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = MESSAGES.validation.nameRequired;
    } else if (formData.name.length > 255) {
      newErrors.name = MESSAGES.validation.nameMaxLength;
    }

    // Priority validation
    if (!formData.priority) {
      newErrors.priority = MESSAGES.validation.priorityRequired;
    }

    // Deadline validation
    if (!formData.deadline) {
      newErrors.deadline = MESSAGES.validation.deadlineRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          // Parse error messages like "Name can't be blank"
          const field = err.split(' ')[0].toLowerCase();
          backendErrors[field] = err;
        });
        setErrors(backendErrors);
      } else {
        setErrors({ submit: MESSAGES.validation.saveFailed });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="todo-name" className="form-label">
          {MESSAGES.todoForm.nameLabel}
          <span className="required-asterisk">*</span>
        </label>
        <input
          id="todo-name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder={MESSAGES.todoForm.namePlaceholder}
          maxLength={255}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span className="form-error" id="name-error" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="todo-priority" className="form-label">
          {MESSAGES.todoForm.priorityLabel}
          <span className="required-asterisk">*</span>
        </label>
        <select
          id="todo-priority"
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          className={`form-select ${errors.priority ? 'error' : ''}`}
          aria-invalid={!!errors.priority}
          aria-describedby={errors.priority ? 'priority-error' : undefined}
        >
          <option value="low">{MESSAGES.priority.low}</option>
          <option value="medium">{MESSAGES.priority.medium}</option>
          <option value="high">{MESSAGES.priority.high}</option>
        </select>
        {errors.priority && (
          <span className="form-error" id="priority-error" role="alert">
            {errors.priority}
          </span>
        )}
      </div>

      <div className="form-group">
        <DatePicker
          label={MESSAGES.todoForm.deadlineLabel}
          value={formData.deadline}
          onChange={(value) => handleChange('deadline', value)}
          error={errors.deadline}
          required
        />
      </div>

      {errors.submit && (
        <div className="form-error-banner" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {MESSAGES.todoForm.cancelButton}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? `${MESSAGES.todoForm.saveButton}中...` : initialData ? MESSAGES.todoForm.updateButton : MESSAGES.todoForm.createButton}
        </Button>
      </div>
    </form>
  );
};

export default TodoForm;
