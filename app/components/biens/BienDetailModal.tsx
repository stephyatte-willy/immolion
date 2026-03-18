'use client';

import { motion } from 'framer-motion';
import { Bien } from '@/app/biens/page';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useState } from 'react';
import '@/app/biens/biens.css';

interface BienDetailModalProps {
  bien: Bien;
  onClose: () => void;
  onEdit: (bien: Bien) => void;
}

export default function BienDetailModal({ bien, onClose, onEdit }: BienDetailModalProps) {
  const { formatMoney, formatDate } = useTheme();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(
    bien.photos && bien.photos.length > 0 ? bien.photos[0].url : null
  );

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

  // ✅ Déterminer le type d'affichage financier
  const isVente = bien.statut === 'EN_VENTE';
  const prixPrincipal = isVente ? bien.prix_vente : bien.loyer_mensuel;
  const prixLabel = isVente ? 'Prix de vente' : 'Loyer mensuel';

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content bien-detail-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="header-icon">{getTypeIcon(bien.type_bien)}</span>
            <h2>{bien.nom}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Corps */}
        <div className="modal-body">
          {/* Galerie photos */}
          {bien.photos && bien.photos.length > 0 ? (
            <div className="detail-photos">
              <div className="detail-photo-main">
                <img 
                  src={selectedPhoto || bien.photos[0].url} 
                  alt={bien.nom}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400/1e293b/ffffff?text=ImmoLion';
                  }}
                />
              </div>
              {bien.photos.length > 1 && (
                <div className="detail-photo-thumbnails">
                  {bien.photos.map((photo, index) => (
                    <div 
                      key={index}
                      className={`thumbnail ${selectedPhoto === photo.url ? 'active' : ''}`}
                      onClick={() => setSelectedPhoto(photo.url)}
                    >
                      <img src={photo.url} alt={`Photo ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="detail-no-photo">
              <span className="no-photo-icon">{getTypeIcon(bien.type_bien)}</span>
              <p>Aucune photo disponible</p>
            </div>
          )}

          {/* Informations principales */}
          <div className="detail-info-grid">
            <div className={`detail-statut-badge ${getStatutClass(bien.statut)}`}>
              {getStatutLabel(bien.statut)}
            </div>
            
            <div className="detail-section">
              <h3>
                <span className="section-icon">📍</span>
                Localisation
              </h3>
              <div className="detail-address">
                <p><strong>Adresse:</strong> {bien.adresse}</p>
                {bien.quartier && <p><strong>Quartier:</strong> {bien.quartier}</p>}
                <p><strong>Commune:</strong> {bien.commune}</p>
                <p><strong>District:</strong> {bien.district}</p>
                <p><strong>Ville:</strong> {bien.ville}</p>
                <p><strong>Pays:</strong> {bien.pays}</p>
              </div>
            </div>

            <div className="detail-section">
              <h3>
                <span className="section-icon">📐</span>
                Caractéristiques
              </h3>
              <div className="detail-caracteristiques">
                <div className="carac-item">
                  <span className="carac-label">Surface</span>
                  <span className="carac-value">{bien.surface} m²</span>
                </div>
                <div className="carac-item">
                  <span className="carac-label">Pièces</span>
                  <span className="carac-value">{bien.pieces}</span>
                </div>
                {bien.etage !== null && bien.etage !== undefined && (
                  <div className="carac-item">
                    <span className="carac-label">Étage</span>
                    <span className="carac-value">{bien.etage}</span>
                  </div>
                )}
              </div>
              {bien.description && (
                <div className="detail-description">
                  <h4>Description</h4>
                  <p>{bien.description}</p>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h3>
                <span className="section-icon">💰</span>
                {isVente ? 'Prix de vente' : 'Aspects financiers'}
              </h3>
              <div className="detail-finances">
                {/* ✅ Prix principal (loyer ou vente) */}
                {prixPrincipal !== undefined && prixPrincipal !== null && (
                  <div className="finance-item">
                    <span className="finance-label">{prixLabel}</span>
                    <span className="finance-value highlight">{formatMoney(prixPrincipal)}</span>
                  </div>
                )}

                {/* ✅ Charges (uniquement pour les locations) */}
                {!isVente && bien.charges !== undefined && bien.charges > 0 && (
                  <div className="finance-item">
                    <span className="finance-label">Charges</span>
                    <span className="finance-value">{formatMoney(bien.charges)}</span>
                  </div>
                )}

                {/* ✅ Dépôt de garantie (uniquement pour les locations) */}
                {!isVente && bien.depot_garantie !== undefined && bien.depot_garantie > 0 && (
                  <div className="finance-item">
                    <span className="finance-label">Dépôt de garantie</span>
                    <span className="finance-value">{formatMoney(bien.depot_garantie)}</span>
                  </div>
                )}

                {/* ✅ Date d'acquisition */}
                {bien.date_acquisition && (
                  <div className="finance-item">
                    <span className="finance-label">Date d'acquisition</span>
                    <span className="finance-value">{formatDate(bien.date_acquisition)}</span>
                  </div>
                )}
              </div>
            </div>

            {bien.locataire_actuel && (
              <div className="detail-section">
                <h3>
                  <span className="section-icon">👤</span>
                  Locataire actuel
                </h3>
                <div className="detail-locataire">
                  <p><strong>Nom:</strong> {bien.locataire_actuel.prenom} {bien.locataire_actuel.nom}</p>
                </div>
              </div>
            )}

            <div className="detail-section">
              <h3>
                <span className="section-icon">📅</span>
                Dates
              </h3>
              <div className="detail-dates">
                <p><strong>Création:</strong> {formatDate(bien.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pied */}
        <div className="modal-footer">
          <button 
            className="btn-cancel"
            onClick={onClose}
          >
            Fermer
          </button>
          <button 
            className="btn-submit"
            onClick={() => {
              onClose();
              onEdit(bien);
            }}
          >
            ✏️ Modifier
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}