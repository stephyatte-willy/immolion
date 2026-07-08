'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bien } from '@/app/biens/page';
import { TYPES_BIENS_CI_AVANCES, STATUTS_LOT } from '@/app/types/biens';
import { 
  DISTRICTS_CI, 
  COMMUNES_ABIDJAN, 
  QUARTIERS_CI,
  VILLES_PAR_DISTRICT,
} from '@/app/types/ci';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import '@/app/biens/biens.css';

type TypeBien = 'IMMEUBLE' | 'APPARTEMENT' | 'MAISON' | 'VILLA' | 'STUDIO' | 'MAGASIN' | 'ENTREPOT' | 'BUREAU' | 'TERRAIN' | 'PARKING' | 'CHAMBRE' | 'KIOSQUE';
type StatutBien = 'DISPONIBLE' | 'EN_VENTE';

interface LotForm {
  id?: number;
  numero_lot?: string;
  etage: string;
  type_lot: string;
  nom: string;
  surface: string;
  pieces: string;
  loyer_mensuel: string;
  prix_vente: string; 
  description?: string;
  statut: string;
}

interface BienFormProps {
  bien: Bien | null;
  onClose: () => void;
  onSuccess: () => void;
  utilisateurId: number;
}

export default function BienForm({ bien, onClose, onSuccess, utilisateurId }: BienFormProps) {
  const [formData, setFormData] = useState({
    proprietaire_id: '',
    reference_unique: '',
    nom: '',
    type_bien: 'MAISON' as TypeBien,
    statut: 'DISPONIBLE' as StatutBien,
    adresse: '',
    quartier: '',
    commune: '',
    ville: 'Abidjan',
    district: 'Abidjan',
    surface: '',
    pieces: '',
    etage: '',
    description: '',
    loyer_mensuel: '',
    prix_vente: '',
    date_acquisition: '',
    latitude: '',
    longitude: '',
    photos: [] as File[],
    photosToDelete: [] as number[],
    est_principal: true,
    nombre_lots: 0,
    lots: [] as LotForm[]
  });

  // État pour le mode de vente de l'immeuble
  const [modeVenteImmeuble, setModeVenteImmeuble] = useState<'par_lots' | 'global'>('par_lots');

  // États pour la modale d'ajout multiple de lots
  const [showMultipleLotModal, setShowMultipleLotModal] = useState(false);
  const [multipleLotConfig, setMultipleLotConfig] = useState({
    quantite: 1,
    prefixe: 'LOT',
    startNumber: 1
  });

  const [proprietaires, setProprietaires] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<{id: number, url: string, est_principale: boolean}[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{id: number, url: string} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Localisation ──────────────────────────────────────
  const [villesDisponibles, setVillesDisponibles] = useState<string[]>([]);
  const [quartiersDisponibles, setQuartiersDisponibles] = useState<string[]>([]);
  const [villeSaisie, setVilleSaisie] = useState('');
  const [quartierSaisi, setQuartierSaisi] = useState('');
  // ─────────────────────────────────────────────────────

  const [showLotForm, setShowLotForm] = useState(false);
  const [editingLotIndex, setEditingLotIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'details'>('resume');
  const [lotsToDelete, setLotsToDelete] = useState<number[]>([]);
  
  const [currentLot, setCurrentLot] = useState<LotForm>({
    numero_lot: '',
    etage: '',
    type_lot: 'APPARTEMENT',
    nom: '',
    surface: '',
    pieces: '',
    loyer_mensuel: '',
    prix_vente: '',
    description: '',
    statut: 'DISPONIBLE'
  });

  const isImmeuble = formData.type_bien === 'IMMEUBLE';
  const isVente = formData.statut === 'EN_VENTE';
  
  // Déterminer si on doit afficher la section des lots
  const afficherSectionLots = () => {
    if (!isImmeuble) return false;
    if (isVente && modeVenteImmeuble === 'global') return false;
    return true;
  };

  const typesLots = [
    'APPARTEMENT', 'MAGASIN', 'BUREAU', 'STUDIO', 'PARKING', 'CHAMBRE'
  ];

  // ── FONCTIONS POUR LA GESTION DES LOTS ────────────────────────────────────────

  // Fonction pour générer le nom du lot automatiquement
  const genererNomLotAuto = (numeroLot?: string, etage?: string, typeLot?: string): string => {
    const typeLotValue = typeLot || currentLot.type_lot;
    const typeMap: Record<string, string> = {
      'APPARTEMENT': 'Appartement',
      'MAGASIN': 'Magasin',
      'BUREAU': 'Bureau',
      'STUDIO': 'Studio',
      'PARKING': 'Parking',
      'CHAMBRE': 'Chambre'
    };
    
    const typeLibelle = typeMap[typeLotValue] || typeLotValue;
    const numLot = numeroLot || currentLot.numero_lot || '';
    const etageValue = etage || currentLot.etage || '';
    
    let nomAuto = typeLibelle;
    if (etageValue) nomAuto += ` - Étage ${etageValue}`;
    if (numLot) nomAuto += ` - Lot ${numLot}`;
    
    return nomAuto;
  };

  // Fonction pour générer un numéro de lot séquentiel
  const genererNumeroLotSequentiel = (prefixe: string, index: number): string => {
    const numero = String(index).padStart(3, '0');
    return `${prefixe}-${numero}`;
  };

  // Fonction pour obtenir le prochain numéro de lot disponible
  const getProchainNumeroLot = (prefixe: string): number => {
    const lotsExistants = formData.lots;
    let maxNumero = 0;
    
    lotsExistants.forEach(lot => {
      if (lot.numero_lot && lot.numero_lot.startsWith(prefixe)) {
        const match = lot.numero_lot.match(new RegExp(`${prefixe}-(\\d+)`));
        if (match && match[1]) {
          const num = parseInt(match[1]);
          if (num > maxNumero) maxNumero = num;
        }
      }
    });
    
    return maxNumero + 1;
  };

  // Mettre à jour le nom du lot automatiquement
  const mettreAJourNomLotAuto = () => {
    const nomSuggere = genererNomLotAuto();
    if (nomSuggere && nomSuggere !== currentLot.nom) {
      setCurrentLot(prev => ({ ...prev, nom: nomSuggere }));
    }
  };

  // Effet pour mettre à jour le nom du lot
  useEffect(() => {
    mettreAJourNomLotAuto();
  }, [currentLot.type_lot, currentLot.numero_lot, currentLot.etage]);

  // Ouvrir la modale d'ajout multiple
  const openMultipleLotModal = () => {
    // Validation des champs obligatoires
    if (isVente && !currentLot.prix_vente) {
      toast.error('Veuillez remplir le prix de vente');
      return;
    }
    if (!isVente && !currentLot.loyer_mensuel) {
      toast.error('Veuillez remplir le loyer mensuel');
      return;
    }
    
    const prochainNumero = getProchainNumeroLot('LOT');
    setMultipleLotConfig({
      quantite: 1,
      prefixe: 'LOT',
      startNumber: prochainNumero
    });
    setShowMultipleLotModal(true);
  };

  // Fonction pour ajouter plusieurs lots
const handleAddMultipleLotsFromModal = () => {
  const { quantite, prefixe, startNumber } = multipleLotConfig;
  
  if (quantite < 1 || quantite > 100) {
    toast.error('La quantité doit être entre 1 et 100');
    return;
  }
  
  // ✅ Validation selon le type (vente ou location)
  if (isVente && !currentLot.prix_vente) {
    toast.error('Veuillez remplir le prix de vente du lot');
    return;
  }
  if (!isVente && !currentLot.loyer_mensuel) {
    toast.error('Veuillez remplir le loyer mensuel du lot');
    return;
  }
  
  const newLots = [...formData.lots];
  const etageValue = currentLot.etage || '';
  const typeLotValue = currentLot.type_lot;
  const surfaceValue = currentLot.surface || '';
  const piecesValue = currentLot.pieces || '';
  const prixVenteValue = currentLot.prix_vente || '';
  const loyerMensuelValue = currentLot.loyer_mensuel || '';
  const statutValue = currentLot.statut || 'DISPONIBLE';
  
  for (let i = 0; i < quantite; i++) {
    const numeroLot = genererNumeroLotSequentiel(prefixe, startNumber + i);
    const nomAuto = genererNomLotAuto(numeroLot, etageValue, typeLotValue);
    
    newLots.push({
      id: undefined,
      numero_lot: numeroLot,
      etage: etageValue,
      type_lot: typeLotValue,
      nom: nomAuto,
      surface: surfaceValue,
      pieces: piecesValue,
      loyer_mensuel: loyerMensuelValue, 
      prix_vente: prixVenteValue, 
      description: '',
      statut: statutValue
    });
  }
  
  setFormData(prev => ({ ...prev, lots: newLots, nombre_lots: newLots.length }));
  setShowMultipleLotModal(false);
  resetCurrentLot();
  toast.success(`${quantite} lot(s) ajouté(s) avec succès (${prefixe}-${String(startNumber).padStart(3, '0')} à ${prefixe}-${String(startNumber + quantite - 1).padStart(3, '0')})`);
};

  // Ajouter un seul lot
  const handleAddLot = () => {
    // Validation des champs obligatoires
    if (isVente && !currentLot.prix_vente) {
      toast.error('Veuillez remplir le prix de vente');
      return;
    }
    if (!isVente && !currentLot.loyer_mensuel) {
      toast.error('Veuillez remplir le loyer mensuel');
      return;
    }
    
    const newLots = [...formData.lots];
    
    // Si pas de numéro de lot, en générer un automatiquement
    let numeroLot = currentLot.numero_lot;
    if (!numeroLot || numeroLot.trim() === '') {
      const prochainNumero = getProchainNumeroLot('LOT');
      numeroLot = genererNumeroLotSequentiel('LOT', prochainNumero);
    }
    
    // Générer le nom si vide
    let nomLot = currentLot.nom;
    if (!nomLot || nomLot.trim() === '') {
      nomLot = genererNomLotAuto(numeroLot, currentLot.etage, currentLot.type_lot);
    }
    
    const newLot = { 
      ...currentLot, 
      numero_lot: numeroLot,
      nom: nomLot,
      description: '' 
    };
    
    if (editingLotIndex !== null) {
      newLots[editingLotIndex] = newLot;
      toast.success('Lot modifié avec succès');
    } else {
      newLots.push(newLot);
      toast.success(`Lot ajouté avec succès (${numeroLot})`);
    }
    
    setFormData(prev => ({ ...prev, lots: newLots, nombre_lots: newLots.length }));
    resetCurrentLot();
    setEditingLotIndex(null);
    setShowLotForm(false);
  };

  // Ajouter plusieurs lots (version simple avec prompt - conservée pour compatibilité)
  const handleAddMultipleLotsPrompt = () => {
    // Validation des champs obligatoires
    if (isVente && !currentLot.prix_vente) {
      toast.error('Veuillez remplir le prix de vente');
      return;
    }
    if (!isVente && !currentLot.loyer_mensuel) {
      toast.error('Veuillez remplir le loyer mensuel');
      return;
    }
    
    const quantite = prompt('Combien de lots identiques voulez-vous ajouter ?', '1');
    const quantiteNum = parseInt(quantite || '1');
    if (isNaN(quantiteNum) || quantiteNum < 1) { 
      toast.error('Quantité invalide'); 
      return; 
    }
    if (quantiteNum > 100) { 
      toast.error('La quantité maximale est de 100 lots par opération'); 
      return; 
    }
    
    const prefixe = prompt('Préfixe pour les numéros de lot (ex: LOT, APP, BUREAU) ou laissez vide', 'LOT');
    const prefixeFinal = prefixe && prefixe.trim() ? prefixe.trim().toUpperCase() : 'LOT';
    
    let prochainNumero = getProchainNumeroLot(prefixeFinal);
    
    const newLots = [...formData.lots];
    const etageValue = currentLot.etage || '';
    const typeLotValue = currentLot.type_lot;
    const surfaceValue = currentLot.surface || '';
    const piecesValue = currentLot.pieces || '';
    const prixVenteValue = currentLot.prix_vente || '';
    const loyerMensuelValue = currentLot.loyer_mensuel || '';
    const statutValue = currentLot.statut || 'DISPONIBLE';
    
    for (let i = 0; i < quantiteNum; i++) {
      const numeroLot = genererNumeroLotSequentiel(prefixeFinal, prochainNumero + i);
      const nomAuto = genererNomLotAuto(numeroLot, etageValue, typeLotValue);
      
      newLots.push({
        id: undefined,
        numero_lot: numeroLot,
        etage: etageValue,
        type_lot: typeLotValue,
        nom: nomAuto,
        surface: surfaceValue,
        pieces: piecesValue,
        loyer_mensuel: loyerMensuelValue,
        prix_vente: prixVenteValue,
        description: '',
        statut: statutValue
      });
    }
    
    setFormData(prev => ({ ...prev, lots: newLots, nombre_lots: newLots.length }));
    resetCurrentLot();
    setShowLotForm(false);
    toast.success(`${quantiteNum} lot(s) ajouté(s) avec succès (${prefixeFinal}-${String(prochainNumero).padStart(3, '0')} à ${prefixeFinal}-${String(prochainNumero + quantiteNum - 1).padStart(3, '0')})`);
  };

  const resetCurrentLot = () => {
    setCurrentLot({ 
      numero_lot: '', 
      etage: '', 
      type_lot: 'APPARTEMENT', 
      nom: '', 
      surface: '', 
      pieces: '', 
      loyer_mensuel: '', 
      prix_vente: '', 
      description: '', 
      statut: 'DISPONIBLE' 
    });
  };

  const handleEditLot = (index: number) => {
    setCurrentLot({ ...formData.lots[index] });
    setEditingLotIndex(index);
    setShowLotForm(true);
  };

  const handleRemoveLot = (index: number) => {
    const lotToRemove = formData.lots[index];
    if (lotToRemove.id) setLotsToDelete(prev => [...prev, lotToRemove.id!]);
    const newLots = [...formData.lots];
    newLots.splice(index, 1);
    setFormData(prev => ({ ...prev, lots: newLots, nombre_lots: newLots.length }));
    toast.success('Lot supprimé');
  };

  // ── FIN FONCTIONS POUR LA GESTION DES LOTS ────────────────────────────────────

  // ── Fonction pour générer le nom commercial suggéré ────────────────────────
  const genererNomCommercial = (): string => {
    const typeBien = formData.type_bien;
    const typeMap: Record<string, string> = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'VILLA': 'Villa',
      'STUDIO': 'Studio',
      'COMMERCIAL': 'Local commercial',
      'MAGASIN': 'Magasin',
      'ENTREPOT': 'Entrepôt',
      'BUREAU': 'Bureau',
      'TERRAIN': 'Terrain',
      'PARKING': 'Parking',
      'CHAMBRE': 'Chambre',
      'KIOSQUE': 'Kiosque',
      'IMMEUBLE': 'Immeuble'
    };
    
    const typeLibelle = typeMap[typeBien] || typeBien;
    
    let localisation = '';
    const quartierFinal = formData.quartier === '__autre__' ? quartierSaisi : formData.quartier;
    if (quartierFinal) {
      localisation = quartierFinal;
    } else if (formData.district === 'Abidjan' && formData.commune) {
      localisation = formData.commune;
    } else if (formData.ville && formData.ville !== '__autre__') {
      localisation = formData.ville;
    } else if (villeSaisie) {
      localisation = villeSaisie;
    }
    
    let nomCommercial = '';
    if (typeLibelle) nomCommercial += typeLibelle;
    if (localisation) nomCommercial += ` - ${localisation}`;
    
    if (!nomCommercial) {
      nomCommercial = `Bien ${new Date().toISOString().slice(0, 10)}`;
    }
    
    return nomCommercial;
  };

  // ── Fonction pour générer une référence unique ────────────────────────────
  const genererReferenceUnique = async (): Promise<string> => {
    try {
      const response = await fetch('/api/biens?limit=1&sort=desc');
      const data = await response.json();
      
      let dernierNumero = 0;
      if (data.success && data.biens && data.biens.length > 0) {
        const derniereRef = data.biens[0].reference_unique || data.biens[0].id;
        const match = derniereRef.match(/BIEN-(\d+)/);
        if (match) {
          dernierNumero = parseInt(match[1]);
        }
      }
      
      const nouveauNumero = dernierNumero + 1;
      return `BIEN-${nouveauNumero.toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Erreur génération référence:', error);
      return `BIEN-${Date.now().toString().slice(-5)}`;
    }
  };

  // ── Mettre à jour le nom commercial suggéré ────────────────────────────────
  const mettreAJourNomCommercial = () => {
    if (bien) return;
    const nomSuggere = genererNomCommercial();
    if (nomSuggere && nomSuggere !== formData.nom) {
      setFormData(prev => ({ ...prev, nom: nomSuggere }));
    }
  };

  // ── Effet pour initialiser la référence unique en création ─────────────────
  useEffect(() => {
    if (!bien && !formData.reference_unique) {
      genererReferenceUnique().then(ref => {
        setFormData(prev => ({ ...prev, reference_unique: ref }));
      });
    }
  }, [bien]);

  // ── Effet pour mettre à jour le nom commercial ────────────────────────────
  useEffect(() => {
    if (!bien) {
      mettreAJourNomCommercial();
    }
  }, [formData.type_bien, formData.district, formData.commune, formData.ville, formData.quartier, villeSaisie, quartierSaisi]);

  // ── Helpers numériques ────────────────────────────────
  const formatNumber = (value: string) => {
    if (!value) return '';
    return value.replace(/[^\d]/g, '');
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, isFormData: boolean = true) => {
    const cleanValue = formatNumber(e.target.value);
    if (isFormData) {
      setFormData(prev => ({ ...prev, [field]: cleanValue }));
    } else {
      setCurrentLot(prev => ({ ...prev, [field]: cleanValue }));
    }
  };

  // ── Statistiques lots ─────────────────────────────────
  // ── Statistiques lots ─────────────────────────────────
const lotsParType = () => {
  const result: Record<string, { 
    count: number; 
    valeurs: number[];  // ✅ Utiliser 'valeurs' au lieu de 'loyers'
    total: number; 
    lots: any[];
    surfaces: number[];
    pieces: number[];
  }> = {};
  
  formData.lots.forEach(lot => {
    const type = lot.type_lot;
    // ✅ Utiliser prix_vente pour la vente, loyer_mensuel pour la location
    const valeur = isVente 
      ? (parseFloat(lot.prix_vente) || 0)
      : (parseFloat(lot.loyer_mensuel) || 0);
    const surface = parseFloat(lot.surface) || 0;
    const pieces = parseInt(lot.pieces) || 0;
    
    if (!result[type]) {
      result[type] = { 
        count: 0, 
        valeurs: [], 
        total: 0, 
        lots: [], 
        surfaces: [], 
        pieces: [] 
      };
    }
    result[type].count += 1;
    result[type].valeurs.push(valeur);  // ✅ Utiliser 'valeurs'
    result[type].surfaces.push(surface);
    result[type].pieces.push(pieces);
    result[type].total += valeur;
    result[type].lots.push(lot);
  });
  
  return result;
};

  const lotsStats = lotsParType();
  const totalRevenus = formData.lots.reduce((sum, lot) => sum + (parseFloat(lot.loyer_mensuel) || 0), 0);
  const lotsLoues = formData.lots.filter(lot => lot.statut === 'LOUE').length;
  const lotsDisponibles = formData.lots.filter(lot => lot.statut === 'DISPONIBLE').length;
  const lotsEnVente = formData.lots.filter(lot => lot.statut === 'EN_VENTE').length;
  const totalLots = formData.lots.length;

  // ── useEffect : chargement initial ───────────────────
  useEffect(() => {
    chargerProprietaires();
    
    if (bien) {
      chargerLotsDuBien(bien.id);
      
      let statutInitial = bien.statut as StatutBien;
      if (statutInitial === 'LOUE') statutInitial = 'DISPONIBLE';
      if (statutInitial === 'VENDU') statutInitial = 'EN_VENTE';
      
      // Déterminer le mode de vente de l'immeuble
      if (bien.type_bien === 'IMMEUBLE' && bien.statut === 'EN_VENTE') {
        if (bien.lots && bien.lots.length > 0) {
          setModeVenteImmeuble('par_lots');
        } else {
          setModeVenteImmeuble('global');
        }
      }
      
      setFormData({
        proprietaire_id: bien.proprietaire_id?.toString() || '',
        reference_unique: bien.reference_unique || `BIEN-${bien.id.toString().padStart(5, '0')}`,
        nom: bien.nom,
        type_bien: bien.type_bien as TypeBien,
        statut: statutInitial,
        adresse: bien.adresse || '',
        quartier: bien.quartier || '',
        commune: bien.commune || '',
        ville: bien.ville,
        district: bien.district || 'Abidjan',
        surface: bien.surface.toString(),
        pieces: bien.pieces.toString(),
        etage: bien.etage?.toString() || '',
        description: bien.description || '',
        loyer_mensuel: bien.loyer_mensuel?.toString() || '',
        prix_vente: bien.prix_vente?.toString() || '',
        date_acquisition: bien.date_acquisition || '',
        latitude: bien.latitude?.toString() || '',
        longitude: bien.longitude?.toString() || '',
        photos: [],
        photosToDelete: [],
        est_principal: true,
        nombre_lots: bien.nombre_lots || 0,
        lots: bien.lots || []
      });

      if (bien.photos) {
        setExistingPhotos(bien.photos.map(p => ({
          id: p.id,
          url: p.url,
          est_principale: Boolean(p.est_principale)
        })));
        setPhotoPreviews(bien.photos.map(p => p.url));
      }
    }
  }, [bien]);

  // ── useEffect : district → villes disponibles ─────────
  useEffect(() => {
    if (!formData.district) {
      setVillesDisponibles([]);
      return;
    }
    if (formData.district === 'Abidjan') {
      setVillesDisponibles([]);
    } else {
      setVillesDisponibles(VILLES_PAR_DISTRICT[formData.district] ?? []);
    }
    setVilleSaisie('');
    setQuartiersDisponibles([]);
    setQuartierSaisi('');
  }, [formData.district]);

  // ── useEffect : commune/ville → quartiers disponibles ─
  useEffect(() => {
    const villeActive = formData.district === 'Abidjan' ? formData.commune : formData.ville;
    if (villeActive && QUARTIERS_CI[villeActive]) {
      setQuartiersDisponibles(QUARTIERS_CI[villeActive]);
    } else {
      setQuartiersDisponibles([]);
    }
    setQuartierSaisi('');
  }, [formData.commune, formData.ville, formData.district]);

  // ── Chargements API ───────────────────────────────────
  const chargerLotsDuBien = async (bienId: number) => {
    try {
      const response = await fetch(`/api/biens/${bienId}/lots`);
      const data = await response.json();
      if (data.success && data.lots) {
        setFormData(prev => ({ ...prev, lots: data.lots, nombre_lots: data.lots.length }));
      }
    } catch (error) {
      console.error('Erreur chargement lots:', error);
    }
  };

  const chargerProprietaires = async () => {
    try {
      const response = await fetch('/api/proprietaires?actif=ACTIF');
      const data = await response.json();
      if (data.success) setProprietaires(data.proprietaires);
    } catch (error) {
      console.error('Erreur chargement propriétaires:', error);
    }
  };

  // ── Validation ────────────────────────────────────────
  const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.nom.trim()) newErrors.nom = 'Le nom commercial est requis';
  if (!formData.district) newErrors.district = 'Le district est requis';

  if (formData.district === 'Abidjan') {
    if (!formData.commune) newErrors.commune = 'La commune est requise pour Abidjan';
  } else {
    const villeChoisie = formData.ville === '__autre__' ? villeSaisie : formData.ville;
    if (!villeChoisie.trim()) newErrors.ville = 'La ville est requise';
  }

  if (!formData.surface) newErrors.surface = 'La surface est requise';
  else if (parseFloat(formData.surface) <= 0) newErrors.surface = 'La surface doit être positive';

  if (formData.type_bien !== 'TERRAIN' && formData.type_bien !== 'IMMEUBLE') {
    if (!formData.pieces) newErrors.pieces = 'Le nombre de pièces est requis';
    else if (parseInt(formData.pieces) <= 0) newErrors.pieces = 'Le nombre de pièces doit être positif';
  }

  // ✅ Validation pour la vente
  if (formData.statut === 'EN_VENTE') {
    // Pour les immeubles en vente globale, le prix est requis
    if (isImmeuble && modeVenteImmeuble === 'global') {
      if (!formData.prix_vente) {
        newErrors.prix_vente = 'Le prix de vente est requis';
      } else if (parseFloat(formData.prix_vente) <= 0) {
        newErrors.prix_vente = 'Le prix doit être positif';
      }
    }
    // Pour les biens simples en vente
    else if (!isImmeuble) {
      if (!formData.prix_vente) {
        newErrors.prix_vente = 'Le prix de vente est requis';
      } else if (parseFloat(formData.prix_vente) <= 0) {
        newErrors.prix_vente = 'Le prix doit être positif';
      }
    }
    // Pour les immeubles en vente par lots, pas de validation du prix principal
  } 
  // ✅ Validation pour la location
  else {
    if (formData.type_bien !== 'TERRAIN' && !isImmeuble) {
      if (!formData.loyer_mensuel) {
        newErrors.loyer_mensuel = 'Le loyer mensuel est requis';
      } else if (parseFloat(formData.loyer_mensuel) <= 0) {
        newErrors.loyer_mensuel = 'Le loyer doit être positif';
      }
    }
  }

  // ✅ Validation des lots pour immeuble en vente par lots ou location
  if (isImmeuble && !(isVente && modeVenteImmeuble === 'global')) {
    if (formData.lots.length === 0) {
      newErrors.lots = 'Au moins un lot est requis';
    } else {
      // ✅ Vérifier que chaque lot a un prix (pour vente) ou un loyer (pour location)
      for (let i = 0; i < formData.lots.length; i++) {
        const lot = formData.lots[i];
        if (isVente) {
          if (!lot.prix_vente || parseFloat(lot.prix_vente) <= 0) {
            newErrors[`lot_${i}_prix`] = `Le lot ${lot.numero_lot || i+1} doit avoir un prix de vente`;
          }
        } else {
          if (!lot.loyer_mensuel || parseFloat(lot.loyer_mensuel) <= 0) {
            newErrors[`lot_${i}_loyer`] = `Le lot ${lot.numero_lot || i+1} doit avoir un loyer mensuel`;
          }
        }
      }
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// ── Soumission ────────────────────────────────────────
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) { toast.error('Veuillez remplir tous les champs obligatoires'); return; }
  setIsLoading(true);

  try {
    const formDataToSend = new FormData();

    const communeFinale = formData.district === 'Abidjan' ? formData.commune : '';
    const villeFinale = formData.district === 'Abidjan'
      ? formData.commune
      : formData.ville === '__autre__' ? villeSaisie : formData.ville;
    const quartierFinal = formData.quartier === '__autre__' ? quartierSaisi : formData.quartier;

    formDataToSend.append('proprietaire_id', formData.proprietaire_id);
    formDataToSend.append('reference_unique', formData.reference_unique);
    formDataToSend.append('nom', formData.nom);
    formDataToSend.append('type_bien', formData.type_bien);
    formDataToSend.append('statut', formData.statut);
    formDataToSend.append('adresse', formData.adresse || '');
    formDataToSend.append('quartier', quartierFinal || '');
    formDataToSend.append('commune', communeFinale);
    formDataToSend.append('ville', villeFinale);
    formDataToSend.append('district', formData.district);
    formDataToSend.append('pays', 'Côte d\'Ivoire');
    formDataToSend.append('surface', formData.surface);

    if (formData.type_bien !== 'TERRAIN') {
      formDataToSend.append('pieces', formData.pieces || '1');
    } else {
      formDataToSend.append('pieces', '0');
    }

    formDataToSend.append('etage', formData.etage || '');
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('date_acquisition', formData.date_acquisition || '');
    formDataToSend.append('latitude', formData.latitude || '');
    formDataToSend.append('longitude', formData.longitude || '');

    if (formData.statut === 'EN_VENTE') {
      formDataToSend.append('prix_vente', formData.prix_vente);
      formDataToSend.append('loyer_mensuel', '0');
    } else {
      formDataToSend.append('loyer_mensuel', formData.loyer_mensuel || '0');
      formDataToSend.append('prix_vente', '');
    }

    formDataToSend.append('est_principal', '1');
    
    // ✅ AJOUTER CETTE LIGNE - Envoi du mode de vente pour les immeubles en vente
    if (isImmeuble && isVente) {
      formDataToSend.append('mode_vente_immeuble', modeVenteImmeuble);
    }
    
    // Pour un immeuble en vente globale, on n'envoie pas de lots
    if (isImmeuble && isVente && modeVenteImmeuble === 'global') {
      formDataToSend.append('nombre_lots', '0');
      formDataToSend.append('lots', '[]');
    } else {
      formDataToSend.append('nombre_lots', formData.lots.length.toString());
      
      if (isImmeuble) {
        const lotsToSend = formData.lots.map(lot => ({
          id: lot.id,
          numero_lot: lot.numero_lot || `Lot_${Date.now()}`,
          etage: lot.etage || null,
          type_lot: lot.type_lot,
          nom: lot.nom || null,
          surface: lot.surface || '0',
          pieces: lot.pieces || null,
          loyer_mensuel: lot.loyer_mensuel,
          prix_vente: lot.prix_vente || null,
          description: '',
          statut: lot.statut
        }));
        formDataToSend.append('lots', JSON.stringify(lotsToSend));
        if (lotsToDelete.length > 0) formDataToSend.append('lotsToDelete', JSON.stringify(lotsToDelete));
      }
    }

    if (formData.photosToDelete && formData.photosToDelete.length > 0) {
      formData.photosToDelete.forEach(id => formDataToSend.append('photosToDelete', id.toString()));
    }

    if (formData.photos && formData.photos.length > 0) {
      formData.photos.forEach(photo => {
        if (photo instanceof File && photo.size > 0) formDataToSend.append('photos', photo);
      });
    }

    const url = bien ? `/api/biens/${bien.id}` : '/api/biens';
    const method = bien ? 'PUT' : 'POST';
    const response = await fetch(url, { method, body: formDataToSend });
    const data = await response.json();

    if (data.success) {
      toast.success(bien ? 'Bien modifié avec succès' : 'Bien créé avec succès');
      onSuccess();
    } else {
      toast.error(data.erreur || 'Une erreur est survenue');
    }
  } catch (error) {
    toast.error('Erreur de connexion au serveur');
  } finally {
    setIsLoading(false);
  }
};

  // ── Photos ────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length !== files.length) toast.error('Certaines photos dépassent 5MB et ont été ignorées');
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...validFiles] }));
    setPhotoPreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
  };

  const handleDeleteExistingPhoto = (photoId: number, photoUrl: string) => {
    setPhotoToDelete({ id: photoId, url: photoUrl });
    setShowDeleteConfirm(true);
  };

  const confirmDeletePhoto = () => {
    if (photoToDelete) {
      setFormData(prev => ({ ...prev, photosToDelete: [...prev.photosToDelete, photoToDelete.id] }));
      const idx = existingPhotos.findIndex(p => p.id === photoToDelete.id);
      if (idx !== -1) {
        setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
        setExistingPhotos(prev => prev.filter((_, i) => i !== idx));
      }
      toast.success('Photo marquée pour suppression');
    }
    setShowDeleteConfirm(false);
    setPhotoToDelete(null);
  };

  const handleDeleteNewPhoto = (index: number) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index - existingPhotos.length, 1);
    setFormData(prev => ({ ...prev, photos: newPhotos }));
    const newPreviews = [...photoPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPhotoPreviews(newPreviews);
    toast.success('Photo supprimée');
  };

  // ── Rendu ─────────────────────────────────────────────
  return (
    <>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="modal-content bien-form-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="header-title-group">
              <h2>{bien ? 'Modifier le bien' : 'Nouveau bien'}</h2>
              {formData.reference_unique && (
                <div className="reference-unique-badge">
                  <span className="ref-label">Réf:</span>
                  <span className="ref-value">{formData.reference_unique}</span>
                </div>
              )}
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit} className="bien-form">
              <div className="form-sections">

                {/* ── Propriétaire ───────────────────────────────── */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>👤</span> Propriétaire (optionnel)
                  </div>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <select
                        value={formData.proprietaire_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, proprietaire_id: e.target.value }))}
                      >
                        <option value="">-- Sans propriétaire --</option>
                        {proprietaires.map(prop => (
                          <option key={prop.id} value={prop.id}>
                            {prop.type === 'PARTICULIER' ? '👤' : prop.type === 'SOCIETE' ? '🏢' : '🏪'}{' '}
                            {prop.prenom} {prop.nom} - {prop.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Identification ─────────────────────────────────── */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>🆔</span> Identification
                  </div>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Nom du bien *</label>
                      <div className="nom-commercial-group">
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                          className={errors.nom ? 'error' : ''}
                          placeholder="Ex: Résidence Victor Hugo, Immeuble Cité Verte"
                        />
                        {!bien && (
                          <button 
                            type="button"
                            className="suggest-nom-btn"
                            onClick={mettreAJourNomCommercial}
                            title="Suggérer un nom basé sur la localisation"
                          >
                            💡 Suggérer
                          </button>
                        )}
                      </div>
                      {errors.nom && <span className="error-message">{errors.nom}</span>}
                      <small className="style1">
                        Le nom du bien est modifiable. La référence unique <span className='style2'>{formData.reference_unique || 'sera générée'}</span> est l'identifiant système.
                      </small>
                    </div>
                  </div>
                </div>

                {/* ── Informations générales ─────────────────────── */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>🏢</span> Informations générales
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Type de bien *</label>
                      <select
                        value={formData.type_bien}
                        onChange={(e) => {
                          const val = e.target.value as TypeBien;
                          setFormData(prev => ({
                            ...prev,
                            type_bien: val,
                            lots: val !== 'IMMEUBLE' ? [] : prev.lots,
                            nombre_lots: val !== 'IMMEUBLE' ? 0 : prev.nombre_lots,
                          }));
                          if (val !== 'IMMEUBLE') {
                            setModeVenteImmeuble('par_lots');
                          }
                        }}
                        className="select-with-arrow"
                      >
                        {TYPES_BIENS_CI_AVANCES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icone} {type.label}{type.peutAvoirLots ? ' (Immeuble avec lots)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Statut *</label>
                      <select
                        value={formData.statut}
                        onChange={(e) => {
                          const newStatut = e.target.value as StatutBien;
                          setFormData(prev => ({ ...prev, statut: newStatut }));
                          if (newStatut !== 'EN_VENTE') {
                            setModeVenteImmeuble('par_lots');
                          }
                        }}
                      >
                        <option value="DISPONIBLE">🏠 Disponible (Location)</option>
                        <option value="EN_VENTE">💰 En vente</option>
                      </select>
                      <small className="style1">
                        Le statut changera automatiquement après validation du contrat
                      </small>
                    </div>
                  </div>
                </div>

                {/* ── Mode de vente pour immeuble (UNIQUEMENT si vente) ── */}
                {isImmeuble && isVente && (
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>🏷️</span> Mode de vente
                    </div>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <div className="toggle-switch-container">
                          <label className="toggle-switch">
                            <input
                              type="radio"
                              name="modeVente"
                              value="global"
                              checked={modeVenteImmeuble === 'global'}
                              onChange={() => {
                                setModeVenteImmeuble('global');
                                setFormData(prev => ({ ...prev, lots: [], nombre_lots: 0 }));
                                toast.success('Mode vente globale activé - Prix unique pour tout l\'immeuble');
                              }}
                            />
                            <span className="toggle-slider"></span>
                            <span className="toggle-label">🏢 Vente globale (immeuble entier)</span>
                          </label>
                          <label className="toggle-switch">
                            <input
                              type="radio"
                              name="modeVente"
                              value="par_lots"
                              checked={modeVenteImmeuble === 'par_lots'}
                              onChange={() => {
                                setModeVenteImmeuble('par_lots');
                                toast.success('Mode vente par lots activé - Prix individuel par lot');
                              }}
                            />
                            <span className="toggle-slider"></span>
                            <span className="toggle-label">📦 Vente par lots (chaque lot a son prix)</span>
                          </label>
                        </div>
                        <small className="field-hint">
                          {modeVenteImmeuble === 'global' 
                            ? '🏢 L\'immeuble sera vendu en une seule fois avec le prix indiqué ci-dessous.' 
                            : '📦 Chaque lot pourra être vendu séparément avec son propre prix.'}
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Aspects financiers ─────────────────────────── */}
<div className="form-section">
  <div className="form-grid">
    {isVente ? (
      // ✅ Pour les immeubles en vente par lots, on n'affiche PAS le prix principal
      (!isImmeuble || (isImmeuble && modeVenteImmeuble === 'global')) ? (
        <div className="form-group">
          <label>Prix de vente (FCFA) *</label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.prix_vente}
            onChange={(e) => handleNumberChange(e, 'prix_vente', true)}
            className={errors.prix_vente ? 'error' : ''}
            placeholder={isImmeuble && modeVenteImmeuble === 'global' ? "Prix de l'immeuble entier" : "50000000"}
          />
          {errors.prix_vente && <span className="error-message">{errors.prix_vente}</span>}
          {isImmeuble && modeVenteImmeuble === 'global' && (
            <small className="field-hint success">
              💡 Prix de vente global pour l'ensemble de l'immeuble
            </small>
          )}
        </div>
      ) : (
        // ✅ Pour les immeubles en vente par lots, on affiche un message informatif
        <div className="form-group">
          <div className="info-message">
            <span className="info-icon">🏷️</span>
            <span className="info-text">
              Vente par lots - Le prix est défini individuellement pour chaque lot
            </span>
          </div>
        </div>
      )
    ) : (
      !isImmeuble && (
        <div className="form-group">
          <label>Loyer mensuel *</label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.loyer_mensuel}
            onChange={(e) => handleNumberChange(e, 'loyer_mensuel', true)}
            className={errors.loyer_mensuel ? 'error' : ''}
            placeholder="250000"
          />
          {errors.loyer_mensuel && <span className="error-message">{errors.loyer_mensuel}</span>}
          <small className="style1">
            Les conditions seront définies dans le contrat
          </small>
        </div>
      )
    )}

    <div className="form-group">
      <label>Date d'acquisition</label>
      <input
        type="date"
        value={formData.date_acquisition}
        onChange={(e) => setFormData(prev => ({ ...prev, date_acquisition: e.target.value }))}
      />
    </div>
  </div>
</div>

                {/* ── Lots (immeubles) ───────────────────────────── */}
                {afficherSectionLots() && (
                  <div className="form-section lots-section">
                    <div className="modal-section-title">
                      <span>🏘️</span> Lots / Unités locatives ({totalLots} lot(s))
                    </div>

                    <div className="lots-tabs">
                      <button 
                        type="button" 
                        className={`lots-tab ${activeTab === 'resume' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('resume')}
                      >
                        <span>📊</span> Résumé par type
                      </button>
                      <button 
                        type="button" 
                        className={`lots-tab ${activeTab === 'details' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('details')}
                      >
                        <span>📋</span> Liste des lots
                      </button>
                    </div>

                    {/* ONGLET RÉSUMÉ PAR TYPE */}
                    {/* ONGLET RÉSUMÉ PAR TYPE */}
{activeTab === 'resume' && (
  <div className="lots-resume-container">
    {Object.keys(lotsStats).length > 0 ? (
      <div className="lots-summary-grid">
        {Object.entries(lotsStats).map(([type, data]) => (
          <div key={type} className="lot-type-summary-card">
            {/* En-tête du type */}
            <div className="summary-card-header">
              <div className="summary-type-icon">
                {type === 'APPARTEMENT' && '🏢'}
                {type === 'MAGASIN' && '🏪'}
                {type === 'BUREAU' && '🏢'}
                {type === 'STUDIO' && '🏢'}
                {type === 'PARKING' && '🅿️'}
                {type === 'CHAMBRE' && '🛏️'}
              </div>
              <div className="summary-type-info">
                <span className="summary-type-name">{type}</span>
                <span className="summary-type-count">{data.count} lot(s)</span>
              </div>
              <div className="summary-type-total">
                <span className="total-label">Total:</span>
                <span className="total-value">{data.total.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Détails du type */}
            <div className="summary-card-details">
              {/* Surfaces */}
              <div className="detail-line">
                <span className="detail-icon">📏</span>
                <span className="detail-label">Surfaces:</span>
                <div className="detail-values">
                  {data.surfaces && data.surfaces.length > 0 ? (
                    data.surfaces.map((surface, idx) => (
                      <span key={idx} className="value-tag surface-tag">
                        {surface} m²
                      </span>
                    ))
                  ) : (
                    <span className="no-value">-</span>
                  )}
                </div>
              </div>

              {/* Pièces */}
              <div className="detail-line">
                <span className="detail-icon">🛏️</span>
                <span className="detail-label">Pièces:</span>
                <div className="detail-values">
                  {data.pieces && data.pieces.length > 0 ? (
                    data.pieces.map((pieces, idx) => (
                      <span key={idx} className="value-tag pieces-tag">
                        {pieces} {pieces <= 1 ? 'pièce' : 'pièces'}
                      </span>
                    ))
                  ) : (
                    <span className="no-value">-</span>
                  )}
                </div>
              </div>

              {/* ✅ Valeurs (loyers ou prix) - CORRIGÉ */}
              <div className="detail-line">
                <span className="detail-icon">💰</span>
                <span className="detail-label">{isVente ? 'Prix:' : 'Loyers:'}</span>
                <div className="detail-values">
                  {data.valeurs && data.valeurs.length > 0 ? (
                    data.valeurs.map((valeur, idx) => (
                      <span key={idx} className="value-tag price-tag">
                        {valeur.toLocaleString()} FCFA
                      </span>
                    ))
                  ) : (
                    <span className="no-value">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="empty-lots-message">
        <span className="empty-icon">🏘️</span>
        <p>Aucun lot ajouté pour le moment</p>
      </div>
    )}
    
    <button 
      type="button" 
      className="btn-add-lot-primary"
      onClick={() => { resetCurrentLot(); setEditingLotIndex(null); setShowLotForm(true); }}
    >
      <span className="btn-icon">➕</span> Ajouter un lot
    </button>
  </div>
)}

                    {/* ONGLET LISTE DES LOTS */}
                    {activeTab === 'details' && (
                      <div className="lots-list-container">
                        {errors.lots && <span className="error-message">{errors.lots}</span>}
                        
                        <div className="lots-list-actions">
                          <button 
                            type="button" 
                            className="btn-add-lot-secondary"
                            onClick={() => { resetCurrentLot(); setEditingLotIndex(null); setShowLotForm(true); }}
                          >
                            <span className="btn-icon">➕</span> Ajouter un lot
                          </button>
                        </div>

                        {formData.lots.length > 0 ? (
                          <div className="lots-table-wrapper">
                            <table className="lots-table">
                              <thead>
                                <tr>
                                  <th>N°</th>
                                  <th>Type</th>
                                  <th>Désignation</th>
                                  <th>Surface</th>
                                  <th>Pièces</th>
                                  <th>Étage</th>
                                  <th>{isVente ? 'Prix' : 'Loyer'}</th>
                                  <th>Statut</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formData.lots.map((lot, index) => (
                                  <tr key={lot.id || index} className="lot-table-row">
                                    <td className="lot-num-cell">
                                      <span className="lot-number-badge">{lot.numero_lot || '-'}</span>
                                    </td>
                                    <td className="lot-type-cell">
                                      <span className="lot-type-badge">
                                        {lot.type_lot === 'APPARTEMENT' && '🏢'}
                                        {lot.type_lot === 'MAGASIN' && '🏪'}
                                        {lot.type_lot === 'BUREAU' && '🏢'}
                                        {lot.type_lot === 'STUDIO' && '🏢'}
                                        {lot.type_lot === 'PARKING' && '🅿️'}
                                        {lot.type_lot === 'CHAMBRE' && '🛏️'}
                                        {' '}{lot.type_lot}
                                      </span>
                                    </td>
                                    <td className="lot-nom-cell">{lot.nom || '-'}</td>
                                    <td className="lot-surface-cell">{lot.surface ? `${lot.surface} m²` : '-'}</td>
                                    <td className="lot-pieces-cell">{lot.pieces || '-'}</td>
                                    <td className="lot-etage-cell">{lot.etage || '-'}</td>
                                    <td className="lot-prix-cell">
                                      <span className="price-value">
                                        {isVente 
                                          ? `${parseInt(lot.prix_vente || '0').toLocaleString()} FCFA`
                                          : `${parseInt(lot.loyer_mensuel || '0').toLocaleString()} FCFA`}
                                      </span>
                                    </td>
                                    <td className="lot-statut-cell">
                                      <span className={`lot-status-badge ${lot.statut === 'LOUE' ? 'status-loue' : lot.statut === 'DISPONIBLE' ? 'status-disponible' : 'status-vente'}`}>
                                        {lot.statut === 'LOUE' ? 'Loué' : lot.statut === 'DISPONIBLE' ? 'Disponible' : 'En vente'}
                                      </span>
                                    </td>
                                    <td className="lot-actions-cell">
                                      <div className="lot-actions-group">
                                        <button 
                                          type="button" 
                                          className="lot-action-btn edit"
                                          onClick={() => handleEditLot(index)}
                                          title="Modifier"
                                        >
                                          ✏️
                                        </button>
                                        <button 
                                          type="button" 
                                          className="lot-action-btn delete"
                                          onClick={() => handleRemoveLot(index)}
                                          title="Supprimer"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="empty-lots-message">
                            <span className="empty-icon">📦</span>
                            <p>Aucun lot ajouté pour le moment</p>
                            <button 
                              type="button" 
                              className="btn-add-lot-primary"
                              onClick={() => { resetCurrentLot(); setEditingLotIndex(null); setShowLotForm(true); }}
                            >
                              <span className="btn-icon">➕</span> Ajouter un premier lot
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── LOCALISATION ───────────────────────────────── */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>📍</span> Localisation
                  </div>
                  <div className="form-grid">

                    {/* 1. District */}
                    <div className="form-group">
                      <label>District *</label>
                      <select
                        value={formData.district}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            district: e.target.value,
                            commune: '',
                            ville: '',
                            quartier: '',
                          }))
                        }
                        className={errors.district ? 'error' : ''}
                      >
                        <option value="">— Sélectionnez un district —</option>
                        {DISTRICTS_CI.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      {errors.district && <span className="error-message">{errors.district}</span>}
                    </div>

                    {/* 2a. Commune — district Abidjan */}
                    {formData.district === 'Abidjan' && (
                      <div className="form-group">
                        <label>Commune *</label>
                        <select
                          value={formData.commune}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, commune: e.target.value, quartier: '' }))
                          }
                          className={errors.commune ? 'error' : ''}
                        >
                          <option value="">— Sélectionnez une commune —</option>
                          {COMMUNES_ABIDJAN.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        {errors.commune && <span className="error-message">{errors.commune}</span>}
                      </div>
                    )}

                    {/* 2b. Ville — autres districts */}
                    {formData.district && formData.district !== 'Abidjan' && (
                      <div className="form-group">
                        <label>Ville / Commune *</label>
                        {villesDisponibles.length > 0 ? (
                          <>
                            <select
                              value={formData.ville}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, ville: e.target.value, quartier: '' }));
                                if (e.target.value !== '__autre__') setVilleSaisie('');
                              }}
                              className={errors.ville ? 'error' : ''}
                            >
                              <option value="">— Sélectionnez une ville —</option>
                              {villesDisponibles.map(v => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                              <option value="__autre__">✏️ Autre ville…</option>
                            </select>
                            {formData.ville === '__autre__' && (
                              <input
                                type="text"
                                value={villeSaisie}
                                onChange={(e) => setVilleSaisie(e.target.value)}
                                placeholder="Saisissez le nom de la ville"
                                className={`mt-1 ${errors.ville ? 'error' : ''}`}
                                autoFocus
                              />
                            )}
                          </>
                        ) : (
                          <input
                            type="text"
                            value={villeSaisie}
                            onChange={(e) => setVilleSaisie(e.target.value)}
                            placeholder="Nom de la ville ou commune"
                            className={errors.ville ? 'error' : ''}
                          />
                        )}
                        {errors.ville && <span className="error-message">{errors.ville}</span>}
                      </div>
                    )}

                    {/* 3. Quartier */}
                    <div className="form-group">
                      <label>Quartier</label>
                      {quartiersDisponibles.length > 0 ? (
                        <>
                          <select
                            value={formData.quartier}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, quartier: e.target.value }));
                              if (e.target.value !== '__autre__') setQuartierSaisi('');
                            }}
                          >
                            <option value="">— Sélectionnez un quartier —</option>
                            {quartiersDisponibles.map(q => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                            <option value="__autre__">✏️ Autre quartier…</option>
                          </select>
                          {formData.quartier === '__autre__' && (
                            <input
                              type="text"
                              value={quartierSaisi}
                              onChange={(e) => setQuartierSaisi(e.target.value)}
                              placeholder="Saisissez le nom du quartier"
                              className="mt-1"
                              autoFocus
                            />
                          )}
                        </>
                      ) : (
                        <input
                          type="text"
                          value={formData.quartier}
                          onChange={(e) => setFormData(prev => ({ ...prev, quartier: e.target.value }))}
                          placeholder="Nom du quartier (optionnel)"
                        />
                      )}
                    </div>

                    {/* 4. Adresse */}
                    <div className="form-group">
                      <label>Adresse (optionnel)</label>
                      <input
                        type="text"
                        value={formData.adresse}
                        onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                        className={errors.adresse ? 'error' : ''}
                        placeholder="Rue, numéro, lieu-dit..."
                      />
                      {errors.adresse && <span className="error-message">{errors.adresse}</span>}
                    </div>

                  </div>
                </div>
                {/* ── FIN LOCALISATION ───────────────────────────── */}

                {/* ── Caractéristiques ───────────────────────────── */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>📐</span> Caractéristiques
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Surface (m²) *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.surface}
                        onChange={(e) => handleNumberChange(e, 'surface', true)}
                        className={errors.surface ? 'error' : ''}
                        placeholder="150"
                      />
                      {errors.surface && <span className="error-message">{errors.surface}</span>}
                    </div>

                    {formData.type_bien !== 'TERRAIN' && formData.type_bien !== 'IMMEUBLE' && (
                      <div className="form-group">
                        <label>Nombre de pièces *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.pieces}
                          onChange={(e) => handleNumberChange(e, 'pieces', true)}
                          className={errors.pieces ? 'error' : ''}
                          placeholder="4"
                        />
                        {errors.pieces && <span className="error-message">{errors.pieces}</span>}
                      </div>
                    )}

                    {(formData.type_bien === 'APPARTEMENT' || formData.type_bien === 'BUREAU' || formData.type_bien === 'MAGASIN') && (
                      <div className="form-group">
                        <label>Étage</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.etage}
                          onChange={(e) => handleNumberChange(e, 'etage', true)}
                          placeholder="2"
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      placeholder={
                        isImmeuble
                          ? "Description de l'immeuble (nombre d'étages, type de lots, équipements...)"
                          : "Description du bien (équipements, état, particularités...)"
                      }
                    />
                  </div>
                </div>

                {/* ── Photos ─────────────────────────────────────── */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>📸</span> Photos
                  </div>
                  <div className="photos-upload">
                    <label htmlFor="photos" className="photos-upload-btn">
                      📁 Ajouter des photos
                    </label>
                    <input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                    />
                    {photoPreviews.length > 0 && (
                      <div className="photos-preview">
                        {photoPreviews.map((preview, index) => {
                          const isExisting = bien && index < existingPhotos.length;
                          const photoId = isExisting ? existingPhotos[index]?.id : null;
                          return (
                            <div key={index} className="photo-preview-item">
                              <img src={preview} alt={`Photo ${index + 1}`} />
                              <button
                                type="button"
                                className="remove-photo"
                                onClick={() => {
                                  if (isExisting && photoId) handleDeleteExistingPhoto(photoId, preview);
                                  else handleDeleteNewPhoto(index);
                                }}
                                title="Supprimer"
                              >
                                ✕
                              </button>
                              {index === 0 && <span className="photo-principale">Principale</span>}
                              {isExisting && formData.photosToDelete.includes(photoId!) && (
                                <span className="photo-deleted">À supprimer</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>
              Annuler
            </button>
            <button type="submit" className="btn-submit" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <><span className="spinner-small"></span>Enregistrement...</>
              ) : (
                '💾 Enregistrer'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* ── MODALE LOT ──────────────────────────────────── */}
      <AnimatePresence>
        {showLotForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLotForm(false)}
          >
            <motion.div
              className="modal-content lot-form-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{editingLotIndex !== null ? 'Modifier le lot' : 'Nouveau lot'}</h2>
                <button className="modal-close-btn" onClick={() => setShowLotForm(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Type de lot *</label>
                    <select
                      value={currentLot.type_lot || 'APPARTEMENT'}
                      onChange={(e) => setCurrentLot(prev => ({ ...prev, type_lot: e.target.value }))}
                    >
                      {typesLots.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Numéro de lot</label>
                    <input
                      type="text"
                      value={currentLot.numero_lot || ''}
                      onChange={(e) => setCurrentLot(prev => ({ ...prev, numero_lot: e.target.value }))}
                      placeholder="Ex: LOT-001, APP-001..."
                    />
                    <small className="field-hint">Identifiant unique du lot (ex: LOT-001)</small>
                  </div>

                  <div className="form-group">
                    <label>Étage</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentLot.etage || ''}
                      onChange={(e) => handleNumberChange(e, 'etage', false)}
                      placeholder="2"
                    />
                    <small className="field-hint">Numéro de l'étage dans l'immeuble</small>
                  </div>

                  <div className="form-group">
                    <label>Nom / Désignation</label>
                    <input
                      type="text"
                      value={currentLot.nom || ''}
                      onChange={(e) => setCurrentLot(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="Généré automatiquement"
                    />
                    <small className="field-hint">Nom du lot - modifiable</small>
                  </div>

                  <div className="form-group">
                    <label>Surface (m²)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentLot.surface || ''}
                      onChange={(e) => handleNumberChange(e, 'surface', false)}
                      placeholder="85"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nombre de pièces</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentLot.pieces || ''}
                      onChange={(e) => handleNumberChange(e, 'pieces', false)}
                      placeholder="3"
                    />
                  </div>

                  {/* Affichage conditionnel selon le statut du bien principal */}
                  {isVente ? (
                    <div className="form-group">
                      <label>Prix de vente (FCFA) *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={currentLot.prix_vente || ''}
                        onChange={(e) => setCurrentLot(prev => ({ ...prev, prix_vente: formatNumber(e.target.value) }))}
                        placeholder="50000000"
                      />
                      <small className="field-hint">Prix de vente de ce lot</small>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Loyer mensuel (FCFA) *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={currentLot.loyer_mensuel || ''}
                        onChange={(e) => setCurrentLot(prev => ({ ...prev, loyer_mensuel: formatNumber(e.target.value) }))}
                        placeholder="150000"
                      />
                      <small className="field-hint">Loyer mensuel de ce lot</small>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={currentLot.statut || 'DISPONIBLE'}
                      onChange={(e) => setCurrentLot(prev => ({ ...prev, statut: e.target.value }))}
                    >
                      {STATUTS_LOT.map(statut => (
                        <option key={statut.value} value={statut.value}>{statut.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => { resetCurrentLot(); setEditingLotIndex(null); setShowLotForm(false); }}
                >
                  Annuler
                </button>
                <button type="button" className="btn-submit" onClick={handleAddLot}>
                  {editingLotIndex !== null ? '💾 Modifier' : '➕ Ajouter'}
                </button>
                {!editingLotIndex && (
                  <button type="button" className="btn-multiple" onClick={openMultipleLotModal}>
                    🔄 Ajouter multiple
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODALE POUR AJOUT MULTIPLE DE LOTS ──────────────────────────────── */}
      <AnimatePresence>
        {showMultipleLotModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMultipleLotModal(false)}
          >
            <motion.div
              className="modal-content multiple-lot-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Ajouter plusieurs lots</h2>
                <button className="modal-close-btn" onClick={() => setShowMultipleLotModal(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="multiple-lot-config">
                  <div className="config-group">
                    <label>Nombre de lots à ajouter</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={multipleLotConfig.quantite}
                      onChange={(e) => setMultipleLotConfig(prev => ({ ...prev, quantite: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="config-group">
                    <label>Préfixe des numéros de lot</label>
                    <input
                      type="text"
                      value={multipleLotConfig.prefixe}
                      onChange={(e) => setMultipleLotConfig(prev => ({ ...prev, prefixe: e.target.value.toUpperCase() }))}
                      placeholder="Ex: LOT, APP, BUREAU"
                    />
                    <small className="field-hint">Les lots seront numérotés LOT-001, LOT-002, etc.</small>
                  </div>

                  <div className="config-group">
                    <label>Numéro de départ</label>
                    <input
                      type="number"
                      min="1"
                      value={multipleLotConfig.startNumber}
                      onChange={(e) => setMultipleLotConfig(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 1 }))}
                    />
                    <small className="field-hint">Premier numéro à utiliser (ex: 1 = LOT-001)</small>
                  </div>

                  <div className="preview-lots">
                    <strong>Aperçu:</strong> {multipleLotConfig.prefixe}-{String(multipleLotConfig.startNumber).padStart(3, '0')} à {multipleLotConfig.prefixe}-{String(multipleLotConfig.startNumber + multipleLotConfig.quantite - 1).padStart(3, '0')}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowMultipleLotModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className="btn-submit" 
                  onClick={handleAddMultipleLotsFromModal}
                >
                  ➕ Ajouter {multipleLotConfig.quantite} lot(s)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmation suppression photo ─────────────── */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer la photo"
        message="Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible."
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDeletePhoto}
        onCancel={() => { setShowDeleteConfirm(false); setPhotoToDelete(null); }}
      />
    </>
  );
}