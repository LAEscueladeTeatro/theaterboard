import React from 'react';

const ToggleSwitch = ({ id, label, checked, onChange, disabled = false }) => {
  return (
    <div className="toggle-switch-container">
      {label && <label htmlFor={id} className="toggle-switch-label">{label}</label>}
      <label className="toggle-switch">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
};

export default ToggleSwitch;
