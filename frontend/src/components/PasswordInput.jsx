import React, { useState } from 'react';

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.436-7.399a1.012 1.012 0 011.636 0l4.436 7.399a1.012 1.012 0 010 .639l-4.436 7.399a1.012 1.012 0 01-1.636 0l-4.436-7.399z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
  </svg>
);

const passwordInputContainerStyle = {
  position: 'relative',
  display: 'flex',
  width: '100%',
  alignItems: 'center',
};

const toggleButtonStyle = {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0',
  display: 'flex',
  color: 'var(--text-color-placeholder, #888890)',
};

const PasswordInput = ({ id, name, value, onChange, placeholder, required, disabled, minLength, style }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputStyle = {
    ...style,
    paddingRight: '40px', // Ensure space for the button
  };

  return (
    <div style={passwordInputContainerStyle}>
      <input
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        style={inputStyle}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        style={toggleButtonStyle}
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        disabled={disabled}
      >
        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};

export default PasswordInput;
