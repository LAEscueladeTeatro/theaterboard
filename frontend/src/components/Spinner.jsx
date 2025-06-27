import React from 'react';
import './Spinner.css';

const Spinner = ({ size = '40px', color = 'var(--primary-color-teacher, #9D4EDD)' }) => {
  const spinnerStyle = {
    width: size,
    height: size,
    borderTopColor: color,
    borderRightColor: 'transparent', // Adjusted for a common spinner look
    borderBottomColor: 'transparent', // Adjusted for a common spinner look
    borderLeftColor: color,
  };
  // For a full circle chase, you might use:
  // borderTopColor: color,
  // borderRightColor: color,
  // borderBottomColor: color,
  // borderLeftColor: 'transparent',

  return <div className="spinner" style={spinnerStyle}></div>;
};

export default Spinner;
