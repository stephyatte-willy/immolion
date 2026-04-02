'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bien } from '@/app/biens/page';
import { TYPES_BIENS_CI_AVANCES, STATUTS_LOT } from '@/app/types/biens';
import { 
  DISTRICTS_CI, 
  COMMUNES_ABIDJAN, 
  QUARTIERS_CI 
} from '@/app/types/ci';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import '@/app/biens/biens.css';

type TypeBien = 'IMMEUBLE' | 'APPARTEMENT' | 'MAISON' | 'VILLA' | 'STUDIO' | 'MAGASIN' | 'ENTREPOT' | 'BUREAU' | 'TERRAIN' | 'PARKING' | 'CHAMBRE' | 'KIOSQUE';
type StatutBien = 'DISPONIBLE' | 'LOUE' | 'EN_TRAVAUX' | 'EN_VENTE' | 'RESERVE';

interface LotForm {
  id?: number;
  numero_lot?: string;
  etage: string;
  type_lot: string;
  nom: string;
  surface: string;
  pieces: string;
  loyer_mensuel: string;
  charges: string;
  depot_garantie: string;
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
    charges: '',
    depot_garantie: '',
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

  const [proprietaires, setProprietaires] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<{id: number, url: string, est_principale: boolean}[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{id: number, url: string} | null>(null);
  const [quartiersDisponibles, setQuartiersDisponibles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [communeSaisie, setCommuneSaisie] = useState('');
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
    charges: '',
    depot_garantie: '',
    prix_vente: '',
    description: '',
    statut: 'DISPONIBLE'
  });

  const isImmeuble = formData.type_bien === 'IMMEUBLE';
  const isVente = formData.statut === 'EN_VENTE';

  const typesLots = [
    'APPARTEMENT', 'MAGASIN', 'BUREAU', 'STUDIO', 'PARKING', 'CHAMBRE'
  ];

  // Fonction pour formater les nombres sans décimales
  const formatNumber = (value: string) => {
    if (!value) return '';
    // Supprimer tout ce qui n'est pas un chiffre
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned;
  };

