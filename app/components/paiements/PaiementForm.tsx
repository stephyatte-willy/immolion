'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MODES_PAIEMENT, STATUTS_PAIEMENT, MOIS } from '@/app/types/paiements';
import toast from 'react-hot-toast';
import './paiements.css';

interface PaiementFormProps {
  paiement: any | null;
  contrat_id?: number;
  locataire_id?: number;
  bien_id?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaiementForm({ 
  paiement, 
  contrat_id, 
  locataire_id, 
  bien_id, 
  onClose, 
  onSuccess 
}: PaiementFormProps) {
  const [formData, setFormData] = useState({
    contrat_id: contrat_id || '',
    locataire_id: locataire_id || '',
    bien_id: bien_id || '',
    type_paiement: 'LOYER',
    montant: '',
    date_paiement: new Date().toISOString().split('T')[0],
    date_echeance: '',
    mode_paiement: 'ESPECES',
    reference: '',
    statut: 'EFFECTUE',
    mois_concerne: '',
    penalite: '0',
    commentaire: ''
  });

  const [contratUnique, setContratUnique] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = MOIS;

  // ✅ Charger le contrat unique du locataire
  useEffect(() => {
    if (locataire_id) {
      chargerContratUnique();
    }
  }, [locataire_id]);

  // ✅ Pré-remplir automatiquement avec le contrat unique
  useEffect(() => {
    if (contratUnique) {
      setFormData(prev => ({
        ...prev,
        contrat_id: contratUnique.id.toString(),
        locataire_id: contratUnique.locataire_id?.toString() || '',
        bien_id: contratUnique.bien_id?.toString() || '',
        montant: contratUnique.loyer_mensuel?.toString() || prev.montant
      }));
    }
  }, [contratUnique]);

  // ✅ Mode édition
  useEffect(() => {
    if (paiement) {
      setFormData({
        contrat_id: paiement.contrat_id?.toString() || '',
        locataire_id: paiement.locataire_id?.toString() || '',
        bien_id: paiement.bien_id?.toString() || '',
        type_paiement: paiement.type_paiement || 'LOYER',
        montant: paiement.montant?.toString() || '',
        date_paiement: paiement.date_paiement?.split('T')[0] || new Date().toISOString().split('T')[0],
        date_echeance: paiement.date_echeance?.split('T')[0] || '',
        mode_paiement: paiement.mode_paiement || 'ESPECES',
        reference: paiement.reference || '',
        statut: paiement.statut || 'EFFECTUE',
        mois_concerne: paiement.mois_concerne || '',
        penalite: paiement.penalite?.toString() || '0',
        commentaire: paiement.commentaire || ''
      });
    }
  }, [paiement]);

  const chargerContratUnique = async () => {
    try {
      // Récupérer le contrat actif du locataire
      const response = await fetch(`/api/contrats?locataire_id=${locataire_id}&statut=ACTIF`);
      const data = await response.json();
      if (data.success && data.contrats && data.contrats.length > 0) {
        setContratUnique(data.contrats[0]); // Prendre le premier contrat actif
      } else {
        toast.error('Aucun contrat actif trouvé pour ce locataire');
      }
    } catch (error) {
      console.error('Erreur chargement contrat:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.contrat_id) newErrors.contrat_id = 'Le contrat est requis';
    if (!formData.montant) {
      newErrors.montant = 'Le montant est requis';
    } else if (parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être positif';
    }
    if (!formData.date_paiement) newErrors.date_paiement = 'La date de paiement est requise';

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
      const url = paiement 
        ? `/api/paiements/${paiement.id}`
        : '/api/paiements';
      
      const method = paiement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(paiement ? 'Paiement modifié avec succès' : 'Paiement enregistré avec succès');
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
        className="modal-content paiement-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{paiement ? 'Modifier le paiement' : 'Nouveau paiement'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="paiement-form">
            <div className="form-sections">
              {/* ✅ Contrat automatiquement sélectionné avec détails */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📄</span> Contrat de bail
                </div>
                
                {contratUnique ? (
                  <>
                    {/* Champ caché pour l'ID du contrat */}
                    <input type="hidden" name="contrat_id" value={contratUnique.id} />
                    
                    {/* Affichage des détails du contrat */}
                    <div className="info-panel">
                      <h4>Détails du contrat</h4>
                      <div className="info-grid">
                        <div>
                          <strong>Locataire:</strong> {contratUnique.locataire?.prenom} {contratUnique.locataire?.nom}
                        </div>
                        <div>
                          <strong>Bien:</strong> {contratUnique.bien?.nom}
                        </div>
                        <div>
                          <strong>Loyer mensuel:</strong> {parseFloat(contratUnique.loyer_mensuel).toLocaleString()} FCFA
                        </div>
                        <div>
                          <strong>N° contrat:</strong> {contratUnique.numero_contrat}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="warning-panel">
                    <span className="warning-icon">⚠️</span>
                    <p>Aucun contrat actif trouvé pour ce locataire</p>
                  </div>
                )}
              </div>

              {/* Montant et dates */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>💰</span> Montant et dates
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Montant (FCFA) *</label>
                    <input
                      type="number"
                      step="100"
                      value={formData.montant}
                      onChange={(e) => setFormData({...formData, montant: e.target.value})}
                      className={errors.montant ? 'error' : ''}
                      placeholder={contratUnique?.loyer_mensuel?.toLocaleString() || "150000"}
                    />
                    {errors.montant && <span className="error-message">{errors.montant}</span>}
                    {contratUnique && (
                      <small className="field-hint">Loyer mensuel: {parseFloat(contratUnique.loyer_mensuel).toLocaleString()} FCFA</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Pénalité (FCFA)</label>
                    <input
                      type="number"
                      step="100"
                      value={formData.penalite}
                      onChange={(e) => setFormData({...formData, penalite: e.target.value})}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date de paiement *</label>
                    <input
                      type="date"
                      value={formData.date_paiement}
                      onChange={(e) => setFormData({...formData, date_paiement: e.target.value})}
                      className={errors.date_paiement ? 'error' : ''}
                    />
                    {errors.date_paiement && <span className="error-message">{errors.date_paiement}</span>}
                  </div>

                  <div className="form-group">
                    <label>Date d'échéance</label>
                    <input
                      type="date"
                      value={formData.date_echeance}
                      onChange={(e) => setFormData({...formData, date_echeance: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Mois concerné */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📅</span> Période concernée
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Mois</label>
                    <select
                      value={formData.mois_concerne?.split('-')[1] || ''}
                      onChange={(e) => {
                        const annee = formData.mois_concerne?.split('-')[0] || currentYear.toString();
                        const newMois = e.target.value ? `${annee}-${e.target.value}` : '';
                        setFormData({...formData, mois_concerne: newMois});
                      }}
                    >
                      <option value="">Sélectionnez un mois</option>
                      {months.map((mois, index) => (
                        <option key={index} value={String(index + 1).padStart(2, '0')}>
                          {mois}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Année</label>
                    <select
                      value={formData.mois_concerne?.split('-')[0] || ''}
                      onChange={(e) => {
                        const mois = formData.mois_concerne?.split('-')[1] || '';
                        const newAnnee = e.target.value;
                        setFormData({...formData, mois_concerne: newAnnee ? `${newAnnee}-${mois}` : ''});
                      }}
                    >
                      <option value="">Sélectionnez une année</option>
                      {years.map(annee => (
                        <option key={annee} value={annee}>{annee}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mode de paiement et statut */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>💳</span> Mode et statut
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Mode de paiement *</label>
                    <select
                      value={formData.mode_paiement}
                      onChange={(e) => setFormData({...formData, mode_paiement: e.target.value})}
                    >
                      {MODES_PAIEMENT.map(mode => (
                        <option key={mode.value} value={mode.value}>
                          {mode.icone} {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    >
                      {STATUTS_PAIEMENT.map(statut => (
                        <option key={statut.value} value={statut.value}>
                          {statut.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Référence</label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({...formData, reference: e.target.value})}
                      placeholder="Référence du paiement"
                    />
                  </div>
                </div>
              </div>

              {/* Commentaire */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📝</span> Commentaire
                </div>
                <div className="form-group full-width">
                  <textarea
                    value={formData.commentaire}
                    onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
                    rows={3}
                    placeholder="Commentaire éventuel..."
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
              paiement ? '💾 Modifier' : '💾 Enregistrer le paiement'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}