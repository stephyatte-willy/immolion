'use client';

import { useState, useEffect } from 'react';
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
  
  // ✅ Statistiques de paiement
  const [totalVersements, setTotalVersements] = useState(0);
  const [montantAcomptePaye, setMontantAcomptePaye] = useState(0);
  const [versementsEffectues, setVersementsEffectues] = useState(0);
  const [resteAPayer, setResteAPayer] = useState(0);
  
  // ✅ Informations du contrat
  const [modePaiementContrat, setModePaiementContrat] = useState<string>('COMPTANT');
  const [montantAcompteContrat, setMontantAcompteContrat] = useState<number>(0);
  const [nombreVersementsContrat, setNombreVersementsContrat] = useState<number>(1);
  const [montantVersementContrat, setMontantVersementContrat] = useState<number>(0);
  const [prixVenteContrat, setPrixVenteContrat] = useState<number>(0);

  // ✅ États pour l'interface
  const [typeVersementDisponible, setTypeVersementDisponible] = useState<string>('ACOMPTE');
  const [montantSuggere, setMontantSuggere] = useState<number>(0);
  const [messageInfo, setMessageInfo] = useState<string>('');

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
      
      if (data.success && data.contrats) {
        // Filtrer les contrats non terminés
        const contratsFiltres = data.contrats.filter((contrat: any) => {
          if (contrat.statut === 'TERMINE') return false;
          if (contrat.bien?.statut === 'VENDU') return false;
          return true;
        });
        
        setContrats(contratsFiltres);
        
        if (contrat_id) {
          const contratTrouve = contratsFiltres.find((c: any) => c.id === contrat_id);
          if (contratTrouve) {
            await selectionnerContrat(contratTrouve);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement contrats:', error);
    } finally {
      setIsLoadingContrats(false);
    }
  };

  // ✅ Fonction principale pour sélectionner un contrat
  const selectionnerContrat = async (contrat: any) => {
    console.log('📦 Contrat sélectionné:', contrat);
    
    setContratSelectionne(contrat);
    
    // Extraire les informations du contrat
    const prixVente = parseFloat(contrat.prix_vente) || 0;
    const acompteContrat = parseFloat(contrat.acompte) || 0;
    const nbVersements = parseInt(contrat.nombre_versements) || 1;
    const montantVersement = parseFloat(contrat.montant_versement) || 0;
    const modeVente = contrat.mode_vente || 'COMPTANT';
    
    setPrixVenteContrat(prixVente);
    setModePaiementContrat(modeVente);
    setMontantAcompteContrat(acompteContrat);
    setNombreVersementsContrat(nbVersements);
    setMontantVersementContrat(montantVersement);
    
    // Mettre à jour le formulaire
    setFormData(prev => ({
      ...prev,
      contrat_id: contrat.id.toString(),
      bien_id: contrat.bien_id?.toString() || '',
      acquereur_id: contrat.acquereur_id?.toString() || ''
    }));
    
    // Charger les versements précédents
    await chargerVersementsPrecedents(contrat.id);
  };

  const chargerVersementsPrecedents = async (contratId: number) => {
    try {
      const response = await fetch(`/api/paiements?contrat_id=${contratId}&type_transaction=VENTE`);
      const data = await response.json();
      
      if (data.success) {
        const paiements = data.paiements || [];
        setVersementsPrecedents(paiements);
        
        // Calculer les totaux
        const total = paiements.reduce((sum: number, p: any) => sum + (parseFloat(p.montant) || 0), 0);
        setTotalVersements(total);
        
        const acompte = paiements.find((p: any) => p.type_paiement === 'ACOMPTE');
        setMontantAcomptePaye(acompte ? parseFloat(acompte.montant) : 0);
        
        const versements = paiements.filter((p: any) => p.type_paiement === 'VERSEMENT').length;
        setVersementsEffectues(versements);
        
        const reste = prixVenteContrat - total;
        setResteAPayer(reste);
        
        // ✅ Déterminer automatiquement le type de versement et le montant suggéré
        determinerProchainVersement();
      }
    } catch (error) {
      console.error('Erreur chargement versements:', error);
    }
  };

  // ✅ Cœur de la logique : déterminer le prochain versement à effectuer
  const determinerProchainVersement = () => {
    if (!contratSelectionne) return;
    
    // Cas 1: Paiement comptant
    if (modePaiementContrat === 'COMPTANT') {
      if (totalVersements === 0) {
        // Premier paiement = paiement total
        setTypeVersementDisponible('SOLDE');
        setMontantSuggere(prixVenteContrat);
        setMessageInfo(`💵 Paiement comptant: ${safeFormatMoney(prixVenteContrat)} à payer en une fois`);
        setFormData(prev => ({ ...prev, type_versement: 'SOLDE', montant: prixVenteContrat.toString() }));
      } else {
        // Déjà payé (normalement impossible car le contrat serait TERMINE)
        setTypeVersementDisponible('SOLDE');
        setMontantSuggere(0);
        setMessageInfo(`✅ Contrat déjà payé`);
      }
      return;
    }
    
    // Cas 2: Paiement échelonné
    if (modePaiementContrat === 'ECHELONNE') {
      
      // Étape 1: Vérifier si l'acompte doit être payé
      if (montantAcomptePaye === 0 && montantAcompteContrat > 0) {
        // Acompte non payé
        const acompteAPayer = montantAcompteContrat;
        setTypeVersementDisponible('ACOMPTE');
        setMontantSuggere(acompteAPayer);
        setMessageInfo(`💵 Premier versement: Acompte de ${safeFormatMoney(acompteAPayer)} (${Math.round((acompteAPayer / prixVenteContrat) * 100)}% du prix)`);
        setFormData(prev => ({ ...prev, type_versement: 'ACOMPTE', montant: acompteAPayer.toString() }));
        return;
      }
      
      // Étape 2: Vérifier si l'acompte a été payé mais pas tous les versements
      if (montantAcomptePaye > 0 && versementsEffectues < nombreVersementsContrat) {
        // Versements restants
        const versementsRestants = nombreVersementsContrat - versementsEffectues;
        const montantVersement = montantVersementContrat > 0 
          ? montantVersementContrat 
          : Math.round(resteAPayer / versementsRestants);
        
        setTypeVersementDisponible('VERSEMENT');
        setMontantSuggere(montantVersement);
        setMessageInfo(`📅 Versement échelonné: ${versementsEffectues + 1}/${nombreVersementsContrat} - ${safeFormatMoney(montantVersement)} par versement`);
        setFormData(prev => ({ ...prev, type_versement: 'VERSEMENT', montant: montantVersement.toString() }));
        return;
      }
      
      // Étape 3: Vérifier si c'est le solde final
      if (resteAPayer > 0) {
        setTypeVersementDisponible('SOLDE');
        setMontantSuggere(resteAPayer);
        setMessageInfo(`✅ Solde final: ${safeFormatMoney(resteAPayer)} à payer pour finaliser l'achat`);
        setFormData(prev => ({ ...prev, type_versement: 'SOLDE', montant: resteAPayer.toString() }));
        return;
      }
      
      // Tout est payé
      setTypeVersementDisponible('SOLDE');
      setMontantSuggere(0);
      setMessageInfo(`🎉 Contrat entièrement payé !`);
    }
  };

  // ✅ Recalculer quand les données changent
  useEffect(() => {
    if (contratSelectionne) {
      determinerProchainVersement();
    }
  }, [totalVersements, montantAcomptePaye, versementsEffectues, resteAPayer, contratSelectionne]);

  // ✅ Mode édition
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
      
      const contratTrouve = contrats.find((c: any) => c.id === paiement.contrat_id);
      if (contratTrouve) {
        selectionnerContrat(contratTrouve);
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
    if (contrat) {
      await selectionnerContrat(contrat);
    }
  };

  // ✅ Appliquer le montant suggéré
  const appliquerMontantSuggere = () => {
    if (montantSuggere > 0) {
      setFormData(prev => ({ ...prev, montant: montantSuggere.toString() }));
      toast.success(`Montant appliqué: ${safeFormatMoney(montantSuggere)}`);
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

    const montantValue = parseFloat(formData.montant) || 0;
    
    if (formData.type_versement === 'ACOMPTE' && montantValue > prixVenteContrat) {
      newErrors.montant = "L'acompte ne peut pas dépasser le prix de vente";
    }
    
    if (formData.type_versement === 'SOLDE' && montantValue > resteAPayer) {
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
      
      const montantValue = parseFloat(formData.montant);
      const nouveauTotal = totalVersements + montantValue;
      const isDernierVersement = (modePaiementContrat === 'COMPTANT') || (nouveauTotal >= prixVenteContrat);
      
      const dataToSend = {
        contrat_id: parseInt(formData.contrat_id),
        bien_id: contrat.bien_id,
        acquereur_id: acquereur_id || contrat.acquereur_id,
        type_paiement: formData.type_versement,
        type_transaction: 'VENTE',
        type_vente: formData.type_versement,
        montant: montantValue,
        date_paiement: formData.date_paiement,
        mode_paiement: formData.mode_paiement,
        reference: formData.reference || null,
        statut: formData.statut,
        commentaire: formData.commentaire || null,
        versement_numero: formData.type_versement === 'VERSEMENT' ? versementsEffectues + 1 : null
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
        toast.success(paiement ? 'Versement modifié avec succès' : 'Versement enregistré avec succès');
        
        if (isDernierVersement) {
          toast.success('🎉 Contrat de vente terminé !');
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
    if (!contrat) return '';
    
    const acquereurNom = contrat.acquereur?.type_acquereur === 'PARTICULIER' 
      ? `${contrat.acquereur.prenom} ${contrat.acquereur.nom}`
      : contrat.acquereur?.raison_sociale || contrat.acquereur?.nom;
    
    const prix = parseFloat(contrat.prix_vente).toLocaleString();
    const bienNom = contrat.bien?.nom || 'Bien';
    const mode = contrat.mode_vente === 'COMPTANT' ? 'Comptant' : `Échelonné (${contrat.nombre_versements}x)`;
    
    let statutInfo = '';
    if (contrat.statut === 'TERMINE') statutInfo = '✅ Terminé';
    else if (contrat.statut === 'ACTIF') statutInfo = '🟢 Actif';
    else if (contrat.statut === 'BROUILLON') statutInfo = '🟡 Brouillon';
    
    return `${contrat.numero_contrat} - ${bienNom} - ${acquereurNom} - ${prix} FCFA (${mode}) ${statutInfo}`;
  };

  // ✅ Obtenir le libellé du type de versement avec les montants
  const getTypeVersementLabel = (type: string) => {
    switch (type) {
      case 'ACOMPTE':
        return {
          title: '💵 Acompte',
          subtitle: `À payer: ${safeFormatMoney(montantAcompteContrat || Math.round(prixVenteContrat * 0.1))}`,
          color: '#f59e0b'
        };
      case 'VERSEMENT':
        return {
          title: '💰 Versement échelonné',
          subtitle: `${versementsEffectues}/${nombreVersementsContrat} versements effectués`,
          color: '#3b82f6'
        };
      case 'SOLDE':
        return {
          title: '✅ Solde final',
          subtitle: `Reste à payer: ${safeFormatMoney(resteAPayer)}`,
          color: '#10b981'
        };
      default:
        return { title: 'Versement', subtitle: '', color: '#6b7280' };
    }
  };

  const typeLabel = getTypeVersementLabel(typeVersementDisponible);

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
              {/* Sélection du contrat */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📄</span> Contrat de vente
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    {isLoadingContrats ? (
                      <div className="loading-small">Chargement des contrats...</div>
                    ) : contrats.length === 0 ? (
                      <div className="no-contrat-message">
                        <div className="no-contrat-icon">📭</div>
                        <div className="no-contrat-text">
                          <strong>Aucun contrat de vente en cours</strong>
                          <p>Pour effectuer un versement, vous devez d'abord créer un contrat de vente.</p>
                        </div>
                        <button 
                          type="button"
                          className="btn-create-contrat"
                          onClick={() => {
                            onClose();
                            window.location.href = '/acquereurs';
                          }}
                        >
                          ➕ Créer un contrat de vente
                        </button>
                      </div>
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
              </div>

              {/* Détails du contrat sélectionné */}
              {contratSelectionne && (
                <>
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>📊</span> État d'avancement
                    </div>
                    <div className="progress-panel">
                      <div className="progress-stats">
                        <div className="stat-progress">
                          <span className="stat-label">Prix total</span>
                          <span className="stat-value">{safeFormatMoney(prixVenteContrat)}</span>
                        </div>
                        <div className="stat-progress">
                          <span className="stat-label">Déjà versé</span>
                          <span className="stat-value success">{safeFormatMoney(totalVersements)}</span>
                        </div>
                        <div className="stat-progress">
                          <span className="stat-label">Reste à payer</span>
                          <span className="stat-value warning">{safeFormatMoney(resteAPayer)}</span>
                        </div>
                      </div>
                      
                      {/* Barre de progression */}
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill"
                          style={{ width: `${Math.min(100, (totalVersements / prixVenteContrat) * 100)}%` }}
                        />
                      </div>
                      <div className="progress-percent">
                        {Math.round((totalVersements / prixVenteContrat) * 100)}% payé
                      </div>
                    </div>
                  </div>

                  {/* Type de versement automatique */}
                  <div className="form-section highlight-section">
                    <div className="modal-section-title">
                      <span>🎯</span> Prochain versement à effectuer
                    </div>
                    <div className="auto-versement-card" style={{ borderLeftColor: typeLabel.color }}>
                      <div className="auto-versement-header">
                        <span className="auto-versement-icon" style={{ background: `${typeLabel.color}20`, color: typeLabel.color }}>
                          {typeVersementDisponible === 'ACOMPTE' && '💵'}
                          {typeVersementDisponible === 'VERSEMENT' && '💰'}
                          {typeVersementDisponible === 'SOLDE' && '✅'}
                        </span>
                        <div className="auto-versement-info">
                          <h4>{typeLabel.title}</h4>
                          <p>{typeLabel.subtitle}</p>
                        </div>
                      </div>
                      <div className="auto-versement-message">
                        <span className="message-icon">ℹ️</span>
                        <span>{messageInfo}</span>
                      </div>
                    </div>
                    
                    {/* Champ type_versement caché - valeur automatique */}
                    <input type="hidden" name="type_versement" value={typeVersementDisponible} />
                  </div>

                  {/* Montant à payer */}
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>💰</span> Montant du versement
                    </div>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <div className="montant-input-group">
                          <input
                            type="number"
                            step="1000"
                            value={formData.montant}
                            onChange={(e) => setFormData({...formData, montant: e.target.value})}
                            className={errors.montant ? 'error' : ''}
                            placeholder="Montant du versement"
                          />
                          {montantSuggere > 0 && (
                            <button 
                              type="button"
                              className="suggest-btn"
                              onClick={appliquerMontantSuggere}
                            >
                              💡 {safeFormatMoney(montantSuggere)}
                            </button>
                          )}
                        </div>
                        {montantSuggere > 0 && (
                          <small className="field-hint success-hint">
                            ✨ Montant recommandé: {safeFormatMoney(montantSuggere)}
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

                  {/* Mode de paiement */}
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>💳</span> Mode de paiement
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
                        <label>Référence (optionnel)</label>
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
              paiement ? '💾 Modifier le versement' : '💾 Enregistrer le versement'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}