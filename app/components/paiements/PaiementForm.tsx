'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MODES_PAIEMENT, STATUTS_PAIEMENT, TYPES_PAIEMENT, MOIS } from '@/app/types/paiements';
import toast from 'react-hot-toast';
import { useTheme } from '@/app/providers/ThemeProvider';
import { PaiementLocationService } from '@/app/services/paiementLocationService';
import './paiements.css';

interface PaiementFormProps {
  paiement: any | null;
  contrat_id?: number;
  locataire_id?: number;
  acquereur_id?: number;
  bien_id?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaiementForm({ 
  paiement, 
  contrat_id, 
  locataire_id: propLocataireId, 
  acquereur_id: propAcquereurId, 
  bien_id: propBienId, 
  onClose, 
  onSuccess 
}: PaiementFormProps) {
  const { formatMoney } = useTheme();
  
  const [formData, setFormData] = useState({
    contrat_id: contrat_id?.toString() || '',
    locataire_id: propLocataireId?.toString() || '',
    acquereur_id: propAcquereurId?.toString() || '',
    bien_id: propBienId?.toString() || '',
    type_paiement: 'LOYER',
    montant: '',
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'ESPECES',
    reference: '',
    statut: 'EFFECTUE',
    mois_concerne: '',
    penalite: '0',
    commentaire: ''
  });

  const [contrats, setContrats] = useState<any[]>([]);
  const [contratSelectionne, setContratSelectionne] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContrats, setIsLoadingContrats] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prochainPaiement, setProchainPaiement] = useState<any>(null);
  const [messageInfo, setMessageInfo] = useState('');

  // ✅ Charger les contrats de location
  useEffect(() => {
    chargerContrats();
  }, [propLocataireId]);

  const chargerContrats = async () => {
    setIsLoadingContrats(true);
    try {
      let url = '/api/contrats?type_contrat=BAIL_VIDE';
      if (propLocataireId) {
        url = `/api/contrats?locataire_id=${propLocataireId}&type_contrat=BAIL_VIDE`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.contrats) {
        const contratsLocation = data.contrats.filter((c: any) => 
          c.statut !== 'TERMINE'
        );
        setContrats(contratsLocation);
        
        if (contrat_id) {
          const contratTrouve = contratsLocation.find((c: any) => c.id === contrat_id);
          if (contratTrouve) {
            await selectionnerContrat(contratTrouve);
          }
        }
        else if (paiement && paiement.contrat_id) {
          const contratTrouve = contratsLocation.find((c: any) => c.id === paiement.contrat_id);
          if (contratTrouve) {
            await selectionnerContrat(contratTrouve);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement contrats:', error);
      toast.error('Erreur de chargement des contrats');
    } finally {
      setIsLoadingContrats(false);
    }
  };

  // ✅ Sélectionner un contrat et charger ses détails
  const selectionnerContrat = async (contrat: any) => {
    setIsLoadingDetails(true);
    setContratSelectionne(contrat);
    
    try {
      // Charger les conditions
      const conditionsRes = await fetch(`/api/contrats/${contrat.id}/conditions`);
      const conditionsData = await conditionsRes.json();
      setConditions(conditionsData.success ? conditionsData.conditions : null);
      
      // Charger les périodes de location
      const periodesRes = await fetch(`/api/periodes-location?contrat_id=${contrat.id}`);
      const periodesData = await periodesRes.json();
      setPeriodes(periodesData.success ? periodesData.periodes : []);
      
      // Calculer le prochain paiement
      calculerProchainPaiement(contrat, conditionsData.conditions, periodesData.periodes);
      
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // ✅ Calculer le prochain paiement à effectuer
  const calculerProchainPaiement = (contrat: any, conditionsData: any, periodesData: any[]) => {
    const loyerMensuel = parseFloat(contrat.loyer_mensuel) || 0;
    
    const conditionsLocation = {
      caution_paye: conditionsData?.caution_paye || false,
      avance_paye: conditionsData?.avance_paye || false,
      montant_caution: parseFloat(conditionsData?.caution) || (loyerMensuel * 2),
      montant_avance: parseFloat(conditionsData?.montant_avance) || (loyerMensuel * 2),
      nombre_mois_avance: conditionsData?.nombre_mois_avance || 2
    };
    
    const prochain = PaiementLocationService.getProchainPaiement(
      conditionsLocation,
      periodesData || [],
      loyerMensuel
    );
    
    setProchainPaiement(prochain);
    
    if (prochain) {
      let message = '';
      switch (prochain.type) {
        case 'CAUTION':
          message = `🔒 Premier paiement: Caution de ${formatMoney(prochain.montant)} (2 mois de loyer)`;
          break;
        case 'AVANCE':
          message = `⏩ Deuxième paiement: Avance de ${formatMoney(prochain.montant)} (${conditionsLocation.nombre_mois_avance} mois)`;
          break;
        case 'LOYER':
          message = `🏠 Paiement du loyer: ${formatMoney(prochain.montant)} pour le mois de ${prochain.mois_concerne}`;
          break;
      }
      setMessageInfo(message);
      
      // Pré-remplir le formulaire
      setFormData(prev => ({
        ...prev,
        contrat_id: contrat.id.toString(),
        locataire_id: contrat.locataire_id?.toString() || '',
        bien_id: contrat.bien_id?.toString() || '',
        type_paiement: prochain.type,
        montant: prochain.montant.toString(),
        mois_concerne: prochain.mois_concerne || ''
      }));
    } else {
      setMessageInfo('✅ Tous les paiements sont à jour !');
    }
  };

  const handleContratChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setContratSelectionne(null);
      setConditions(null);
      setPeriodes([]);
      setProchainPaiement(null);
      return;
    }
    
    const contrat = contrats.find(c => c.id.toString() === id);
    if (contrat) {
      await selectionnerContrat(contrat);
    }
  };

  // ✅ Vérifier si le type de paiement est autorisé
  const isPaiementAutorise = (type: string, moisConcerne?: string): boolean => {
    if (!conditions) return type === 'CAUTION';
    
    const conditionsLocation = {
      caution_paye: conditions.caution_paye || false,
      avance_paye: conditions.avance_paye || false,
      montant_caution: parseFloat(conditions.caution) || 0,
      montant_avance: parseFloat(conditions.montant_avance) || 0,
      nombre_mois_avance: conditions.nombre_mois_avance || 2
    };
    
    const result = PaiementLocationService.isPaiementAutorise(
      conditionsLocation,
      periodes,
      type,
      moisConcerne
    );
    
    if (!result.autorise) {
      toast.error(result.message);
    }
    return result.autorise;
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

    if (formData.type_paiement === 'LOYER' && !formData.mois_concerne) {
      newErrors.mois_concerne = 'Veuillez sélectionner le mois concerné';
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

    // Vérifier l'autorisation avant soumission
    if (!isPaiementAutorise(formData.type_paiement, formData.mois_concerne)) {
      return;
    }

    setIsLoading(true);

    try {
      const contrat = contrats.find(c => c.id.toString() === formData.contrat_id);
      
      if (!contrat) {
        toast.error('Contrat non trouvé');
        setIsLoading(false);
        return;
      }
      
      const dataToSend = {
        contrat_id: parseInt(formData.contrat_id),
        bien_id: contrat.bien_id,
        locataire_id: contrat.locataire_id,
        type_paiement: formData.type_paiement,
        type_transaction: 'LOCATION',
        montant: parseFloat(formData.montant),
        date_paiement: formData.date_paiement,
        mode_paiement: formData.mode_paiement,
        reference: formData.reference || null,
        statut: formData.statut,
        mois_concerne: formData.type_paiement === 'LOYER' ? formData.mois_concerne : null,
        penalite: parseFloat(formData.penalite) || 0,
        commentaire: formData.commentaire || null,
        est_paiement_initial: formData.type_paiement !== 'LOYER' ? 1 : 0
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
        
        // Recharger les données pour mettre à jour l'état
        if (contrat) {
          await selectionnerContrat(contrat);
        }
        
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

  const safeFormatMoney = (montant: number) => {
    if (isNaN(montant) || montant === null || montant === undefined) {
      return formatMoney(0);
    }
    return formatMoney(montant);
  };

  const getContratDisplay = (contrat: any) => {
    const statutLabel = contrat.statut === 'ACTIF' ? '🟢 Actif' : '🟡 Brouillon';
    const loyer = parseFloat(contrat.loyer_mensuel).toLocaleString();
    return `${contrat.numero_contrat} - ${contrat.bien?.nom || 'Bien'} - ${loyer} FCFA/mois ${statutLabel}`;
  };

  const getTypePaiementLabel = (type: string) => {
    switch (type) {
      case 'CAUTION': return '🔒 Caution (2 mois)';
      case 'AVANCE': return '⏩ Avance loyer';
      case 'LOYER': return '🏠 Loyer mensuel';
      default: return type;
    }
  };

  // ✅ Générer les options de mois pour les loyers (seulement après caution+avance)
  const getMoisOptions = () => {
    if (!prochainPaiement || prochainPaiement.type !== 'LOYER') return [];
    
    return periodes
      .filter(p => p.statut !== 'PAYE')
      .map(p => ({
        value: p.mois_concerne,
        label: new Date(p.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      }));
  };

  const moisOptions = getMoisOptions();

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
          <h2>{paiement ? 'Modifier le paiement' : 'Nouveau paiement location'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="paiement-form">
            <div className="form-sections">
              {/* Sélection du contrat */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📄</span> Sélection du contrat de location
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Contrat *</label>
                    {isLoadingContrats ? (
                      <div className="loading-small">Chargement des contrats...</div>
                    ) : (
                      <select
                        value={formData.contrat_id}
                        onChange={handleContratChange}
                        className={errors.contrat_id ? 'error' : ''}
                        disabled={!!paiement}
                      >
                        <option value="">Sélectionnez un contrat de location</option>
                        {contrats.map((contrat: any) => (
                          <option key={contrat.id} value={contrat.id}>
                            {getContratDisplay(contrat)}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.contrat_id && <span className="error-message">{errors.contrat_id}</span>}
                    {!isLoadingContrats && contrats.length === 0 && (
                      <div className="info-message warning">
                        ⚠️ Aucun contrat de location trouvé. Veuillez d'abord créer un contrat de location.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Détails du contrat et progression */}
              {contratSelectionne && (
                <>
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>📋</span> Détails du contrat
                    </div>
                    <div className="info-panel">
                      <div className="info-grid">
                        <div><strong>Locataire:</strong> {contratSelectionne.locataire?.prenom} {contratSelectionne.locataire?.nom}</div>
                        <div><strong>Bien:</strong> {contratSelectionne.bien?.nom}</div>
                        <div><strong>Loyer mensuel:</strong> {safeFormatMoney(parseFloat(contratSelectionne.loyer_mensuel))}</div>
                        <div><strong>Date début:</strong> {new Date(contratSelectionne.date_debut).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Prochain paiement à effectuer */}
                  {isLoadingDetails ? (
                    <div className="loading-small">Chargement des informations...</div>
                  ) : prochainPaiement && (
                    <div className="form-section highlight-section">
                      <div className="modal-section-title">
                        <span>🎯</span> Prochain paiement à effectuer
                      </div>
                      <div className="auto-versement-card">
                        <div className="auto-versement-header">
                          <span className="auto-versement-icon">
                            {prochainPaiement.type === 'CAUTION' && '🔒'}
                            {prochainPaiement.type === 'AVANCE' && '⏩'}
                            {prochainPaiement.type === 'LOYER' && '🏠'}
                          </span>
                          <div className="auto-versement-info">
                            <h4>{getTypePaiementLabel(prochainPaiement.type)}</h4>
                            <p>{prochainPaiement.description}</p>
                          </div>
                        </div>
                        <div className="auto-versement-message">
                          <span className="message-icon">ℹ️</span>
                          <span>{messageInfo}</span>
                        </div>
                        <div className="auto-versement-montant">
                          <span>Montant à payer:</span>
                          <strong>{safeFormatMoney(prochainPaiement.montant)}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Type de paiement (automatique mais modifiable) */}
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>🏷️</span> Type de paiement
                    </div>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Type *</label>
                        <select
                          value={formData.type_paiement}
                          onChange={(e) => {
                            const newType = e.target.value;
                            if (isPaiementAutorise(newType, formData.mois_concerne)) {
                              setFormData({...formData, type_paiement: newType});
                            }
                          }}
                        >
                          <option value="CAUTION">🔒 Caution (2 mois)</option>
                          <option value="AVANCE">⏩ Avance loyer</option>
                          <option value="LOYER">🏠 Loyer mensuel</option>
                        </select>
                        <small className="field-hint">
                          {formData.type_paiement === 'CAUTION' && 'Premier paiement: 2 mois de loyer en garantie'}
                          {formData.type_paiement === 'AVANCE' && 'Deuxième paiement: Avance sur loyers'}
                          {formData.type_paiement === 'LOYER' && 'Paiement mensuel du loyer (après caution et avance)'}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Mois concerné (pour loyer seulement) */}
                  {formData.type_paiement === 'LOYER' && (
                    <div className="form-section">
                      <div className="modal-section-title">
                        <span>📅</span> Mois concerné
                      </div>
                      <div className="form-grid">
                        <div className="form-group full-width">
                          <label>Mois *</label>
                          <select
                            value={formData.mois_concerne}
                            onChange={(e) => setFormData({...formData, mois_concerne: e.target.value})}
                            className={errors.mois_concerne ? 'error' : ''}
                          >
                            <option value="">Sélectionnez le mois</option>
                            {moisOptions.map((mois, idx) => (
                              <option key={idx} value={mois.value}>
                                {mois.label}
                              </option>
                            ))}
                          </select>
                          {errors.mois_concerne && <span className="error-message">{errors.mois_concerne}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Montant */}
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>💰</span> Montant
                    </div>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Montant (FCFA) *</label>
                        <input
                          type="number"
                          step="1000"
                          value={formData.montant}
                          onChange={(e) => setFormData({...formData, montant: e.target.value})}
                          className={errors.montant ? 'error' : ''}
                          placeholder="Montant du paiement"
                        />
                        {errors.montant && <span className="error-message">{errors.montant}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Date de paiement */}
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>📅</span> Date de paiement
                    </div>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Date *</label>
                        <input
                          type="date"
                          value={formData.date_paiement}
                          onChange={(e) => setFormData({...formData, date_paiement: e.target.value})}
                          className={errors.date_paiement ? 'error' : ''}
                        />
                        {errors.date_paiement && <span className="error-message">{errors.date_paiement}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Mode de paiement */}
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>💳</span> Mode de paiement
                    </div>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Mode *</label>
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
                        rows={2}
                        placeholder="Commentaire éventuel..."
                      />
                    </div>
                  </div>
                </>
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
            disabled={isLoading || !contratSelectionne}
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