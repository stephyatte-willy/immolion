'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { STATUTS_LOCATAIRE } from '@/app/types/locataires';
import toast from 'react-hot-toast';
import '@/app/locataires/locataires.css';

interface LocataireFormProps {
  locataire: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LocataireForm({ locataire, onClose, onSuccess }: LocataireFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    telephone_secondaire: '',
    date_naissance: '',
    lieu_naissance: '',
    nationalite: 'Ivoirienne',
    profession: '',
    employeur: '',
    revenus_mensuels: '',
    statut: 'PROSPECT',
    notes: '',
    bien_actuel_id: ''
  });

  const [biens, setBiens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    chargerBiens();
    
    if (locataire) {
      setFormData({
        nom: locataire.nom || '',
        prenom: locataire.prenom || '',
        email: locataire.email || '',
        telephone: locataire.telephone || '',
        telephone_secondaire: locataire.telephone_secondaire || '',
        date_naissance: locataire.date_naissance?.split('T')[0] || '',
        lieu_naissance: locataire.lieu_naissance || '',
        nationalite: locataire.nationalite || 'Ivoirienne',
        profession: locataire.profession || '',
        employeur: locataire.employeur || '',
        revenus_mensuels: locataire.revenus_mensuels?.toString() || '',
        statut: locataire.statut || 'PROSPECT',
        notes: locataire.notes || '',
        bien_actuel_id: locataire.bien_actuel?.id?.toString() || ''
      });
    }
  }, [locataire]);

  const chargerBiens = async () => {
    try {
      const response = await fetch('/api/biens?statut=LOUE,DISPONIBLE');
      const data = await response.json();
      if (data.success) {
        setBiens(data.biens);
      }
    } catch (error) {
      console.error('Erreur chargement biens:', error);
    }
  };

  const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
  if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
  if (!formData.email.trim()) {
    newErrors.email = 'L\'email est requis';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Email invalide';
  }
  
  // ✅ Téléphone : seulement requis et que des chiffres (espaces autorisés)
  if (!formData.telephone.trim()) {
    newErrors.telephone = 'Le téléphone est requis';
  } else {
    // Enlever les espaces pour vérifier qu'il n'y a que des chiffres
    const phoneDigits = formData.telephone.replace(/\s+/g, '');
    if (!/^[0-9]+$/.test(phoneDigits)) {
      newErrors.telephone = 'Le téléphone ne doit contenir que des chiffres';
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast.error('Veuillez corriger les erreurs du formulaire');
    return;
  }

  setIsLoading(true);

  try {
    const url = locataire 
      ? `/api/locataires/${locataire.id}`
      : '/api/locataires';
    
    const method = locataire ? 'PUT' : 'POST';

    // ✅ CORRECTION: Utiliser bien_id au lieu de bien_actuel_id
    const dataToSend = {
      ...formData,
      bien_id: formData.bien_actuel_id || null  // Convertir en bien_id
    };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });

    const data = await response.json();

    if (data.success) {
      toast.success(locataire ? 'Locataire modifié avec succès' : 'Locataire créé avec succès');
      onSuccess();
    } else {
      toast.error(data.erreur || 'Une erreur est survenue');
    }
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur de connexion au serveur');
  } finally {
    setIsLoading(false);
  }
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
        className="modal-content locataire-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{locataire ? 'Modifier le locataire' : 'Nouveau locataire'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="locataire-form">
            <div className="form-sections">
              {/* Identité */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>👤</span> Identité
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className={errors.nom ? 'error' : ''}
                    />
                    {errors.nom && <span className="error-message">{errors.nom}</span>}
                  </div>

                  <div className="form-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      className={errors.prenom ? 'error' : ''}
                    />
                    {errors.prenom && <span className="error-message">{errors.prenom}</span>}
                  </div>

                  <div className="form-group">
                    <label>Date de naissance</label>
                    <input
                      type="date"
                      value={formData.date_naissance}
                      onChange={(e) => setFormData({...formData, date_naissance: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Lieu de naissance</label>
                    <input
                      type="text"
                      value={formData.lieu_naissance}
                      onChange={(e) => setFormData({...formData, lieu_naissance: e.target.value})}
                      placeholder="Abidjan"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nationalité</label>
                    <input
                      type="text"
                      value={formData.nationalite}
                      onChange={(e) => setFormData({...formData, nationalite: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📞</span> Contact
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={errors.email ? 'error' : ''}
                      placeholder="locataire@email.com"
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>Téléphone *</label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                      className={errors.telephone ? 'error' : ''}
                      placeholder="+225 00 00 00 00"
                    />
                    {errors.telephone && <span className="error-message">{errors.telephone}</span>}
                  </div>

                  <div className="form-group">
                    <label>Téléphone secondaire</label>
                    <input
                      type="tel"
                      value={formData.telephone_secondaire}
                      onChange={(e) => setFormData({...formData, telephone_secondaire: e.target.value})}
                      placeholder="+225 00 00 00 00"
                    />
                  </div>
                </div>
              </div>

              {/* Professionnel */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>💼</span> Situation professionnelle
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Profession</label>
                    <input
                      type="text"
                      value={formData.profession}
                      onChange={(e) => setFormData({...formData, profession: e.target.value})}
                      placeholder="Ingénieur, Commerçant..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Employeur</label>
                    <input
                      type="text"
                      value={formData.employeur}
                      onChange={(e) => setFormData({...formData, employeur: e.target.value})}
                      placeholder="Nom de l'entreprise"
                    />
                  </div>

                  <div className="form-group">
                    <label>Revenus mensuels (FCFA)</label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.revenus_mensuels}
                      onChange={(e) => setFormData({...formData, revenus_mensuels: e.target.value})}
                      placeholder="300000"
                    />
                  </div>
                </div>
              </div>

              {/* Statut et affectation */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📋</span> Statut et affectation
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Statut *</label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    >
                      {STATUTS_LOCATAIRE.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Bien actuel</label>
                    <select
                      value={formData.bien_actuel_id}
                      onChange={(e) => setFormData({...formData, bien_actuel_id: e.target.value})}
                    >
                      <option value="">Aucun bien</option>
                      {biens.map(bien => (
                        <option key={bien.id} value={bien.id}>
                          {bien.nom} - {bien.ville}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    placeholder="Informations complémentaires..."
                  />
                </div>
              </div>
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
        </div>
      </motion.div>
    </motion.div>
  );
}