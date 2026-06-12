import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" 
}) => {
  if (!isOpen) return null;

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn btn-danger';
      case 'warning':
        return 'btn btn-primary'; // Amber style
      default:
        return 'btn btn-primary';
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} className={type === 'danger' ? 'text-red-500' : 'text-amber-500'} />
            {title}
          </h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close Dialog">
            <X size={18} />
          </button>
        </div>
        
        <div style={{ marginBottom: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {message}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={getButtonClass()} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
