'use client';

import { motion } from 'framer-motion';
import { TYPES_EVENEMENT, STATUTS_EVENEMENT } from '@/app/types/calendrier';
import { useTheme } from '@/app/providers/ThemeProvider';
import '@/app/calendrier/calendrier.css';

interface EvenementDetailModalProps {
  evenement: any;
  onClose: () => void;
  onEdit: (evenement: any) => void;
  onDelete: (evenement: any) => void;
}

export default function EvenementDetailModal({
  evenement,
  onClose,
  onEdit,
  onDelete
}: EvenementDetailModalProps) {
  const { formatDate } = useTheme();

  const getTypeInfo = (type: string) => {
    const typeInfo = TYPES_EVENEMENT.find(t => t.value === type) || TYPES_EVENEMENT[0];
    return {
      icone: typeInfo.icone,
      label: typeInfo.label,
      couleur: typeInfo.couleur
    };
  };

  const getStatutInfo = (statut: string) => {
    const statutInfo = STATUTS_EVENEMENT.find(s => s.value === statut) || STATUTS_EVENEMENT[0];
    return {
      label: statutInfo.label,
      couleur: statutInfo.couleur
    };
  };

  const typeInfo = getTypeInfo(evenement.type_evenement);
  const statutInfo = getStatutInfo(evenement.statut);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'Non défini';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content evenement-detail-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderBottomColor: typeInfo.couleur }}>
          <div className="modal-title">
            <span className="title-icon">{typeInfo.icone}</span>
            <h2>{evenement.titre}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="evenement-detail-grid">
            <div className="detail-card">
              <h3>
                <span className="card-icon">📋</span>
                Informations générales
              </h3>
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span className="detail-value" style={{ color: typeInfo.couleur }}>
                  {typeInfo.icone} {typeInfo.label}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Statut</span>
                <span className="detail-value" style={{ color: statutInfo.couleur }}>
                  {statutInfo.label}
                </span>
              </div>
              {evenement.lieu && (
                <div className="detail-row">
                  <span className="detail-label">Lieu</span>
                  <span className="detail-value">📍 {evenement.lieu}</span>
                </div>
              )}
            </div>

            <div className="detail-card">
              <h3>
                <span className="card-icon">📅</span>
                Dates
              </h3>
              <div className="detail-row">
                <span className="detail-label">Début</span>
                <span className="detail-value">{formatDateTime(evenement.date_debut)}</span>
              </div>
              {evenement.date_fin && (
                <div className="detail-row">
                  <span className="detail-label">Fin</span>
                  <span className="detail-value">{formatDateTime(evenement.date_fin)}</span>
                </div>
              )}
              {evenement.date_rappel && (
                <div className="detail-row">
                  <span className="detail-label">Rappel</span>
                  <span className="detail-value">⏰ {formatDateTime(evenement.date_rappel)}</span>
                </div>
              )}
              {evenement.recurrence && evenement.recurrence !== 'UNIQUE' && (
                <div className="detail-row">
                  <span className="detail-label">Récurrence</span>
                  <span className="detail-value">
                    {evenement.recurrence === 'JOURNALIER' && 'Quotidienne'}
                    {evenement.recurrence === 'HEBDOMADAIRE' && 'Hebdomadaire'}
                    {evenement.recurrence === 'MENSUEL' && 'Mensuelle'}
                    {evenement.recurrence === 'ANNUEL' && 'Annuelle'}
                    {evenement.recurrence_fin && ` jusqu'au ${formatDate(evenement.recurrence_fin)}`}
                  </span>
                </div>
              )}
            </div>

            {evenement.description && (
              <div className="detail-card">
                <h3>
                  <span className="card-icon">📝</span>
                  Description
                </h3>
                <p className="description-text">{evenement.description}</p>
              </div>
            )}

            {(evenement.bien_nom || evenement.locataire_nom || evenement.contrat_numero) && (
              <div className="detail-card">
                <h3>
                  <span className="card-icon">🔗</span>
                  Liens associés
                </h3>
                {evenement.bien_nom && (
                  <div className="detail-row">
                    <span className="detail-label">Bien</span>
                    <span className="detail-value">🏠 {evenement.bien_nom}</span>
                  </div>
                )}
                {evenement.locataire_nom && (
                  <div className="detail-row">
                    <span className="detail-label">Client</span>
                    <span className="detail-value">
                      👤 {evenement.locataire_prenom} {evenement.locataire_nom}
                    </span>
                  </div>
                )}
                {evenement.contrat_numero && (
                  <div className="detail-row">
                    <span className="detail-label">Contrat</span>
                    <span className="detail-value">📄 {evenement.contrat_numero}</span>
                  </div>
                )}
              </div>
            )}

            <div className="detail-card">
              <h3>
                <span className="card-icon">ℹ️</span>
                Informations système
              </h3>
              <div className="detail-row">
                <span className="detail-label">Créé le</span>
                <span className="detail-value">{formatDateTime(evenement.created_at)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Modifié le</span>
                <span className="detail-value">{formatDateTime(evenement.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Fermer
          </button>
          <button 
            className="btn-submit"
            onClick={() => {
              onClose();
              onEdit(evenement);
            }}
          >
            ✏️ Modifier
          </button>
          <button 
            className="btn-delete"
            onClick={() => {
              onClose();
              onDelete(evenement);
            }}
          >
            🗑️ Supprimer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}