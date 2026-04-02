'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import { STATUTS_CONTRAT, TYPES_CONTRAT } from '@/app/types/contrats';
import './contrats.css';

interface ContratCardProps {
  contrat: any;
  onView: (id: number) => void;
  onEdit: (contrat: any) => void;
  onDelete?: (id: number) => void;
  isCompact?: boolean;
}

export default function ContratCard({ 
  contrat, 
  onView, 
  onEdit, 
  onDelete, 
  isCompact = false 
}: ContratCardProps) {
  const { formatMoney, formatDate } = useTheme();

  const getStatutInfo = (statut: string) => {
    const statutObj = STATUTS_CONTRAT.find(s => s.value === statut) || STATUTS_CONTRAT[1];
    return {
      label: statutObj.label,
      couleur: statutObj.couleur
    };
  };

  const getTypeInfo = (type: string) => {
    const typeObj = TYPES_CONTRAT.find(t => t.value === type) || TYPES_CONTRAT[0];
    return {
      label: typeObj.label,
      icone: typeObj.icone
    };
  };

  const statutInfo = getStatutInfo(contrat.statut);
  const typeInfo = getTypeInfo(contrat.type_contrat);
  const isActif = contrat.statut === 'ACTIF';

  if (isCompact) {
    return (
      <motion.div 
        className="contrat-card compact"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => onView(contrat.id)}
      >
        <div className="contrat-card-header">
          <div className="contrat-type-icon" title={typeInfo.label}>
            {typeInfo.icone}
          </div>
          <div className="contrat-info-compact">
            <div className="contrat-numero">{contrat.numero_contrat}</div>
            <div className="contrat-periode">
              {formatDate(contrat.date_debut)} - {contrat.date_fin ? formatDate(contrat.date_fin) : 'En cours'}
            </div>
          </div>
          <div 
            className="contrat-statut-badge"
            style={{ 
              background: `${statutInfo.couleur}20`,
              color: statutInfo.couleur
            }}
          >
            {statutInfo.label}
          </div>
        </div>
        <div className="contrat-card-body">
          <div className="contrat-loyer">
            <span className="loyer-label">Loyer</span>
            <span className="loyer-valeur">{formatMoney(contrat.loyer_mensuel)}</span>
          </div>
          {contrat.bien_nom && (
            <div className="contrat-bien-mini">
              <span className="bien-icon">🏠</span>
              <span className="bien-nom">{contrat.bien_nom}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="contrat-card detailed"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="contrat-card-header">
        <div className="contrat-type-section">
          <div className="contrat-type-icon large">{typeInfo.icone}</div>
          <div className="contrat-type-label">{typeInfo.label}</div>
        </div>
        <div 
          className="contrat-statut-badge large"
          style={{ 
            background: `${statutInfo.couleur}20`,
            color: statutInfo.couleur,
            borderColor: `${statutInfo.couleur}40`
          }}
        >
          {statutInfo.label}
        </div>
      </div>

      <div className="contrat-card-body">
        <div className="contrat-numero-section">
          <span className="numero-label">N° contrat</span>
          <span className="numero-valeur">{contrat.numero_contrat}</span>
        </div>

        <div className="contrat-dates">
          <div className="date-item">
            <span className="date-icon">📅</span>
            <span className="date-label">Début:</span>
            <span className="date-valeur">{formatDate(contrat.date_debut)}</span>
          </div>
          {contrat.date_fin && (
            <div className="date-item">
              <span className="date-icon">⏱️</span>
              <span className="date-label">Fin:</span>
              <span className="date-valeur">{formatDate(contrat.date_fin)}</span>
            </div>
          )}
        </div>

        <div className="contrat-finances">
          <div className="finance-item">
            <span className="finance-label">Loyer mensuel</span>
            <span className="finance-valeur highlight">{formatMoney(contrat.loyer_mensuel)}</span>
          </div>
          {contrat.charges_mensuelles > 0 && (
            <div className="finance-item">
              <span className="finance-label">Charges</span>
              <span className="finance-valeur">{formatMoney(contrat.charges_mensuelles)}</span>
            </div>
          )}
          {contrat.depot_garantie > 0 && (
            <div className="finance-item">
              <span className="finance-label">Dépôt de garantie</span>
              <span className="finance-valeur">{formatMoney(contrat.depot_garantie)}</span>
            </div>
          )}
        </div>

        {contrat.bien && (
          <div className="contrat-bien">
            <span className="bien-icon">🏠</span>
            <div className="bien-info">
              <div className="bien-nom">{contrat.bien.nom}</div>
              <div className="bien-adresse">{contrat.bien.adresse}</div>
            </div>
          </div>
        )}

        {contrat.lot && (
          <div className="contrat-lot">
            <span className="lot-icon">🏘️</span>
            <div className="lot-info">
              <div className="lot-numero">Lot {contrat.lot.numero_lot}</div>
              <div className="lot-type">{contrat.lot.type_lot}</div>
            </div>
          </div>
        )}

        {contrat.locataire && (
          <div className="contrat-locataire">
            <span className="locataire-icon">👤</span>
            <div className="locataire-info">
              <div className="locataire-nom">{contrat.locataire.prenom} {contrat.locataire.nom}</div>
              <div className="locataire-contact">{contrat.locataire.email}</div>
            </div>
          </div>
        )}

        {contrat.clause_particuliere && (
          <div className="contrat-clause">
            <span className="clause-icon">📝</span>
            <p className="clause-texte">{contrat.clause_particuliere}</p>
          </div>
        )}
      </div>

      <div className="contrat-card-footer">
        <button className="action-btn view" onClick={() => onView(contrat.id)} title="Voir détails">
          👁️
        </button>
        <button className="action-btn edit" onClick={() => onEdit(contrat)} title="Modifier">
          ✏️
        </button>
        {onDelete && !isActif && (
          <button className="action-btn delete" onClick={() => onDelete(contrat.id)} title="Supprimer">
            🗑️
          </button>
        )}
      </div>
    </motion.div>
  );
}