'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import toast from 'react-hot-toast';
import './profil.css';

export default function Profil() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    avatar: null as File | null,
    avatarPreview: ''
  });
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    
    const user = JSON.parse(userStr);
    setUtilisateur(user);
    setFormData({
      prenom: user.prenom || '',
      nom: user.nom || '',
      email: user.email || '',
      telephone: user.telephone || '',
      motDePasse: '',
      avatar: null,
      avatarPreview: user.avatar || ''
    });
    
    chargerEntreprise();
    chargerUtilisateurComplet(user.id);
  }, []);

  const chargerEntreprise = async () => {
    try {
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      if (data.success) setEntreprise(data.entreprise);
    } catch (error) {
      console.error('Erreur chargement entreprise:', error);
    }
  };

  const chargerUtilisateurComplet = async (id: number) => {
    try {
      const response = await fetch(`/api/utilisateurs/${id}`);
      const data = await response.json();
      if (data.success && data.utilisateur) {
        setUtilisateur(data.utilisateur);
        // Mettre à jour localStorage
        localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('L\'avatar ne doit pas dépasser 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          avatar: file,
          avatarPreview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('prenom', formData.prenom);
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telephone', formData.telephone || '');
      
      // N'envoyer le mot de passe que s'il a été modifié
      if (formData.motDePasse && formData.motDePasse.trim() !== '') {
        formDataToSend.append('motDePasse', formData.motDePasse);
      }
      
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      const response = await fetch(`/api/utilisateurs/${utilisateur.id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profil mis à jour avec succès');
        setIsEditing(false);
        
        // Recharger les données complètes
        await chargerUtilisateurComplet(utilisateur.id);
        
        // Réinitialiser le champ mot de passe
        setFormData(prev => ({ ...prev, motDePasse: '' }));
      } else {
        toast.error(data.erreur || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  if (!utilisateur) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de votre profil...</p>
      </div>
    );
  }

  return (
    <div className="profil-container">
      <Sidebar />
      
      <div className="profil-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Mon Profil"
          sousTitre="Gérez vos informations personnelles"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="profil-content">
          <motion.div 
            className="profil-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="profil-header">
              <div className="profil-title">
                <span className="profil-icon">👤</span>
                <h2>Informations personnelles</h2>
              </div>
              {!isEditing ? (
                <button 
                  className="save-button"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Modifier
                </button>
              ) : (
                <button 
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      prenom: utilisateur.prenom,
                      nom: utilisateur.nom,
                      email: utilisateur.email,
                      telephone: utilisateur.telephone || '',
                      motDePasse: '',
                      avatar: null,
                      avatarPreview: utilisateur.avatar || ''
                    });
                  }}
                >
                  ✖ Annuler
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="profil-avatar-section">
                <div className="avatar-large-container">
                  {formData.avatarPreview ? (
                    <img 
                      src={formData.avatarPreview} 
                      alt="Avatar"
                      className="avatar-large"
                    />
                  ) : (
                    <div className="avatar-large-placeholder">
                      <span>{formData.prenom[0]}{formData.nom[0]}</span>
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <div className="avatar-upload">
                    <label htmlFor="avatar-upload" className="upload-button">
                      📁 Changer l'avatar
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
              </div>

              <div className="profil-grid">
                <div className="form-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    disabled={!isEditing || isLoading}
                    className={!isEditing ? 'readonly' : ''}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    disabled={!isEditing || isLoading}
                    className={!isEditing ? 'readonly' : ''}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing || isLoading}
                    className={!isEditing ? 'readonly' : ''}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    disabled={!isEditing || isLoading}
                    className={!isEditing ? 'readonly' : ''}
                    placeholder="+225 00 00 00 00"
                  />
                </div>

                {isEditing && (
                  <div className="form-group full-width">
                    <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                    <input
                      type="password"
                      value={formData.motDePasse}
                      onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </div>

              <div className="profil-info-section">
                <h3>Informations de compte</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Rôle</span>
                    <span className="info-value">{utilisateur.role}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Statut</span>
                    <span className="info-value">
                      {utilisateur.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date d'inscription</span>
                    <span className="info-value">
                      {new Date(utilisateur.date_creation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="form-actions">
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
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      prenom: utilisateur.prenom,
                      nom: utilisateur.nom,
                      email: utilisateur.email,
                      telephone: utilisateur.telephone || '',
                      motDePasse: '',
                      avatar: null,
                      avatarPreview: utilisateur.avatar || ''
                    });
                  }}
                >
                  ✖ Annuler
                </button>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}