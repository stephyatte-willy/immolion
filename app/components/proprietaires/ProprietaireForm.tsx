'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TYPES_PROPRIETAIRE } from '@/app/types/proprietaires';
import DocumentProprietaireForm from './DocumentProprietaireForm';
import DocumentProprietaireCard from './DocumentProprietaireCard';
import toast from 'react-hot-toast';
import '@/app/proprietaires/proprietaires.css';

// ✅ Liste des pays (Afrique, Amérique, Asie, Europe, Océanie)
const PAYS_LISTE = [
  // 🌍 Afrique
  'Côte d\'Ivoire',
  'Afrique du Sud',
  'Algérie',
  'Angola',
  'Bénin',
  'Botswana',
  'Burkina Faso',
  'Burundi',
  'Cameroun',
  'Cap-Vert',
  'Centrafrique',
  'Comores',
  'Congo',
  'Djibouti',
  'Égypte',
  'Érythrée',
  'Eswatini',
  'Éthiopie',
  'Gabon',
  'Gambie',
  'Ghana',
  'Guinée',
  'Guinée-Bissau',
  'Guinée équatoriale',
  'Kenya',
  'Lesotho',
  'Liberia',
  'Libye',
  'Madagascar',
  'Malawi',
  'Mali',
  'Maroc',
  'Maurice',
  'Mauritanie',
  'Mayotte',
  'Mozambique',
  'Namibie',
  'Niger',
  'Nigeria',
  'Ouganda',
  'RDC',
  'Rwanda',
  'Sahara occidental',
  'Sao Tomé-et-Principe',
  'Sénégal',
  'Seychelles',
  'Sierra Leone',
  'Somalie',
  'Soudan',
  'Soudan du Sud',
  'Tanzanie',
  'Tchad',
  'Togo',
  'Tunisie',
  'Zambie',
  'Zimbabwe',

  // 🌎 Amérique du Nord
  'Canada',
  'États-Unis',
  'Mexique',
  'Cuba',
  'Haïti',
  'Jamaïque',
  'République dominicaine',
  'Panama',
  'Costa Rica',
  'Guatemala',
  'Honduras',
  'Nicaragua',
  'Salvador',
  'Belize',
  'Bahamas',
  'Barbade',
  'Trinité-et-Tobago',

  // 🌎 Amérique du Sud
  'Argentine',
  'Bolivie',
  'Brésil',
  'Chili',
  'Colombie',
  'Équateur',
  'Guyane',
  'Paraguay',
  'Pérou',
  'Suriname',
  'Uruguay',
  'Venezuela',

  // 🌏 Asie
  'Afghanistan',
  'Arabie saoudite',
  'Arménie',
  'Azerbaïdjan',
  'Bahreïn',
  'Bangladesh',
  'Bhoutan',
  'Birmanie',
  'Brunei',
  'Cambodge',
  'Chine',
  'Corée du Nord',
  'Corée du Sud',
  'Émirats arabes unis',
  'Géorgie',
  'Inde',
  'Indonésie',
  'Irak',
  'Iran',
  'Israël',
  'Japon',
  'Jordanie',
  'Kazakhstan',
  'Kirghizistan',
  'Koweït',
  'Laos',
  'Liban',
  'Malaisie',
  'Maldives',
  'Mongolie',
  'Népal',
  'Oman',
  'Ouzbékistan',
  'Pakistan',
  'Palestine',
  'Philippines',
  'Qatar',
  'Russie',
  'Singapour',
  'Sri Lanka',
  'Syrie',
  'Tadjikistan',
  'Taïwan',
  'Thaïlande',
  'Timor oriental',
  'Turkménistan',
  'Turquie',
  'Vietnam',
  'Yémen',

  // 🌏 Océanie
  'Australie',
  'Fidji',
  'Îles Marshall',
  'Îles Salomon',
  'Kiribati',
  'Micronésie',
  'Nauru',
  'Nouvelle-Zélande',
  'Palau',
  'Papouasie-Nouvelle-Guinée',
  'Samoa',
  'Tonga',
  'Tuvalu',
  'Vanuatu',

  // 🌍 Europe
  'Albanie',
  'Allemagne',
  'Andorre',
  'Autriche',
  'Belgique',
  'Biélorussie',
  'Bosnie-Herzégovine',
  'Bulgarie',
  'Chypre',
  'Croatie',
  'Danemark',
  'Espagne',
  'Estonie',
  'Finlande',
  'France',
  'Grèce',
  'Hongrie',
  'Irlande',
  'Islande',
  'Italie',
  'Kosovo',
  'Lettonie',
  'Liechtenstein',
  'Lituanie',
  'Luxembourg',
  'Macédoine du Nord',
  'Malte',
  'Moldavie',
  'Monaco',
  'Monténégro',
  'Norvège',
  'Pays-Bas',
  'Pologne',
  'Portugal',
  'Roumanie',
  'Royaume-Uni',
  'Serbie',
  'Slovaquie',
  'Slovénie',
  'Suède',
  'Suisse',
  'Tchéquie',
  'Ukraine',
  'Vatican'
].sort();

