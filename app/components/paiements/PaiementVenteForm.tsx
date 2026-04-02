'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MODES_PAIEMENT, STATUTS_PAIEMENT } from '@/app/types/paiements';
import toast from 'react-hot-toast';
import { useTheme } from '@/app/providers/ThemeProvider';
import './paiements.css';

interface PaiementVenteFormProps {
  paiement: any | null;
  contrat_id?: number;
  acquereur_id?: number;
  bien_id?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaiementVenteForm({ 
  paiement, 
  contrat_id, 
  acquereur_id, 
  bien_id, 
  onClose, 
  onSuccess 
}: PaiementVenteFormProps) {
  const { formatMoney } = useTheme();
  
  const [formData, setFormData] = useState({
    contrat_id: '',
    acquereur_id: '',
    bien_id: '',
    type_versement: 'ACOMPTE',
    montant: '',
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'ESPECES',
    reference: '',
    statut: 'EFFECTUE',
    commentaire: ''
  });

  const [contrats, setContrats] = useState<any[]>([]);
  const [contratSelectionne, setContratSelectionne] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContrats, setIsLoadingContrats] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [versementsPrecedents, setVersementsPrecedents] = useState<any[]>([]);
  const [totalVersements, setTotalVersements] = useState(0);
  const [montantAcompte, setMontantAcompte] = useState(0);
  const [resteAPayer, setResteAPayer] = useState(0);

  // ✅ Charger les contrats de vente
  useEffect(() => {
    chargerContratsVente();
  }, [acquereur_id]);

