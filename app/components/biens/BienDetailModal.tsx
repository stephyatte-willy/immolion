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
  const [showLotsDetails, setShowLotsDetails] = useState(true);

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
      'IMMEUBLE': '🏢',
      'APPARTEMENT': '🏢',
      'MAISON': '🏠',
      'VILLA': '🏛️',
      'STUDIO': '🏢',
      'COMMERCIAL': '🏪',
      'MAGASIN': '🏪',
      'TERRAIN': '🌲',
      'ENTREPOT': '🏭',
      'BUREAU': '🏢',
      'PARKING': '🅿️',
      'CHAMBRE': '🛏️',
      'KIOSQUE': '🏪'
    };
    return icons[type] || '🏢';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'IMMEUBLE': 'Immeuble',
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'VILLA': 'Villa',
      'STUDIO': 'Studio',
      'COMMERCIAL': 'Commercial',
      'MAGASIN': 'Magasin',
      'TERRAIN': 'Terrain',
      'ENTREPOT': 'Entrepôt',
      'BUREAU': 'Bureau',
      'PARKING': 'Parking',
      'CHAMBRE': 'Chambre',
      'KIOSQUE': 'Kiosque'
    };
    return labels[type] || type;
  };

  // Déterminer le type d'affichage financier
  const isVente = bien.statut === 'EN_VENTE';
  const isImmeuble = bien.type_bien === 'IMMEUBLE';
  
  // Calculer le prix principal (loyer ou vente)
  const getPrixPrincipal = () => {
    if (isVente) {
      return bien.prix_vente;
    } else if (isImmeuble && bien.lots && bien.lots.length > 0) {
      return bien.lots.reduce((sum, lot) => sum + (parseFloat(lot.loyer_mensuel) || 0), 0);
    } else {
      return bien.loyer_mensuel;
    }
  };
  
  const prixPrincipal = getPrixPrincipal();
  const prixLabel = isVente ? 'Prix de vente' : (isImmeuble ? 'Revenus mensuels totaux' : 'Loyer mensuel');

  // Statistiques des lots pour les immeubles
  const getLotsStats = () => {
    if (!bien.lots || bien.lots.length === 0) return null;
    
    const stats: Record<string, { count: number; loyers: number[]; total: number; surfaces: number[] }> = {};
    
    bien.lots.forEach((lot: any) => {
      const type = lot.type_lot;
      const loyer = parseFloat(lot.loyer_mensuel) || 0;
      const surface = parseFloat(lot.surface) || 0;
      
      if (!stats[type]) {
        stats[type] = { count: 0, loyers: [], total: 0, surfaces: [] };
      }
      
      stats[type].count++;
      stats[type].loyers.push(loyer);
      stats[type].surfaces.push(surface);
      stats[type].total += loyer;
    });
    
    return stats;
  };
  
  const lotsStats = isImmeuble ? getLotsStats() : null;
  const totalLots = bien.lots?.length || 0;

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
            
            {/* Type de bien */}
            <div className="detail-section">
              <h3>
                <span className="section-icon">🏷️</span>
                Type de bien
              </h3>
              <div className="detail-type">
                <span className="type-badge-large">
                  {getTypeIcon(bien.type_bien)} {getTypeLabel(bien.type_bien)}
                </span>
                {isImmeuble && totalLots > 0 && (
                  <span className="lots-badge">🏘️ {totalLots} lots</span>
                )}
              </div>
            </div>
            
            {/* Localisation */}
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

            {/* Caractéristiques */}
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
                {bien.type_bien !== 'IMMEUBLE' && bien.type_bien !== 'TERRAIN' && (
                  <div className="carac-item">
                    <span className="carac-label">Pièces</span>
                    <span className="carac-value">{bien.pieces}</span>
                  </div>
                )}
                {bien.etage !== null && bien.etage !== undefined && bien.type_bien !== 'IMMEUBLE' && (
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

            {/* Aspects financiers */}
            <div className="detail-section">
              <h3>
                <span className="section-icon">💰</span>
                {prixLabel}
              </h3>
              <div className="detail-finances">
                {prixPrincipal !== undefined && prixPrincipal !== null && prixPrincipal > 0 && (
                  <div className="finance-item">
                    <span className="finance-label">{prixLabel}</span>
                    <span className="finance-value highlight">{formatMoney(prixPrincipal)}</span>
                  </div>
                )}

                {!isVente && !isImmeuble && bien.charges !== undefined && bien.charges > 0 && (
                  <div className="finance-item">
                    <span className="finance-label">Charges</span>
                    <span className="finance-value">{formatMoney(bien.charges)}</span>
                  </div>
                )}

                {!isVente && !isImmeuble && bien.depot_garantie !== undefined && bien.depot_garantie > 0 && (
                  <div className="finance-item">
                    <span className="finance-label">Dépôt de garantie</span>
                    <span className="finance-value">{formatMoney(bien.depot_garantie)}</span>
                  </div>
                )}

                {bien.date_acquisition && (
                  <div className="finance-item">
                    <span className="finance-label">Date d'acquisition</span>
                    <span className="finance-value">{formatDate(bien.date_acquisition)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lots pour les immeubles */}
            {isImmeuble && bien.lots && bien.lots.length > 0 && (
              <div className="detail-section lots-detail-section">
                <h3 onClick={() => setShowLotsDetails(!showLotsDetails)} style={{ cursor: 'pointer' }}>
                  <span className="section-icon">🏘️</span>
                  Lots / Unités locatives ({totalLots} lots)
                  <span className="toggle-icon">{showLotsDetails ? '▲' : '▼'}</span>
                </h3>
                
                {showLotsDetails && (
                  <div className="detail-lots">
                    {/* Résumé par type */}
                    {lotsStats && Object.keys(lotsStats).length > 0 && (
                      <div className="lots-summary">
                        <h4>📊 Résumé par type</h4>
                        <div className="lots-types-grid">
                          {Object.entries(lotsStats).map(([type, data]) => (
                            <div key={type} className="lot-type-summary">
                              <span className="lot-type-name">{type}</span>
                              <span className="lot-type-count">{data.count} lot(s)</span>
                              <span className="lot-type-total">{formatMoney(data.total)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="lots-total-revenus">
                          <strong>💰 Total des revenus mensuels:</strong> {formatMoney(prixPrincipal || 0)}
                        </div>
                      </div>
                    )}
                    
                    {/* Liste détaillée des lots - TABLEAU */}
                    // Dans BienDetailModal.tsx, dans la section des lots, modifiez l'affichage :

{/* Liste détaillée des lots - TABLEAU */}
<div className="lots-list-detailed">
  <h4>📋 Liste détaillée des lots</h4>
  <div className="lots-table-container">
    <table className="lots-table">
      <thead>
        <tr>
          <th>N°</th>
          <th>Type</th>
          <th>Surface</th>
          <th>Pièces</th>
          <th>{bien.statut === 'EN_VENTE' ? 'Prix de vente' : 'Loyer'}</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {bien.lots.map((lot: any, index: number) => (
          <tr key={lot.id || index}>
            <td className="lot-number">{lot.numero_lot}</td>
            <td className="lot-type-cell">
              <span className="lot-type-badge">
                {lot.type_lot === 'STUDIO' && '🏢'}
                {lot.type_lot === 'APPARTEMENT' && '🏢'}
                {lot.type_lot === 'MAGASIN' && '🏪'}
                {lot.type_lot === 'BUREAU' && '🏢'}
                {lot.type_lot === 'PARKING' && '🅿️'}
                {lot.type_lot === 'CHAMBRE' && '🛏️'}
                {' '}{lot.type_lot}
              </span>
            </td>
            <td className="lot-surface">{lot.surface} m²</td>
            <td className="lot-pieces">{lot.pieces || '-'}</td>
            <td className="lot-loyer">
              {bien.statut === 'EN_VENTE' 
                ? formatMoney(parseFloat(lot.prix_vente) || 0)
                : formatMoney(parseFloat(lot.loyer_mensuel) || 0)}
            </td>
            <td className="lot-status">
              <span className={`status-badge ${lot.statut === 'LOUE' ? 'status-loue' : lot.statut === 'DISPONIBLE' ? 'status-disponible' : 'status-vente'}`}>
                {lot.statut === 'LOUE' ? 'Loué' : lot.statut === 'DISPONIBLE' ? 'Disponible' : 'En vente'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
                  </div>
                )}
              </div>
            )}

            {/* Locataire actuel */}
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

            {/* Dates */}
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