// ✅ Fonction pour formater le nom en majuscules
const formatNom = (value: string): string => {
  return value.toUpperCase();
};

// ✅ Fonction pour formater le prénom (Première lettre en majuscule, reste en minuscule)
const formatPrenom = (value: string): string => {
  return value
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ✅ Fonction pour formater le téléphone 
const formatTelephone = (value: string, codePays: string = '+225'): string => {
  // Supprimer tous les caractères non numériques
  let cleaned = value.replace(/\D/g, '');
  
  // Si le numéro est vide, retourner une chaîne vide
  if (!cleaned) return '';
  
  // Si le numéro commence déjà par le code pays (sans le +), on le garde avec +
  if (cleaned.startsWith(codePays.replace('+', ''))) {
    return `+${cleaned}`;
  }
  
  // Si le numéro commence par 0 (format local), on conserve le 0 et on ajoute le code pays
  if (cleaned.startsWith('0')) {
    // Garder le 0 et ajouter le code pays
    return `${codePays}${cleaned}`;
  }
  
  // Sinon, on ajoute le code pays et le 0 par défaut
  return `${codePays}0${cleaned}`;
};

// ✅ Fonction pour extraire le numéro sans le code pays pour l'affichage
const extractPhoneNumber = (value: string): string => {
  if (!value) return '';
  
  // Supprimer le code pays si présent
  let cleaned = value.replace(/^\+225/, '');
  
  // Supprimer tous les caractères non numériques
  cleaned = cleaned.replace(/\D/g, '');
  
  return cleaned;
};

// ✅ Fonction pour valider le téléphone
const validateTelephone = (value: string): boolean => {
  const cleaned = value.replace(/\D/g, '');
  // Accepte les numéros de 8 à 15 chiffres
  return cleaned.length >= 8 && cleaned.length <= 15;
};

interface ProprietaireFormProps {
  proprietaire: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProprietaireForm({ 
  proprietaire, 
  onClose, 
  onSuccess 
}: ProprietaireFormProps) {
  const [formData, setFormData] = useState({
    type: 'PARTICULIER',
    nom: '',
    prenom: '',
    raison_sociale: '',
    email: '',
    telephone: '',
    telephone_secondaire: '',
    adresse: '',
    ville: '',
    pays: 'Côte d\'Ivoire',
    num_identite: '',
    date_naissance: '',
    profession: '',
    notes: '',
    actif: true
  });

  const [biensDisponibles, setBiensDisponibles] = useState<any[]>([]);
  const [biensSelectionnes, setBiensSelectionnes] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [codePays, setCodePays] = useState('+225'); // ✅ Code pays par défaut

  const isEditing = !!proprietaire?.id;
  const isEntite = formData.type === 'SOCIETE' || formData.type === 'AGENCE';
  const isParticulier = formData.type === 'PARTICULIER';

useEffect(() => {
  chargerBiens();
  
  if (proprietaire) {
    // ✅ Extraire le numéro sans le code pays pour l'affichage
    const extractNumber = (phone: string): string => {
      if (!phone) return '';
      // Enlever le code pays +225 s'il est présent
      let cleaned = phone.replace(/^\+225/, '');
      // Garder uniquement les chiffres
      cleaned = cleaned.replace(/\D/g, '');
      return cleaned;
    };

    setFormData({
      type: proprietaire.type || 'PARTICULIER',
      nom: proprietaire.nom || '',
      prenom: proprietaire.prenom || '',
      raison_sociale: proprietaire.raison_sociale || proprietaire.nom || '',
      email: proprietaire.email || '',
      telephone: extractNumber(proprietaire.telephone),
      telephone_secondaire: extractNumber(proprietaire.telephone_secondaire),
      adresse: proprietaire.adresse || '',
      ville: proprietaire.ville || '',
      pays: proprietaire.pays || 'Côte d\'Ivoire',
      num_identite: proprietaire.num_identite || '',
      date_naissance: proprietaire.date_naissance?.split('T')[0] || '',
      profession: proprietaire.profession || '',
      notes: proprietaire.notes || '',
      actif: proprietaire.actif !== undefined ? proprietaire.actif : true
    });
    
    if (proprietaire.biens) {
      setBiensSelectionnes(proprietaire.biens.map((b: any) => b.id));
    }
    
    chargerDocuments(proprietaire.id);
  }
}, [proprietaire]);

  const chargerDocuments = async (proprietaireId: number) => {
    setIsLoadingDocs(true);
    try {
      const response = await fetch(`/api/documents?proprietaire_id=${proprietaireId}`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const isBienDisponible = (bien: any) => {
    if (isEditing && bien.proprietaire_id === proprietaire?.id) {
      return true;
    }
    return !bien.proprietaire_id;
  };

  const getProprietaireActuel = (bien: any) => {
    if (!bien.proprietaire_id) return null;
    if (bien.proprietaire_nom) {
      return `${bien.proprietaire_prenom || ''} ${bien.proprietaire_nom}`.trim();
    }
    return 'Propriétaire existant';
  };

  const chargerBiens = async () => {
  try {
    // ✅ Ajouter avec_proprietaire=true pour avoir les infos du propriétaire actuel
    const response = await fetch('/api/biens?avec_proprietaire=true');
    const data = await response.json();
    if (data.success) {
      console.log('📦 Biens chargés:', data.biens);
      setBiensDisponibles(data.biens);
    }
  } catch (error) {
    console.error('Erreur chargement biens:', error);
  }
};

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isParticulier) {
      if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
      if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    } else {
      if (!formData.raison_sociale.trim()) newErrors.raison_sociale = 'La raison sociale est requise';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // ✅ Validation du téléphone (si renseigné)
    if (formData.telephone && !validateTelephone(formData.telephone)) {
      newErrors.telephone = 'Le téléphone doit contenir entre 8 et 15 chiffres';
    }
    if (formData.telephone_secondaire && !validateTelephone(formData.telephone_secondaire)) {
      newErrors.telephone_secondaire = 'Le téléphone doit contenir entre 8 et 15 chiffres';
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
    // ✅ Formater les téléphones pour l'envoi
    const telephoneFormate = formData.telephone 
      ? formatTelephone(formData.telephone, codePays)
      : '';
    const telephoneSecondaireFormate = formData.telephone_secondaire 
      ? formatTelephone(formData.telephone_secondaire, codePays)
      : '';

    const dataToSend = {
      ...formData,
      nom: isEntite ? formData.raison_sociale : formatNom(formData.nom),
      prenom: isEntite ? '' : formatPrenom(formData.prenom),
      telephone: telephoneFormate,
      telephone_secondaire: telephoneSecondaireFormate,
      biens_ids: biensSelectionnes
    };

    const url = proprietaire 
      ? `/api/proprietaires/${proprietaire.id}`
      : '/api/proprietaires';
    
    const method = proprietaire ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });

    const data = await response.json();

    if (data.success) {
      toast.success(proprietaire ? 'Propriétaire modifié avec succès' : 'Propriétaire créé avec succès');
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

  const handleToggleBien = (bienId: number) => {
    setBiensSelectionnes(prev => 
      prev.includes(bienId) 
        ? prev.filter(id => id !== bienId)
        : [...prev, bienId]
    );
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Document supprimé avec succès');
        if (proprietaire?.id) chargerDocuments(proprietaire.id);
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleUpdateDocument = async (id: number, type: string, dateExpiration: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type_document: type, date_expiration: dateExpiration })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Document mis à jour');
        if (proprietaire?.id) chargerDocuments(proprietaire.id);
      } else {
        toast.error(data.erreur || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    }
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
          className="modal-content proprietaire-form-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{proprietaire ? 'Modifier le propriétaire' : 'Nouveau propriétaire'}</h2>
            <button className="modal-close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit} className="proprietaire-form">
              <div className="form-sections">
                {/* Type en premier */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>🏷️</span> Type de propriétaire
                  </div>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => {
                          setFormData({...formData, type: e.target.value});
                          setErrors(prev => {
                            const newErrors = {...prev};
                            delete newErrors.nom;
                            delete newErrors.prenom;
                            delete newErrors.raison_sociale;
                            return newErrors;
                          });
                        }}
                        className="select-with-arrow"
                      >
                        {TYPES_PROPRIETAIRE.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icone} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Identité - adaptée au type */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>👤</span> {isEntite ? 'Informations de l\'entité' : 'Identité'}
                  </div>
                  <div className="form-grid">
                    {isParticulier ? (
                      <>
                        <div className="form-group">
                          <label>Nom *</label>
                          <input
                            type="text"
                            value={formData.nom}
                            onChange={(e) => setFormData({...formData, nom: formatNom(e.target.value)})}
                            className={errors.nom ? 'error' : ''}
                            placeholder="KOUADIO"
                            style={{ textTransform: 'uppercase' }}
                          />
                          {errors.nom && <span className="error-message">{errors.nom}</span>}
                        </div>

                        <div className="form-group">
                          <label>Prénom *</label>
                          <input
                            type="text"
                            value={formData.prenom}
                            onChange={(e) => setFormData({...formData, prenom: formatPrenom(e.target.value)})}
                            className={errors.prenom ? 'error' : ''}
                            placeholder="Jean"
                          />
                          {errors.prenom && <span className="error-message">{errors.prenom}</span>}
                        </div>
                      </>
                    ) : (
                      <div className="form-group full-width">
                        <label>Raison sociale / Nom de l'entité *</label>
                        <input
                          type="text"
                          value={formData.raison_sociale}
                          onChange={(e) => setFormData({...formData, raison_sociale: formatNom(e.target.value)})}
                          className={errors.raison_sociale ? 'error' : ''}
                          placeholder={formData.type === 'SOCIETE' ? 'SOCIETE GENERALE CI' : 'IMMOLION GESTION'}
                          style={{ textTransform: 'uppercase' }}
                        />
                        {errors.raison_sociale && <span className="error-message">{errors.raison_sociale}</span>}
                      </div>
                    )}

                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={errors.email ? 'error' : ''}
                        placeholder="contact@example.com"
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label>Téléphone</label>
                      <div className="phone-input-wrapper">
                        <span className="phone-prefix">{codePays}</span>
                        <input
                          type="tel"
                          value={extractPhoneNumber(formData.telephone)}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            // Si le champ est vide, on stocke une chaîne vide
                            if (!rawValue) {
                              setFormData({...formData, telephone: ''});
                              return;
                            }
                            // Stocker le numéro tel que saisi (sans le code pays)
                            setFormData({...formData, telephone: rawValue});
                          }}
                          onBlur={(e) => {
                            // Au moment de perdre le focus, on formate le numéro
                            const value = e.target.value;
                            if (value && value.length > 0) {
                              // Si le numéro a au moins 1 chiffre, on le formate avec le code pays
                              const formatted = formatTelephone(value, codePays);
                              setFormData({...formData, telephone: value});
                            }
                          }}
                          className={errors.telephone ? 'error' : ''}
                          placeholder="07 87 65 43 21"
                        />
                      </div>
                      {errors.telephone && <span className="error-message">{errors.telephone}</span>}
                      <small className="field-hint">Exemple: 07 87 65 43 21</small>
                    </div>

                  <div className="form-group">
                    <label>Téléphone secondaire</label>
                    <div className="phone-input-wrapper">
                      <span className="phone-prefix">{codePays}</span>
                      <input
                        type="tel"
                        value={extractPhoneNumber(formData.telephone_secondaire)}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          if (!rawValue) {
                            setFormData({...formData, telephone_secondaire: ''});
                            return;
                          }
                          setFormData({...formData, telephone_secondaire: rawValue});
                        }}
                        className={errors.telephone_secondaire ? 'error' : ''}
                        placeholder="07 87 65 43 21"
                      />
                    </div>
                    {errors.telephone_secondaire && <span className="error-message">{errors.telephone_secondaire}</span>}
                  </div>

                    <div className="form-group">
                      <label>N° d'identité</label>
                      <input
                        type="text"
                        value={formData.num_identite}
                        onChange={(e) => setFormData({...formData, num_identite: formatNom(e.target.value)})}
                        placeholder={isParticulier ? 'CNI, Passeport...' : 'RCCM, NIF...'}
                      />
                    </div>

                    {isParticulier && (
                      <>
                        <div className="form-group">
                          <label>Date de naissance</label>
                          <input
                            type="date"
                            value={formData.date_naissance}
                            onChange={(e) => setFormData({...formData, date_naissance: e.target.value})}
                          />
                        </div>

                        <div className="form-group">
                          <label>Profession</label>
                          <input
                            type="text"
                            value={formData.profession}
                            onChange={(e) => setFormData({...formData, profession: formatPrenom(e.target.value)})}
                            placeholder="Commerçant, Enseignant..."
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Adresse */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>📍</span> Adresse
                  </div>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Adresse</label>
                      <input
                        type="text"
                        value={formData.adresse}
                        onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                        placeholder="Rue, numéro, lieu-dit..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Ville</label>
                      <input
                        type="text"
                        value={formData.ville}
                        onChange={(e) => setFormData({...formData, ville: e.target.value})}
                        placeholder="Abidjan"
                      />
                    </div>

                    <div className="form-group">
                      <label>Pays</label>
                      <select
                        value={formData.pays}
                        onChange={(e) => setFormData({...formData, pays: e.target.value})}
                        className="select-with-arrow"
                      >
                        {PAYS_LISTE.map(pays => (
                          <option key={pays} value={pays}>
                            {pays}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Biens associés */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>🏢</span> Biens associés
                  </div>
                  <div className="biens-associes">
                    <p className="section-hint">
                      Sélectionnez les biens appartenant à ce propriétaire
                    </p>
                    <div className="biens-checkbox-list">
                      {biensDisponibles.map(bien => {
                        const disponible = isBienDisponible(bien);
                        const proprietaireActuel = getProprietaireActuel(bien);
                        const estSelectionne = biensSelectionnes.includes(bien.id);
                        const estDejaAttribue = !disponible && !estSelectionne;
                        
                        return (
                          <label 
                            key={bien.id} 
                            className={`bien-checkbox ${!disponible ? 'indisponible' : ''} ${estSelectionne ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={estSelectionne}
                              onChange={() => handleToggleBien(bien.id)}
                              disabled={!disponible && !estSelectionne}
                            />
                            <span className="bien-info">
                              <span className="bien-nom">{bien.nom}</span>
                              <span className="bien-adresse">{bien.adresse}, {bien.commune}</span>
                              <span className="bien-statut">{bien.statut}</span>
                              {estDejaAttribue && (
                                <span className="bien-attribue">
                                  <span className="attribue-icon">🔒</span>
                                  Déjà attribué à {proprietaireActuel}
                                </span>
                              )}
                              {estSelectionne && !estDejaAttribue && (
                                <span className="bien-selectionne">✓ Sélectionné</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                      {biensDisponibles.length === 0 && (
                        <p className="no-biens">Aucun bien disponible</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>📝</span> Notes
                  </div>
                  <div className="form-group full-width">
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      placeholder="Informations complémentaires..."
                    />
                  </div>
                </div>

                {/* Documents - UNIQUEMENT en mode édition */}
                {isEditing && (
                  <div className="form-section">
                    <div className="modal-section-title">
                      <span>📎</span> Documents du propriétaire
                    </div>
                    
                    <div className="documents-section">
                      <button 
                        type="button"
                        className="btn-add-document"
                        onClick={() => setShowDocumentForm(true)}
                      >
                        <span className="btn-icon">➕</span>
                        Ajouter des documents
                      </button>
                      
                      {isLoadingDocs ? (
                        <div className="loading-docs">
                          <div className="spinner-mini"></div>
                          <span>Chargement des documents...</span>
                        </div>
                      ) : documents.length > 0 ? (
                        <div className="documents-grid">
                          {documents.map((doc) => (
                            <DocumentProprietaireCard
                              key={doc.id}
                              document={doc}
                              onDelete={handleDeleteDocument}
                              onUpdate={handleUpdateDocument}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="no-documents">Aucun document pour ce propriétaire</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Statut */}
                <div className="form-section">
                  <div className="modal-section-title">
                    <span>⚙️</span> Statut
                  </div>
                  <div className="form-group">
                    <label className="toggle-label bien-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.actif}
                        onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                      />
                      <span className="toggle-text">Actif</span>
                    </label>
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
                proprietaire ? '💾 Modifier' : '💾 Créer'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Modale d'ajout de documents */}
      <AnimatePresence>
        {showDocumentForm && isEditing && proprietaire?.id && (
          <DocumentProprietaireForm
            proprietaire_id={proprietaire.id}
            onClose={() => setShowDocumentForm(false)}
            onSuccess={() => {
              setShowDocumentForm(false);
              chargerDocuments(proprietaire.id);
              toast.success('Documents ajoutés avec succès');
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}