  const chargerContratsVente = async () => {
    setIsLoadingContrats(true);
    try {
      let url = '/api/contrats?type_contrat=VENTE';
      if (acquereur_id) {
        url = `/api/contrats?acquereur_id=${acquereur_id}&type_contrat=VENTE`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📦 Contrats de vente chargés:', data.contrats);
      
      if (data.success && data.contrats) {
        setContrats(data.contrats);
        
        // ✅ Si un contrat_id est fourni, le sélectionner automatiquement
        if (contrat_id) {
          const contratTrouve = data.contrats.find((c: any) => c.id === contrat_id);
          if (contratTrouve) {
            console.log('✅ Contrat trouvé:', contratTrouve);
            console.log('✅ Bien_id du contrat:', contratTrouve.bien_id);
            setContratSelectionne(contratTrouve);
            setFormData(prev => ({ 
              ...prev, 
              contrat_id: contrat_id.toString(),
              bien_id: contratTrouve.bien_id?.toString() || '',
              acquereur_id: contratTrouve.acquereur_id?.toString() || ''
            }));
            await chargerVersementsPrecedents(contratTrouve.id);
          }
        }
        // ✅ En mode édition, sélectionner le contrat du paiement
        else if (paiement && paiement.contrat_id) {
          const contratTrouve = data.contrats.find((c: any) => c.id === paiement.contrat_id);
          if (contratTrouve) {
            setContratSelectionne(contratTrouve);
            setFormData(prev => ({ 
              ...prev, 
              contrat_id: paiement.contrat_id.toString(),
              bien_id: contratTrouve.bien_id?.toString() || '',
              acquereur_id: contratTrouve.acquereur_id?.toString() || ''
            }));
            await chargerVersementsPrecedents(paiement.contrat_id);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement contrats de vente:', error);
    } finally {
      setIsLoadingContrats(false);
    }
  };

  const chargerVersementsPrecedents = async (contratId: number) => {
    try {
      const response = await fetch(`/api/paiements?contrat_id=${contratId}&type_transaction=VENTE`);
      const data = await response.json();
      if (data.success) {
        setVersementsPrecedents(data.paiements);
        
        const total = data.paiements.reduce((sum: number, p: any) => {
          let montant = parseFloat(p.montant) || 0;
          return sum + montant;
        }, 0);
        setTotalVersements(total);
        
        const acompte = data.paiements.find((p: any) => p.type_paiement === 'ACOMPTE');
        setMontantAcompte(acompte ? parseFloat(acompte.montant) : 0);
        
        if (contratSelectionne) {
          const prixVente = parseFloat(contratSelectionne.prix_vente) || 0;
          setResteAPayer(prixVente - total);
        }
      }
    } catch (error) {
      console.error('Erreur chargement versements:', error);
    }
  };

  // ✅ Mettre à jour les détails quand le contrat change
  useEffect(() => {
    if (contratSelectionne) {
      chargerVersementsPrecedents(contratSelectionne.id);
      setFormData(prev => ({
        ...prev,
        bien_id: contratSelectionne.bien_id?.toString() || '',
        acquereur_id: contratSelectionne.acquereur_id?.toString() || ''
      }));
    }
  }, [contratSelectionne]);

  // ✅ Mode édition - pré-remplir les données du paiement
  useEffect(() => {
    if (paiement && contrats.length > 0) {
      setFormData({
        contrat_id: paiement.contrat_id?.toString() || '',
        acquereur_id: paiement.acquereur_id?.toString() || '',
        bien_id: paiement.bien_id?.toString() || '',
        type_versement: paiement.type_paiement || 'ACOMPTE',
        montant: paiement.montant?.toString() || '',
        date_paiement: paiement.date_paiement?.split('T')[0] || new Date().toISOString().split('T')[0],
        mode_paiement: paiement.mode_paiement || 'ESPECES',
        reference: paiement.reference || '',
        statut: paiement.statut || 'EFFECTUE',
        commentaire: paiement.commentaire || ''
      });
      
      // Sélectionner le contrat correspondant
      const contratTrouve = contrats.find((c: any) => c.id === paiement.contrat_id);
      if (contratTrouve) {
        setContratSelectionne(contratTrouve);
      }
    }
  }, [paiement, contrats]);

  const handleContratChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setContratSelectionne(null);
      setFormData(prev => ({ ...prev, contrat_id: '', bien_id: '', acquereur_id: '' }));
      return;
    }
    
    const contrat = contrats.find(c => c.id.toString() === id);
    console.log('📦 Contrat sélectionné:', contrat);
    console.log('📦 Bien_id du contrat:', contrat?.bien_id);
    
    setContratSelectionne(contrat || null);
    setFormData(prev => ({ 
      ...prev, 
      contrat_id: id,
      bien_id: contrat?.bien_id?.toString() || '',
      acquereur_id: contrat?.acquereur_id?.toString() || ''
    }));
  };

  const getMontantSuggere = () => {
    if (!contratSelectionne) return 0;
    
    const prixVente = parseFloat(contratSelectionne.prix_vente) || 0;
    
    switch (formData.type_versement) {
      case 'ACOMPTE':
        return Math.round(prixVente * 0.1);
      case 'VERSEMENT':
        if (contratSelectionne.nombre_versements) {
          const nbVersementsRestants = contratSelectionne.nombre_versements - versementsPrecedents.filter(v => v.type_paiement === 'VERSEMENT').length;
          if (nbVersementsRestants > 0) {
            return Math.round(resteAPayer / nbVersementsRestants);
          }
        }
        return Math.round(resteAPayer);
      case 'SOLDE':
        return resteAPayer;
      default:
        return 0;
    }
  };

  const montantSuggere = getMontantSuggere();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.contrat_id) newErrors.contrat_id = 'Le contrat est requis';
    if (!formData.montant) {
      newErrors.montant = 'Le montant est requis';
    } else if (parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être positif';
    }
    if (!formData.date_paiement) newErrors.date_paiement = 'La date de paiement est requise';

    if (formData.type_versement === 'SOLDE' && parseFloat(formData.montant) > resteAPayer) {
      newErrors.montant = 'Le solde ne peut pas dépasser le reste à payer';
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
    const contrat = contrats.find(c => c.id.toString() === formData.contrat_id);
    
    if (!contrat) {
      toast.error('Contrat non trouvé');
      setIsLoading(false);
      return;
    }
    
    console.log('📦 Contrat complet:', contrat);
    console.log('📦 bien_id:', contrat.bien_id);
    console.log('📦 acquereur_id:', contrat.acquereur_id);
    
    if (!contrat.bien_id) {
      console.error('❌ Le contrat n\'a pas de bien_id:', contrat);
      toast.error('Le contrat sélectionné n\'a pas de bien associé');
      setIsLoading(false);
      return;
    }
    
    const isSolde = formData.type_versement === 'SOLDE';
    const isDernierVersement = isSolde || (resteAPayer - parseFloat(formData.montant) <= 0);
    
    const dataToSend = {
      contrat_id: parseInt(formData.contrat_id),
      bien_id: contrat.bien_id,
      acquereur_id: acquereur_id || contrat.acquereur_id,
      type_paiement: formData.type_versement,
      type_transaction: 'VENTE',
      type_vente: formData.type_versement,
      montant: parseFloat(formData.montant),
      date_paiement: formData.date_paiement,
      mode_paiement: formData.mode_paiement,
      reference: formData.reference || null,
      statut: formData.statut,
      commentaire: formData.commentaire || null,
      versement_numero: formData.type_versement === 'VERSEMENT' ? versementsPrecedents.filter(v => v.type_paiement === 'VERSEMENT').length + 1 : null
    };
    
    console.log('📦 Données envoyées pour paiement:', dataToSend);

    const url = paiement 
      ? `/api/paiements/${paiement.id}`
      : '/api/paiements';
    
    const method = paiement ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });

