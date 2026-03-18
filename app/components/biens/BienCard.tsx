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

  
  const getPhotoUrl = () => {
  if (imageError) return null;
  
  if (bien.photos && Array.isArray(bien.photos) && bien.photos.length > 0) {
    const principale = bien.photos.find(p => Boolean(p.est_principale) === true);
    return principale?.url || bien.photos[0]?.url;
  }
  return null;
};

  const photoUrl = getPhotoUrl();

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
          <span>{bien.adresse}, {bien.commune}</span>
        </div>

        <div className="bien-card-features">
          <div className="feature">
            <span className="feature-icon">📏</span>
            <span>{bien.surface} m²</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🛏️</span>
            <span>{bien.pieces} pièces</span>
          </div>
          {bien.etage !== null && bien.etage !== undefined && (
            <div className="feature">
              <span className="feature-icon">🏢</span>
              <span>Étage {bien.etage}</span>
            </div>
          )}
        </div>

        <div className="bien-card-price">
          <span className="price-label">Loyer mensuel</span>
          <span className="price-value">{formatMoney(bien.loyer_mensuel)}</span>
          {bien.charges > 0 && (
            <span className="charges">dont {formatMoney(bien.charges)} de charges</span>
          )}
        </div>

        {bien.locataire_actuel && (
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