import React from 'react';
import PropTypes from 'prop-types';
import './Checkbox.css';

/**
 * Reusable Checkbox component
 * @param {Object} props - Component props
 * @param {boolean} props.checked - Whether the checkbox is checked
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Checkbox label text
 * @param {string} props.id - Checkbox input ID
 * @param {boolean} props.disabled - Whether the checkbox is disabled
 * @param {string} props.className - Additional CSS classes
 */
const Checkbox = ({
  checked = false,
  onChange,
  label,
  id,
  disabled = false,
  className = '',
}) => {
  const checkboxClasses = [
    'checkbox-container',
    className,
    disabled ? 'checkbox-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={checkboxClasses}>
      <input
        type="checkbox"
        id={id}
        className="checkbox-input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      {label && (
        <label htmlFor={id} className="checkbox-label">
          {label}
        </label>
      )}
    </div>
  );
};

Checkbox.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Checkbox;
