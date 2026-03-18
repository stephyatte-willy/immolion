'use client';

import { motion } from 'framer-motion';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean; // ✅ Nouvelle prop
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
  onConfirm,
  onCancel,
  disabled = false // ✅ Valeur par défaut
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '#ef4444',
          gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
        };
      case 'warning':
        return {
          icon: '#f59e0b',
          gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
        };
      case 'info':
        return {
          icon: '#3b82f6',
          gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
      default:
        return {
          icon: '#94a3b8',
          gradient: 'linear-gradient(135deg, #94a3b8, #64748b)'
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={disabled ? undefined : onCancel}
    >
      <motion.div 
        className="modal-content confirm-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête avec icône */}
        <div className="confirm-header">
          <div 
            className="confirm-icon"
            style={{ background: colors.gradient }}
          >
            <span>{getIcon()}</span>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onCancel}
            disabled={disabled}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Corps */}
        <div className="confirm-body">
          <h2 className="confirm-title">{title}</h2>
          <p className="confirm-message">{message}</p>
        </div>

        {/* Pied avec boutons */}
        <div className="confirm-footer">
          <button 
            className="confirm-btn cancel"
            onClick={onCancel}
            disabled={disabled}
          >
            {cancelText}
          </button>
          <button 
            className="confirm-btn confirm"
            style={{ background: colors.gradient }}
            onClick={onConfirm}
            disabled={disabled}
          >
            {disabled ? (
              <>
                <span className="spinner-small"></span>
                {confirmText}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}