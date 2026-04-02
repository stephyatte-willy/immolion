'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import '@/app/proprietaires/proprietaires.css';

interface ProprietaireCardProps {
  proprietaire: any;
  onView: (id: number) => void;
  onEdit: (proprietaire: any) => void;
  onDelete: (proprietaire: any) => void;
}

export default function ProprietaireCard({ 
  proprietaire, 
  onView, 
  onEdit, 
  onDelete 
}: ProprietaireCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const getTypeInfo = (type: string) => {
    const types: Record<string, { icone: string; label: string; couleur: string }> = {
      'PARTICULIER': { icone: '👤', label: 'Particulier', couleur: '#10b981' },
      'SOCIETE': { icone: '🏢', label: 'Société', couleur: '#3b82f6' },
      'AGENCE': { icone: '🏪', label: 'Agence', couleur: '#f59e0b' }
    };
    return types[type] || { icone: '👤', label: type, couleur: '#94a3b8' };
  };

  const typeInfo = getTypeInfo(proprietaire.type);
  const getInitials = () => {
    return `${proprietaire.prenom?.[0] || ''}${proprietaire.nom?.[0] || ''}`.toUpperCase();
  };

  const nbBiens = proprietaire.biens?.length || 0;
  const hasNoBiens = nbBiens === 0;

    const formatPhoneNumber = (phone: string): string => {
    if (!phone) return 'Non renseigné';
    // Supprimer le code pays pour l'affichage si présent
    let cleaned = phone.replace(/^\+225/, '');
    // Formater le numéro avec des espaces tous les 2 chiffres
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return cleaned;
  };

  const telephone1 = proprietaire.telephone ? formatPhoneNumber(proprietaire.telephone) : null;
  const telephone2 = proprietaire.telephone_secondaire ? formatPhoneNumber(proprietaire.telephone_secondaire) : null;

  // ✅ Afficher l'alerte automatiquement après le chargement si pas de biens
  useState(() => {
    if (hasNoBiens) {
      setTimeout(() => setShowAlert(true), 500);
      setTimeout(() => setShowAlert(false), 5000);
    }
  });

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
          {proprietaire.nom} {proprietaire.prenom}
        </h3>
        
      </div>

      <div className="card-body">
        <div className="info">
          <div className="info-item">
            <span className="info-icon">✉️</span>
            <span className="info-text">{proprietaire.email}</span>
          </div>
          
          {/* ✅ Téléphone ❶ */}
          <div className="info-item">
            <span className="info-icon">📞</span>
            <span className="info-text">
              <span className="phone-number">1</span> 
              {telephone1 || 'Non renseigné'}
            </span>
          </div>
          
          {/* ✅ Téléphone ❷ - affiché seulement si présent */}
          {telephone2 && (
            <div className="info-item">
              <span className="info-icon">📞</span>
              <span className="info-text">
                <span className="phone-number">2</span> 
                {telephone2}
              </span>
            </div>
          )}
        </div>

        <div className="proprietaire-stats">
          <div className={`stat-item`}>
            <span className="stat-value-proprio">{nbBiens}</span> <span className="stat-label">Bien(s)</span>
            </div>

          <div className="proprietaire-badge">
          <span className="type-icon">{typeInfo.icone}</span>
          <span className="type-label" style={{ color: typeInfo.couleur }}>
            {typeInfo.label}
          </span>
          </div>

          <div className="stat-item">
            <span className="stat-value-proprio">
              {proprietaire.actif ? '✅' : '❌'}
            </span>
            <span className="stat-label">{proprietaire.actif ? 'Actif' : 'Inactif'}</span>
          </div>
        </div>

        {nbBiens > 0 && (
          <div className="proprietaire-biens-preview">
            <span className="biens-preview-title">Bien(s) :</span>
            <div className="biens-list">
              {proprietaire.biens?.slice(0, 3).map((bien: any) => (
                <span key={bien.id} className="bien-tag">
                  {bien.nom}
                </span>
              ))}
              {nbBiens > 3 && (
                <span className="bien-tag more">+{nbBiens - 3}</span>
              )}
            </div>
          </div>
        )}


        {hasNoBiens && (
          <motion.button
          className={`btn-add-bien-rapide stat-item ${hasNoBiens ? 'empty' : ''}`}
            onClick={() => onEdit(proprietaire)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="btn-icon">➕</span>
            Attribuer Bien(s)
          </motion.button>
        )}
      </div>

      <div className={`proprietaire-card-actions ${isHovered ? 'visible' : ''}`}>
        <button 
          className="action-btn view"
          onClick={() => onView(proprietaire.id)}
          title="Voir détails"
        >
          👁️
        </button>
        <button 
          className="action-btn edit"
          onClick={() => onEdit(proprietaire)}
          title="Modifier"
        >
          ✏️
        </button>
        <button 
          className="action-btn delete"
          onClick={() => onDelete(proprietaire)}
          title="Supprimer"
        >
          🗑️
        </button>
      </div>
    </motion.div>
  );
}