    // ✅ Lire la réponse comme texte d'abord pour voir ce qui est retourné
    const responseText = await response.text();
    console.log('📦 Réponse brute du serveur:', responseText);
    console.log('📦 Status de la réponse:', response.status);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erreur de parsing JSON:', parseError);
      console.error('❌ La réponse n\'est pas du JSON valide:', responseText);
      toast.error('Erreur de communication avec le serveur');
      setIsLoading(false);
      return;
    }

    if (data.success) {
      toast.success(paiement ? 'Versement modifié avec succès' : 'Versement enregistré avec succès');
      
      if (isDernierVersement) {
        toast.success('Contrat de vente terminé');
      }
      
      onSuccess();
    } else {
      console.error('❌ Erreur réponse:', data);
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

  const prixVente = contratSelectionne ? parseFloat(contratSelectionne.prix_vente) || 0 : 0;

  // ✅ Obtenir l'affichage du contrat
  const getContratDisplay = (contrat: any) => {
    if (!contrat) return '';
    const acquereurNom = contrat.acquereur?.type_acquereur === 'PARTICULIER' 
      ? `${contrat.acquereur.prenom} ${contrat.acquereur.nom}`
      : contrat.acquereur?.raison_sociale || contrat.acquereur?.nom;
    return `${contrat.numero_contrat} - ${contrat.bien?.nom || 'Bien'} - ${acquereurNom} - ${parseFloat(contrat.prix_vente).toLocaleString()} FCFA`;
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
        className="modal-content paiement-vente-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{paiement ? 'Modifier le versement' : 'Nouveau versement'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="paiement-form">
            <div className="form-sections">
              {/* Sélection du contrat de vente */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📄</span> Contrat de vente
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
                      >
                        <option value="">Sélectionnez un contrat de vente</option>
                        {contrats.map((contrat: any) => (
                          <option key={contrat.id} value={contrat.id}>
                            {getContratDisplay(contrat)}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.contrat_id && <span className="error-message">{errors.contrat_id}</span>}
                  </div>
                </div>
                
                {contratSelectionne && (
                  <div className="info-panel">
                    <h4>Détails du contrat de vente</h4>
                    <div className="info-grid">
                      <div><strong>Contrat:</strong> {contratSelectionne.numero_contrat}</div>
                      <div><strong>Acquéreur:</strong> {
                        contratSelectionne.acquereur?.type_acquereur === 'PARTICULIER' 
                          ? `${contratSelectionne.acquereur.prenom} ${contratSelectionne.acquereur.nom}`
                          : contratSelectionne.acquereur?.raison_sociale || contratSelectionne.acquereur?.nom
                      }</div>
                      <div><strong>Bien:</strong> {contratSelectionne.bien?.nom}</div>
                      <div><strong>Prix de vente:</strong> {safeFormatMoney(prixVente)}</div>
                      <div><strong>Acompte versé:</strong> {safeFormatMoney(montantAcompte)}</div>
                      <div><strong>Déjà versé:</strong> {safeFormatMoney(totalVersements)}</div>
                      <div><strong>Reste à payer:</strong> <span className="highlight">{safeFormatMoney(resteAPayer)}</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Type de versement */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🏷️</span> Type de versement
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Type de versement *</label>
                    <div className="radio-group-vente">
                      <label className="radio-label-vente">
                        <input
                          type="radio"
                          value="ACOMPTE"
                          checked={formData.type_versement === 'ACOMPTE'}
                          onChange={(e) => setFormData({...formData, type_versement: e.target.value})}
                          disabled={montantAcompte > 0}
                        />
                        <div className="radio-content">
                          <span className="radio-icon">💵</span>
                          <div>
                            <strong>Acompte</strong>
                            <small>Premier versement (généralement 10%)</small>
                          </div>
                        </div>
                      </label>
                      
                      <label className="radio-label-vente">
                        <input
                          type="radio"
                          value="VERSEMENT"
                          checked={formData.type_versement === 'VERSEMENT'}
                          onChange={(e) => setFormData({...formData, type_versement: e.target.value})}
                          disabled={montantAcompte === 0}
                        />
                        <div className="radio-content">
                          <span className="radio-icon">💰</span>
                          <div>
                            <strong>Versement échelonné</strong>
                            <small>Paiement mensuel ou selon échéancier</small>
                          </div>
                        </div>
                      </label>
                      
                      <label className="radio-label-vente">
                        <input
                          type="radio"
                          value="SOLDE"
                          checked={formData.type_versement === 'SOLDE'}
                          onChange={(e) => setFormData({...formData, type_versement: e.target.value})}
                          disabled={resteAPayer <= 0}
                        />
                        <div className="radio-content">
                          <span className="radio-icon">✅</span>
                          <div>
                            <strong>Solde final</strong>
                            <small>Dernier versement pour finaliser l'achat</small>
                          </div>
                        </div>
                      </label>
                    </div>
                    {errors.type_versement && <span className="error-message">{errors.type_versement}</span>}
                  </div>
                </div>
              </div>

              {/* Montant et dates */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>💰</span> Montant et date
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Montant (FCFA) *</label>
                    <input
                      type="number"
                      step="1000"
                      value={formData.montant}
                      onChange={(e) => setFormData({...formData, montant: e.target.value})}
                      className={errors.montant ? 'error' : ''}
                      placeholder={formData.type_versement === 'ACOMPTE' ? "10 000 000" : "Montant du versement"}
                    />
                    {montantSuggere > 0 && (
                      <small className="field-hint">
                        Suggestion: {safeFormatMoney(montantSuggere)}
                        <button 
                          type="button"
                          className="suggest-btn"
                          onClick={() => setFormData({...formData, montant: montantSuggere.toString()})}
                        >
                          Appliquer
                        </button>
                      </small>
                    )}
                    {errors.montant && <span className="error-message">{errors.montant}</span>}
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
                      placeholder="Référence du versement"
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
              paiement ? '💾 Modifier' : '💾 Enregistrer le versement'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}