  // Fonction pour gérer les changements de champs numériques
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, isFormData: boolean = true) => {
    const rawValue = e.target.value;
    const cleanValue = formatNumber(rawValue);
    
    if (isFormData) {
      setFormData({ ...formData, [field]: cleanValue });
    } else {
      setCurrentLot({ ...currentLot, [field]: cleanValue });
    }
  };

  const lotsParType = () => {
    const result: Record<string, { 
      count: number; 
      loyers: number[]; 
      total: number; 
      lots: any[];
      surfaces: number[];
      pieces: number[];
    }> = {};
    
    formData.lots.forEach(lot => {
      const type = lot.type_lot;
      const loyer = parseFloat(lot.loyer_mensuel) || 0;
      const surface = parseFloat(lot.surface) || 0;
      const pieces = parseInt(lot.pieces) || 0;
      
      if (!result[type]) {
        result[type] = { 
          count: 0, 
          loyers: [], 
          total: 0, 
          lots: [],
          surfaces: [],
          pieces: []
        };
      }
      
      result[type].count += 1;
      result[type].loyers.push(loyer);
      result[type].surfaces.push(surface);
      result[type].pieces.push(pieces);
      result[type].total += loyer;
      result[type].lots.push(lot);
    });
    
    return result;
  };

  const lotsStats = lotsParType();
  
  const totalRevenus = formData.lots.reduce((sum, lot) => {
    return sum + (parseFloat(lot.loyer_mensuel) || 0);
  }, 0);

  const lotsLoues = formData.lots.filter(lot => lot.statut === 'LOUE').length;
  const lotsDisponibles = formData.lots.filter(lot => lot.statut === 'DISPONIBLE').length;
  const lotsEnVente = formData.lots.filter(lot => lot.statut === 'EN_VENTE').length;
  const totalLots = formData.lots.length;

  useEffect(() => {
    chargerProprietaires();
    
    if (bien) {
      chargerLotsDuBien(bien.id);
      
      setFormData({
        proprietaire_id: bien.proprietaire_id?.toString() || '',
        nom: bien.nom,
        type_bien: bien.type_bien as TypeBien,
        statut: bien.statut as StatutBien,
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
        charges: bien.charges?.toString() || '',
        depot_garantie: bien.depot_garantie?.toString() || '',
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

      if (bien.commune && QUARTIERS_CI[bien.commune]) {
        setQuartiersDisponibles(QUARTIERS_CI[bien.commune]);
      }
    }
  }, [bien]);

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

  useEffect(() => {
    if (formData.commune && QUARTIERS_CI[formData.commune]) {
      setQuartiersDisponibles(QUARTIERS_CI[formData.commune]);
    } else {
      setQuartiersDisponibles([]);
    }
  }, [formData.commune]);

  const chargerProprietaires = async () => {
    try {
      const response = await fetch('/api/proprietaires?actif=ACTIF');
      const data = await response.json();
      if (data.success) {
        setProprietaires(data.proprietaires);
      }
    } catch (error) {
      console.error('Erreur chargement propriétaires:', error);
    }
  };

  // Ajouter plusieurs lots identiques
  const handleAddMultipleLots = () => {
    if (!currentLot.loyer_mensuel) {
      toast.error('Veuillez remplir le loyer mensuel');
      return;
    }

    const quantite = prompt('Combien d\'appartements identiques voulez-vous ajouter ?', '1');
    const quantiteNum = parseInt(quantite || '1');
    
    if (isNaN(quantiteNum) || quantiteNum < 1) {
      toast.error('Quantité invalide');
      return;
    }

    if (quantiteNum > 100) {
      toast.error('La quantité maximale est de 100 lots par opération');
      return;
    }

    const newLots = [...formData.lots];
    
    for (let i = 0; i < quantiteNum; i++) {
      let numeroLot = currentLot.numero_lot || `Lot_${Date.now()}_${i + 1}`;
      if (quantiteNum > 1 && i > 0) {
        numeroLot = `${currentLot.numero_lot || 'Lot'}_${i + 1}`;
      }
      
      const newLot: LotForm = {
        numero_lot: numeroLot,
        etage: currentLot.etage || '',
        type_lot: currentLot.type_lot,
        nom: currentLot.nom || '',
        surface: currentLot.surface || '',
        pieces: currentLot.pieces || '',
        loyer_mensuel: currentLot.loyer_mensuel,
        charges: currentLot.charges || '0',
        depot_garantie: currentLot.depot_garantie || '',
        prix_vente: currentLot.prix_vente || '',
        description: '',
        statut: currentLot.statut
      };
      
      newLots.push(newLot);
    }
    
    setFormData({ ...formData, lots: newLots, nombre_lots: newLots.length });
    
    resetCurrentLot();
    setShowLotForm(false);
    
    toast.success(`${quantiteNum} lot(s) ajouté(s) avec succès`);
  };

  // Ajouter un seul lot
  const handleAddLot = () => {
    if (!currentLot.loyer_mensuel) {
      toast.error('Veuillez remplir le loyer mensuel');
      return;
    }

    const newLots = [...formData.lots];
    const newLot = {
      ...currentLot,
      numero_lot: currentLot.numero_lot || `Lot_${Date.now()}`,
      description: ''
    };
    
    if (editingLotIndex !== null) {
      newLots[editingLotIndex] = newLot;
      toast.success('Lot modifié avec succès');
    } else {
      newLots.push(newLot);
      toast.success('Lot ajouté avec succès');
    }

    setFormData({ ...formData, lots: newLots, nombre_lots: newLots.length });
    
    resetCurrentLot();
    setEditingLotIndex(null);
    setShowLotForm(false);
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
      charges: '',
      depot_garantie: '',
      prix_vente: '',
      description: '',
      statut: 'DISPONIBLE'
    });
  };

  const handleEditLot = (index: number) => {
    const lotToEdit = formData.lots[index];
    setCurrentLot({ ...lotToEdit });
    setEditingLotIndex(index);
    setShowLotForm(true);
  };

  const handleRemoveLot = (index: number) => {
    const lotToRemove = formData.lots[index];
    
    if (lotToRemove.id) {
      setLotsToDelete(prev => [...prev, lotToRemove.id!]);
    }
    
    const newLots = [...formData.lots];
    newLots.splice(index, 1);
    setFormData({ ...formData, lots: newLots, nombre_lots: newLots.length });
    toast.success('Lot supprimé');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    // Adresse n'est plus requise
    if (!formData.district) newErrors.district = 'Le district est requis';
    
    if (formData.district === 'Abidjan') {
      if (!formData.commune) newErrors.commune = 'La commune est requise';
    } else {
      if (!communeSaisie.trim()) newErrors.communeSaisie = 'La ville/commune est requise';
    }
    
    if (!formData.surface) newErrors.surface = 'La surface est requise';
    else if (parseFloat(formData.surface) <= 0) newErrors.surface = 'La surface doit être positive';
    
    if (formData.type_bien !== 'TERRAIN' && formData.type_bien !== 'IMMEUBLE') {
      if (!formData.pieces) newErrors.pieces = 'Le nombre de pièces est requis';
      else if (parseInt(formData.pieces) <= 0) newErrors.pieces = 'Le nombre de pièces doit être positif';
    }

    if (formData.statut === 'EN_VENTE') {
      if (!formData.prix_vente) newErrors.prix_vente = 'Le prix de vente est requis';
      else if (parseFloat(formData.prix_vente) <= 0) newErrors.prix_vente = 'Le prix doit être positif';
    } else if (formData.statut === 'LOUE' || formData.statut === 'DISPONIBLE') {
      if (formData.type_bien !== 'TERRAIN' && !isImmeuble) {
        if (!formData.loyer_mensuel) newErrors.loyer_mensuel = 'Le loyer mensuel est requis';
        else if (parseFloat(formData.loyer_mensuel) <= 0) newErrors.loyer_mensuel = 'Le loyer doit être positif';
      }
    }

    if (isImmeuble && formData.lots.length === 0) {
      newErrors.lots = 'Au moins un lot est requis pour un immeuble';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast.error('Veuillez remplir tous les champs obligatoires');
    return;
  }

  setIsLoading(true);

  try {
    const formDataToSend = new FormData();
    
    // Données de base
    formDataToSend.append('proprietaire_id', formData.proprietaire_id);
    formDataToSend.append('nom', formData.nom);
    formDataToSend.append('type_bien', formData.type_bien);
    formDataToSend.append('statut', formData.statut);
    formDataToSend.append('adresse', formData.adresse || '');
    formDataToSend.append('quartier', formData.quartier || '');
    
    const communeValue = formData.district === 'Abidjan' ? formData.commune : communeSaisie;
    formDataToSend.append('commune', communeValue);
    formDataToSend.append('ville', formData.ville || 'Abidjan');
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
      formDataToSend.append('charges', '0');
      formDataToSend.append('depot_garantie', '');
    } else {
      formDataToSend.append('loyer_mensuel', formData.loyer_mensuel || '0');
      formDataToSend.append('charges', formData.charges || '0');
      formDataToSend.append('depot_garantie', formData.depot_garantie || '');
      formDataToSend.append('prix_vente', '');
    }
    
    formDataToSend.append('est_principal', isImmeuble ? '1' : '1');
    formDataToSend.append('nombre_lots', formData.lots.length.toString());
    
    // Lots
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
        charges: lot.charges || '0',
        depot_garantie: lot.depot_garantie || null,
        prix_vente: lot.prix_vente || null,
        description: '',
        statut: lot.statut
      }));
      
      formDataToSend.append('lots', JSON.stringify(lotsToSend));
      
      if (lotsToDelete.length > 0) {
        formDataToSend.append('lotsToDelete', JSON.stringify(lotsToDelete));
      }
    }
    
    // ✅ PHOTOS - Important: S'assurer que les photos sont bien ajoutées
    // Photos à supprimer
    if (formData.photosToDelete && formData.photosToDelete.length > 0) {
      formData.photosToDelete.forEach(id => {
        formDataToSend.append('photosToDelete', id.toString());
      });
      console.log('📸 Photos à supprimer:', formData.photosToDelete);
    }

    // ✅ Nouvelles photos - Vérifier que formData.photos contient bien les fichiers
    if (formData.photos && formData.photos.length > 0) {
      formData.photos.forEach((photo, index) => {
        if (photo instanceof File && photo.size > 0) {
          formDataToSend.append('photos', photo);
          console.log(`📸 Photo ${index + 1} ajoutée:`, photo.name, photo.size);
        }
      });
      console.log(`📸 Total nouvelles photos: ${formData.photos.length}`);
    } else {
      console.log('📸 Aucune nouvelle photo à ajouter');
    }

    const url = bien ? `/api/biens/${bien.id}` : '/api/biens';
    const method = bien ? 'PUT' : 'POST';

    console.log('📤 Envoi des données...');
    console.log('📸 Nombre de photos dans FormData:', formDataToSend.getAll('photos').length);

    const response = await fetch(url, {
      method,
      body: formDataToSend
    });

    const data = await response.json();
    console.log('📦 Réponse API:', data);

    if (data.success) {
      toast.success(bien ? 'Bien modifié avec succès' : 'Bien créé avec succès');
      onSuccess();
    } else {
      console.error('❌ Erreur réponse:', data);
      toast.error(data.erreur || 'Une erreur est survenue');
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
    toast.error('Erreur de connexion au serveur');
  } finally {
    setIsLoading(false);
  }
};

