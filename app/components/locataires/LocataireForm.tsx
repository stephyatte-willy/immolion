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
    bien_id: '',
    lot_id: ''
  });

  const [biens, setBiens] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [selectedBienType, setSelectedBienType] = useState<string>('');
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
        bien_id: locataire.bien_actuel?.id?.toString() || locataire.bien_id?.toString() || '',
        lot_id: locataire.lot_actuel?.id?.toString() || locataire.lot_id?.toString() || ''
      });
      
      if (locataire.bien_actuel?.id) {
        chargerLotsDisponibles(locataire.bien_actuel.id);
        setSelectedBienType(locataire.bien_actuel.type_bien);
      }
    }
  }, [locataire]);

  const chargerBiens = async () => {
    try {
      const response = await fetch('/api/biens');
      const data = await response.json();
      if (data.success) {
        setBiens(data.biens);
      }
    } catch (error) {
      console.error('Erreur chargement biens:', error);
    }
  };

  const chargerLotsDisponibles = async (bienId: number) => {
  try {
    console.log('🔍 Chargement des lots pour bien_id:', bienId);
    const response = await fetch(`/api/lots/disponibles?bien_id=${bienId}`);
    const data = await response.json();
    console.log('📦 Réponse lots:', data);
    
    if (data.success) {
      setLots(data.lots);
      if (data.lots.length === 0) {
        console.log('⚠️ Aucun lot disponible pour ce bien');
      } else {
        console.log(`✅ ${data.lots.length} lots disponibles chargés`);
      }
    } else {
      console.error('❌ Erreur chargement lots:', data.erreur);
      setLots([]);
    }
  } catch (error) {
    console.error('❌ Erreur chargement lots:', error);
    setLots([]);
  }
};

  const handleBienChange = async (bienId: string) => {
  setFormData({ ...formData, bien_id: bienId, lot_id: '' });
  
  if (bienId) {
    const bien = biens.find(b => b.id.toString() === bienId);
    console.log('🏢 Bien sélectionné:', bien);
    setSelectedBienType(bien?.type_bien || '');
    
    if (bien?.type_bien === 'IMMEUBLE') {
      console.log('🏘️ C\'est un immeuble, chargement des lots...');
      await chargerLotsDisponibles(parseInt(bienId));
    } else {
      console.log('🏠 C\'est un bien simple, pas de lots');
      setLots([]);
    }
  } else {
    setSelectedBienType('');
    setLots([]);
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
    
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    }

    // Si un bien est sélectionné et que c'est un immeuble, le lot est obligatoire
    if (formData.bien_id && selectedBienType === 'IMMEUBLE' && !formData.lot_id) {
      newErrors.lot_id = 'Veuillez sélectionner un lot pour cet immeuble';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fonction pour vérifier si un lot est déjà attribué
const verifierDisponibiliteLot = async (lotId: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/lots/${lotId}/disponibilite`);
    const data = await response.json();
    if (data.success && data.disponible) {
      return true;
    } else {
      toast.error(data.message || 'Ce lot n\'est pas disponible');
      return false;
    }
  } catch (error) {
    console.error('Erreur vérification lot:', error);
    return false;
  }
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (formData.lot_id) {
        const disponible = await verifierDisponibiliteLot(parseInt(formData.lot_id));
        if (!disponible) return;
      }

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
                      type="text"
                      inputMode="numeric"
                      value={formData.revenus_mensuels}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setFormData({...formData, revenus_mensuels: value});
                      }}
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
                    <label>Bien</label>
                    <select
                      value={formData.bien_id}
                      onChange={(e) => handleBienChange(e.target.value)}
                    >
                      <option value="">Aucun bien</option>
                      {biens.map(bien => (
                        <option key={bien.id} value={bien.id} disabled={bien.statut === 'LOUE'}>
                          {bien.nom} - {bien.ville}
                          {bien.statut === 'LOUE' && ' (🔒 Déjà loué)'}
                          {bien.statut === 'RESERVE' && ' (⏳ Réservé)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBienType === 'IMMEUBLE' && lots.length > 0 && (
                    <div className="form-group">
                      <label>Lot *</label>
                      <select
                        value={formData.lot_id}
                        onChange={(e) => setFormData({...formData, lot_id: e.target.value})}
                        className={errors.lot_id ? 'error' : ''}
                      >
                        <option value="">Sélectionnez un lot</option>
                        {lots.map(lot => (
                          <option key={lot.id} value={lot.id} disabled={lot.statut === 'LOUE'}>
                            {lot.numero_lot} - {lot.type_lot} - {lot.surface} m² - {lot.loyer_mensuel?.toLocaleString()} FCFA
                            {lot.statut === 'LOUE' && ' (🔒 Déjà loué)'}
                            {lot.statut === 'RESERVE' && ' (⏳ Réservé)'}
                          </option>
                        ))}
                      </select>
                      {errors.lot_id && <span className="error-message">{errors.lot_id}</span>}
                    </div>
                  )}

                  {selectedBienType === 'IMMEUBLE' && lots.length === 0 && formData.bien_id && (
                    <div className="form-group full-width">
                      <div className="info-message">
                        ⚠️ Aucun lot disponible dans cet immeuble. Tous les lots sont déjà loués.
                      </div>
                    </div>
                  )}
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