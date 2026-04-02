'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { TYPES_PROPRIETAIRE } from '@/app/types/proprietaires';
import '@/app/proprietaires/proprietaires.css';

interface ProprietaireDetailModalProps {
  proprietaire: any;
  onClose: () => void;
  onEdit: (proprietaire: any) => void;
  onAddBien?: (proprietaire: any) => void;
}

export default function ProprietaireDetailModal({
  proprietaire,
  onClose,
  onEdit,
  onAddBien
}: ProprietaireDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'biens' | 'documents'>('info');
  const [selectedBien, setSelectedBien] = useState<any>(null);
  const { formatDate, formatMoney } = useTheme();

  const getTypeInfo = (type: string) => {
    const types: Record<string, { icone: string; label: string; couleur: string }> = {
      'PARTICULIER': { icone: '👤', label: 'Particulier', couleur: '#10b981' },
      'SOCIETE': { icone: '🏢', label: 'Société', couleur: '#3b82f6' },
      'AGENCE': { icone: '🏪', label: 'Agence', couleur: '#f59e0b' }
    };
    return types[type] || { icone: '👤', label: type, couleur: '#94a3b8' };
  };

  const typeInfo = getTypeInfo(proprietaire.type);
  const nbBiens = proprietaire.biens?.length || 0;
  const nbDocuments = proprietaire.documents?.length || 0;

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

  const getTypeBienIcon = (type: string) => {
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

  const tabs = [
    { id: 'info', label: 'Informations', icon: '👤', count: null },
    { id: 'biens', label: 'Biens', icon: '🏢', count: nbBiens },
    { id: 'documents', label: 'Documents', icon: '📎', count: nbDocuments }
  ];

  const handleViewBien = (bien: any) => {
    setSelectedBien(bien);
  };

  const handleCloseBienDetail = () => {
    setSelectedBien(null);
  };

  return (
    <>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="modal-content proprietaire-detail-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="modal-header proprietaire-detail-header">
            <div className="header-left">
              <div className="proprietaire-detail-avatar">
                <span>{proprietaire.prenom?.[0]}{proprietaire.nom?.[0]}</span>
              </div>
              <div className="proprietaire-detail-title">
                <h2>{proprietaire.prenom} {proprietaire.nom}</h2>
                <div className="proprietaire-detail-subtitle">
                  <span className="detail-email">{proprietaire.email}</span>
                  <span className="detail-tel">{proprietaire.telephone || 'Téléphone non renseigné'}</span>
                </div>
              </div>
            </div>
            <div className="header-right">
              <div 
                className="proprietaire-detail-type"
                style={{ 
                  background: `${typeInfo.couleur}20`,
                  color: typeInfo.couleur,
                  borderColor: `${typeInfo.couleur}40`
                }}
              >
                <span className="type-icon">{typeInfo.icone}</span>
                <span className="type-label">{typeInfo.label}</span>
              </div>
              <button className="modal-close-btn" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Onglets */}
          <div className="proprietaire-detail-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="tab-count">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Corps avec contenu des onglets */}
          <div className="modal-body proprietaire-detail-body">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="tab-content"
              >
                {/* Onglet Informations */}
                {activeTab === 'info' && (
                  <div className="info-tab">
                    {/* Identité */}
                    <div className="detail-card">
                      <h3>
                        <span className="card-icon">👤</span>
                        Identité
                      </h3>
                      <div className="detail-grid">
                        <div className="detail-row">
                          <span className="detail-label">Nom complet</span>
                          <span className="detail-value">{proprietaire.prenom} {proprietaire.nom}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{proprietaire.email}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Téléphone</span>
                          <span className="detail-value">{proprietaire.telephone || 'Non renseigné'}</span>
                        </div>
                        {proprietaire.telephone_secondaire && (
                          <div className="detail-row">
                            <span className="detail-label">Téléphone 2</span>
                            <span className="detail-value">{proprietaire.telephone_secondaire}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">Type</span>
                          <span className="detail-value" style={{ color: typeInfo.couleur }}>
                            {typeInfo.icone} {typeInfo.label}
                          </span>
                        </div>
                        {proprietaire.num_identite && (
                          <div className="detail-row">
                            <span className="detail-label">N° d'identité</span>
                            <span className="detail-value">{proprietaire.num_identite}</span>
                          </div>
                        )}
                        {proprietaire.date_naissance && (
                          <div className="detail-row">
                            <span className="detail-label">Date de naissance</span>
                            <span className="detail-value">{formatDate(proprietaire.date_naissance)}</span>
                          </div>
                        )}
                        {proprietaire.profession && (
                          <div className="detail-row">
                            <span className="detail-label">Profession</span>
                            <span className="detail-value">{proprietaire.profession}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Adresse */}
                    {(proprietaire.adresse || proprietaire.ville) && (
                      <div className="detail-card">
                        <h3>
                          <span className="card-icon">📍</span>
                          Adresse
                        </h3>
                        <div className="detail-grid">
                          {proprietaire.adresse && (
                            <div className="detail-row">
                              <span className="detail-label">Adresse</span>
                              <span className="detail-value">{proprietaire.adresse}</span>
                            </div>
                          )}
                          {proprietaire.ville && (
                            <div className="detail-row">
                              <span className="detail-label">Ville</span>
                              <span className="detail-value">{proprietaire.ville}</span>
                            </div>
                          )}
                          {proprietaire.pays && (
                            <div className="detail-row">
                              <span className="detail-label">Pays</span>
                              <span className="detail-value">{proprietaire.pays}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Statistiques */}
                    <div className="detail-card">
                      <h3>
                        <span className="card-icon">📊</span>
                        Statistiques
                      </h3>
                      <div className="stats-grid">
                        <div className="stat-card-small">
                          <div className="stat-value-large">{nbBiens}</div>
                          <div className="stat-label-small">Bien(s)</div>
                        </div>
                        <div className="stat-card-small">
                          <div className="stat-value-large">{proprietaire.actif ? '✅' : '❌'}</div>
                          <div className="stat-label-small">{proprietaire.actif ? 'Actif' : 'Inactif'}</div>
                        </div>
                        <div className="stat-card-small">
                          <div className="stat-value-large">{formatDate(proprietaire.created_at)}</div>
                          <div className="stat-label-small">Inscription</div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {proprietaire.notes && (
                      <div className="detail-card">
                        <h3>
                          <span className="card-icon">📝</span>
                          Notes
                        </h3>
                        <p className="notes-text">{proprietaire.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Onglet Biens */}
                {activeTab === 'biens' && (
                  <div className="biens-tab">
                    {nbBiens === 0 ? (
                      <div className="empty-tab">
                        <span className="empty-icon">🏢</span>
                        <p>Aucun bien associé à ce propriétaire</p>
                        {onAddBien && (
                          <button 
                            className="btn-add-bien"
                            onClick={() => onAddBien(proprietaire)}
                          >
                            <span className="btn-icon">➕</span>
                            Ajouter un bien
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="biens-list-detail">
                        {proprietaire.biens.map((bien: any) => (
                          <div 
                            key={bien.id} 
                            className="bien-detail-item"
                            onClick={() => handleViewBien(bien)}
                          >
                            <div className="bien-icon">{getTypeBienIcon(bien.type_bien)}</div>
                            <div className="bien-info">
                              <div className="bien-header">
                                <span className="bien-nom">{bien.nom}</span>
                                <span className={`bien-statut ${getStatutClass(bien.statut)}`}>
                                  {getStatutLabel(bien.statut)}
                                </span>
                              </div>
                              <div className="bien-adresse">
                                {bien.adresse}, {bien.commune}, {bien.ville}
                              </div>
                              <div className="bien-caracteristiques">
                                <span>📏 {bien.surface} m²</span>
                                {bien.pieces > 0 && <span>🛏️ {bien.pieces} pièces</span>}
                                {bien.etage && <span>🏢 Étage {bien.etage}</span>}
                              </div>
                              <div className="bien-prix">
                                {bien.statut === 'EN_VENTE' ? (
                                  <span className="prix-vente">💰 {formatMoney(bien.prix_vente)}</span>
                                ) : (
                                  <span className="prix-loyer">🏠 {formatMoney(bien.loyer_mensuel)}/mois</span>
                                )}
                                {bien.locataire_actuel && (
                                  <span className="locataire-badge">
                                    👤 {bien.locataire_actuel.prenom} {bien.locataire_actuel.nom}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="bien-arrow">→</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Onglet Documents */}
                {activeTab === 'documents' && (
                  <div className="documents-tab">
                    {nbDocuments === 0 ? (
                      <div className="empty-tab">
                        <span className="empty-icon">📎</span>
                        <p>Aucun document pour ce propriétaire</p>
                      </div>
                    ) : (
                      <div className="documents-list-detail">
                        {proprietaire.documents?.map((doc: any) => (
                          <div key={doc.id} className="document-detail-item">
                            <div className="doc-icon">📄</div>
                            <div className="doc-info">
                              <div className="doc-name">{doc.nom}</div>
                              <div className="doc-meta">
                                <span>📅 {formatDate(doc.date_upload)}</span>
                                <span>📦 {(doc.taille / 1024).toFixed(2)} KB</span>
                              </div>
                              {doc.date_expiration && (
                                <div className={`doc-expiration ${new Date(doc.date_expiration) < new Date() ? 'expired' : 'valid'}`}>
                                  {new Date(doc.date_expiration) < new Date() ? '⚠️ Expiré le' : '✅ Valide jusqu\'au'} {formatDate(doc.date_expiration)}
                                </div>
                              )}
                            </div>
                            <div className="doc-actions">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-download" title="Télécharger">
                                📥
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pied de la modale */}
          <div className="modal-footer proprietaire-detail-footer">
            <button className="btn-cancel" onClick={onClose}>
              Fermer
            </button>
            <button 
              className="btn-submit"
              onClick={() => {
                onClose();
                onEdit(proprietaire);
              }}
            >
              ✏️ Modifier
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Modale de détail d'un bien */}
      <AnimatePresence>
        {selectedBien && (
          <BienQuickViewModal
            bien={selectedBien}
            onClose={handleCloseBienDetail}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ✅ Composant pour la vue rapide d'un bien
function BienQuickViewModal({ bien, onClose }: { bien: any; onClose: () => void }) {
  const { formatMoney, formatDate } = useTheme();

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

  const getTypeBienIcon = (type: string) => {
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

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content bien-quick-view-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <span className="title-icon">{getTypeBienIcon(bien.type_bien)}</span>
            <h2>{bien.nom}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="bien-quick-info">
            <div className="info-row">
              <span className="info-label">Adresse</span>
              <span className="info-value">{bien.adresse}, {bien.commune}, {bien.ville}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Surface</span>
              <span className="info-value">{bien.surface} m²</span>
            </div>
            {bien.pieces > 0 && (
              <div className="info-row">
                <span className="info-label">Pièces</span>
                <span className="info-value">{bien.pieces}</span>
              </div>
            )}
            {bien.etage && (
              <div className="info-row">
                <span className="info-label">Étage</span>
                <span className="info-value">{bien.etage}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Statut</span>
              <span className={`statut-badge ${getStatutClass(bien.statut)}`}>
                {getStatutLabel(bien.statut)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">
                {bien.statut === 'EN_VENTE' ? 'Prix de vente' : 'Loyer mensuel'}
              </span>
              <span className="info-value highlight">
                {bien.statut === 'EN_VENTE' 
                  ? formatMoney(bien.prix_vente)
                  : formatMoney(bien.loyer_mensuel)}
              </span>
            </div>
            {bien.charges > 0 && bien.statut !== 'EN_VENTE' && (
              <div className="info-row">
                <span className="info-label">Charges</span>
                <span className="info-value">{formatMoney(bien.charges)}</span>
              </div>
            )}
            {bien.locataire_actuel && (
              <div className="info-row">
                <span className="info-label">Locataire</span>
                <span className="info-value">
                  {bien.locataire_actuel.prenom} {bien.locataire_actuel.nom}
                </span>
              </div>
            )}
            {bien.date_acquisition && (
              <div className="info-row">
                <span className="info-label">Acquisition</span>
                <span className="info-value">{formatDate(bien.date_acquisition)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}