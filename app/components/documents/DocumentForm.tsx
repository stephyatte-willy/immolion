'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TYPES_DOCUMENTS } from '@/app/types/documents';
import toast from 'react-hot-toast';
import './documents.css';

interface DocumentFormProps {
  locataire_id?: number;
  acquereur_id?: number;
  bien_id?: number;
  proprietaire_id?: number;
  locataire_nom?: string;
  acquereur_nom?: string;
  bien_nom?: string;
  proprietaire_nom?: string;
  document?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocumentForm({ 
  locataire_id,
  acquereur_id,
  bien_id,
  proprietaire_id,
  locataire_nom,
  acquereur_nom,
  bien_nom,
  proprietaire_nom,
  document,
  onClose, 
  onSuccess 
}: DocumentFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [typeDocument, setTypeDocument] = useState(document?.type_document || 'AUTRE');
  const [dateExpiration, setDateExpiration] = useState(document?.date_expiration?.split('T')[0] || '');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Déterminer le nom du client à afficher
  const getClientName = () => {
    if (locataire_nom) return locataire_nom;
    if (acquereur_nom) return acquereur_nom;
    if (bien_nom) return bien_nom;
    if (proprietaire_nom) return proprietaire_nom;
    if (document) {
      if (document.locataire_prenom && document.locataire_nom) {
        return `${document.locataire_prenom} ${document.locataire_nom}`;
      }
      if (document.acquereur_prenom && document.acquereur_nom) {
        return `${document.acquereur_prenom} ${document.acquereur_nom}`;
      }
      if (document.bien_nom) return document.bien_nom;
      if (document.proprietaire_nom) return document.proprietaire_nom;
    }
    return 'Client sélectionné';
  };

  // Déterminer le type de client
  const getClientType = () => {
    if (locataire_id) return 'Locataire';
    if (acquereur_id) return 'Acquéreur';
    if (bien_id) return 'Bien';
    if (proprietaire_id) return 'Propriétaire';
    return 'Client';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      toast.error('Certains fichiers dépassent 10MB et ont été ignorés');
    }

    setSelectedFiles(validFiles);

    const newPreviews = validFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return `/icons/${file.type.includes('pdf') ? 'pdf' : 'document'}.png`;
    });
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document && selectedFiles.length === 0) {
      toast.error('Veuillez sélectionner au moins un fichier');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      // Ajouter l'ID approprié selon le type de client
      if (locataire_id) {
        formData.append('locataire_id', locataire_id.toString());
      }
      if (acquereur_id) {
        formData.append('acquereur_id', acquereur_id.toString());
      }
      if (bien_id) {
        formData.append('bien_id', bien_id.toString());
      }
      if (proprietaire_id) {
        formData.append('proprietaire_id', proprietaire_id.toString());
      }
      
      formData.append('type_document', typeDocument);
      if (dateExpiration) formData.append('date_expiration', dateExpiration);

      if (document) {
        // Mode modification
        formData.append('_method', 'PUT');
        selectedFiles.forEach(file => {
          formData.append('documents', file);
        });
      } else {
        // Mode création
        selectedFiles.forEach(file => {
          formData.append('documents', file);
        });
      }

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const url = document ? `/api/documents/${document.id}` : '/api/documents';
      const method = document ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData
      });

      clearInterval(interval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        toast.success(document ? 'Document modifié avec succès' : 'Document ajouté avec succès');
        onSuccess();
      } else {
        toast.error(data.erreur || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('image')) return '🖼️';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel')) return '📊';
    return '📎';
  };

  const clientName = getClientName();
  const clientType = getClientType();

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content document-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <h2>{document ? '📎 Modifier le document' : '📎 Ajouter un document'}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="document-form">
            <div className="form-section">
              <div className="modal-section-title">
                <span>👤</span> Client / Entité
              </div>
              
              <div className="info-panel">
                <div className="client-info">
                  <span className="client-icon">👥</span>
                  <div className="client-details">
                    <span className="client-type">{clientType}</span>
                    <span className="client-name">{clientName}</span>
                  </div>
                </div>
                {!locataire_id && !acquereur_id && !bien_id && !proprietaire_id && !document?.locataire_id && !document?.acquereur_id && (
                  <p className="warning-text">⚠️ Aucune entité sélectionnée. Veuillez fermer et sélectionner un client, bien ou propriétaire.</p>
                )}
              </div>
            </div>

            <div className="form-section">
              <div className="modal-section-title">
                <span>📋</span> Informations du document
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Type de document *</label>
                  <select
                    value={typeDocument}
                    onChange={(e) => setTypeDocument(e.target.value)}
                    disabled={isLoading}
                  >
                    {TYPES_DOCUMENTS.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icone} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date d'expiration (optionnel)</label>
                  <input
                    type="date"
                    value={dateExpiration}
                    onChange={(e) => setDateExpiration(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="modal-section-title">
                <span>📁</span> Fichier
              </div>

              <div 
                className={`upload-area ${isLoading ? 'disabled' : ''}`}
                onClick={() => !isLoading && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (isLoading) return;
                  const files = Array.from(e.dataTransfer.files);
                  const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
                  setSelectedFiles(validFiles);
                  
                  const newPreviews = validFiles.map(file => {
                    if (file.type.startsWith('image/')) {
                      return URL.createObjectURL(file);
                    }
                    return `/icons/${file.type.includes('pdf') ? 'pdf' : 'document'}.png`;
                  });
                  setPreviews(newPreviews);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={!document}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">📤</div>
                <p className="upload-text">
                  {document ? 'Cliquez pour remplacer le fichier' : 'Cliquez ou glissez-déposez votre fichier ici'}
                </p>
                <p className="upload-hint">
                  Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>Fichier sélectionné</h4>
                  <div className="files-list">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-icon">{getFileIcon(file)}</div>
                        <div className="file-info">
                          <div className="file-name">{file.name}</div>
                          <div className="file-size">
                            {(file.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                        <button
                          type="button"
                          className="file-remove"
                          onClick={() => removeFile(index)}
                          disabled={isLoading}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {document && !selectedFiles.length && (
                <div className="current-file">
                  <span className="current-file-icon">📄</span>
                  <span className="current-file-name">Fichier actuel: {document.nom}</span>
                  <span className="current-file-hint">(Laissez vide pour conserver le fichier actuel)</span>
                </div>
              )}

              {isLoading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="progress-text">
                    Upload en cours... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn-submit"
            onClick={handleSubmit}
            disabled={isLoading || (!document && selectedFiles.length === 0)}
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                {document ? 'Modification...' : 'Upload en cours...'} {uploadProgress}%
              </>
            ) : (
              document ? '💾 Modifier' : '📤 Ajouter'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}