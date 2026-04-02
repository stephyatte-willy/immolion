'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MODES_PAIEMENT, STATUTS_PAIEMENT, TYPES_PAIEMENT, MOIS } from '@/app/types/paiements';
import toast from 'react-hot-toast';
import { useTheme } from '@/app/providers/ThemeProvider';
import { prochainPaiementService } from '@/app/services/prochainPaiementService';
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

  const [contrats, setContrats] = useState<any[]>([]);
  const [contratSelectionne, setContratSelectionne] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContrats, setIsLoadingContrats] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [versementsPrecedents, setVersementsPrecedents] = useState<any[]>([]);
  const [totalVersements, setTotalVersements] = useState(0);
  const [periodesAPayer, setPeriodesAPayer] = useState<any[]>([]);
  const [isLoadingPeriodes, setIsLoadingPeriodes] = useState(false);
  const [prochainPaiement, setProchainPaiement] = useState<any>(null);
  const [messageStatut, setMessageStatut] = useState('');

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = MOIS;

  const isVente = contratSelectionne?.type_contrat === 'VENTE';

  // ✅ Fonction pour calculer le reste à payer d'un contrat de vente
  const calculerResteAPayer = async (contrat: any): Promise<number> => {
    try {
      // Récupérer tous les paiements de ce contrat (type_transaction = VENTE)
      const response = await fetch(`/api/paiements?contrat_id=${contrat.id}&type_transaction=VENTE`);
      const data = await response.json();
      
      if (data.success && data.paiements) {
        const totalPaye = data.paiements.reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.montant) || 0);
        }, 0);
        const prixVente = parseFloat(contrat.prix_vente) || 0;
        return prixVente - totalPaye;
      }
      return parseFloat(contrat.prix_vente) || 0;
    } catch (error) {
      console.error('Erreur calcul reste à payer:', error);
      return parseFloat(contrat.prix_vente) || 0;
    }
  };

  // ✅ Charger les contrats au montage
  useEffect(() => {
    chargerContrats();
  }, [propLocataireId, propAcquereurId]);

  // ✅ Charger les contrats avec calcul du reste à payer
  // ✅ Charger les contrats avec calcul du reste à payer