const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  
  const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
  if (validFiles.length !== files.length) {
    toast.error('Certaines photos dépassent 5MB et ont été ignorées');
  }

  setFormData({ ...formData, photos: [...formData.photos, ...validFiles] });

  const newPreviews = validFiles.map(f => URL.createObjectURL(f));
  setPhotoPreviews([...photoPreviews, ...newPreviews]);
};

  const handleDeleteExistingPhoto = (photoId: number, photoUrl: string) => {
    setPhotoToDelete({ id: photoId, url: photoUrl });
    setShowDeleteConfirm(true);
  };

  const confirmDeletePhoto = () => {
    if (photoToDelete) {
      setFormData({
        ...formData,
        photosToDelete: [...formData.photosToDelete, photoToDelete.id]
      });

      const photoIndex = existingPhotos.findIndex(p => p.id === photoToDelete.id);
      if (photoIndex !== -1) {
        const newPreviews = [...photoPreviews];
        newPreviews.splice(photoIndex, 1);
        setPhotoPreviews(newPreviews);

        const newExistingPhotos = [...existingPhotos];
        newExistingPhotos.splice(photoIndex, 1);
        setExistingPhotos(newExistingPhotos);
      }

      toast.success('Photo marquée pour suppression');
    }
    setShowDeleteConfirm(false);
    setPhotoToDelete(null);
  };

  const handleDeleteNewPhoto = (index: number) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index - existingPhotos.length, 1);
    setFormData({ ...formData, photos: newPhotos });

    const newPreviews = [...photoPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPhotoPreviews(newPreviews);

    toast.success('Photo supprimée');
  };

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
            <h2>{bien ? 'Modifier le bien' : 'Nouveau bien'} {formData.nom}</h2>
            <button className="modal-close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit} className="bien-form">
              <div className="form-sections">
                {/* Propriétaire */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>👤</span> Propriétaire (optionnel)
                  </div>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Propriétaire</label>
                      <select
                        value={formData.proprietaire_id}
                        onChange={(e) => setFormData({...formData, proprietaire_id: e.target.value})}
                      >
                        <option value="">-- Sans propriétaire --</option>
                        {proprietaires.map(prop => (
                          <option key={prop.id} value={prop.id}>
                            {prop.type === 'PARTICULIER' ? '👤' : prop.type === 'SOCIETE' ? '🏢' : '🏪'} 
                            {' '}{prop.prenom} {prop.nom} - {prop.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Informations générales */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>🏢</span> Informations générales
                  </div>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Nom du bien *</label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        className={errors.nom ? 'error' : ''}
                        placeholder="Ex: Résidence Victor Hugo, Immeuble Cité Verte"
                      />
                      {errors.nom && <span className="error-message">{errors.nom}</span>}
                    </div>

                    <div className="form-group">
                      <label>Type de bien *</label>
                      <select
                        value={formData.type_bien}
                        onChange={(e) => {
                          setFormData({...formData, type_bien: e.target.value as TypeBien});
                          if (e.target.value !== 'IMMEUBLE') {
                            setFormData(prev => ({ ...prev, lots: [], nombre_lots: 0 }));
                          }
                        }}
                        className="select-with-arrow"
                      >
                        {TYPES_BIENS_CI_AVANCES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icone} {type.label} {type.peutAvoirLots ? ' (Immeuble avec lots)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Statut *</label>
                      <select
                        value={formData.statut}
                        onChange={(e) => setFormData({...formData, statut: e.target.value as StatutBien})}
                      >
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="LOUE">Loué</option>
                        <option value="EN_TRAVAUX">En travaux</option>
                        <option value="EN_VENTE">En vente</option>
                        <option value="RESERVE">Réservé</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Aspects financiers */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>💰</span> {isVente ? 'Prix de vente' : 'Aspects financiers'}
                  </div>
                  <div className="form-grid">
                    {isVente ? (
                      <div className="form-group full-width">
                        <label>Prix de vente (FCFA) *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.prix_vente}
                          onChange={(e) => handleNumberChange(e, 'prix_vente', true)}
                          className={errors.prix_vente ? 'error' : ''}
                          placeholder="50000000"
                        />
                        {errors.prix_vente && <span className="error-message">{errors.prix_vente}</span>}
                      </div>
                    ) : (
                      !isImmeuble && (
                        <>
                          <div className="form-group">
                            <label>Loyer mensuel (FCFA) *</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formData.loyer_mensuel}
                              onChange={(e) => handleNumberChange(e, 'loyer_mensuel', true)}
                              className={errors.loyer_mensuel ? 'error' : ''}
                              placeholder="250000"
                            />
                            {errors.loyer_mensuel && <span className="error-message">{errors.loyer_mensuel}</span>}
                          </div>

                          <div className="form-group">
                            <label>Charges mensuelles (FCFA)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formData.charges}
                              onChange={(e) => handleNumberChange(e, 'charges', true)}
                              placeholder="25000"
                            />
                          </div>

                          <div className="form-group">
                            <label>Dépôt de garantie (FCFA)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formData.depot_garantie}
                              onChange={(e) => handleNumberChange(e, 'depot_garantie', true)}
                              placeholder="500000"
                            />
                          </div>
                        </>
                      )
                    )}

                    <div className="form-group">
                      <label>Date d'acquisition</label>
                      <input
                        type="date"
                        value={formData.date_acquisition}
                        onChange={(e) => setFormData({...formData, date_acquisition: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {isImmeuble && (
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

                    {activeTab === 'resume' && (
                      <div className="lots-resume">
                        <div className="summary-stats">
                          <div className="stat-card-small">
                            <div className="stat-value">{totalLots}</div>
                            <div className="stat-label">Total lots</div>
                          </div>
                          <div className="stat-card-small">
                            <div className="stat-value">{lotsLoues}</div>
                            <div className="stat-label">Loués</div>
                          </div>
                          <div className="stat-card-small">
                            <div className="stat-value">{lotsDisponibles}</div>
                            <div className="stat-label">Disponibles</div>
                          </div>
                          <div className="stat-card-small">
                            <div className="stat-value">{lotsEnVente}</div>
                            <div className="stat-label">En vente</div>
                          </div>
                          <div className="stat-card-small total-revenus">
                            <div className="stat-value highlight">{totalRevenus.toLocaleString()} FCFA</div>
                            <div className="stat-label">Revenus mensuels totaux</div>
                          </div>
                        </div>

                        {Object.keys(lotsStats).length > 0 ? (
                          <div className="lots-by-type">
                            <h4>📊 Détail par type de lot</h4>
                            <div className="lots-types-table-container">
                              {Object.entries(lotsStats).map(([type, data]) => (
                                <div key={type} className="lot-type-card-table">
                                  <div className="lot-type-header-table">
                                    <span className="lot-type-icon">
                                      {type === 'APPARTEMENT' ? '🏢' : 
                                       type === 'MAGASIN' ? '🏪' : 
                                       type === 'BUREAU' ? '🏢' : 
                                       type === 'STUDIO' ? '🏢' : 
                                       type === 'PARKING' ? '🅿️' : '🛏️'}
                                    </span>
                                    <span className="lot-type-name">{type}</span>
                                    <span className="lot-type-count">{data.count} lot(s)</span>
                                  </div>
                                  
                                  <div className="lot-type-details-table">
                                    <div className="detail-row">
                                      <div className="detail-label">Surfaces:</div>
                                      <div className="detail-values surfaces-list">
                                        {data.surfaces.map((surface, idx) => (
                                          <span key={idx} className="value-badge surface-badge">
                                            {surface} m²
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div className="detail-row">
                                      <div className="detail-label">Pièces:</div>
                                      <div className="detail-values pieces-list">
                                        {data.pieces.map((pieces, idx) => (
                                          <span key={idx} className="value-badge pieces-badge">
                                            {pieces} {pieces <= 1 ? 'pièce' : 'pièces'}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div className="detail-row">
                                      <div className="detail-label">Loyers:</div>
                                      <div className="detail-values loyers-list">
                                        {data.loyers.map((loyer, idx) => (
                                          <span key={idx} className="value-badge loyer-badge">
                                            {loyer.toLocaleString()} FCFA
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div className="detail-total">
                                      <span className="total-label">Total mensuel:</span>
                                      <span className="total-value">{data.total.toLocaleString()} FCFA</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="no-lots-message">Aucun lot ajouté pour le moment</p>
                        )}

                        <button 
                          type="button"
                          className="btn-add-lot"
                          onClick={() => {
                            resetCurrentLot();
                            setEditingLotIndex(null);
                            setShowLotForm(true);
                          }}
                        >
                          <span className="btn-icon">➕</span>
                          Ajouter un lot
                        </button>
                      </div>
                    )}

                    {activeTab === 'details' && (
                      <div className="lots-list-container">
                        {errors.lots && <span className="error-message">{errors.lots}</span>}
                        
                        <button 
                          type="button"
                          className="btn-add-lot"
                          onClick={() => {
                            resetCurrentLot();
                            setEditingLotIndex(null);
                            setShowLotForm(true);
                          }}
                        >
                          <span className="btn-icon">➕</span>
                          Ajouter un lot
                        </button>

                        {formData.lots.length > 0 ? (
                          <div className="lots-list">
                            <div className="lots-header">
                              <span className="lot-num">N°</span>
                              <span className="lot-type">Type</span>
                              <span className="lot-surface">Surface</span>
                              <span className="lot-pieces">Pièces</span>
                              <span className="lot-loyer">Loyer</span>
                              <span className="lot-statut">Statut</span>
                              <span className="lot-actions">Actions</span>
                            </div>
                            {formData.lots.map((lot, index) => (
                              <div key={lot.id || index} className="lot-item">
                                <span className="lot-num">{lot.numero_lot || '-'}</span>
                                <span className="lot-type">{lot.type_lot}</span>
                                <span className="lot-surface">{lot.surface ? `${lot.surface} m²` : '-'}</span>
                                <span className="lot-pieces">{lot.pieces || '-'}</span>
                                <span className="lot-loyer">{parseInt(lot.loyer_mensuel || '0').toLocaleString()} FCFA</span>
                                <span className={`lot-statut ${lot.statut === 'LOUE' ? 'loue' : lot.statut === 'DISPONIBLE' ? 'disponible' : 'vente'}`}>
                                  {lot.statut === 'LOUE' ? 'Loué' : lot.statut === 'DISPONIBLE' ? 'Disponible' : 'En vente'}
                                </span>
                                <span className="lot-actions">
                                  <button 
                                    type="button" 
                                    className="edit-lot"
                                    onClick={() => handleEditLot(index)}
                                    title="Modifier"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    type="button" 
                                    className="delete-lot"
                                    onClick={() => handleRemoveLot(index)}
                                    title="Supprimer"
                                  >
                                    🗑️
                                  </button>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-lots-message">Aucun lot ajouté</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Localisation */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>📍</span> Localisation
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>District *</label>
                      <select
                        value={formData.district}
                        onChange={(e) => {
                          setFormData({...formData, district: e.target.value, commune: ''});
                          setCommuneSaisie('');
                        }}
                        className={errors.district ? 'error' : ''}
                      >
                        <option value="">Sélectionnez un district</option>
                        {DISTRICTS_CI.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      {errors.district && <span className="error-message">{errors.district}</span>}
                    </div>

                    {formData.district === 'Abidjan' ? (
                      <div className="form-group">
                        <label>Commune *</label>
                        <select
                          value={formData.commune}
                          onChange={(e) => setFormData({...formData, commune: e.target.value})}
                          className={errors.commune ? 'error' : ''}
                        >
                          <option value="">Sélectionnez une commune</option>
                          {COMMUNES_ABIDJAN.map(commune => (
                            <option key={commune} value={commune}>{commune}</option>
                          ))}
                        </select>
                        {errors.commune && <span className="error-message">{errors.commune}</span>}
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>Ville/Commune *</label>
                        <input
                          type="text"
                          value={communeSaisie}
                          onChange={(e) => setCommuneSaisie(e.target.value)}
                          className={errors.communeSaisie ? 'error' : ''}
                          placeholder="Nom de la ville ou commune"
                        />
                        {errors.communeSaisie && <span className="error-message">{errors.communeSaisie}</span>}
                      </div>
                    )}

                    <div className="form-group">
                      <label>Quartier</label>
                      {formData.district === 'Abidjan' && formData.commune && quartiersDisponibles.length > 0 ? (
                        <select
                          value={formData.quartier}
                          onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                        >
                          <option value="">Sélectionnez un quartier</option>
                          {quartiersDisponibles.map(quartier => (
                            <option key={quartier} value={quartier}>{quartier}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.quartier}
                          onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                          placeholder="Nom du quartier"
                        />
                      )}
                    </div>

                    <div className="form-group">
                      <label>Adresse (optionnel)</label>
                      <input
                        type="text"
                        value={formData.adresse}
                        onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                        className={errors.adresse ? 'error' : ''}
                        placeholder="Rue, numéro, lieu-dit..."
                      />
                      {errors.adresse && <span className="error-message">{errors.adresse}</span>}
                    </div>
                  </div>
                </div>

                {/* Caractéristiques */}
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
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      placeholder={
                        formData.statut === 'EN_TRAVAUX' 
                          ? "Description des travaux à réaliser, état actuel..."
                          : isImmeuble 
                            ? "Description de l'immeuble (nombre d'étages, type de lots, équipements...)"
                            : "Description du bien (équipements, état, particularités...)"
                      }
                    />
                  </div>
                </div>

                {/* Photos */}
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
                                  if (isExisting && photoId) {
                                    handleDeleteExistingPhoto(photoId, preview);
                                  } else {
                                    handleDeleteNewPhoto(index);
                                  }
                                }}
                                title="Supprimer"
                              >
                                ✕
                              </button>
                              {index === 0 && (
                                <span className="photo-principale">Principale</span>
                              )}
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

      {/* Modale d'ajout/modification de lot simplifiée */}
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
                      onChange={(e) => setCurrentLot({...currentLot, type_lot: e.target.value})}
                    >
                      {typesLots.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nom / Désignation</label>
                    <input
                      type="text"
                      value={currentLot.nom || ''}
                      onChange={(e) => setCurrentLot({...currentLot, nom: e.target.value})}
                      placeholder="Appartement F4, Bureau Directeur..."
                    />
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

                  <div className="form-group">
                    <label>Loyer mensuel (FCFA) *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentLot.loyer_mensuel || ''}
                      onChange={(e) => handleNumberChange(e, 'loyer_mensuel', false)}
                      placeholder="150000"
                    />
                  </div>

                  <div className="form-group">
                    <label>Charges (FCFA)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentLot.charges || ''}
                      onChange={(e) => handleNumberChange(e, 'charges', false)}
                      placeholder="25000"
                    />
                  </div>

                  <div className="form-group">
                    <label>Dépôt de garantie (FCFA)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentLot.depot_garantie || ''}
                      onChange={(e) => handleNumberChange(e, 'depot_garantie', false)}
                      placeholder="300000"
                    />
                  </div>

                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={currentLot.statut || 'DISPONIBLE'}
                      onChange={(e) => setCurrentLot({...currentLot, statut: e.target.value})}
                    >
                      {STATUTS_LOT.map(statut => (
                        <option key={statut.value} value={statut.value}>
                          {statut.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    resetCurrentLot();
                    setEditingLotIndex(null);
                    setShowLotForm(false);
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className="btn-submit"
                  onClick={handleAddLot}
                >
                  {editingLotIndex !== null ? '💾 Modifier' : '➕ Ajouter'}
                </button>
                {!editingLotIndex && (
                  <button 
                    type="button" 
                    className="btn-multiple"
                    onClick={handleAddMultipleLots}
                  >
                    🔄 Ajouter multiple
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer la photo"
        message="Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible."
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDeletePhoto}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPhotoToDelete(null);
        }}
      />
    </>
  );
}