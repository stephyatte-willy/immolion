'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TYPES_DOCUMENTS } from '@/app/types/documents';
import toast from 'react-hot-toast';
import '@/app/proprietaires/proprietaires.css';

interface DocumentProprietaireFormProps {
  proprietaire_id: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocumentProprietaireForm({ 
  proprietaire_id, 
  onClose, 
  onSuccess 
}: DocumentProprietaireFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [typeDocument, setTypeDocument] = useState('AUTRE');
  const [dateExpiration, setDateExpiration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    if (selectedFiles.length === 0) {
      toast.error('Veuillez sélectionner au moins un fichier');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('proprietaire_id', proprietaire_id.toString());
      formData.append('type_document', typeDocument);
      if (dateExpiration) formData.append('date_expiration', dateExpiration);

      selectedFiles.forEach(file => {
        formData.append('documents', file);
      });

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Documents uploadés avec succès');
        onSuccess();
      } else {
        toast.error(data.erreur || 'Erreur lors de l\'upload');
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

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content document-proprietaire-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <span className="title-icon">📎</span>
            <h2>Ajouter des documents pour le propriétaire</h2>
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
                  <small className="field-hint">Pour les documents à validité limitée (CNI, passeport, etc.)</small>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="modal-section-title">
                <span>📁</span> Fichiers
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
                  setSelectedFiles(prev => [...prev, ...validFiles]);
                  
                  const newPreviews = validFiles.map(file => {
                    if (file.type.startsWith('image/')) {
                      return URL.createObjectURL(file);
                    }
                    return `/icons/${file.type.includes('pdf') ? 'pdf' : 'document'}.png`;
                  });
                  setPreviews(prev => [...prev, ...newPreviews]);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">📤</div>
                <p className="upload-text">
                  Cliquez ou glissez-déposez vos fichiers ici
                </p>
                <p className="upload-hint">
                  Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB par fichier)
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>Fichiers sélectionnés ({selectedFiles.length})</h4>
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
            disabled={isLoading || selectedFiles.length === 0}
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                Upload en cours... {uploadProgress}%
              </>
            ) : (
              <>
                <span className="btn-icon">📤</span>
                Uploader {selectedFiles.length} fichier(s)
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}