const chargerContrats = async () => {
  setIsLoadingContrats(true);
  try {
    let url = '/api/contrats?statut=ACTIF';
    
    if (propLocataireId) {
      url = `/api/contrats?locataire_id=${propLocataireId}&statut=ACTIF`;
    }
    else if (propAcquereurId) {
      url = `/api/contrats?acquereur_id=${propAcquereurId}&statut=ACTIF`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success && data.contrats) {
      // ✅ Filtrer les contrats actifs uniquement (statut = ACTIF)
      const contratsActifs = data.contrats.filter((c: any) => c.statut === 'ACTIF');
      
      // ✅ Pour chaque contrat de vente, calculer le reste à payer
      const contratsAvecReste = await Promise.all(
        contratsActifs.map(async (contrat: any) => {
          if (contrat.type_contrat === 'VENTE') {
            // Récupérer tous les paiements de vente
            const paiementsResponse = await fetch(`/api/paiements?contrat_id=${contrat.id}&type_transaction=VENTE`);
            const paiementsData = await paiementsResponse.json();
            
            let totalPaye = 0;
            if (paiementsData.success && paiementsData.paiements) {
              totalPaye = paiementsData.paiements.reduce((sum: number, p: any) => {
                return sum + (parseFloat(p.montant) || 0);
              }, 0);
            }
            
            const prixVente = parseFloat(contrat.prix_vente) || 0;
            const resteAPayer = prixVente - totalPaye;
            
            return {
              ...contrat,
              totalPaye,
              resteAPayer
            };
          }
          return {
            ...contrat,
            resteAPayer: 0
          };
        })
      );
      
      // ✅ Pour les ventes, ne garder que ceux avec reste > 0
      const contratsFiltres = contratsAvecReste.filter((contrat: any) => {
        if (contrat.type_contrat === 'VENTE') {
          return contrat.resteAPayer > 0;
        }
        return true;
      });
      
      setContrats(contratsFiltres);
      
      // Sélection du contrat si fourni
      if (contrat_id) {
        const contratTrouve = contratsFiltres.find((c: any) => c.id === contrat_id);
        if (contratTrouve) {
          setContratSelectionne(contratTrouve);
          setFormData(prev => ({ ...prev, contrat_id: contrat_id.toString() }));
        }
      }
      else if (paiement && paiement.contrat_id) {
        const contratTrouve = contratsFiltres.find((c: any) => c.id === paiement.contrat_id);
        if (contratTrouve) {
          setContratSelectionne(contratTrouve);
          setFormData(prev => ({ ...prev, contrat_id: paiement.contrat_id.toString() }));
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

  // ✅ Effet pour calculer le prochain paiement
  useEffect(() => {
    if (contratSelectionne && !isVente) {
      calculerProchainPaiement();
    }
  }, [contratSelectionne, periodesAPayer]);

  const calculerProchainPaiement = async () => {
    if (!contratSelectionne) return;
    
    try {
      const response = await fetch(`/api/paiements?contrat_id=${contratSelectionne.id}&type_paiement=LOYER`);
      const data = await response.json();
      const paiementsExistants = data.success ? data.paiements : [];
      
      const conditionsRes = await fetch(`/api/contrats/${contratSelectionne.id}/conditions`);
      const conditionsData = await conditionsRes.json();
      const conditions = conditionsData.success ? conditionsData.conditions : null;
      
      const nombreMoisAvance = conditions?.nombre_mois_avance || 0;
      const dateDebut = new Date(contratSelectionne.date_debut);
      const loyerMensuel = parseFloat(contratSelectionne.loyer_mensuel) || 0;
      const chargesMensuelles = parseFloat(contratSelectionne.charges_mensuelles) || 0;
      
      const prochain = prochainPaiementService.calculerProchainPaiementLocation(
        dateDebut,
        loyerMensuel,
        chargesMensuelles,
        nombreMoisAvance,
        paiementsExistants
      );
      
      setProchainPaiement(prochain);
      setMessageStatut(prochainPaiementService.getMessageStatut(prochain, paiementsExistants));
      
      if (prochain) {
        setFormData(prev => ({
          ...prev,
          mois_concerne: prochain.mois_concerne,
          montant: prochain.montant.toString(),
          date_paiement: new Date().toISOString().split('T')[0],
          type_paiement: 'LOYER'
        }));
      }
    } catch (error) {
      console.error('Erreur calcul prochain paiement:', error);
    }
  };

  // ✅ Charger les versements précédents pour les ventes
  useEffect(() => {
    if (contratSelectionne && isVente) {
      chargerVersementsPrecedents(contratSelectionne.id);
    }
  }, [contratSelectionne, isVente]);

  // ✅ Charger les périodes à payer pour les locations
  useEffect(() => {
    if (contratSelectionne && !isVente && contratSelectionne.id) {
      chargerPeriodesAPayer(contratSelectionne.id);
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
        acquereur_id: contratSelectionne.acquereur_id?.toString() || '',
        bien_id: contratSelectionne.bien_id?.toString() || '',
        montant: isContratVente ? '' : (contratSelectionne.loyer_mensuel?.toString() || prev.montant),
        montant_total_vente: isContratVente ? (contratSelectionne.prix_vente?.toString() || '') : '',
        type_paiement: isContratVente ? 'ACOMPTE' : 'LOYER',
      }));
    }
  }, [contratSelectionne]);

  // ✅ Mode édition - pré-remplir les données du paiement
  useEffect(() => {
    if (paiement) {
      setFormData({
        contrat_id: paiement.contrat_id?.toString() || '',
        locataire_id: paiement.locataire_id?.toString() || '',
        acquereur_id: paiement.acquereur_id?.toString() || '',
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
    }
  }, [paiement]);

  // ✅ Charger les versements précédents
  const chargerVersementsPrecedents = async (contratId: number) => {
    try {
      // Récupérer tous les paiements de vente pour ce contrat
      const response = await fetch(`/api/paiements?contrat_id=${contratId}&type_transaction=VENTE`);
      const data = await response.json();
      if (data.success) {
        setVersementsPrecedents(data.paiements);
        
        const total = data.paiements.reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.montant) || 0);
        }, 0);
        
        setTotalVersements(total);
        
        const maxNumero = Math.max(...data.paiements.map((p: any) => p.versement_numero || 0), 0);
        setFormData(prev => ({
          ...prev,
          versement_numero: (maxNumero + 1).toString(),
          echeancier_id: `VENTE-${contratId}-${new Date().getFullYear()}`
        }));
      }
    } catch (error) {
      console.error('Erreur chargement versements:', error);
    }
  };

  // ✅ Charger les périodes à payer
  const chargerPeriodesAPayer = async (contratId: number) => {
    setIsLoadingPeriodes(true);
    try {
      const response = await fetch(`/api/periodes-location?contrat_id=${contratId}&statut=EN_ATTENTE,EN_RETARD`);
      const data = await response.json();
      if (data.success && data.periodes) {
        setPeriodesAPayer(data.periodes);
      } else {
        setPeriodesAPayer([]);
      }
    } catch (error) {
      console.error('Erreur chargement périodes:', error);
      setPeriodesAPayer([]);
    } finally {
      setIsLoadingPeriodes(false);
    }
  };

  const formaterNombreSansDecimales = (valeur: any): string => {
    if (valeur === null || valeur === undefined || valeur === '') {
      return '0';
    }
    
    let nombre: number;
    if (typeof valeur === 'string') {
      const nettoye = valeur.replace(/\s/g, '').replace(',', '.');
      nombre = parseFloat(nettoye);
    } else {
      nombre = valeur;
    }
    
    if (isNaN(nombre)) {
      return '0';
    }
    
    const nombreArrondi = Math.round(nombre);
    return nombreArrondi.toLocaleString('fr-FR');
  };

  const resteAPayer = useMemo(() => {
    if (!isVente || !contratSelectionne?.prix_vente) return 0;
    
    let prixVente = 0;
    if (typeof contratSelectionne.prix_vente === 'string') {
      prixVente = parseFloat(contratSelectionne.prix_vente);
    } else {
      prixVente = contratSelectionne.prix_vente || 0;
    }
    
    const reste = prixVente - totalVersements;
    return isNaN(reste) ? 0 : reste;
  }, [isVente, contratSelectionne, totalVersements]);

  const handleContratChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setContratSelectionne(null);
      setPeriodesAPayer([]);
      return;
    }
    
    const contrat = contrats.find(c => c.id.toString() === id);
    setContratSelectionne(contrat || null);
    if (contrat?.type_contrat === 'VENTE') {
      await chargerVersementsPrecedents(contrat.id);
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

    if (!isVente && !formData.mois_concerne && periodesAPayer.length > 0) {
      newErrors.mois_concerne = 'Veuillez sélectionner le mois concerné';
    }

    if (isVente) {
      if (!formData.type_vente) {
        newErrors.type_vente = 'Le type de versement est requis';
      } else if (formData.type_vente === 'ACOMPTE') {
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
        contrat_id: parseInt(formData.contrat_id),
        bien_id: parseInt(formData.bien_id),
        locataire_id: formData.locataire_id ? parseInt(formData.locataire_id) : null,
        acquereur_id: formData.acquereur_id ? parseInt(formData.acquereur_id) : null,
        type_paiement: isVente ? formData.type_vente : formData.type_paiement,
        type_vente: isVente ? formData.type_vente : null,
        montant: parseFloat(formData.montant),
        montant_total_vente: formData.montant_total_vente ? parseFloat(formData.montant_total_vente) : null,
        versement_numero: formData.versement_numero ? parseInt(formData.versement_numero) : null,
        echeancier_id: formData.echeancier_id || null,
        date_paiement: formData.date_paiement,
        date_echeance: formData.date_echeance || null,
        mode_paiement: formData.mode_paiement,
        reference: formData.reference || null,
        statut: formData.statut,
        mois_concerne: formData.mois_concerne || null,
        penalite: parseFloat(formData.penalite) || 0,
        commentaire: formData.commentaire || null
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

  const safeFormatMoney = (montant: number) => {
    if (isNaN(montant) || montant === null || montant === undefined) {
      return formatMoney(0);
    }
    return formatMoney(montant);
  };

  // ✅ Obtenir le texte du contrat pour l'affichage
  const getContratDisplay = (contrat: any) => {
    if (contrat.type_contrat === 'VENTE') {
      const reste = contrat.resteAPayer !== undefined ? contrat.resteAPayer : '?';
      return `${contrat.numero_contrat} - VENTE - ${contrat.bien?.nom || 'Bien'} - Reste: ${formaterNombreSansDecimales(reste)} FCFA`;
    }
    return `${contrat.numero_contrat} - LOCATION - ${contrat.bien?.nom || 'Bien'} - ${formaterNombreSansDecimales(contrat.loyer_mensuel)} FCFA/mois`;
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
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📄</span> Sélection du contrat
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
                        <option value="">Sélectionnez un contrat</option>
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
                        ⚠️ Aucun contrat actif trouvé. Veuillez d'abord créer un contrat.
                      </div>
                    )}
                  </div>
                </div>
                
                {contratSelectionne && (
                  <div className="info-panel">
                    <h4>Détails du contrat</h4>
                    <div className="info-grid">
                      <div>
                        <strong>Client:</strong> 
                        {contratSelectionne.locataire ? 
                          `${contratSelectionne.locataire.prenom} ${contratSelectionne.locataire.nom}` : 
                          contratSelectionne.acquereur ? 
                            `${contratSelectionne.acquereur.prenom} ${contratSelectionne.acquereur.nom}` : 
                            'Non spécifié'}
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
                            <strong>Prix de vente:</strong> {formaterNombreSansDecimales(contratSelectionne.prix_vente)} FCFA
                          </div>
                          <div>
                            <strong>Déjà versé:</strong> {formaterNombreSansDecimales(totalVersements)} FCFA
                          </div>
                          <div>
                            <strong>Reste à payer:</strong> <span className="highlight">{formaterNombreSansDecimales(resteAPayer)} FCFA</span>
                          </div>
                        </>
                      ) : (
                        <div>
                          <strong>Loyer mensuel:</strong> {formaterNombreSansDecimales(contratSelectionne.loyer_mensuel)} FCFA
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* (Le reste du formulaire reste identique) */}
              {contratSelectionne && !isVente && (
                <div className="info-panel">
                  <h4>📅 Prochain paiement</h4>
                  <div className={`statut-message ${prochainPaiement?.estEnRetard ? 'retard' : prochainPaiementService.estDansPeriodePaiement() ? 'alerte' : 'info'}`}>
                    {messageStatut}
                  </div>
                  {prochainPaiement && (
                    <div className="prochain-paiement-details">
                      <div className="detail-row">
                        <span className="detail-label">Mois concerné:</span>
                        <span className="detail-value">{prochainPaiement.mois_concerne}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Montant à payer:</span>
                        <span className="detail-value highlight">{safeFormatMoney(prochainPaiement.montant)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Date d'échéance:</span>
                        <span className={`detail-value ${prochainPaiement.estEnRetard ? 'retard' : ''}`}>
                          {prochainPaiement.date_echeance}
                        </span>
                      </div>
                      {prochainPaiement.estEnRetard && (
                        <div className="detail-row alert">
                          <span className="alert-icon">⚠️</span>
                          <span className="alert-text">Ce paiement est en retard. Des pénalités peuvent s'appliquer.</span>
                        </div>
                      )}
                      {!prochainPaiement.estEnRetard && prochainPaiementService.estDansPeriodePaiement() && (
                        <div className="detail-row success">
                          <span className="success-icon">✅</span>
                          <span className="success-text">Nous sommes dans la période de paiement (1er-10 du mois).</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {contratSelectionne && contratSelectionne.type_contrat !== 'VENTE' && (
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>📅</span> Période à payer
                  </div>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Mois concerné *</label>
                      {isLoadingPeriodes ? (
                        <div className="loading-small">Chargement des périodes...</div>
                      ) : periodesAPayer.length > 0 ? (
                        <select
                          value={formData.mois_concerne}
                          onChange={(e) => setFormData({...formData, mois_concerne: e.target.value})}
                          className={errors.mois_concerne ? 'error' : ''}
                        >
                          <option value="">Sélectionnez le mois</option>
                          {periodesAPayer.map((periode: any, index: number) => (
                            <option key={periode.id || index} value={periode.mois_concerne}>
                              {periode.mois_concerne} - {safeFormatMoney(periode.total_du)}
                              {periode.statut === 'EN_RETARD' && ' (⚠️ En retard)'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="info-message success">
                          ✅ Aucun paiement en attente. Tous les loyers sont à jour.
                        </div>
                      )}
                      {errors.mois_concerne && <span className="error-message">{errors.mois_concerne}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Type de paiement */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🏷️</span> Type de paiement
                </div>
                <div className="form-grid">
                  {isVente ? (
                    <>
                      <div className="form-group">
                        <label>Type de versement *</label>
                        <select
                          value={formData.type_vente}
                          onChange={(e) => setFormData({...formData, type_vente: e.target.value})}
                          className={errors.type_vente ? 'error' : ''}
                        >
                          <option value="">Sélectionnez le type</option>
                          <option value="ACOMPTE">Acompte</option>
                          <option value="VERSEMENT">Versement</option>
                          <option value="SOLDE">Solde final</option>
                        </select>
                        {errors.type_vente && <span className="error-message">{errors.type_vente}</span>}
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
                      step="1000"
                      value={formData.montant}
                      onChange={(e) => setFormData({...formData, montant: e.target.value})}
                      className={errors.montant ? 'error' : ''}
                      placeholder={isVente ? "Montant du versement" : "150000"}
                    />
                    {errors.montant && <span className="error-message">{errors.montant}</span>}

                    {isVente && resteAPayer > 0 && (
                      <small className="field-hint">
                        Reste à payer: {formaterNombreSansDecimales(resteAPayer)} FCFA
                      </small>
                    )}

                    {!isVente && contratSelectionne && (
                      <small className="field-hint">
                        Loyer mensuel: {formaterNombreSansDecimales(contratSelectionne.loyer_mensuel)} FCFA
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