'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TYPES_DOCUMENTS } from '@/app/types/documents';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import toast from 'react-hot-toast';
import './documents.css';

interface DocumentCardProps {
  document: any;
  onDelete: (id: number) => void;
  onUpdate?: (id: number, type: string, dateExpiration: string) => void;
}

export default function DocumentCard({ document, onDelete, onUpdate }: DocumentCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [typeDocument, setTypeDocument] = useState(document.type_document);
  const [dateExpiration, setDateExpiration] = useState(document.date_expiration || '');
  const [isHovered, setIsHovered] = useState(false);

  const getDocumentTypeInfo = (type: string) => {
    const typeInfo = TYPES_DOCUMENTS.find(t => t.value === type) || TYPES_DOCUMENTS[0];
    return {
      icone: typeInfo.icone,
      label: typeInfo.label
    };
  };

  const typeInfo = getDocumentTypeInfo(document.type_document);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(document.id, typeDocument, dateExpiration);
      setIsEditing(false);
    }
  };

  const isExpired = document.date_expiration && new Date(document.date_expiration) < new Date();

  return (
    <>
      <motion.div 
        className={`document-card ${isExpired ? 'expired' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="document-icon">
          {typeInfo.icone}
        </div>

        <div className="document-content">
          <div className="document-header">
            <h4 className="document-name">{document.nom}</h4>
            <span className="document-type">{typeInfo.label}</span>
          </div>

          <div className="document-meta">
            <span className="document-date">
              📅 Ajouté le {formatDate(document.date_upload)}
            </span>
            <span className="document-size">
              📦 {formatFileSize(document.taille || 0)}
            </span>
          </div>

          {document.date_expiration && (
            <div className={`document-expiration ${isExpired ? 'expired' : ''}`}>
              {isExpired ? '⚠️ Expiré le' : '✅ Valide jusqu\'au'} {formatDate(document.date_expiration)}
            </div>
          )}

          {isEditing && (
            <div className="document-edit-form">
              <select
                value={typeDocument}
                onChange={(e) => setTypeDocument(e.target.value)}
                className="edit-select"
              >
                {TYPES_DOCUMENTS.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icone} {type.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dateExpiration}
                onChange={(e) => setDateExpiration(e.target.value)}
                className="edit-date"
                placeholder="Date d'expiration"
              />
              <div className="edit-actions">
                <button onClick={handleUpdate} className="edit-save">✓</button>
                <button onClick={() => setIsEditing(false)} className="edit-cancel">✕</button>
              </div>
            </div>
          )}
        </div>

        <div className={`document-actions ${isHovered ? 'visible' : ''}`}>
          <button 
            className="action-btn download"
            onClick={handleDownload}
            title="Télécharger"
          >
            📥
          </button>
          {onUpdate && (
            <button 
              className="action-btn edit"
              onClick={() => setIsEditing(true)}
              title="Modifier"
            >
              ✏️
            </button>
          )}
          <button 
            className="action-btn delete"
            onClick={() => setShowDeleteConfirm(true)}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer le document"
        message={`Êtes-vous sûr de vouloir supprimer "${document.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={() => {
          onDelete(document.id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}