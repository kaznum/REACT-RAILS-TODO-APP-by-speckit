import React from 'react';
import './DatePicker.css';

const DatePicker = ({ value, onChange, label, error, required = false, minDate = null }) => {
  const today = new Date().toISOString().split('T')[0];
  const min = minDate || today;

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="date-picker">
      {label && (
        <label className="date-picker-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <input
        type="date"
        value={value || ''}
        onChange={handleChange}
        min={min}
        required={required}
        className={`date-picker-input ${error ? 'error' : ''}`}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      {error && (
        <span className="date-picker-error" id={`${label}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default DatePicker;
