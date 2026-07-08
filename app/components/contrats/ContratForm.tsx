'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TYPES_CONTRAT, STATUTS_CONTRAT } from '@/app/types/contrats';
import toast from 'react-hot-toast';
import './contrats.css';

interface ContratFormProps {
  contrat: any | null;
  locataire_id?: number;
  acquereur_id?: number;
  bien_id?: number;
  lot_id?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContratForm({ 
  contrat, 
  locataire_id, 
  acquereur_id,
  bien_id, 
  lot_id,
  onClose, 
  onSuccess 
}: ContratFormProps) {
  const [formData, setFormData] = useState({
    bien_id: bien_id?.toString() || '',
    lot_id: lot_id?.toString() || '',
    locataire_id: locataire_id?.toString() || '',
    acquereur_id: acquereur_id?.toString() || '',
    type_contrat: 'BAIL_VIDE',
    date_debut: '',
    date_fin: '',
    date_signature: '',
    date_etat_lieux_entree: '',
    date_etat_lieux_sortie: '',
    loyer_mensuel: '',
    charges_mensuelles: '',
    depot_garantie: '',
    clause_particuliere: '',
    statut: 'BROUILLON',
    nombre_mois_avance: '2', 
    nombre_mois_caution: '2',
    statut_validation: 'BROUILLON'
  });

  const [conditions, setConditions] = useState({
    caution: '',
    nombre_mois_avance: '1',
    paiements: [
      { type: 'CAUTION', montant: '', mode: 'ESPECES' },
      { type: 'AVANCE', montant: '', mode: 'ESPECES' }
    ]
  });

  const [biens, setBiens] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [locataires, setLocataires] = useState<any[]>([]);
  const [acquereurs, setAcquereurs] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [bienSelectionne, setBienSelectionne] = useState<any>(null);
  const [locataireSelectionne, setLocataireSelectionne] = useState<any>(null);
  const [lotSelectionne, setLotSelectionne] = useState<any>(null);
  const [reservationSelectionnee, setReservationSelectionnee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConditionsForm, setShowConditionsForm] = useState(false);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [createdContratId, setCreatedContratId] = useState<number | null>(null);
  const [lotsCharges, setLotsCharges] = useState(false);

  const isVente = formData.type_contrat === 'VENTE';

  // ✅ Charger les conditions de location existantes en mode édition
  useEffect(() => {
    if (contrat && contrat.id) {
      const chargerConditionsLocation = async () => {
        try {
          const response = await fetch(`/api/contrats/${contrat.id}/conditions`);
          const data = await response.json();
          if (data.success && data.conditions) {
            setConditions({
              caution: data.conditions.caution?.toString() || '',
              nombre_mois_avance: data.conditions.nombre_mois_avance?.toString() || '1',
              paiements: [
                { type: 'CAUTION', montant: data.conditions.caution?.toString() || '', mode: 'ESPECES' },
                { type: 'AVANCE', montant: data.conditions.montant_avance?.toString() || '', mode: 'ESPECES' }
              ]
            });
          }
        } catch (error) {
          console.error('Erreur chargement conditions:', error);
        }
      };
      
      chargerConditionsLocation();
    }
  }, [contrat]);

  // ✅ Chargement initial des listes
  useEffect(() => {
    chargerBiens();
    chargerLocataires();
    chargerAcquereurs();
  }, []);

  // ✅ Initialisation pour la création (avec préremplis)
  useEffect(() => {
    if (locataire_id && !contrat) {
      chargerLocataireDetails(locataire_id);
    }
    if (acquereur_id && !contrat) {
      chargerAcquereurDetails(acquereur_id);
    }
    if (bien_id && !contrat) {
      const bien = biens.find(b => b.id === bien_id);
      if (bien) {
        setBienSelectionne(bien);
        setFormData(prev => ({ ...prev, bien_id: bien_id.toString() }));
        if (bien.type_bien === 'IMMEUBLE') {
          chargerLotsDuBien(bien_id);
        }
      }
    }
    if (lot_id && !contrat) {
      setFormData(prev => ({ ...prev, lot_id: lot_id.toString() }));
    }
  }, [locataire_id, acquereur_id, bien_id, lot_id, biens, contrat]);

  // ✅ Initialisation pour l'édition
  useEffect(() => {
    if (contrat && biens.length > 0 && (locataires.length > 0 || acquereurs.length > 0)) {
      console.log('📝 Mode édition - Contrat:', contrat);
      
      setFormData({
        bien_id: contrat.bien_id?.toString() || '',
        lot_id: contrat.lot_id?.toString() || '',
        locataire_id: contrat.locataire_id?.toString() || '',
        acquereur_id: contrat.acquereur_id?.toString() || '',
        type_contrat: contrat.type_contrat || 'BAIL_VIDE',
        date_debut: contrat.date_debut?.split('T')[0] || '',
        date_fin: contrat.date_fin?.split('T')[0] || '',
        date_signature: contrat.date_signature?.split('T')[0] || '',
        date_etat_lieux_entree: contrat.date_etat_lieux_entree?.split('T')[0] || '',
        date_etat_lieux_sortie: contrat.date_etat_lieux_sortie?.split('T')[0] || '',
        loyer_mensuel: contrat.loyer_mensuel?.toString() || '',
        charges_mensuelles: contrat.charges_mensuelles?.toString() || '',
        depot_garantie: contrat.depot_garantie?.toString() || '',
        clause_particuliere: contrat.clause_particuliere || '',
        statut: contrat.statut || 'BROUILLON',
        nombre_mois_avance: contrat.nombre_mois_avance || '2',
        nombre_mois_caution: contrat.nombre_mois_caution || '2',
        statut_validation: contrat.statut_validation || 'BROUILLON'
      });
      
      // Récupérer le client (locataire ou acquéreur)
      if (contrat.locataire_id) {
        const locataireExistant = locataires.find(l => l.id === contrat.locataire_id);
        if (locataireExistant) {
          setLocataireSelectionne(locataireExistant);
        } else {
          fetch(`/api/locataires/${contrat.locataire_id}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                setLocataireSelectionne(data.locataire);
                setLocataires(prev => {
                  const existe = prev.some(l => l.id === data.locataire.id);
                  if (!existe) {
                    return [data.locataire, ...prev];
                  }
                  return prev;
                });
              }
            })
            .catch(err => console.error('Erreur chargement locataire:', err));
        }
      }
      
      if (contrat.acquereur_id) {
        const acquereurExistant = acquereurs.find(a => a.id === contrat.acquereur_id);
        if (acquereurExistant) {
          // Traitement pour acquéreur si nécessaire
        }
      }
      
      // Récupérer le bien du contrat
      if (contrat.bien_id) {
        const bienExistant = biens.find(b => b.id === contrat.bien_id);
        if (bienExistant) {
          setBienSelectionne(bienExistant);
          if (bienExistant.type_bien === 'IMMEUBLE' && contrat.lot_id) {
            chargerLotsDuBien(bienExistant.id);
          }
        } else {
          fetch(`/api/biens/${contrat.bien_id}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                setBienSelectionne(data.bien);
                if (data.bien.type_bien === 'IMMEUBLE' && contrat.lot_id) {
                  chargerLotsDuBien(data.bien.id);
                }
              }
            })
            .catch(err => console.error('Erreur chargement bien:', err));
        }
      }
      
      // Récupérer le lot du contrat
      if (contrat.lot_id) {
        fetch(`/api/lots/disponibles?bien_id=${contrat.bien_id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              const lot = data.lots.find((l: any) => l.id === contrat.lot_id);
              if (lot) {
                setLotSelectionne(lot);
                setFormData(prev => ({ ...prev, lot_id: contrat.lot_id.toString() }));
              }
            }
          })
          .catch(err => console.error('Erreur chargement lot:', err));
      }
    }
  }, [contrat, biens, locataires, acquereurs]);

  // Effet pour charger les lots quand le bien change
  useEffect(() => {
    if (bienSelectionne && bienSelectionne.type_bien === 'IMMEUBLE') {
      chargerLotsDuBien(bienSelectionne.id);
    } else {
      setLots([]);
      setLotSelectionne(null);
      setLotsCharges(false);
    }
  }, [bienSelectionne]);

  // Effet pour pré-remplir le loyer quand un lot est sélectionné
  useEffect(() => {
    if (lotSelectionne) {
      setFormData(prev => ({
        ...prev,
        loyer_mensuel: lotSelectionne.loyer_mensuel?.toString() || '',
        charges_mensuelles: lotSelectionne.charges?.toString() || ''
      }));
    }
  }, [lotSelectionne]);

  // Effet pour pré-remplir le loyer quand un bien simple est sélectionné
  useEffect(() => {
    if (bienSelectionne && bienSelectionne.type_bien !== 'IMMEUBLE') {
      setFormData(prev => ({
        ...prev,
        loyer_mensuel: bienSelectionne.loyer_mensuel?.toString() || '',
        charges_mensuelles: bienSelectionne.charges?.toString() || ''
      }));
    }
  }, [bienSelectionne]);

  const chargerBiens = async () => {
    try {
      const response = await fetch('/api/biens?statut=DISPONIBLE,RESERVE,LOUE');
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

  const chargerLotsDuBien = async (bienId: number) => {
    try {
      const response = await fetch(`/api/lots/disponibles?bien_id=${bienId}`);
      const data = await response.json();
      if (data.success) {
        setLots(data.lots);
        setLotsCharges(true);
      }
    } catch (error) {
      console.error('Erreur chargement lots:', error);
    }
  };

  const chargerLocataires = async () => {
    try {
      const response = await fetch('/api/locataires?statut=ACTIF,PROSPECT');
      const data = await response.json();
      if (data.success) setLocataires(data.locataires);
    } catch (error) {
      console.error('Erreur chargement locataires:', error);
    }
  };

  const chargerLocataireDetails = async (locataireId: number) => {
    try {
      const response = await fetch(`/api/locataires/${locataireId}`);
      const data = await response.json();
      if (data.success) {
        const locataire = data.locataire;
        setLocataireSelectionne(locataire);
        setFormData(prev => ({ ...prev, locataire_id: locataireId.toString() }));
        
        if (locataire.lot_actuel) {
          const lot = locataire.lot_actuel;
          const immeuble = lot.immeuble;
          if (immeuble) {
            setFormData(prev => ({
              ...prev,
              bien_id: immeuble.id?.toString() || '',
              lot_id: lot.id?.toString() || ''
            }));
            setBienSelectionne(immeuble);
          }
          setLotSelectionne(lot);
          if (immeuble) {
            await chargerLotsDuBien(immeuble.id);
          }
        } else if (locataire.bien_actuel) {
          const bien = locataire.bien_actuel;
          setFormData(prev => ({
            ...prev,
            bien_id: bien.id?.toString() || '',
            lot_id: ''
          }));
          setBienSelectionne(bien);
        }
        
        await chargerReservationsLocataire(locataireId);
      }
    } catch (error) {
      console.error('Erreur chargement locataire:', error);
    }
  };

  const chargerAcquereurDetails = async (acquereurId: number) => {
    try {
      const response = await fetch(`/api/acquereurs/${acquereurId}`);
      const data = await response.json();
      if (data.success) {
        const acquereur = data.acquereur;
        // Traitement pour acquéreur si nécessaire
        if (acquereur.bien_id) {
          const bien = biens.find(b => b.id === acquereur.bien_id);
          if (bien) {
            setBienSelectionne(bien);
            setFormData(prev => ({
              ...prev,
              bien_id: bien.id?.toString() || ''
            }));
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement acquéreur:', error);
    }
  };

  const chargerReservationsLocataire = async (locataireId: number) => {
    try {
      const response = await fetch(`/api/reservations?locataire_id=${locataireId}&statut=ACTIVE`);
      
      if (!response.ok) {
        console.warn(`Erreur API réservations: ${response.status}`);
        setReservations([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.reservations && data.reservations.length > 0) {
        setReservations(data.reservations);
        
        const currentBienId = formData.bien_id ? parseInt(formData.bien_id) : null;
        const currentLotId = formData.lot_id ? parseInt(formData.lot_id) : null;
        
        const matchingReservation = data.reservations.find((r: any) => {
          if (currentLotId && r.lot_id === currentLotId) return true;
          if (currentBienId && r.bien_id === currentBienId) return true;
          return false;
        });
        
        if (matchingReservation) {
          setReservationSelectionnee(matchingReservation);
          setReservationId(matchingReservation.id);
        }
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      setReservations([]);
    }
  };

  const creerReservation = async (): Promise<number | null> => {
    const bienId = formData.bien_id ? parseInt(formData.bien_id) : null;
    const lotId = formData.lot_id ? parseInt(formData.lot_id) : null;
    const locataireId = parseInt(formData.locataire_id);
    
    if (!locataireId || (!bienId && !lotId)) {
      toast.error('Veuillez sélectionner un locataire et un bien/lot');
      return null;
    }

    try {
      const checkResponse = await fetch(`/api/reservations?locataire_id=${locataireId}&lot_id=${lotId}&statut=ACTIVE`);
      const checkData = await checkResponse.json();
      
      if (checkData.success && checkData.reservations && checkData.reservations.length > 0) {
        const existingReservation = checkData.reservations[0];
        console.log('✅ Réservation existante trouvée:', existingReservation.id);
        setReservationId(existingReservation.id);
        setReservationSelectionnee(existingReservation);
        toast.success('Réservation existante récupérée');
        return existingReservation.id;
      }
      
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bien_id: bienId,
          lot_id: lotId,
          locataire_id: locataireId,
          duree_reservation_jours: 7
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReservationId(data.id);
        toast.success('Réservation créée avec succès');
        return data.id;
      } else {
        if (data.erreur && data.erreur.includes('déjà réservé')) {
          const retryResponse = await fetch(`/api/reservations?locataire_id=${locataireId}&lot_id=${lotId}&statut=ACTIVE`);
          const retryData = await retryResponse.json();
          if (retryData.success && retryData.reservations && retryData.reservations.length > 0) {
            const existingReservation = retryData.reservations[0];
            setReservationId(existingReservation.id);
            setReservationSelectionnee(existingReservation);
            toast.success('Réservation existante récupérée');
            return existingReservation.id;
          }
        }
        toast.error(data.erreur || 'Erreur lors de la création de la réservation');
        return null;
      }
    } catch (error) {
      console.error('Erreur création réservation:', error);
      toast.error('Erreur de connexion');
      return null;
    }
  };

  const creerContrat = async (reservationIdValue: number): Promise<number | null> => {
    setIsSubmitting(true);
    try {
      console.log('📦 Création contrat avec:', {
        bien_id: formData.bien_id,
        lot_id: formData.lot_id,
        locataire_id: formData.locataire_id,
        acquereur_id: formData.acquereur_id,
        reservation_id: reservationIdValue
      });
      
      const response = await fetch('/api/contrats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bien_id: formData.bien_id ? parseInt(formData.bien_id) : null,
          lot_id: formData.lot_id ? parseInt(formData.lot_id) : null,
          locataire_id: formData.locataire_id ? parseInt(formData.locataire_id) : null,
          acquereur_id: formData.acquereur_id ? parseInt(formData.acquereur_id) : null,
          type_contrat: formData.type_contrat,
          date_debut: formData.date_debut,
          date_fin: formData.date_fin || null,
          date_signature: formData.date_signature || null,
          date_etat_lieux_entree: formData.date_etat_lieux_entree || null,
          date_etat_lieux_sortie: formData.date_etat_lieux_sortie || null,
          loyer_mensuel: parseFloat(formData.loyer_mensuel) || 0,
          charges_mensuelles: parseFloat(formData.charges_mensuelles) || 0,
          depot_garantie: parseFloat(formData.depot_garantie) || null,
          clause_particuliere: formData.clause_particuliere || null,
          reservation_id: reservationIdValue
        })
      });
      
      const data = await response.json();
      console.log('📦 Réponse création contrat:', data);
      
      if (data.success) {
        toast.success('Contrat créé avec succès');
        setCreatedContratId(data.id);
        return data.id;
      } else {
        toast.error(data.erreur || 'Erreur lors de la création du contrat');
        return null;
      }
    } catch (error) {
      console.error('Erreur création contrat:', error);
      toast.error('Erreur de connexion');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const validerContrat = async (contratId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contrats/${contratId}/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caution: parseFloat(conditions.caution) || 0,
          nombre_mois_avance: parseInt(conditions.nombre_mois_avance) || 1,
          paiements: conditions.paiements.map(p => ({
            type: p.type,
            montant: parseFloat(p.montant) || 0,
            mode: p.mode
          })),
          valide_par: 1
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Contrat validé avec succès');
        onSuccess();
      } else {
        toast.error(data.erreur || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation contrat:', error);
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // Dans ContratForm.tsx, assurez-vous que handleSubmit envoie bien type_contrat = 'BAIL_VIDE'
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
      bien_id: parseInt(formData.bien_id),
      locataire_id: locataire_id || (contrat?.locataire_id ? parseInt(contrat.locataire_id) : null),
      type_contrat: 'BAIL_VIDE', // ✅ Important pour les locations
      loyer_mensuel: parseFloat(formData.loyer_mensuel) || 0,
      charges_mensuelles: parseFloat(formData.charges_mensuelles) || 0,
      depot_garantie: parseFloat(formData.depot_garantie) || null,
      date_debut: formData.date_debut,
      date_fin: formData.date_fin || null
    };

    console.log('📦 Envoi création contrat location:', dataToSend);

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
      toast.success(contrat ? 'Contrat modifié avec succès' : 'Contrat créé avec succès');
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

  const calculerTotal = () => {
    const caution = parseFloat(conditions.caution) || 0;
    const loyer = parseFloat(formData.loyer_mensuel) || 0;
    const avance = loyer * (parseInt(conditions.nombre_mois_avance) || 1);
    return { caution, avance, total: caution + avance };
  };

  const calculerPaiementsTotal = () => {
    return conditions.paiements.reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);
  };

  const handlePaiementChange = (index: number, field: string, value: string) => {
    const newPaiements = [...conditions.paiements];
    newPaiements[index] = { ...newPaiements[index], [field]: value };
    setConditions({ ...conditions, paiements: newPaiements });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!contrat) {
      if (!formData.locataire_id && !formData.acquereur_id) {
        newErrors.client = 'Un client (locataire ou acquéreur) est requis';
      }
    }
    
    if (!formData.bien_id && !formData.lot_id) newErrors.bien = 'Un bien ou un lot est requis';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    if (!formData.loyer_mensuel && formData.type_contrat !== 'VENTE') {
      newErrors.loyer_mensuel = 'Le loyer mensuel est requis';
    }
    
    if (bienSelectionne?.type_bien === 'IMMEUBLE' && !formData.lot_id) {
      newErrors.lot_id = 'Veuillez sélectionner un lot pour cet immeuble';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value.startsWith('locataire_')) {
      const id = value.replace('locataire_', '');
      setFormData({ ...formData, locataire_id: id, acquereur_id: '' });
      chargerLocataireDetails(parseInt(id));
    } else if (value.startsWith('acquereur_')) {
      const id = value.replace('acquereur_', '');
      setFormData({ ...formData, acquereur_id: id, locataire_id: '' });
      chargerAcquereurDetails(parseInt(id));
    } else {
      setFormData({ ...formData, locataire_id: '', acquereur_id: '' });
      setLocataireSelectionne(null);
    }
  };

  const handleBienChange = async (bienId: string) => {
    setFormData({ ...formData, bien_id: bienId, lot_id: '' });
    const bien = biens.find(b => b.id.toString() === bienId);
    setBienSelectionne(bien || null);
    setLotSelectionne(null);
    
    if (bien?.type_bien === 'IMMEUBLE') {
      await chargerLotsDuBien(bien.id);
    }
  };

  const total = calculerTotal();
  const totalPaiements = calculerPaiementsTotal();
  const totalRequis = total.total;
  const paiementsSuffisants = totalPaiements >= totalRequis;

  const getBienDisplay = (bien: any) => {
    if (bien.type_bien === 'IMMEUBLE') {
      return `${bien.nom} (Immeuble) - ${bien.ville}`;
    }
    return `${bien.nom} - ${bien.ville}`;
  };

  const isClientDisabled = !!contrat;

  // Obtenir le nom du client pour l'affichage en mode édition
  const getClientDisplayName = () => {
    if (contrat?.locataire) {
      return `${contrat.locataire.prenom} ${contrat.locataire.nom} (Locataire)`;
    }
    if (contrat?.acquereur) {
      return `${contrat.acquereur.prenom} ${contrat.acquereur.nom} (Acquéreur)`;
    }
    return '';
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
        className="modal-content contrat-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            {contrat ? 'Modifier le contrat' : 'Nouveau contrat de location'}
            {showConditionsForm && ' - Paiements initiaux'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="contrat-form">
            {!showConditionsForm ? (
              <div className="form-sections">
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>🤝</span> Parties prenantes
                  </div>

                    <div className="modal-section-title">
    <span>🏦</span> Conditions de location (Côte d'Ivoire)
  </div>
  <div className="form-grid">
    <div className="form-group">
      <label>Nombre de mois d'avance</label>
      <select
        value={formData.nombre_mois_avance}
        onChange={(e) => setFormData({...formData, nombre_mois_avance: e.target.value})}
      >
        <option value="0">Aucune avance</option>
        <option value="1">1 mois d'avance</option>
        <option value="2">2 mois d'avance (Recommandé)</option>
        <option value="3">3 mois d'avance</option>
      </select>
      <small className="field-hint">En Côte d'Ivoire, la pratique est 2 mois d'avance</small>
    </div>

    <div className="form-group">
      <label>Nombre de mois de caution</label>
      <select
        value={formData.nombre_mois_caution}
        onChange={(e) => setFormData({...formData, nombre_mois_caution: e.target.value})}
      >
        <option value="0">Aucune caution</option>
        <option value="1">1 mois de caution</option>
        <option value="2">2 mois de caution (Recommandé)</option>
        <option value="3">3 mois de caution</option>
      </select>
      <small className="field-hint">En Côte d'Ivoire, la pratique est 2 mois de caution</small>
    </div>
  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Client *</label>
                      {contrat ? (
                        <div className="form-static">
                          <strong>{getClientDisplayName()}</strong>
                        </div>
                      ) : (
                        <select
                          value={formData.locataire_id ? `locataire_${formData.locataire_id}` : (formData.acquereur_id ? `acquereur_${formData.acquereur_id}` : '')}
                          onChange={handleClientChange}
                          className={errors.client ? 'error' : ''}
                        >
                          <option value="">Sélectionnez un client</option>
                          <optgroup label="Locataires">
                            {locataires.map(loc => (
                              <option key={`locataire_${loc.id}`} value={`locataire_${loc.id}`}>
                                {loc.prenom} {loc.nom} - {loc.email} (Locataire)
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Acquéreurs">
                            {acquereurs.map(acq => (
                              <option key={`acquereur_${acq.id}`} value={`acquereur_${acq.id}`}>
                                {acq.prenom} {acq.nom} - {acq.email} (Acquéreur)
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      )}
                      {!contrat && errors.client && <span className="error-message">{errors.client}</span>}
                    </div>

                    <div className="form-group">
                      <label>Bien *</label>
                      {contrat ? (
                        <div className="form-static">
                          <strong>{contrat.bien?.nom}</strong>
                          <br />
                          <small className="text-muted">
                            {contrat.bien?.adresse}, {contrat.bien?.commune}
                          </small>
                        </div>
                      ) : (
                        <select
                          value={formData.bien_id}
                          onChange={(e) => handleBienChange(e.target.value)}
                          className={errors.bien ? 'error' : ''}
                        >
                          <option value="">Sélectionnez un bien</option>
                          {biens.map(bien => (
                            <option key={bien.id} value={bien.id}>
                              {getBienDisplay(bien)}
                              {bien.statut === 'RESERVE' ? ' (🔒 Réservé)' : bien.statut === 'LOUE' ? ' (🔒 Loué)' : ' (✅ Disponible)'}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.bien && <span className="error-message">{errors.bien}</span>}
                    </div>

                    {bienSelectionne?.type_bien === 'IMMEUBLE' && (
                      <div className="form-group">
                        <label>Lot *</label>
                        {contrat ? (
                          <div className="form-static">
                            <strong>
                              {contrat.lot?.numero_lot} - {contrat.lot?.type_lot}
                            </strong>
                            <br />
                            <small className="text-muted">
                              Surface: {contrat.lot?.surface} m² - Loyer: {contrat.lot?.loyer_mensuel?.toLocaleString()} FCFA
                            </small>
                          </div>
                        ) : (
                          <select
                            value={formData.lot_id}
                            onChange={(e) => {
                              const id = e.target.value;
                              setFormData({ ...formData, lot_id: id });
                              const lot = lots.find(l => l.id.toString() === id);
                              setLotSelectionne(lot || null);
                            }}
                            className={errors.lot_id ? 'error' : ''}
                            disabled={lots.length === 0}
                          >
                            <option value="">Sélectionnez un lot</option>
                            {lots.map(lot => (
                              <option key={lot.id} value={lot.id}>
                                {lot.numero_lot} - {lot.type_lot} - {lot.surface} m² - {lot.loyer_mensuel?.toLocaleString()} FCFA
                                {lot.statut === 'RESERVE' ? ' (🔒 Réservé)' : lot.statut === 'LOUE' ? ' (🔒 Loué)' : ' (✅ Disponible)'}
                              </option>
                            ))}
                          </select>
                        )}
                        {errors.lot_id && <span className="error-message">{errors.lot_id}</span>}
                      </div>
                    )}

                    {reservationSelectionnee && (
                      <div className="info-panel info">
                        <h4>📅 Réservation existante</h4>
                        <div className="info-grid">
                          <div><strong>Date de réservation:</strong> {new Date(reservationSelectionnee.date_reservation).toLocaleDateString()}</div>
                          <div><strong>Expire le:</strong> {new Date(reservationSelectionnee.date_expiration).toLocaleDateString()}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {bienSelectionne && bienSelectionne.type_bien !== 'IMMEUBLE' && (
                    <div className="info-panel">
                      <h4>Informations du bien</h4>
                      <div className="info-grid">
                        <div><strong>Adresse:</strong> {bienSelectionne.adresse}, {bienSelectionne.commune}</div>
                        <div><strong>Surface:</strong> {bienSelectionne.surface} m²</div>
                        <div><strong>Pièces:</strong> {bienSelectionne.pieces}</div>
                        <div><strong>Loyer:</strong> {bienSelectionne.loyer_mensuel?.toLocaleString()} FCFA</div>
                      </div>
                    </div>
                  )}

                  {lotSelectionne && (
                    <div className="info-panel">
                      <h4>Informations du lot</h4>
                      <div className="info-grid">
                        <div><strong>Numéro:</strong> {lotSelectionne.numero_lot}</div>
                        <div><strong>Type:</strong> {lotSelectionne.type_lot}</div>
                        <div><strong>Surface:</strong> {lotSelectionne.surface} m²</div>
                        <div><strong>Loyer:</strong> {lotSelectionne.loyer_mensuel?.toLocaleString()} FCFA</div>
                        <div><strong>Immeuble:</strong> {lotSelectionne.immeuble?.nom}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dates du contrat */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>📅</span> Dates du contrat
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Date de début *</label>
                      <input
                        type="date"
                        value={formData.date_debut}
                        onChange={(e) => setFormData({...formData, date_debut: e.target.value})}
                        className={errors.date_debut ? 'error' : ''}
                      />
                      {errors.date_debut && <span className="error-message">{errors.date_debut}</span>}
                    </div>

                    <div className="form-group">
                      <label>Date de fin</label>
                      <input
                        type="date"
                        value={formData.date_fin}
                        onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Type de contrat *</label>
                      <select
                        value={formData.type_contrat}
                        onChange={(e) => setFormData({...formData, type_contrat: e.target.value})}
                      >
                        {TYPES_CONTRAT.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icone} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Loyer mensuel (FCFA) *</label>
                      <input
                        type="number"
                        step="1000"
                        value={formData.loyer_mensuel}
                        onChange={(e) => setFormData({...formData, loyer_mensuel: e.target.value})}
                        className={errors.loyer_mensuel ? 'error' : ''}
                        placeholder="150000"
                      />
                      {errors.loyer_mensuel && <span className="error-message">{errors.loyer_mensuel}</span>}
                    </div>

                    <div className="form-group">
                      <label>Charges mensuelles (FCFA)</label>
                      <input
                        type="number"
                        step="1000"
                        value={formData.charges_mensuelles}
                        onChange={(e) => setFormData({...formData, charges_mensuelles: e.target.value})}
                        placeholder="25000"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Clauses particulières</label>
                      <textarea
                        value={formData.clause_particuliere}
                        onChange={(e) => setFormData({...formData, clause_particuliere: e.target.value})}
                        rows={3}
                        placeholder="Clauses particulières du contrat..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-sections">
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>💰</span> Paiements initiaux
                  </div>
                  
                  <div className="info-panel warning">
                    <h4>⚠️ Important</h4>
                    <p>Le contrat ne sera validé qu'après réception de la caution et du premier loyer (ou des mois d'avance).</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Caution (FCFA) *</label>
                      <input
                        type="number"
                        step="10000"
                        value={conditions.caution}
                        onChange={(e) => setConditions({...conditions, caution: e.target.value})}
                        placeholder="Ex: 300000"
                      />
                      <small className="field-hint">Généralement 2 mois de loyer</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Nombre de mois d'avance *</label>
                      <select
                        value={conditions.nombre_mois_avance}
                        onChange={(e) => setConditions({...conditions, nombre_mois_avance: e.target.value})}
                      >
                        <option value="1">1 mois</option>
                        <option value="2">2 mois</option>
                        <option value="3">3 mois</option>
                        <option value="6">6 mois</option>
                      </select>
                    </div>
                  </div>

                  <div className="info-panel">
                    <h4>Récapitulatif des paiements requis</h4>
                    <div className="info-grid">
                      <div><strong>Caution:</strong> {total.caution.toLocaleString()} FCFA</div>
                      <div><strong>Avance ({conditions.nombre_mois_avance} mois):</strong> {total.avance.toLocaleString()} FCFA</div>
                      <div><strong>Total à payer:</strong> <span className="highlight">{total.total.toLocaleString()} FCFA</span></div>
                    </div>
                  </div>

                  <div className="modal-section-title" style={{ marginTop: 24 }}>
                    <span>💳</span> Enregistrement des paiements
                  </div>

                  {conditions.paiements.map((paiement, index) => (
                    <div key={index} className="form-grid">
                      <div className="form-group">
                        <label>{paiement.type === 'CAUTION' ? 'Caution' : 'Avance'} (FCFA)</label>
                        <input
                          type="number"
                          step="1000"
                          value={paiement.montant}
                          onChange={(e) => handlePaiementChange(index, 'montant', e.target.value)}
                          placeholder={paiement.type === 'CAUTION' ? '300000' : total.avance.toLocaleString()}
                        />
                      </div>
                      <div className="form-group">
                        <label>Mode de paiement</label>
                        <select
                          value={paiement.mode}
                          onChange={(e) => handlePaiementChange(index, 'mode', e.target.value)}
                        >
                          <option value="ESPECES">Espèces</option>
                          <option value="CHEQUE">Chèque</option>
                          <option value="VIREMENT">Virement bancaire</option>
                          <option value="CARTE">Carte bancaire</option>
                          <option value="MOBILE_MONEY">Mobile Money</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  <div className="info-panel" style={{ marginTop: 16 }}>
                    <div className="info-grid">
                      <div><strong>Total payé:</strong> {totalPaiements.toLocaleString()} FCFA</div>
                      <div><strong>Total requis:</strong> {totalRequis.toLocaleString()} FCFA</div>
                      <div><strong>Statut:</strong> 
                        {paiementsSuffisants ? (
                          <span className="success">✅ Paiements suffisants</span>
                        ) : (
                          <span className="error">❌ Insuffisant ({Math.abs(totalPaiements - totalRequis).toLocaleString()} FCFA manquant)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!paiementsSuffisants && (
                    <div className="info-panel error">
                      ⚠️ Le total des paiements doit être au moins égal au montant total requis.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="modal-footer">
              {showConditionsForm && (
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowConditionsForm(false)}
                  disabled={isLoading}
                >
                  ← Retour
                </button>
              )}
              <button 
                type="button" 
                className="btn-cancel"
                onClick={onClose}
                disabled={isLoading || isSubmitting}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={isLoading || isSubmitting || (showConditionsForm && !paiementsSuffisants)}
              >
                {isLoading || isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    {showConditionsForm ? 'Validation...' : 'Création...'}
                  </>
                ) : (
                  showConditionsForm ? '💾 Valider le contrat' : '➡️ Continuer'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}