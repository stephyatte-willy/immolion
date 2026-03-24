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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    try {
      if (document.url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = document.url;
        link.download = document.nom;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Téléchargement lancé');
      } else {
        window.open(document.url, '_blank');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleView = () => {
    try {
      if (document.url.startsWith('data:')) {
        const newWindow = window.open();
        if (newWindow) {
          if (document.url.startsWith('data:image')) {
            newWindow.document.write(`
              <html>
                <head><title>${document.nom}</title></head>
                <body style="margin:0; display:flex; align-items:center; justify-content:center; background:#f5f5f5;">
                  <img src="${document.url}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
                </body>
              </html>
            `);
          } else {
            newWindow.document.write(`
              <html>
                <head><title>${document.nom}</title></head>
                <body style="margin:0;">
                  <embed src="${document.url}" type="${document.url.split(';')[0].replace('data:', '')}" width="100%" height="100%" />
                </body>
              </html>
            `);
          }
          newWindow.document.close();
        }
      } else {
        window.open(document.url, '_blank');
      }
    } catch (error) {
      console.error('Erreur visualisation:', error);
      toast.error('Erreur lors de la visualisation');
    }
  };

  const handleUpdate = async () => {
    if (onUpdate) {
      setIsUpdating(true);
      try {
        await onUpdate(document.id, typeDocument, dateExpiration);
        setIsEditing(false);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(document.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const isExpired = document.date_expiration && new Date(document.date_expiration) < new Date();
  const isImage = document.url.startsWith('data:image') || 
                  document.nom.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  // ✅ Nom complet du propriétaire
  const proprietaireNom = document.locataire_prenom && document.locataire_nom 
    ? `${document.locataire_prenom} ${document.locataire_nom}`
    : 'Client inconnu';

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

          {/* ✅ Ajout du propriétaire */}
          <div className="document-proprietaire">
            <span className="proprietaire-icon">👤</span>
            <span className="proprietaire-nom">{proprietaireNom}</span>
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

          {isImage && (
            <div className="document-image-preview">
              <img 
                src={document.url} 
                alt={document.nom}
                style={{ maxWidth: '100px', maxHeight: '60px', objectFit: 'cover', borderRadius: '4px' }}
                onClick={handleView}
              />
            </div>
          )}

          {isEditing && (
            <div className="document-edit-form">
              <select
                value={typeDocument}
                onChange={(e) => setTypeDocument(e.target.value)}
                className="edit-select"
                disabled={isUpdating}
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
                disabled={isUpdating}
              />
              <div className="edit-actions">
                <button 
                  onClick={handleUpdate} 
                  className="edit-save"
                  disabled={isUpdating}
                >
                  {isUpdating ? <span className="spinner-mini"></span> : '✓'}
                </button>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="edit-cancel"
                  disabled={isUpdating}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`document-actions ${isHovered ? 'visible' : ''}`}>
          <button 
            className="action-btn view"
            onClick={handleView}
            title="Voir le document"
          >
            👁️
          </button>
          {onUpdate && (
            <button 
              className="action-btn edit"
              onClick={() => setIsEditing(true)}
              title="Modifier"
              disabled={isDeleting}
            >
              ✏️
            </button>
          )}
          <button 
            className="action-btn delete"
            onClick={() => setShowDeleteConfirm(true)}
            title="Supprimer"
            disabled={isDeleting || isUpdating}
          >
            {isDeleting ? <span className="spinner-mini"></span> : '🗑️'}
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
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
}