import React from 'react';
import './ConfirmationModal.css';
import Spinner from './Spinner'; // Importar el componente Spinner

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClassName = 'btn-primary', // Clase por defecto para el botón de confirmar
  showSpinner = false // Para mostrar un spinner en el botón de confirmar
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-content">
        {title && <h3 className="confirmation-modal-title">{title}</h3>}
        <p className="confirmation-modal-message">{message}</p>
        <div className="confirmation-modal-actions">
          <button onClick={onClose} className="btn-secondary" disabled={showSpinner}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={confirmButtonClassName}
            disabled={showSpinner}
          >
            {showSpinner ? (
              <Spinner size="1em" color="white" /> // Usar el componente Spinner
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
