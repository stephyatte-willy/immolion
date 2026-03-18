'use client';

import { motion } from 'framer-motion';
import { Bien } from '@/app/biens/page';
import { useState } from 'react';
import '@/app/biens/biens.css';

interface BienCardProps {
  bien: Bien;
  onView: (id: number) => void;
  onEdit: (bien: Bien) => void;
  onDelete: (id: number) => void;
  formatMoney: (amount: number) => string;
}

export default function BienCard({ bien, onView, onEdit, onDelete, formatMoney }: BienCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Types de biens
  const typesResidentiels = ['APPARTEMENT', 'MAISON', 'VILLA', 'STUDIO'];
  const typesCommerciaux = ['COMMERCIAL', 'BUREAU', 'ENTREPOT'];
  const typesLocation = ['APPARTEMENT', 'MAISON', 'VILLA', 'STUDIO', 'COMMERCIAL', 'BUREAU'];

  const getStatutClass = (statut: string) => {
    const classes: Record<string, string> = {
      'DISPONIBLE': 'statut-disponible',
      'LOUE': 'statut-loue',
      'EN_TRAVAUX': 'statut-travaux',
      'EN_VENTE': 'statut-vente',
      'RESERVE': 'statut-reserve'
    };
    return classes[statut] || '';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      'DISPONIBLE': 'Disponible',
      'LOUE': 'Loué',
      'EN_TRAVAUX': 'En travaux',
      'EN_VENTE': 'En vente',
      'RESERVE': 'Réservé'
    };
    return labels[statut] || statut;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'APPARTEMENT': '🏢',
      'MAISON': '🏠',
      'VILLA': '🏛️',
      'STUDIO': '🏢',
      'COMMERCIAL': '🏪',
      'TERRAIN': '🌲',
      'ENTREPOT': '🏭',
      'BUREAU': '🏢'
    };
    return icons[type] || '🏢';
  };

  // ✅ Fonction pour obtenir le libellé du prix selon le statut
  const getPriceLabel = () => {
    if (bien.statut === 'EN_VENTE') {
      return 'Prix de vente';
    } else if (typesLocation.includes(bien.type_bien)) {
      return 'Loyer mensuel';
    } else {
      return 'Prix';
    }
  };

  // ✅ Fonction pour obtenir la valeur du prix selon le statut
  const getPriceValue = () => {
    if (bien.statut === 'EN_VENTE') {
      // Si on a une colonne prix_vente, l'utiliser, sinon utiliser loyer_mensuel comme fallback
      return (bien as any).prix_vente || bien.loyer_mensuel;
    } else {
      return bien.loyer_mensuel;
    }
  };

  // ✅ Fonction pour vérifier si on doit afficher les pièces
  const showPieces = () => {
    return typesResidentiels.includes(bien.type_bien) || typesCommerciaux.includes(bien.type_bien);
  };

  // ✅ Fonction pour vérifier si on doit afficher l'étage
  const showEtage = () => {
    return ['APPARTEMENT', 'COMMERCIAL', 'BUREAU'].includes(bien.type_bien);
  };

  // ✅ Fonction pour vérifier si on doit afficher les charges
  const showCharges = () => {
    return bien.statut !== 'EN_VENTE' && typesLocation.includes(bien.type_bien) && bien.charges > 0;
  };

  // ✅ Fonction pour obtenir la localisation complète
  const getLocalisation = () => {
    let localisation = bien.adresse;
    
    if (bien.quartier) {
      localisation += `, Quartier ${bien.quartier}`;
    }
    
    localisation += `, ${bien.commune || bien.ville}`;
    
    if (bien.district && bien.district !== 'Abidjan') {
      localisation += `, ${bien.district}`;
    }
    
    return localisation;
  };

  const getPhotoUrl = () => {
    if (imageError) return null;
    
    if (bien.photos && Array.isArray(bien.photos) && bien.photos.length > 0) {
      const principale = bien.photos.find(p => Boolean(p.est_principale) === true);
      return principale?.url || bien.photos[0]?.url;
    }
    return null;
  };

  const photoUrl = getPhotoUrl();
  const priceLabel = getPriceLabel();
  const priceValue = getPriceValue();

  return (
    <motion.div 
      className="bien-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bien-card-image-container">
        {photoUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="bien-card-image-loader">
                <div className="loader-spinner"></div>
              </div>
            )}
            <img 
              src={photoUrl} 
              alt={bien.nom}
              className={`bien-card-image ${imageLoaded ? 'loaded' : 'loading'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.log('❌ Erreur chargement photo:', photoUrl);
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          </>
        ) : (
          <div className="bien-card-image-placeholder">
            <div className="placeholder-gradient">
              <span className="placeholder-icon">{getTypeIcon(bien.type_bien)}</span>
              <span className="placeholder-text">Aucune photo</span>
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className={`bien-card-statut ${getStatutClass(bien.statut)}`}>
          {getStatutLabel(bien.statut)}
        </div>
        <div className="bien-card-type">
          <span className="type-icon">{getTypeIcon(bien.type_bien)}</span>
          <span className="type-label">{bien.type_bien}</span>
        </div>

        {/* Overlay au survol */}
        <div className="bien-card-overlay">
          <button 
            className="overlay-btn view"
            onClick={() => onView(bien.id)}
          >
            👁️ Voir détails
          </button>
        </div>
      </div>

      <div className="bien-card-content">
        <h3 className="bien-card-title">{bien.nom}</h3>
        
        <div className="bien-card-location">
          <span className="location-icon">📍</span>
          <span className="location-text" title={getLocalisation()}>
            {getLocalisation().length > 40 
              ? getLocalisation().substring(0, 40) + '...' 
              : getLocalisation()}
          </span>
        </div>

        <div className="bien-card-features">
          <div className="feature">
            <span className="feature-icon">📏</span>
            <span>{bien.surface} m²</span>
          </div>
          
          {/* Afficher les pièces seulement pour les types appropriés */}
          {showPieces() && (
            <div className="feature">
              <span className="feature-icon">🛏️</span>
              <span>{bien.pieces} pièces</span>
            </div>
          )}
          
          {/* Afficher l'étage seulement pour les types appropriés */}
          {showEtage() && bien.etage !== null && bien.etage !== undefined && (
            <div className="feature">
              <span className="feature-icon">🏢</span>
              <span>Étage {bien.etage}</span>
            </div>
          )}

          {/* Pour les terrains, afficher une icône spécifique */}
          {bien.type_bien === 'TERRAIN' && (
            <div className="feature">
              <span className="feature-icon">🌲</span>
              <span>Terrain</span>
            </div>
          )}
        </div>

        {/* Section prix adaptée */}
        <div className="bien-card-price">
          <span className="price-label">{priceLabel}</span>
          <span className={`price-value ${bien.statut === 'EN_VENTE' ? 'vente' : ''}`}>
            {formatMoney(priceValue)}
          </span>
          
          {/* Afficher les charges seulement pour les locations */}
          {showCharges() && (
            <span className="charges">dont {formatMoney(bien.charges)} de charges</span>
          )}
        </div>

        {/* Badge supplémentaire pour les biens en travaux */}
        {bien.statut === 'EN_TRAVAUX' && (
          <div className="bien-card-travaux">
            <span className="travaux-icon">🔨</span>
            <span className="travaux-text">En rénovation</span>
          </div>
        )}

        {/* Informations locataire pour les biens loués */}
        {bien.statut === 'LOUE' && bien.locataire_actuel && (
          <div className="bien-card-locataire">
            <span className="locataire-icon">👤</span>
            <span>{bien.locataire_actuel.prenom} {bien.locataire_actuel.nom}</span>
          </div>
        )}

        <div className="bien-card-actions">
          <button 
            className="action-btn view"
            onClick={() => onView(bien.id)}
            title="Voir détails"
          >
            👁️
          </button>
          <button 
            className="action-btn edit"
            onClick={() => onEdit(bien)}
            title="Modifier"
          >
            ✏️
          </button>
          <button 
            className="action-btn delete"
            onClick={() => onDelete(bien.id)}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>
    </motion.div>
  );
}