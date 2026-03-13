'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import './parametres.css';

interface Entreprise {
  id?: number;
  nom: string;
  ville: string;
  telephone: string;
  email: string;
  site_web: string;
  logo_url: string | null;
}

export default function InfoEntreprise() {
  const [entreprise, setEntreprise] = useState<Entreprise>({
    nom: '',
    ville: '',
    telephone: '',
    email: '',
    site_web: '',
    logo_url: null
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Charger les données de l'entreprise au montage
  useEffect(() => {
    chargerEntreprise();
  }, []);

  const chargerEntreprise = async () => {
    try {
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      if (data.success && data.entreprise) {
        setEntreprise(data.entreprise);
        setLogoPreview(data.entreprise.logo_url);
      }
    } catch (error) {
      console.error('Erreur chargement entreprise:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Le logo ne doit pas dépasser 2MB');
        return;
      }
      
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

// Remplacer la validation du téléphone (lignes 84-112 environ) par :

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Validation des champs
    if (!entreprise.nom || !entreprise.ville || !entreprise.telephone || !entreprise.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation email uniquement
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(entreprise.email)) {
      toast.error('Email invalide');
      return;
    }

    // ✅ PLUS DE VALIDATION STRICTE DU TÉLÉPHONE
    // On garde juste une vérification basique (non vide)
    if (!entreprise.telephone.trim()) {
      toast.error('Le téléphone est requis');
      return;
    }

    const formData = new FormData();
    
    if (entreprise.id) {
      formData.append('id', entreprise.id.toString());
    }
    
    formData.append('nom', entreprise.nom);
    formData.append('ville', entreprise.ville);
    formData.append('telephone', entreprise.telephone);
    formData.append('email', entreprise.email);
    formData.append('site_web', entreprise.site_web || '');
    
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    const method = entreprise.id ? 'PUT' : 'POST';
    
    const response = await fetch('/api/entreprise', {
      method: method,
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      toast.success(entreprise.id ? 'Entreprise modifiée avec succès' : 'Entreprise créée avec succès');
      setIsEditing(false);
      setLogoFile(null);
      await chargerEntreprise();
    } else {
      toast.error(data.erreur || 'Une erreur est survenue');
    }
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur lors de la sauvegarde');
  } finally {
    setIsLoading(false);
  }
};

  const handleDelete = async () => {
    if (!entreprise.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/entreprise?id=${entreprise.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Entreprise supprimée avec succès');
        setEntreprise({
          nom: '',
          ville: '',
          telephone: '',
          email: '',
          site_web: '',
          logo_url: null
        });
        setLogoPreview(null);
        setIsEditing(true); // Passer en mode édition pour créer une nouvelle
        setShowDeleteConfirm(false);
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLogoFile(null);
    setLogoPreview(entreprise.logo_url);
    // Recharger les données originales
    chargerEntreprise();
  };

  return (
    <motion.div 
      className="param-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="param-header">
        <div className="param-title">
          <span className="param-icon">🏢</span>
          <h2>Informations de l'entreprise</h2>
        </div>
        <div className="header-actions">
          {!isEditing && entreprise.id && (
            <>
              <button 
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Modifier
              </button>
              <button 
                className="delete-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ Supprimer
              </button>
            </>
          )}
          {!isEditing && !entreprise.id && (
            <button 
              className="edit-button"
              onClick={() => setIsEditing(true)}
            >
              ➕ Créer
            </button>
          )}
        </div>
      </div>

      {/* Logo Section */}
      <div className="entreprise-logo-section">
        <div className="logo-container">
          {logoPreview ? (
            <img 
              src={logoPreview} 
              alt="Logo entreprise"
              className="entreprise-logo"
            />
          ) : (
            <div className="logo-placeholder">
              <span>{entreprise.nom ? entreprise.nom.charAt(0).toUpperCase() : '?'}</span>
            </div>
          )}
        </div>
        
        {isEditing && (
          <div className="logo-upload">
            <label htmlFor="logo-upload" className="upload-button">
              📁 {logoPreview ? 'Changer le logo' : 'Ajouter un logo'}
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            {logoFile && (
              <span className="file-name">{logoFile.name}</span>
            )}
          </div>
        )}
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <div className="entreprise-grid">
          <div className="form-group">
            <label>Nom de l'entreprise <span className="required">*</span></label>
            <input
              type="text"
              value={entreprise.nom}
              onChange={(e) => setEntreprise({...entreprise, nom: e.target.value})}
              disabled={!isEditing || isLoading}
              placeholder="Ex: ImmoLion CI"
              className={!isEditing ? 'readonly' : ''}
              required
            />
          </div>

          <div className="form-group">
            <label>Ville <span className="required">*</span></label>
            <input
              type="text"
              value={entreprise.ville}
              onChange={(e) => setEntreprise({...entreprise, ville: e.target.value})}
              disabled={!isEditing || isLoading}
              placeholder="Ex: Abidjan, Yamoussoukro"
              className={!isEditing ? 'readonly' : ''}
              required
            />
          </div>

          <div className="form-group">
            <label>Téléphone <span className="required">*</span></label>
            <input
              type="tel"
              value={entreprise.telephone}
              onChange={(e) => setEntreprise({...entreprise, telephone: e.target.value})}
              disabled={!isEditing || isLoading}
              placeholder="+225 00 00 00 00"
              className={!isEditing ? 'readonly' : ''}
              required
            />
            <small className="input-hint">Format: +225 00 00 00 00</small>
          </div>

          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input
              type="email"
              value={entreprise.email}
              onChange={(e) => setEntreprise({...entreprise, email: e.target.value})}
              disabled={!isEditing || isLoading}
              placeholder="contact@entreprise.ci"
              className={!isEditing ? 'readonly' : ''}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Site web</label>
            <input
              type="url"
              value={entreprise.site_web}
              onChange={(e) => setEntreprise({...entreprise, site_web: e.target.value})}
              disabled={!isEditing || isLoading}
              placeholder="https://www.monentreprise.ci"
              className={!isEditing ? 'readonly' : ''}
            />
          </div>
        </div>

        {/* Actions du formulaire */}
        <AnimatePresence>
          {isEditing && (
            <motion.div 
              className="form-actions"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button 
                type="submit" 
                className="save-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-small"></span>
                    Enregistrement...
                  </>
                ) : (
                  '💾 Enregistrer'
                )}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Annuler
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3>Confirmer la suppression</h3>
              <p>Êtes-vous sûr de vouloir supprimer les informations de l'entreprise ? Cette action est irréversible.</p>
              <div className="modal-actions">
                <button 
                  className="confirm-delete"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? 'Suppression...' : '🗑️ Supprimer'}
                </button>
                <button 
                  className="cancel-delete"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}