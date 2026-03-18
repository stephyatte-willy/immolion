'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bien } from '@/app/biens/page';
import { 
  DISTRICTS_CI, 
  COMMUNES_ABIDJAN, 
  QUARTIERS_CI,
  TYPES_BIENS_CI, 
  STATUTS_BIENS_CI 
} from '@/app/types/ci';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import '@/app/biens/biens.css';

type TypeBien = 'APPARTEMENT' | 'MAISON' | 'VILLA' | 'STUDIO' | 'COMMERCIAL' | 'TERRAIN' | 'ENTREPOT' | 'BUREAU';
type StatutBien = 'DISPONIBLE' | 'LOUE' | 'EN_TRAVAUX' | 'EN_VENTE' | 'RESERVE';

interface BienFormProps {
  bien: Bien | null;
  onClose: () => void;
  onSuccess: () => void;
  utilisateurId: number;
}

export default function BienForm({ bien, onClose, onSuccess, utilisateurId }: BienFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    type_bien: 'APPARTEMENT' as TypeBien,
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
    prix_vente: '',              // ✅ Nouveau champ
    date_acquisition: '',
    latitude: '',
    longitude: '',
    photos: [] as File[],
    photosToDelete: [] as number[]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<{id: number, url: string, est_principale: boolean}[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{id: number, url: string} | null>(null);
  const [quartiersDisponibles, setQuartiersDisponibles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [communeSaisie, setCommuneSaisie] = useState('');

  // Types de biens
  const typesResidentiels = ['APPARTEMENT', 'MAISON', 'VILLA', 'STUDIO'];
  const typesAvecEtage = ['APPARTEMENT', 'COMMERCIAL', 'BUREAU'];
  const typesLocation = ['APPARTEMENT', 'MAISON', 'VILLA', 'STUDIO', 'COMMERCIAL', 'BUREAU', 'ENTREPOT'];

  useEffect(() => {
    if (bien) {
      setFormData({
        nom: bien.nom,
        type_bien: bien.type_bien as TypeBien,
        statut: bien.statut as StatutBien,
        adresse: bien.adresse,
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
        photosToDelete: []
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

  useEffect(() => {
    if (formData.commune && QUARTIERS_CI[formData.commune]) {
      setQuartiersDisponibles(QUARTIERS_CI[formData.commune]);
    } else {
      setQuartiersDisponibles([]);
    }
  }, [formData.commune]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.adresse.trim()) newErrors.adresse = 'L\'adresse est requise';
    if (!formData.district) newErrors.district = 'Le district est requis';
    
    if (formData.district === 'Abidjan') {
      if (!formData.commune) newErrors.commune = 'La commune est requise';
    } else {
      if (!communeSaisie.trim()) newErrors.communeSaisie = 'La ville/commune est requise';
    }
    
    if (!formData.surface) newErrors.surface = 'La surface est requise';
    else if (parseFloat(formData.surface) <= 0) newErrors.surface = 'La surface doit être positive';
    
    // Validation des pièces selon le type
    if (typesResidentiels.includes(formData.type_bien) || formData.type_bien === 'COMMERCIAL') {
      if (!formData.pieces) newErrors.pieces = 'Le nombre de pièces est requis';
      else if (parseInt(formData.pieces) <= 0) newErrors.pieces = 'Le nombre de pièces doit être positif';
    }

    // Validation financière selon le statut
    if (formData.statut === 'EN_VENTE') {
      if (!formData.prix_vente) newErrors.prix_vente = 'Le prix de vente est requis';
      else if (parseFloat(formData.prix_vente) <= 0) newErrors.prix_vente = 'Le prix doit être positif';
    } else if (formData.statut === 'LOUE' || formData.statut === 'DISPONIBLE') {
      if (typesLocation.includes(formData.type_bien)) {
        if (!formData.loyer_mensuel) newErrors.loyer_mensuel = 'Le loyer mensuel est requis';
        else if (parseFloat(formData.loyer_mensuel) <= 0) newErrors.loyer_mensuel = 'Le loyer doit être positif';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      formDataToSend.append('proprietaire_id', utilisateurId.toString());
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('type_bien', formData.type_bien);
      formDataToSend.append('statut', formData.statut);
      formDataToSend.append('adresse', formData.adresse);
      formDataToSend.append('quartier', formData.quartier || '');
      
      // Gestion de la commune selon le district
      const communeValue = formData.district === 'Abidjan' ? formData.commune : communeSaisie;
      formDataToSend.append('commune', communeValue);
      
      formDataToSend.append('ville', formData.ville || 'Abidjan');
      formDataToSend.append('district', formData.district);
      formDataToSend.append('pays', 'Côte d\'Ivoire');
      formDataToSend.append('surface', formData.surface);
      formDataToSend.append('pieces', formData.pieces || '1');
      formDataToSend.append('etage', formData.etage || '');
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('date_acquisition', formData.date_acquisition || '');
      formDataToSend.append('latitude', formData.latitude || '');
      formDataToSend.append('longitude', formData.longitude || '');
      
      // ✅ Gestion des champs financiers selon le statut
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
      
      // Photos
      formData.photosToDelete.forEach(id => {
        formDataToSend.append('photosToDelete', id.toString());
      });

      formData.photos.forEach(photo => {
        formDataToSend.append('photos', photo);
      });

      const url = bien 
        ? `/api/biens/${bien.id}`
        : '/api/biens';
      
      const method = bien ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend
      });

      const data = await response.json();

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

  // Déterminer si on est en mode vente
  const isVente = formData.statut === 'EN_VENTE';
  const showLocationFields = !isVente && typesLocation.includes(formData.type_bien);

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
            <h2>{bien ? 'Modifier le bien' : 'Nouveau bien'}</h2>
            <button className="modal-close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit} className="bien-form">
              <div className="form-sections">
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
                        placeholder="Ex: Villa Cocody, Résidence Palmeraie"
                      />
                      {errors.nom && <span className="error-message">{errors.nom}</span>}
                    </div>

                    <div className="form-group">
                      <label>Type de bien *</label>
                      <select
                        value={formData.type_bien}
                        onChange={(e) => setFormData({...formData, type_bien: e.target.value as TypeBien})}
                      >
                        {TYPES_BIENS_CI.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icone} {type.label}
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
                        {STATUTS_BIENS_CI.map(statut => (
                          <option key={statut.value} value={statut.value}>
                            {statut.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

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

                    <div className="form-group full-width">
                      <label>Adresse *</label>
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
                        type="number"
                        step="0.01"
                        value={formData.surface}
                        onChange={(e) => setFormData({...formData, surface: e.target.value})}
                        className={errors.surface ? 'error' : ''}
                        placeholder="150"
                      />
                      {errors.surface && <span className="error-message">{errors.surface}</span>}
                    </div>

                    {formData.type_bien !== 'TERRAIN' && (
                      <div className="form-group">
                        <label>Nombre de pièces *</label>
                        <input
                          type="number"
                          value={formData.pieces}
                          onChange={(e) => setFormData({...formData, pieces: e.target.value})}
                          className={errors.pieces ? 'error' : ''}
                          placeholder="4"
                        />
                        {errors.pieces && <span className="error-message">{errors.pieces}</span>}
                      </div>
                    )}

                    {typesAvecEtage.includes(formData.type_bien) && (
                      <div className="form-group">
                        <label>Étage</label>
                        <input
                          type="number"
                          value={formData.etage}
                          onChange={(e) => setFormData({...formData, etage: e.target.value})}
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
                          : "Description du bien (équipements, état, particularités...)"
                      }
                    />
                  </div>
                </div>

                {/* Aspects financiers - adaptés */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>💰</span> {isVente ? 'Prix de vente' : 'Aspects financiers'}
                  </div>
                  <div className="form-grid">
                    {isVente ? (
                      // Mode vente
                      <div className="form-group full-width">
                        <label>Prix de vente (FCFA) *</label>
                        <input
                          type="number"
                          step="10000"
                          value={formData.prix_vente}
                          onChange={(e) => setFormData({...formData, prix_vente: e.target.value})}
                          className={errors.prix_vente ? 'error' : ''}
                          placeholder="50 000 000"
                        />
                        {errors.prix_vente && <span className="error-message">{errors.prix_vente}</span>}
                      </div>
                    ) : (
                      // Mode location
                      showLocationFields && (
                        <>
                          <div className="form-group">
                            <label>Loyer mensuel (FCFA) *</label>
                            <input
                              type="number"
                              step="1000"
                              value={formData.loyer_mensuel}
                              onChange={(e) => setFormData({...formData, loyer_mensuel: e.target.value})}
                              className={errors.loyer_mensuel ? 'error' : ''}
                              placeholder="250000"
                            />
                            {errors.loyer_mensuel && <span className="error-message">{errors.loyer_mensuel}</span>}
                          </div>

                          <div className="form-group">
                            <label>Charges mensuelles (FCFA)</label>
                            <input
                              type="number"
                              step="1000"
                              value={formData.charges}
                              onChange={(e) => setFormData({...formData, charges: e.target.value})}
                              placeholder="25000"
                            />
                          </div>

                          <div className="form-group">
                            <label>Dépôt de garantie (FCFA)</label>
                            <input
                              type="number"
                              step="1000"
                              value={formData.depot_garantie}
                              onChange={(e) => setFormData({...formData, depot_garantie: e.target.value})}
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