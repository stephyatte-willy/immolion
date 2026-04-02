'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import '@/app/acquereurs/acquereurs.css';

interface AcquereurCardProps {
  acquereur: any;
  onView: (id: number) => void;
  onEdit: (acquereur: any) => void;
  onDelete: (acquereur: any) => void;
}

export default function AcquereurCard({ 
  acquereur, 
  onView, 
  onEdit, 
  onDelete 
}: AcquereurCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getTypeInfo = (type: string) => {
    const types: Record<string, { icone: string; label: string; couleur: string }> = {
      'PARTICULIER': { icone: '👤', label: 'Particulier', couleur: '#10b981' },
      'SOCIETE': { icone: '🏢', label: 'Société', couleur: '#3b82f6' },
      'AGENCE': { icone: '🏪', label: 'Agence', couleur: '#f59e0b' }
    };
    return types[type] || { icone: '👤', label: type, couleur: '#94a3b8' };
  };

  const typeInfo = getTypeInfo(acquereur.type_acquereur);
  
  // ✅ Fonction pour obtenir les initiales (adaptée pour les sociétés)
  const getInitials = () => {
    if (acquereur.type_acquereur !== 'PARTICULIER') {
      // Pour les sociétés/agences, prendre la première lettre de la raison sociale
      const raisonSociale = acquereur.raison_sociale || acquereur.nom;
      return raisonSociale?.substring(0, 2).toUpperCase() || '🏢';
    }
    return `${acquereur.prenom?.[0] || ''}${acquereur.nom?.[0] || ''}`.toUpperCase();
  };

  // ✅ Fonction pour obtenir le nom affiché
  const getDisplayName = () => {
    if (acquereur.type_acquereur !== 'PARTICULIER') {
      return acquereur.raison_sociale || acquereur.nom;
    }
    return `${acquereur.prenom} ${acquereur.nom}`;
  };

  const nbContrats = acquereur.contrats?.length || 0;
  const bienAttribue = acquereur.bien; // Le bien est chargé via l'API

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <div className="contenu-avat">
          <span>{getInitials()}</span>
        </div>
        <h3 className="nom">
          {getDisplayName()}
        </h3>
      </div>

      <div className="card-body">
        <div className="info">
          <div className="info-item">
            <span className="info-icon">✉️</span>
            <span className="info-text">{acquereur.email}</span>
          </div>
          <div className="info-item">
            <span className="info-icon">📞</span>
            <span className="info-text">{acquereur.telephone || 'Non renseigné'}</span>
          </div>
        </div>

        {/* ✅ Bien attribué */}
        {bienAttribue && (
          <div className="bien-attribue">
            <span className="bien-icon">🏠</span>
            <div className="bien-info">
              <span className="bien-nom">{bienAttribue.nom}</span>
              <span className="bien-prix">{bienAttribue.prix_vente?.toLocaleString()} FCFA</span>
            </div>
          </div>
        )}

        <div className="stats">
          <div className="stat-item">
            <span className="stat-value">{nbContrats}</span>
            <span className="stat-label">Contrat(s)</span>
          </div>
          <div className="badge">
            <span className="type-icon">{typeInfo.icone}</span>
            <span className="type-label" style={{ color: typeInfo.couleur }}>
              {typeInfo.label}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {acquereur.actif ? '✅' : '❌'}
            </span>
            <span className="stat-label">{acquereur.actif ? 'Actif' : 'Inactif'}</span>
          </div>
        </div>

        {nbContrats > 0 && (
          <div className="contrats-preview">
            <span className="contrats-preview-title">Contrats:</span>
            <div className="contrats-list">
              {acquereur.contrats?.slice(0, 2).map((contrat: any) => (
                <span key={contrat.id} className="contrat-tag">
                  {contrat.numero_contrat}
                </span>
              ))}
              {nbContrats > 2 && (
                <span className="contrat-tag more">+{nbContrats - 2}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`card-actions ${isHovered ? 'visible' : ''}`}>
        <button 
          className="action-btn view"
          onClick={() => onView(acquereur.id)}
          title="Voir détails"
        >
          👁️
        </button>
        <button 
          className="action-btn edit"
          onClick={() => onEdit(acquereur)}
          title="Modifier"
        >
          ✏️
        </button>
        <button 
          className="action-btn delete"
          onClick={() => onDelete(acquereur)}
          title="Supprimer"
        >
          🗑️
        </button>
      </div>
    </motion.div>
  );
}