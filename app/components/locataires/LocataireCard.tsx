'use client';

import { motion } from 'framer-motion';
import '@/app/locataires/locataires.css';

interface LocataireCardProps {
  locataire: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    statut: string;
    bien_actuel?: {
      id: number;
      nom: string;
      type_bien?: string;
    };
    lot_actuel?: {
      id: number;
      numero_lot: string;
      type_lot: string;
    };
    impayes?: number;
  };
  onView: (id: number) => void;
  onEdit: (locataire: any) => void;
  onDelete: (locataire: any) => void;
  formatMoney: (montant: number) => string;
}

export default function LocataireCard({ locataire, onView, onEdit, onDelete, formatMoney }: LocataireCardProps) {
  const getStatutClass = (statut: string) => {
    const classes: Record<string, string> = {
      'ACTIF': 'statut-actif',
      'INACTIF': 'statut-inactif',
      'PROSPECT': 'statut-prospect'
    };
    return classes[statut] || '';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      'ACTIF': 'Actif',
      'INACTIF': 'Inactif',
      'PROSPECT': 'Prospect'
    };
    return labels[statut] || statut;
  };

  const getInitials = () => {
    return `${locataire.prenom[0]}${locataire.nom[0]}`.toUpperCase();
  };

  const getBienLabel = () => {
    if (locataire.lot_actuel) {
      return `${locataire.lot_actuel.numero_lot} - ${locataire.lot_actuel.type_lot}`;
    }
    if (locataire.bien_actuel) {
      return locataire.bien_actuel.nom;
    }
    return null;
  };

  const bienLabel = getBienLabel();

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <div className="contenu-avat">
          <span>{getInitials()}</span>
        </div>
        <h3 className="nom">
          {locataire.prenom} {locataire.nom}
        </h3>
      </div>

      <div className="card-body">
        

        <div className="info">
          <div className="info-item">
            <span className="info-icon">✉️</span>
            <span className="info-text">{locataire.email}</span>
          </div>
          <div className="info-item">
            <span className="info-icon">📞</span>
            <span className="info-text">{locataire.telephone}</span>
          </div>
        </div>

        {bienLabel && (
          <div className="locataire-bien">
            <span className="bien-icon">
              {locataire.lot_actuel ? '🏘️' : '🏠'}
            </span>
            <span className="bien-nom">{bienLabel}</span>
          </div>
        )}


        {locataire.impayes && locataire.impayes > 0 && (
          <div className="locataire-alerte">
            <span className="alerte-icon">⚠️</span>
            <span className="alerte-text">{formatMoney(locataire.impayes)} impayé(s)</span>
          </div>
        )}
      </div>

      <div className="locataire-card-footer">
        <div className={`locataire-statut ${getStatutClass(locataire.statut)}`}>
          {getStatutLabel(locataire.statut)}
        </div>
        <button 
          className="action-btn view"
          onClick={() => onView(locataire.id)}
          title="Voir détails"
        >
          👁️
        </button>
        <button 
          className="action-btn edit"
          onClick={() => onEdit(locataire)}
          title="Modifier"
        >
          ✏️
        </button>
        <button 
          className="action-btn delete"
          onClick={() => onDelete(locataire)}
          title="Supprimer"
        >
          🗑️
        </button>
      </div>
    </motion.div>
  );
}