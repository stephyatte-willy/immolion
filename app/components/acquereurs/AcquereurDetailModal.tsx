'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import { TYPES_ACQUEREUR } from '@/app/types/acquereurs';
import ContratVenteForm from '@/app/components/contrats/ContratVenteForm';
import PaiementVenteForm from '@/app/components/paiements/PaiementVenteForm';
import DocumentForm from '@/app/components/documents/DocumentForm';
import DocumentCard from '@/app/components/documents/DocumentCard';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { contratVenteService } from '@/app/services/contratVenteService';
import toast from 'react-hot-toast';
import '@/app/acquereurs/acquereurs.css';

interface AcquereurDetailModalProps {
  acquereur: any;
  onClose: () => void;
  onEdit: (acquereur: any) => void;
}

export default function AcquereurDetailModal({ 
  acquereur: initialAcquereur, 
  onClose, 
  onEdit 
}: AcquereurDetailModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [showContratForm, setShowContratForm] = useState(false);
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<any>(null);
  const [selectedPaiement, setSelectedPaiement] = useState<any>(null);
  const [acquereurData, setAcquereurData] = useState<any>(initialAcquereur);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: string, id: number, item: any} | null>(null);
  const [isGeneratingContrat, setIsGeneratingContrat] = useState(false);

  const { formatMoney, formatDate } = useTheme();

  useEffect(() => {
    refreshAcquereurData();
  }, []);

  useEffect(() => {
    setAcquereurData(initialAcquereur);
  }, [initialAcquereur]);

  useEffect(() => {
    if (acquereurData?.id) {
      chargerPaiements();
      chargerDocuments();
    }
  }, [acquereurData?.id, refreshKey]);

  const getTypeInfo = (type: string) => {
    const types: Record<string, { icone: string; label: string; couleur: string }> = {
      'PARTICULIER': { icone: '👤', label: 'Particulier', couleur: '#10b981' },
      'SOCIETE': { icone: '🏢', label: 'Société', couleur: '#3b82f6' },
      'AGENCE': { icone: '🏪', label: 'Agence', couleur: '#f59e0b' }
    };
    return types[type] || { icone: '👤', label: type, couleur: '#94a3b8' };
  };

  const typeInfo = getTypeInfo(acquereurData.type_acquereur);
  const isEntite = acquereurData.type_acquereur === 'SOCIETE' || acquereurData.type_acquereur === 'AGENCE';

  const refreshAcquereurData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/acquereurs/${initialAcquereur.id}`);
      const data = await response.json();
      if (data.success) {
        setAcquereurData(data.acquereur);
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('❌ Erreur rechargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chargerPaiements = async () => {
    try {
      const response = await fetch(`/api/paiements?acquereur_id=${acquereurData.id}`);
      const data = await response.json();
      if (data.success) {
        setPaiements(data.paiements);
      }
    } catch (error) {
      console.error('❌ Erreur chargement paiements:', error);
    }
  };

  const chargerDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?acquereur_id=${acquereurData.id}`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('❌ Erreur chargement documents:', error);
    }
  };

  const handleAddContrat = () => {
    setSelectedContrat(null);
    setShowContratForm(true);
  };

  const handleEditContrat = (contrat: any) => {
    setSelectedContrat({
      ...contrat,
      acquereur: {
        id: acquereurData.id,
        nom: acquereurData.nom,
        prenom: acquereurData.prenom,
        email: acquereurData.email,
        telephone: acquereurData.telephone,
        type_acquereur: acquereurData.type_acquereur
      }
    });
    setShowContratForm(true);
  };

  const handleDeleteContrat = (contrat: any) => {
    setItemToDelete({ type: 'contrat', id: contrat.id, item: contrat });
    setShowDeleteConfirm(true);
  };

  const handleAddPaiement = () => {
    setSelectedPaiement(null);
    setShowPaiementForm(true);
  };

  const handleEditPaiement = (paiement: any) => {
    setSelectedPaiement(paiement);
    setShowPaiementForm(true);
  };

  const handleDeletePaiement = (paiement: any) => {
    setItemToDelete({ type: 'paiement', id: paiement.id, item: paiement });
    setShowDeleteConfirm(true);
  };

  const handleAddDocument = () => {
    setShowDocumentForm(true);
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast.success('Document supprimé avec succès');
        chargerDocuments();
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleUpdateDocument = async (id: number, type: string, dateExpiration: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type_document: type, date_expiration: dateExpiration })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Document mis à jour');
        chargerDocuments();
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(data.erreur || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleExporterContrat = async (contrat: any) => {
    setIsGeneratingContrat(true);
    try {
      const entrepriseRes = await fetch('/api/entreprise');
      const entrepriseData = await entrepriseRes.json();
      const entreprise = entrepriseData.entreprise || {
        nom: 'ImmoLion Gestion',
        ville: 'Abidjan',
        adresse: 'Abidjan, Côte d\'Ivoire',
        telephone: '+225 00 00 00 00',
        email: 'contact@immolion.ci'
      };

      const contratData = {
        numero_contrat: contrat.numero_contrat,
        date_signature: contrat.date_signature || new Date().toISOString(),
        vendeur: {
          nom: 'Admin',
          prenom: 'Super',
          email: 'admin@immolion.com',
          telephone: '+225 00 00 00 00'
        },
        acheteur: {
          nom: acquereurData.nom,
          prenom: acquereurData.prenom,
          email: acquereurData.email,
          telephone: acquereurData.telephone,
          date_naissance: acquereurData.date_naissance,
          lieu_naissance: acquereurData.lieu_naissance,
          nationalite: acquereurData.nationalite,
          profession: acquereurData.profession
        },
        bien: {
          nom: contrat.bien?.nom || 'Bien',
          adresse: contrat.bien?.adresse || '',
          quartier: contrat.bien?.quartier,
          commune: contrat.bien?.commune || '',
          ville: contrat.bien?.ville || 'Abidjan',
          district: contrat.bien?.district || '',
          surface: contrat.bien?.surface || 0,
          pieces: contrat.bien?.pieces || 1,
          etage: contrat.bien?.etage,
          description: contrat.bien?.description
        },
        prix_vente: contrat.prix_vente || 0,
        clause_particuliere: contrat.clause_particuliere,
        entreprise: {
          nom: entreprise.nom,
          adresse: entreprise.adresse || `${entreprise.ville}, Côte d'Ivoire`,
          telephone: entreprise.telephone,
          email: entreprise.email
        }
      };

      await contratVenteService.genererContratVente(contratData);
      toast.success('Contrat de vente exporté avec succès');
    } catch (error) {
      console.error('❌ Erreur export:', error);
      toast.error('Erreur lors de l\'exportation');
    } finally {
      setIsGeneratingContrat(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/${itemToDelete.type}s/${itemToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`${itemToDelete.type === 'contrat' ? 'Contrat' : 'Paiement'} supprimé avec succès`);
        await refreshAcquereurData();
        if (itemToDelete.type === 'paiement') {
          await chargerPaiements();
        }
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleContratSuccess = async () => {
    setShowContratForm(false);
    await refreshAcquereurData();
    toast.success('Opération réussie');
  };

  const handlePaiementSuccess = async () => {
    setShowPaiementForm(false);
    await chargerPaiements();
    setRefreshKey(prev => prev + 1);
    toast.success('Paiement enregistré avec succès');
  };

  const handleDocumentSuccess = () => {
    setShowDocumentForm(false);
    chargerDocuments();
    setRefreshKey(prev => prev + 1);
    toast.success('Documents uploadés avec succès');
  };

  const tabs = [
    { id: 'info', label: 'Informations', icon: '👤' },
    { id: 'contrats', label: 'Contrats de vente', icon: '📄' },
    { id: 'paiements', label: 'Paiements', icon: '💰' },
    { id: 'documents', label: 'Documents', icon: '📎' }
  ];

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content detail-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="modal-header detail-header">
          <div className="header-right">
            <div className="detail-avatar">
              <span>{isEntite ? '🏢' : `${acquereurData.prenom?.[0] || ''}${acquereurData.nom?.[0] || ''}`.toUpperCase()}</span>
            </div>
            <div className="detail-title">
              <h2>
                {isEntite 
                  ? acquereurData.raison_sociale 
                  : `${acquereurData.prenom} ${acquereurData.nom}`}
              </h2>
              <div className="detail-subtitle">
                <span className="detail-email">{acquereurData.email}</span>
                <span className="detail-tel">{acquereurData.telephone || 'Tél non renseigné'}</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div 
              className="detail-type"
              style={{ 
                background: `${typeInfo.couleur}20`,
                color: typeInfo.couleur,
                borderColor: `${typeInfo.couleur}40`
              }}
            >
              <span className="type-icon">{typeInfo.icone}</span>
              <span className="type-label">{typeInfo.label}</span>
            </div>
            <div className={`acquereur-detail-statut ${acquereurData.actif ? 'actif' : 'inactif'}`}>
              {acquereurData.actif ? 'Actif' : 'Inactif'}
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="detail-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Corps */}
        <div className="modal-body detail-body">
          <AnimatePresence mode="wait">
            <motion.div>
              {/* Onglet Informations */}
              {activeTab === 'info' && (
                  <div className="detail-card">
                    <h3>
                      <span className="card-icon">🏷️</span>
                      Type d'acquéreur
                    </h3>
                    <div className="detail-grid">
                      <div className="detail-row">
                        <span className="detail-label">Type</span>
                        <span className="detail-value">
                          <span className="type-badge" style={{ background: `${typeInfo.couleur}20`, color: typeInfo.couleur }}>
                            {typeInfo.icone} {typeInfo.label}
                          </span>
                        </span>
                      </div>
                      {isEntite && acquereurData.raison_sociale && (
                        <div className="detail-row">
                          <span className="detail-label">Raison sociale</span>
                          <span className="detail-value">{acquereurData.raison_sociale}</span>
                        </div>
                      )}
                    </div>

                  <div className="detail-card">
                    <h3>
                      <span className="card-icon">👤</span>
                      {isEntite ? 'Informations de l\'entité' : 'Identité'}
                    </h3>
                    <div className="detail-grid">
                      {!isEntite && (
                        <>
                          <div className="detail-row">
                            <span className="detail-label">Nom complet</span>
                            <span className="detail-value">{acquereurData.prenom} {acquereurData.nom}</span>
                          </div>
                          {acquereurData.date_naissance && (
                            <div className="detail-row">
                              <span className="detail-label">Date de naissance</span>
                              <span className="detail-value">{formatDate(acquereurData.date_naissance)}</span>
                            </div>
                          )}
                          {acquereurData.lieu_naissance && (
                            <div className="detail-row">
                              <span className="detail-label">Lieu de naissance</span>
                              <span className="detail-value">{acquereurData.lieu_naissance}</span>
                            </div>
                          )}
                          <div className="detail-row">
                            <span className="detail-label">Nationalité</span>
                            <span className="detail-value">{acquereurData.nationalite || 'Ivoirienne'}</span>
                          </div>
                          {acquereurData.profession && (
                            <div className="detail-row">
                              <span className="detail-label">Profession</span>
                              <span className="detail-value">{acquereurData.profession}</span>
                            </div>
                          )}
                          {acquereurData.employeur && (
                            <div className="detail-row">
                              <span className="detail-label">Employeur</span>
                              <span className="detail-value">{acquereurData.employeur}</span>
                            </div>
                          )}
                          {acquereurData.revenus_mensuels > 0 && (
                            <div className="detail-row">
                              <span className="detail-label">Revenus mensuels</span>
                              <span className="detail-value highlight">{formatMoney(acquereurData.revenus_mensuels)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">N° d'identité</span>
                        <span className="detail-value">{acquereurData.num_identite || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-card">
                    <h3>
                      <span className="card-icon">📞</span>
                      Contact
                    </h3>
                    <div className="detail-grid">
                      <div className="detail-row">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{acquereurData.email}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Téléphone</span>
                        <span className="detail-value">{acquereurData.telephone || 'Non renseigné'}</span>
                      </div>
                      {acquereurData.telephone_secondaire && (
                        <div className="detail-row">
                          <span className="detail-label">Téléphone 2</span>
                          <span className="detail-value">{acquereurData.telephone_secondaire}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(acquereurData.adresse || acquereurData.ville) && (
                    <div className="detail-card">
                      <h3>
                        <span className="card-icon">📍</span>
                        Adresse
                      </h3>
                      <div className="detail-grid">
                        {acquereurData.adresse && (
                          <div className="detail-row">
                            <span className="detail-label">Adresse</span>
                            <span className="detail-value">{acquereurData.adresse}</span>
                          </div>
                        )}
                        {acquereurData.ville && (
                          <div className="detail-row">
                            <span className="detail-label">Ville</span>
                            <span className="detail-value">{acquereurData.ville}</span>
                          </div>
                        )}
                        {acquereurData.pays && (
                          <div className="detail-row">
                            <span className="detail-label">Pays</span>
                            <span className="detail-value">{acquereurData.pays}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {acquereurData.notes && (
                    <div className="detail-card">
                      <h3>
                        <span className="card-icon">📝</span>
                        Notes
                      </h3>
                      <p className="notes-text">{acquereurData.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Contrats de vente */}
              {activeTab === 'contrats' && (
                <div className="contrats-tab">
                  <div className="tab-actions">
                    <button 
                      className="btn-add"
                      onClick={handleAddContrat}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">➕</span>
                      Nouveau contrat
                    </button>
                    <button 
                      className="btn-refresh"
                      onClick={refreshAcquereurData}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">🔄</span>
                      Rafraîchir
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Chargement des contrats...</p>
                    </div>
                  ) : acquereurData.contrats && acquereurData.contrats.length > 0 ? (
                    <div className="contrats-list-compact">
                      {acquereurData.contrats.map((contrat: any) => (
                        <div key={contrat.id} className="contrat-item-with-actions">
                          <div className="contrat-card-compact">
                            <div className="contrat-header-compact">
                              <div className="contrat-numero">{contrat.numero_contrat}</div>
                              <div className="contrat-montant">{formatMoney(contrat.prix_vente)}</div>
                            </div>
                            <div className="contrat-body-compact">
                              <div className="contrat-info">
                                <span className="info-icon">🏠</span>
                                <span>{contrat.bien?.nom || 'Bien'}</span>
                              </div>
                              <div className="contrat-info">
                                <span className="info-icon">📅</span>
                                <span>Début: {formatDate(contrat.date_debut)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="contrat-actions-group">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEditContrat(contrat)}
                              title="Modifier le contrat"
                            >
                              ✏️
                            </button>
                            <button
                              className="action-btn export"
                              onClick={() => handleExporterContrat(contrat)}
                              title="Exporter le contrat"
                              disabled={isGeneratingContrat}
                            >
                              {isGeneratingContrat ? '⏳' : '📄'}
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteContrat(contrat)}
                              title="Supprimer le contrat"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-tab">
                      <span className="empty-icon">📄</span>
                      <p>Aucun contrat de vente pour cet acquéreur</p>
                      <button 
                        className="btn-add empty-btn"
                        onClick={handleAddContrat}
                      >
                        Créer un contrat
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Paiements */}
              {activeTab === 'paiements' && (
                <div className="paiements-tab">
                  <div className="tab-actions">
                    <button 
                      className="btn-add"
                      onClick={handleAddPaiement}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">➕</span>
                      Nouveau versement
                    </button>
                    <button 
                      className="btn-refresh"
                      onClick={() => {
                        chargerPaiements();
                        setRefreshKey(prev => prev + 1);
                      }}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">🔄</span>
                      Rafraîchir
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Chargement des versements...</p>
                    </div>
                  ) : paiements && paiements.length > 0 ? (
                    <div className="paiements-list">
                      {paiements.map((paiement) => (
                        <div key={paiement.id} className="paiement-card">
                          <div className="paiement-header">
                            <div className="paiement-title">
                              <span className="paiement-icon">💰</span>
                              <span className="paiement-reference">{paiement.reference || 'Versement'}</span>
                            </div>
                            <span className={`paiement-statut ${paiement.statut.toLowerCase()}`}>
                              {paiement.statut}
                            </span>
                          </div>
                          
                          <div className="paiement-body">
                            <div className="paiement-info-row">
                              <div className="paiement-info">
                                <span className="info-label">Montant</span>
                                <span className="info-value highlight">{formatMoney(paiement.montant)}</span>
                              </div>
                              <div className="paiement-info">
                                <span className="info-label">Date</span>
                                <span className="info-value">{formatDate(paiement.date_paiement)}</span>
                              </div>
                            </div>
                            
                            <div className="paiement-info-row">
                              <div className="paiement-info">
                                <span className="info-label">Mode</span>
                                <span className="info-value">{paiement.mode_paiement}</span>
                              </div>
                              {paiement.versement_numero && (
                                <div className="paiement-info">
                                  <span className="info-label">Versement</span>
                                  <span className="info-value">n°{paiement.versement_numero}</span>
                                </div>
                              )}
                            </div>
                            
                            {paiement.contrat_numero && (
                              <div className="paiement-contrat">
                                <span className="contrat-icon">📄</span>
                                <span className="contrat-numero">Contrat: {paiement.contrat_numero}</span>
                              </div>
                            )}
                            
                            {paiement.commentaire && (
                              <div className="paiement-commentaire">
                                <span className="commentaire-icon">📝</span>
                                <span className="commentaire-texte">{paiement.commentaire}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="paiement-footer">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEditPaiement(paiement)}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeletePaiement(paiement)}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-tab">
                      <span className="empty-icon">💰</span>
                      <p>Aucun versement pour cet acquéreur</p>
                      <button 
                        className="btn-add empty-btn"
                        onClick={handleAddPaiement}
                      >
                        Enregistrer un versement
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Documents */}
              {activeTab === 'documents' && (
                <div className="documents-tab">
                  <div className="tab-actions">
                    <button 
                      className="btn-add"
                      onClick={handleAddDocument}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">➕</span>
                      Ajouter
                    </button>
                    <button 
                      className="btn-refresh"
                      onClick={() => {
                        chargerDocuments();
                        setRefreshKey(prev => prev + 1);
                      }}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">🔄</span>
                      Rafraîchir
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Chargement des documents...</p>
                    </div>
                  ) : documents && documents.length > 0 ? (
                    <div className="documents-grid">
                      {documents.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          onDelete={handleDeleteDocument}
                          onUpdate={handleUpdateDocument}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-tab">
                      <span className="empty-icon">📎</span>
                      <p>Aucun document pour cet acquéreur</p>
                      <button 
                        className="btn-add empty-btn"
                        onClick={handleAddDocument}
                      >
                        Ajouter des documents
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pied */}
        <div className="modal-footer acquereur-detail-footer">
          <button className="btn-cancel" onClick={onClose}>
            Fermer
          </button>
          <button 
            className="btn-submit"
            onClick={() => {
              onClose();
              onEdit(acquereurData);
            }}
          >
            ✏️ Modifier
          </button>
        </div>
      </motion.div>

      {/* Modale formulaire contrat */}
  <AnimatePresence>
  {showContratForm && (
    <ContratVenteForm
      contrat={selectedContrat}
      acquereur_id={acquereurData.id}
      bien_id={acquereurData.bien_id}
      onClose={() => setShowContratForm(false)}
      onSuccess={handleContratSuccess}
    />
  )}
</AnimatePresence>

      {/* Modale formulaire paiement */}
      <AnimatePresence>
  {showPaiementForm && (
    <PaiementVenteForm
      paiement={selectedPaiement}
      acquereur_id={acquereurData.id}
      bien_id={acquereurData.bien_id}
      onClose={() => setShowPaiementForm(false)}
      onSuccess={handlePaiementSuccess}
    />
  )}
</AnimatePresence>

      {/* Modale formulaire document */}
      <AnimatePresence>
  {showDocumentForm && (
    <DocumentForm
      acquereur_id={acquereurData.id}  // ✅ Utilisation de acquereur_id
      onClose={() => setShowDocumentForm(false)}
      onSuccess={handleDocumentSuccess}
    />
  )}
</AnimatePresence>

      {/* Modale de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={`Supprimer ${itemToDelete?.type === 'contrat' ? 'le contrat' : 'le paiement'}`}
        message={`Êtes-vous sûr de vouloir supprimer ${itemToDelete?.type === 'contrat' ? 'ce contrat de vente' : 'ce paiement'} ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        isLoading={isLoading}
      />
    </motion.div>
  );
}