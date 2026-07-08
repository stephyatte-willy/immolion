'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import './contrats.css';

interface ContratVenteFormProps {
  contrat: any | null;
  acquereur_id?: number;
  bien_id?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContratVenteForm({ 
  contrat, 
  acquereur_id, 
  bien_id,
  onClose, 
  onSuccess 
}: ContratVenteFormProps) {
  const [formData, setFormData] = useState({
    bien_id: '',
    acquereur_id: '',
    type_contrat: 'VENTE',
    mode_vente: 'COMPTANT',
    date_debut: '',
    date_fin: '',
    date_signature: '',
    prix_vente: '',
    acompte: '',
    nombre_versements: '1',
    montant_versement: '',
    frais_notaire: '',
    frais_agence: '',
    clause_particuliere: '',
    statut: 'BROUILLON'
  });

  const [biens, setBiens] = useState<any[]>([]);
  const [acquereurs, setAcquereurs] = useState<any[]>([]);
  const [bienSelectionne, setBienSelectionne] = useState<any>(null);
  const [acquereurSelectionne, setAcquereurSelectionne] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Fonction pour calculer le montant par versement
  const calculerMontantVersement = (prixVente: number, acompte: number, nombreVersements: number): number => {
    if (nombreVersements <= 0) return 0;
    const resteAPayer = Math.max(0, prixVente - acompte);
    return resteAPayer / nombreVersements;
  };

  // ✅ Fonction pour mettre à jour les champs calculés
  const mettreAJourMontantVersement = () => {
    const prixVenteValue = parseFloat(formData.prix_vente) || 0;
    const acompteValue = parseFloat(formData.acompte) || 0;
    const nombreVersementsValue = parseInt(formData.nombre_versements) || 1;
    
    const nouveauMontantVersement = calculerMontantVersement(prixVenteValue, acompteValue, nombreVersementsValue);
    
    setFormData(prev => ({
      ...prev,
      montant_versement: nouveauMontantVersement.toString()
    }));
  };

  // ✅ Effet pour recalculer quand prix_vente, acompte ou nombre_versements change
  useEffect(() => {
    if (formData.mode_vente === 'ECHELONNE') {
      mettreAJourMontantVersement();
    }
  }, [formData.prix_vente, formData.acompte, formData.nombre_versements, formData.mode_vente]);

  useEffect(() => {
    chargerBiens();
    chargerAcquereurs();
  }, []);

  useEffect(() => {
    if (contrat) {
      console.log('📝 Mode édition - Contrat de vente:', contrat);
      
      setFormData({
        bien_id: contrat.bien_id?.toString() || '',
        acquereur_id: contrat.acquereur_id?.toString() || '',
        type_contrat: contrat.type_contrat || 'VENTE',
        mode_vente: contrat.mode_vente || 'COMPTANT',
        date_debut: contrat.date_debut?.split('T')[0] || '',
        date_fin: contrat.date_fin?.split('T')[0] || '',
        date_signature: contrat.date_signature?.split('T')[0] || '',
        prix_vente: contrat.prix_vente?.toString() || '',
        acompte: contrat.acompte?.toString() || '',
        nombre_versements: contrat.nombre_versements?.toString() || '1',
        montant_versement: contrat.montant_versement?.toString() || '',
        frais_notaire: contrat.frais_notaire?.toString() || '',
        frais_agence: contrat.frais_agence?.toString() || '',
        clause_particuliere: contrat.clause_particuliere || '',
        statut: contrat.statut || 'BROUILLON'
      });
      
      if (contrat.acquereur) {
        setAcquereurSelectionne(contrat.acquereur);
      } else if (contrat.acquereur_id) {
        fetchAcquereur(contrat.acquereur_id);
      }
      
      if (contrat.bien) {
        setBienSelectionne(contrat.bien);
      } else if (contrat.bien_id) {
        fetchBien(contrat.bien_id);
      }
    } else {
      if (acquereur_id) {
        fetchAcquereur(acquereur_id);
        setFormData(prev => ({ ...prev, acquereur_id: acquereur_id.toString() }));
      }
      if (bien_id) {
        fetchBien(bien_id);
        setFormData(prev => ({ ...prev, bien_id: bien_id.toString() }));
      }
    }
  }, [contrat, acquereur_id, bien_id]);

  const fetchAcquereur = async (id: number) => {
    try {
      const response = await fetch(`/api/acquereurs/${id}`);
      const data = await response.json();
      if (data.success) {
        setAcquereurSelectionne(data.acquereur);
      }
    } catch (error) {
      console.error('Erreur chargement acquéreur:', error);
    }
  };

  const fetchBien = async (id: number) => {
    try {
      const response = await fetch(`/api/biens/${id}`);
      const data = await response.json();
      if (data.success) {
        setBienSelectionne(data.bien);
        if (!contrat) {
          const prixVente = data.bien.prix_vente || 0;
          setFormData(prev => ({
            ...prev,
            prix_vente: prixVente.toString(),
            frais_notaire: (prixVente * 0.075).toString(),
            frais_agence: (prixVente * 0.05).toString()
          }));
        }
      }
    } catch (error) {
      console.error('Erreur chargement bien:', error);
    }
  };

  const chargerBiens = async () => {
    try {
      const response = await fetch('/api/biens?statut=EN_VENTE');
      const data = await response.json();
      if (data.success) setBiens(data.biens);
    } catch (error) {
      console.error('Erreur chargement biens:', error);
    }
  };

  const chargerAcquereurs = async () => {
    try {
      const response = await fetch('/api/acquereurs?actif=ACTIF');
      const data = await response.json();
      if (data.success) setAcquereurs(data.acquereurs);
    } catch (error) {
      console.error('Erreur chargement acquéreurs:', error);
    }
  };

  const handleModeVenteChange = (mode: string) => {
    setFormData({ ...formData, mode_vente: mode });
    
    if (mode === 'COMPTANT') {
      setFormData(prev => ({
        ...prev,
        nombre_versements: '1',
        montant_versement: prev.prix_vente,
        acompte: ''
      }));
    } else {
      // Mode ECHELONNE - réinitialiser avec nombre_versements = 1
      const prixVenteValue = parseFloat(formData.prix_vente) || 0;
      const acompteValue = parseFloat(formData.acompte) || 0;
      const resteAPayer = Math.max(0, prixVenteValue - acompteValue);
      
      setFormData(prev => ({
        ...prev,
        nombre_versements: '1',
        montant_versement: resteAPayer.toString()
      }));
    }
  };

  const handlePrixVenteChange = (prix: string) => {
    const prixValue = parseFloat(prix) || 0;
    const acompteValue = parseFloat(formData.acompte) || 0;
    const nombreVersements = parseInt(formData.nombre_versements) || 1;
    
    // Recalculer le montant par versement
    const resteAPayer = Math.max(0, prixValue - acompteValue);
    const montantVersement = formData.mode_vente === 'ECHELONNE' 
      ? resteAPayer / nombreVersements 
      : prixValue;
    
    setFormData(prev => ({
      ...prev,
      prix_vente: prix,
      montant_versement: montantVersement.toString(),
      frais_notaire: (prixValue * 0.075).toString(),
      frais_agence: (prixValue * 0.05).toString()
    }));
  };

  const handleAcompteChange = (acompte: string) => {
    const acompteValue = parseFloat(acompte) || 0;
    const prixVenteValue = parseFloat(formData.prix_vente) || 0;
    const nombreVersements = parseInt(formData.nombre_versements) || 1;
    
    // Vérifier que l'acompte ne dépasse pas le prix de vente
    if (acompteValue > prixVenteValue) {
      toast.error("L'acompte ne peut pas dépasser le prix de vente");
      return;
    }
    
    const resteAPayer = Math.max(0, prixVenteValue - acompteValue);
    const montantVersement = formData.mode_vente === 'ECHELONNE' 
      ? resteAPayer / nombreVersements 
      : resteAPayer;
    
    setFormData(prev => ({
      ...prev,
      acompte: acompte,
      montant_versement: montantVersement.toString()
    }));
  };

  const handleNombreVersementsChange = (nombre: string) => {
    const nombreValue = parseInt(nombre) || 1;
    const prixVenteValue = parseFloat(formData.prix_vente) || 0;
    const acompteValue = parseFloat(formData.acompte) || 0;
    
    // Limiter le nombre de versements à 60 (5 ans max)
    if (nombreValue > 60) {
      toast.error("Le nombre de versements ne peut pas dépasser 60");
      return;
    }
    
    const resteAPayer = Math.max(0, prixVenteValue - acompteValue);
    const montantVersement = resteAPayer / nombreValue;
    
    setFormData(prev => ({
      ...prev,
      nombre_versements: nombre,
      montant_versement: montantVersement.toString()
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bien_id) newErrors.bien_id = 'Le bien est requis';
    if (!formData.acquereur_id) newErrors.acquereur_id = 'L\'acquéreur est requis';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    if (!formData.prix_vente) {
      newErrors.prix_vente = 'Le prix de vente est requis';
    } else if (parseFloat(formData.prix_vente) <= 0) {
      newErrors.prix_vente = 'Le prix doit être positif';
    }

    if (formData.mode_vente === 'ECHELONNE') {
      const acompteValue = parseFloat(formData.acompte) || 0;
      const prixVenteValue = parseFloat(formData.prix_vente) || 0;
      
      if (acompteValue <= 0) {
        newErrors.acompte = 'L\'acompte est requis';
      } else if (acompteValue >= prixVenteValue) {
        newErrors.acompte = 'L\'acompte doit être inférieur au prix de vente';
      }
      
      if (!formData.nombre_versements || parseInt(formData.nombre_versements) < 1) {
        newErrors.nombre_versements = 'Le nombre de versements est invalide';
      }
      
      const montantVersementValue = parseFloat(formData.montant_versement) || 0;
      if (montantVersementValue <= 0) {
        newErrors.montant_versement = 'Le montant par versement doit être positif';
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
      const prixVenteValue = parseFloat(formData.prix_vente) || 0;
      const acompteValue = parseFloat(formData.acompte) || 0;
      const nombreVersementsValue = parseInt(formData.nombre_versements) || 1;
      const montantVersementValue = parseFloat(formData.montant_versement) || 0;
      
      const dataToSend = {
        ...formData,
        bien_id: parseInt(formData.bien_id),
        acquereur_id: parseInt(formData.acquereur_id),
        type_contrat: 'VENTE',
        prix_vente: prixVenteValue,
        acompte: acompteValue,
        nombre_versements: nombreVersementsValue,
        montant_versement: montantVersementValue,
        frais_notaire: parseFloat(formData.frais_notaire) || 0,
        frais_agence: parseFloat(formData.frais_agence) || 0
      };

      const url = contrat 
        ? `/api/contrats/${contrat.id}`
        : '/api/contrats';
      
      const method = contrat ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(contrat ? 'Contrat de vente modifié avec succès' : 'Contrat de vente créé avec succès');
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

  const getBienDisplay = (bien: any) => {
    return `${bien.nom} - ${bien.ville} - ${bien.prix_vente?.toLocaleString()} FCFA`;
  };

  const getAcquereurDisplay = (acquereur: any) => {
    if (!acquereur) return '';
    if (acquereur.type_acquereur === 'PARTICULIER') {
      return `${acquereur.prenom} ${acquereur.nom} - ${acquereur.email}`;
    }
    return `${acquereur.raison_sociale || acquereur.nom} - ${acquereur.email}`;
  };

  const prixVenteValue = parseFloat(formData.prix_vente) || 0;
  const acompteValue = parseFloat(formData.acompte) || 0;
  const resteAPayer = Math.max(0, prixVenteValue - acompteValue);
  const montantVersementValue = parseFloat(formData.montant_versement) || 0;

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content contrat-vente-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{contrat ? 'Modifier le contrat de vente' : 'Nouveau contrat de vente'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="contrat-form">
            <div className="form-sections">
              {/* Parties prenantes */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🤝</span> Parties prenantes
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Acquéreur *</label>
                    {contrat ? (
                      <div className="form-static">
                        <strong>
                          {acquereurSelectionne?.type_acquereur === 'PARTICULIER' ? '👤' : '🏢'} 
                          {getAcquereurDisplay(acquereurSelectionne)}
                        </strong>
                      </div>
                    ) : (
                      <select
                        value={formData.acquereur_id}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFormData({...formData, acquereur_id: id});
                          const acquereur = acquereurs.find(a => a.id.toString() === id);
                          setAcquereurSelectionne(acquereur || null);
                          if (acquereur?.bien_id && !formData.bien_id) {
                            const bien = biens.find(b => b.id === acquereur.bien_id);
                            if (bien) {
                              setBienSelectionne(bien);
                              setFormData(prev => ({
                                ...prev,
                                bien_id: bien.id.toString(),
                                prix_vente: bien.prix_vente?.toString() || ''
                              }));
                            }
                          }
                        }}
                        className={errors.acquereur_id ? 'error' : ''}
                      >
                        <option value="">Sélectionnez un acquéreur</option>
                        {acquereurs.map(acq => (
                          <option key={acq.id} value={acq.id}>
                            {acq.type_acquereur === 'PARTICULIER' ? '👤' : '🏢'} 
                            {getAcquereurDisplay(acq)}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.acquereur_id && <span className="error-message">{errors.acquereur_id}</span>}
                  </div>

                  <div className="form-group">
                    <label>Bien à acquérir *</label>
                    {contrat ? (
                      <div className="form-static">
                        <strong>{bienSelectionne?.nom}</strong>
                        <br />
                        <small className="text-muted">
                          {bienSelectionne?.adresse}, {bienSelectionne?.commune}
                        </small>
                      </div>
                    ) : (
                      <select
                        value={formData.bien_id}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFormData({...formData, bien_id: id});
                          const bien = biens.find(b => b.id.toString() === id);
                          setBienSelectionne(bien || null);
                          if (bien) {
                            handlePrixVenteChange(bien.prix_vente?.toString() || '');
                          }
                        }}
                        className={errors.bien_id ? 'error' : ''}
                      >
                        <option value="">Sélectionnez un bien</option>
                        {biens.map(bien => (
                          <option key={bien.id} value={bien.id}>
                            {getBienDisplay(bien)}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.bien_id && <span className="error-message">{errors.bien_id}</span>}
                  </div>
                </div>

                {bienSelectionne && (
                  <div className="info-panel">
                    <h4>Informations du bien</h4>
                    <div className="info-grid">
                      <div><strong>Adresse:</strong> {bienSelectionne.adresse}, {bienSelectionne.commune}</div>
                      <div><strong>Surface:</strong> {bienSelectionne.surface} m²</div>
                      <div><strong>Pièces:</strong> {bienSelectionne.pieces}</div>
                      <div><strong>Prix de vente:</strong> {bienSelectionne.prix_vente?.toLocaleString()} FCFA</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode de vente */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🏷️</span> Mode de vente
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Mode de paiement *</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          value="COMPTANT"
                          checked={formData.mode_vente === 'COMPTANT'}
                          onChange={(e) => handleModeVenteChange(e.target.value)}
                        />
                        <span>💵 Comptant (Paiement unique)</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          value="ECHELONNE"
                          checked={formData.mode_vente === 'ECHELONNE'}
                          onChange={(e) => handleModeVenteChange(e.target.value)}
                        />
                        <span>📅 Échelonné (Acompte + Versements)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Montants et dates */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>💰</span> Montants et dates
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Prix de vente (FCFA) *</label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.prix_vente}
                      onChange={(e) => handlePrixVenteChange(e.target.value)}
                      className={errors.prix_vente ? 'error' : ''}
                      placeholder="50 000 000"
                    />
                    {errors.prix_vente && <span className="error-message">{errors.prix_vente}</span>}
                  </div>

                  <div className="form-group">
                    <label>Frais de notaire (FCFA)</label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.frais_notaire}
                      onChange={(e) => setFormData({...formData, frais_notaire: e.target.value})}
                      placeholder="1 500 000"
                    />
                    <small className="field-hint">Généralement 7.5% du prix de vente</small>
                  </div>

                  <div className="form-group">
                    <label>Frais d'agence (FCFA)</label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.frais_agence}
                      onChange={(e) => setFormData({...formData, frais_agence: e.target.value})}
                      placeholder="1 000 000"
                    />
                    <small className="field-hint">Généralement 5% du prix de vente</small>
                  </div>

                  {formData.mode_vente === 'ECHELONNE' && (
                    <>
                      <div className="form-group">
                        <label>Acompte (FCFA) *</label>
                        <input
                          type="number"
                          step="10000"
                          value={formData.acompte}
                          onChange={(e) => handleAcompteChange(e.target.value)}
                          className={errors.acompte ? 'error' : ''}
                          placeholder="10 000 000"
                        />
                        <small className="field-hint">
                          Saisir l'acompte - Le reste à payer sera automatiquement divisé en versements
                        </small>
                        {errors.acompte && <span className="error-message">{errors.acompte}</span>}
                      </div>

                      <div className="form-group">
                        <label>Nombre de versements *</label>
                        <input
                          type="number"
                          value={formData.nombre_versements}
                          onChange={(e) => handleNombreVersementsChange(e.target.value)}
                          className={errors.nombre_versements ? 'error' : ''}
                          placeholder="1"
                          min="1"
                          max="60"
                        />
                        <small className="field-hint">Maximum 60 versements</small>
                        {errors.nombre_versements && <span className="error-message">{errors.nombre_versements}</span>}
                      </div>

                      <div className="form-group">
                        <label>Montant par versement (FCFA)</label>
                        <input
                          type="number"
                          value={formData.montant_versement}
                          readOnly
                          className="readonly"
                        />
                        <small className="field-hint">Calculé automatiquement: (Prix - Acompte) / Nombre de versements</small>
                        {errors.montant_versement && <span className="error-message">{errors.montant_versement}</span>}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Date de signature *</label>
                    <input
                      type="date"
                      value={formData.date_debut}
                      onChange={(e) => setFormData({...formData, date_debut: e.target.value})}
                      className={errors.date_debut ? 'error' : ''}
                    />
                    {errors.date_debut && <span className="error-message">{errors.date_debut}</span>}
                  </div>

                  <div className="form-group">
                    <label>Date de fin (optionnel)</label>
                    <input
                      type="date"
                      value={formData.date_fin}
                      onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Récapitulatif pour échelonné */}
              {formData.mode_vente === 'ECHELONNE' && prixVenteValue > 0 && (
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>📊</span> Récapitulatif
                  </div>
                  <div className="info-panel">
                    <div className="info-grid recap-grid">
                      <div className="recap-item">
                        <span className="recap-label">💰 Prix de vente:</span>
                        <span className="recap-value">{prixVenteValue.toLocaleString()} FCFA</span>
                      </div>
                      <div className="recap-item">
                        <span className="recap-label">💵 Acompte:</span>
                        <span className="recap-value">{acompteValue.toLocaleString()} FCFA</span>
                      </div>
                      <div className="recap-item highlight">
                        <span className="recap-label">📉 Reste à payer:</span>
                        <span className="recap-value">{resteAPayer.toLocaleString()} FCFA</span>
                      </div>
                      <div className="recap-item">
                        <span className="recap-label">🔢 Nombre de versements:</span>
                        <span className="recap-value">{formData.nombre_versements}</span>
                      </div>
                      <div className="recap-item highlight">
                        <span className="recap-label">📅 Montant par versement:</span>
                        <span className="recap-value">{montantVersementValue.toLocaleString()} FCFA</span>
                      </div>
                      <div className="recap-item">
                        <span className="recap-label">🏛️ Frais de notaire:</span>
                        <span className="recap-value">{(parseFloat(formData.frais_notaire) || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="recap-item">
                        <span className="recap-label">🏢 Frais d'agence:</span>
                        <span className="recap-value">{(parseFloat(formData.frais_agence) || 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clauses particulières */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📝</span> Clauses particulières
                </div>
                <div className="form-group full-width">
                  <textarea
                    value={formData.clause_particuliere}
                    onChange={(e) => setFormData({...formData, clause_particuliere: e.target.value})}
                    rows={4}
                    placeholder="Clauses particulières du contrat de vente..."
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
              contrat ? '💾 Modifier le contrat' : '💾 Créer le contrat de vente'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}