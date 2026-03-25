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
    };
    impayes?: number;
  };
  onView: (id: number) => void;
  onEdit: (locataire: any) => void;
  onDelete: (locataire: any) => void;
  formatMoney: (montant: number) => string; // ✅ Ajout de formatMoney
}

export default function LocataireCard({ locataire, onView, onEdit, onDelete, formatMoney }: LocataireCardProps) {
  const getStatutClass = (statut: string) => {
    const classes: Record<string, string> = {
      'ACTIF': 'statut-actif',
      'INACTIF': 'statut-inactif',
      'SORTI': 'statut-sorti',
      'PROSPECT': 'statut-prospect'
    };
    return classes[statut] || '';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      'ACTIF': 'Actif',
      'INACTIF': 'Inactif',
      'SORTI': 'Sorti',
      'PROSPECT': 'Prospect'
    };
    return labels[statut] || statut;
  };

  const getInitials = () => {
    return `${locataire.prenom[0]}${locataire.nom[0]}`.toUpperCase();
  };

  return (
    <motion.div 
      className="locataire-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="locataire-card-header">
        <div className="locataire-avat">
          <span>{getInitials()}</span>
        </div>
        <div className={`locataire-statut ${getStatutClass(locataire.statut)}`}>
          {getStatutLabel(locataire.statut)}
        </div>
      </div>

      <div className="locataire-card-body">
        <h3 className="locataire-name">
          {locataire.prenom} {locataire.nom}
        </h3>

        <div className="locataire-info">
          <div className="info-item-locataire">
            <span className="info-icon-locataire">✉️</span>
            <span className="info-text-locataire">{locataire.email}</span>
          </div>
          <div className="info-item-locataire">
        <span className="info-icon-locataire">📞</span>
        <span className="info-text-locataire">{locataire.telephone}</span>
        </div>
        </div>

        {locataire.bien_actuel && (
          <div className="locataire-bien-ico">
            <span className="locataire-icon">🏠</span>
            <span className="locataire-bien-name">{locataire.bien_actuel.nom}</span>
          </div>
        )}

        {locataire.impayes && locataire.impayes > 0 && (
          <div className="locataire-alerte">
            <span className="alerte-icon">⚠️</span>
            <span className="alerte-text">{formatMoney(locataire.impayes)} impayé(s)</span> {/* ✅ Formaté */}
          </div>
        )}
      </div>

      <div className="locataire-card-footer">
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