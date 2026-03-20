'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MODES_PAIEMENT, STATUTS_PAIEMENT, TYPES_PAIEMENT, MOIS } from '@/app/types/paiements';
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
    type_vente: '',
    montant: '',
    montant_total_vente: '',
    versement_numero: '',
    echeancier_id: '',
    date_paiement: new Date().toISOString().split('T')[0],
    date_echeance: '',
    mode_paiement: 'ESPECES',
    reference: '',
    statut: 'EFFECTUE',
    mois_concerne: '',
    penalite: '0',
    commentaire: ''
  });

  const [contrats, setContrats] = useState<any[]>([]); // ✅ Liste des contrats
  const [contratSelectionne, setContratSelectionne] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [versementsPrecedents, setVersementsPrecedents] = useState<any[]>([]);
  const [totalVersements, setTotalVersements] = useState(0);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = MOIS;

  // ✅ Déterminer si c'est une vente
  const isVente = contratSelectionne?.type_contrat === 'VENTE';
  const typePaiementVente = formData.type_vente;

  // ✅ Charger tous les contrats du locataire
  useEffect(() => {
    if (locataire_id) {
      chargerContrats();
    }
  }, [locataire_id]);

  // ✅ Charger les versements précédents quand un contrat est sélectionné
  useEffect(() => {
    if (contratSelectionne && isVente) {
      chargerVersementsPrecedents();
    }
  }, [contratSelectionne, isVente]);

  // ✅ Pré-remplir quand un contrat est sélectionné
  useEffect(() => {
    if (contratSelectionne) {
      const isContratVente = contratSelectionne.type_contrat === 'VENTE';
      
      setFormData(prev => ({
        ...prev,
        contrat_id: contratSelectionne.id.toString(),
        locataire_id: contratSelectionne.locataire_id?.toString() || '',
        bien_id: contratSelectionne.bien_id?.toString() || '',
        montant: isContratVente ? '' : (contratSelectionne.loyer_mensuel?.toString() || prev.montant),
        montant_total_vente: isContratVente ? (contratSelectionne.prix_vente?.toString() || '') : '',
        type_paiement: isContratVente ? 'ACOMPTE' : 'LOYER',
      }));
    }
  }, [contratSelectionne]);

  // ✅ Mode édition
  useEffect(() => {
    if (paiement) {
      setFormData({
        contrat_id: paiement.contrat_id?.toString() || '',
        locataire_id: paiement.locataire_id?.toString() || '',
        bien_id: paiement.bien_id?.toString() || '',
        type_paiement: paiement.type_paiement || 'LOYER',
        type_vente: paiement.type_vente || '',
        montant: paiement.montant?.toString() || '',
        montant_total_vente: paiement.montant_total_vente?.toString() || '',
        versement_numero: paiement.versement_numero?.toString() || '',
        echeancier_id: paiement.echeancier_id || '',
        date_paiement: paiement.date_paiement?.split('T')[0] || new Date().toISOString().split('T')[0],
        date_echeance: paiement.date_echeance?.split('T')[0] || '',
        mode_paiement: paiement.mode_paiement || 'ESPECES',
        reference: paiement.reference || '',
        statut: paiement.statut || 'EFFECTUE',
        mois_concerne: paiement.mois_concerne || '',
        penalite: paiement.penalite?.toString() || '0',
        commentaire: paiement.commentaire || ''
      });
      
      // Sélectionner le contrat correspondant
      if (paiement.contrat_id && contrats.length > 0) {
        const contrat = contrats.find(c => c.id === paiement.contrat_id);
        if (contrat) {
          setContratSelectionne(contrat);
        }
      }
    }
  }, [paiement, contrats]);

  const chargerContrats = async () => {
    try {
      const response = await fetch(`/api/contrats?locataire_id=${locataire_id}`);
      const data = await response.json();
      if (data.success && data.contrats) {
        setContrats(data.contrats);
        
        // ✅ Si un contrat_id est fourni, le sélectionner automatiquement
        if (contrat_id) {
          const contrat = data.contrats.find((c: any) => c.id === contrat_id);
          if (contrat) {
            setContratSelectionne(contrat);
          }
        }
      } else {
        toast.error('Aucun contrat trouvé pour ce client');
      }
    } catch (error) {
      console.error('Erreur chargement contrats:', error);
    }
  };

  const chargerVersementsPrecedents = async () => {
    if (!contratSelectionne) return;
    
    try {
      const response = await fetch(`/api/paiements?contrat_id=${contratSelectionne.id}&type_paiement=ACOMPTE,VERSEMENT,SOLDE`);
      const data = await response.json();
      if (data.success) {
        setVersementsPrecedents(data.paiements);
        const total = data.paiements.reduce((sum: number, p: any) => sum + p.montant, 0);
        setTotalVersements(total);
        
        // Déterminer le prochain numéro de versement
        const maxNumero = Math.max(...data.paiements.map((p: any) => p.versement_numero || 0), 0);
        setFormData(prev => ({
          ...prev,
          versement_numero: (maxNumero + 1).toString(),
          echeancier_id: `VENTE-${contratSelectionne.id}-${new Date().getFullYear()}`
        }));
      }
    } catch (error) {
      console.error('Erreur chargement versements:', error);
    }
  };

  const handleContratChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setContratSelectionne(null);
      return;
    }
    
    const contrat = contrats.find(c => c.id.toString() === id);
    setContratSelectionne(contrat || null);
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

    // Validation pour une vente
    if (isVente) {
      if (typePaiementVente === 'ACOMPTE') {
        const montantSaisi = parseFloat(formData.montant);
        const totalVente = parseFloat(formData.montant_total_vente || '0');
        if (montantSaisi > totalVente) {
          newErrors.montant = 'L\'acompte ne peut pas dépasser le prix total';
        }
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
      const dataToSend = {
        ...formData,
        // Pour une vente, on garde la trace du type
        type_paiement: isVente ? typePaiementVente : formData.type_paiement,
      };

      const url = paiement 
        ? `/api/paiements/${paiement.id}`
        : '/api/paiements';
      
      const method = paiement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
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

  const resteAPayer = isVente && contratSelectionne?.prix_vente 
    ? (parseFloat(contratSelectionne.prix_vente) - totalVersements) 
    : 0;

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
              {/* ✅ Sélection du contrat */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📄</span> Sélection du contrat
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Contrat *</label>
                    <select
                      value={formData.contrat_id}
                      onChange={handleContratChange}
                      className={errors.contrat_id ? 'error' : ''}
                      disabled={!!paiement} // Désactivé en mode édition
                    >
                      <option value="">Sélectionnez un contrat</option>
                      {contrats.map((contrat: any) => (
                        <option key={contrat.id} value={contrat.id}>
                          {contrat.numero_contrat} - {contrat.type_contrat === 'VENTE' ? 'VENTE' : 'LOCATION'} - {contrat.bien?.nom || 'Bien'}
                        </option>
                      ))}
                    </select>
                    {errors.contrat_id && <span className="error-message">{errors.contrat_id}</span>}
                  </div>
                </div>
                
                {contratSelectionne && (
                  <div className="info-panel">
                    <h4>Détails du contrat</h4>
                    <div className="info-grid">
                      <div>
                        <strong>Client:</strong> {contratSelectionne.locataire?.prenom} {contratSelectionne.locataire?.nom}
                      </div>
                      <div>
                        <strong>Bien:</strong> {contratSelectionne.bien?.nom}
                      </div>
                      <div>
                        <strong>Type:</strong> {isVente ? 'VENTE' : 'LOCATION'}
                      </div>
                      <div>
                        <strong>N° contrat:</strong> {contratSelectionne.numero_contrat}
                      </div>
                      {isVente ? (
                        <>
                          <div>
                            <strong>Prix de vente:</strong> {parseFloat(contratSelectionne.prix_vente || 0).toLocaleString()} FCFA
                          </div>
                          <div>
                            <strong>Déjà versé:</strong> {totalVersements.toLocaleString()} FCFA
                          </div>
                          <div>
                            <strong>Reste à payer:</strong> {resteAPayer.toLocaleString()} FCFA
                          </div>
                        </>
                      ) : (
                        <div>
                          <strong>Loyer mensuel:</strong> {parseFloat(contratSelectionne.loyer_mensuel || 0).toLocaleString()} FCFA
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Type de paiement - adapté */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🏷️</span> Type de paiement
                </div>
                <div className="form-grid">
                  {isVente ? (
                    // ✅ Pour une vente
                    <>
                      <div className="form-group">
                        <label>Type de versement *</label>
                        <select
                          value={formData.type_vente}
                          onChange={(e) => setFormData({...formData, type_vente: e.target.value})}
                        >
                          <option value="">Sélectionnez le type</option>
                          <option value="ACOMPTE">Acompte</option>
                          <option value="VERSEMENT">Versement</option>
                          <option value="SOLDE">Solde final</option>
                        </select>
                      </div>

                      {formData.type_vente && (
                        <div className="form-group">
                          <label>N° versement</label>
                          <input
                            type="number"
                            value={formData.versement_numero}
                            onChange={(e) => setFormData({...formData, versement_numero: e.target.value})}
                            placeholder="1"
                            readOnly={formData.type_vente !== 'VERSEMENT'}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    // ✅ Pour une location
                    <div className="form-group">
                      <label>Type de paiement</label>
                      <select
                        value={formData.type_paiement}
                        onChange={(e) => setFormData({...formData, type_paiement: e.target.value})}
                      >
                        {TYPES_PAIEMENT.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icone} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
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
                      placeholder={isVente ? "Montant du versement" : "150000"}
                    />
                    {errors.montant && <span className="error-message">{errors.montant}</span>}
                    
                    {isVente && resteAPayer > 0 && (
                      <small className="field-hint">
                        Reste à payer: {resteAPayer.toLocaleString()} FCFA
                      </small>
                    )}
                    
                    {!isVente && contratSelectionne && (
                      <small className="field-hint">
                        Loyer mensuel: {parseFloat(contratSelectionne.loyer_mensuel || 0).toLocaleString()} FCFA
                      </small>
                    )}
                  </div>

                  {isVente && (
                    <div className="form-group">
                      <label>Prix total de vente</label>
                      <input
                        type="number"
                        step="10000"
                        value={formData.montant_total_vente}
                        readOnly
                        className="readonly"
                      />
                    </div>
                  )}

                  {!isVente && (
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
                  )}

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

              {/* Période concernée - uniquement pour location */}
              {!isVente && (
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
              )}

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
              paiement ? '💾 Modifier' : '💾 Enregistrer'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}