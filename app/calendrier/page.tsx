'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import CalendrierVue from '@/app/components/calendrier/CalendrierVue';
import EvenementForm from '@/app/components/calendrier/EvenementForm';
import EvenementDetailModal from '@/app/components/calendrier/EvenementDetailModal';
import ActionButtons from '@/app/components/common/ActionButtons';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { ExportColumn } from '@/app/services/exportService';
import { useTheme } from '@/app/providers/ThemeProvider';
import { TYPES_EVENEMENT, STATUTS_EVENEMENT } from '@/app/types/calendrier';
import toast from 'react-hot-toast';
import './calendrier.css';

export default function CalendrierPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [evenements, setEvenements] = useState<any[]>([]);
  const [filteredEvenements, setFilteredEvenements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvenement, setSelectedEvenement] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [evenementToDelete, setEvenementToDelete] = useState<any>(null);
  const [vueActuelle, setVueActuelle] = useState<'mois' | 'semaine' | 'jour' | 'liste'>('mois');
  const [dateActuelle, setDateActuelle] = useState(new Date());
  const [filtres, setFiltres] = useState({
    type: 'TOUS',
    statut: 'TOUS'
  });
  const [currentFilters, setCurrentFilters] = useState<any>({});
  
  // ✅ États pour la sélection multiple (toujours actifs)
  const [selectedEvenements, setSelectedEvenements] = useState<number[]>([]);
  const [showMultipleDeleteConfirm, setShowMultipleDeleteConfirm] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();
  const { formatDate } = useTheme();

  // Colonnes pour l'export Excel
  const exportColumns: ExportColumn[] = [
    { header: 'ID', key: 'id' },
    { header: 'Titre', key: 'titre' },
    { header: 'Type', key: 'type_evenement' },
    { header: 'Description', key: 'description' },
    { header: 'Date de début', key: 'date_debut' },
    { header: 'Date de fin', key: 'date_fin' },
    { header: 'Statut', key: 'statut' },
    { header: 'Lieu', key: 'lieu' },
    { header: 'Bien', key: 'bien_nom' },
    { header: 'Locataire', key: 'locataire_nom' },
    { header: 'Contrat', key: 'contrat_numero' }
  ];

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    setUtilisateur(JSON.parse(userStr));
    chargerEvenements();
    chargerEntreprise();
  }, []);

  const chargerEntreprise = async () => {
    try {
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      if (data.success) setEntreprise(data.entreprise);
    } catch (error) {
      console.error('❌ Erreur chargement entreprise:', error);
    }
  };

  const chargerEvenements = async () => {
    setIsLoading(true);
    try {
      let url = '/api/evenements';
      
      const params = new URLSearchParams();
      if (filtres.type !== 'TOUS') params.append('type', filtres.type);
      if (filtres.statut !== 'TOUS') params.append('statut', filtres.statut);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setEvenements(data.evenements);
        setFilteredEvenements(data.evenements);
        setSelectedEvenements([]); // ✅ Réinitialiser la sélection
      } else {
        toast.error('Erreur lors du chargement des événements');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (filters: any) => {
    setCurrentFilters(filters);
    let filtered = [...evenements];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.titre?.toLowerCase().includes(searchLower) ||
        e.description?.toLowerCase().includes(searchLower) ||
        e.lieu?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type && filters.type !== 'TOUS') {
      filtered = filtered.filter(e => e.type_evenement === filters.type);
    }

    if (filters.statut && filters.statut !== 'TOUS') {
      filtered = filtered.filter(e => e.statut === filters.statut);
    }

    if (filters.dateDebut) {
      filtered = filtered.filter(e => new Date(e.date_debut) >= new Date(filters.dateDebut));
    }

    if (filters.dateFin) {
      filtered = filtered.filter(e => new Date(e.date_debut) <= new Date(filters.dateFin));
    }

    setFilteredEvenements(filtered);
    setSelectedEvenements([]); // ✅ Réinitialiser la sélection
  };

  // ✅ Fonction pour afficher tous les événements
  const handleShowAll = () => {
    setFiltres({
      type: 'TOUS',
      statut: 'TOUS'
    });
    setCurrentFilters({});
    setVueActuelle('liste');
    chargerEvenements();
    toast.success('Affichage de tous les événements en liste');
  };

  // ✅ Fonction pour réinitialiser les filtres
  const handleResetFilters = () => {
    setFiltres({
      type: 'TOUS',
      statut: 'TOUS'
    });
    setCurrentFilters({});
    chargerEvenements();
    toast.success('Filtres réinitialisés');
  };

  // ✅ Gestion de la sélection multiple
  const toggleSelectEvenement = (id: number) => {
    setSelectedEvenements(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEvenements.length === filteredEvenements.length) {
      setSelectedEvenements([]);
    } else {
      setSelectedEvenements(filteredEvenements.map(e => e.id));
    }
  };

  // ✅ Suppression multiple fetch(`/api/evenements/${id}`, { method: 'DELETE' })
  const handleMultipleDelete = async () => {
    if (selectedEvenements.length === 0) return;
    
      setShowMultipleDeleteConfirm(false);
      setIsDeletingMultiple(true);
    
    try {
      const promises = selectedEvenements.map(id => 
        fetch(`/api/evenements/${id}`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res.ok);
      
      if (allSuccess) {
        toast.success(`${selectedEvenements.length} événement(s) supprimé(s) avec succès`);
        chargerEvenements();
      } else {
        toast.error('Erreur lors de la suppression de certains événements');
      }
    } catch (error) {
      console.error('❌ Erreur suppression multiple:', error);
      toast.error('Erreur lors de la suppression multiple');
    }
  };

  const handleAddEvenement = () => {
    setSelectedEvenement(null);
    setShowForm(true);
  };

  const handleEditEvenement = (evenement: any) => {
    setSelectedEvenement(evenement);
    setShowForm(true);
  };

  const handleViewEvenement = (evenement: any) => {
    setSelectedEvenement(evenement);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (evenement: any) => {
    setEvenementToDelete(evenement);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!evenementToDelete) return;

    try {
      const response = await fetch(`/api/evenements/${evenementToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Événement supprimé avec succès');
        chargerEvenements();
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setShowDeleteConfirm(false);
      setEvenementToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    chargerEvenements();
  };

  const handleFiltreChange = (type: string, value: string) => {
    setFiltres(prev => ({ ...prev, [type]: value }));
  };

  useEffect(() => {
    chargerEvenements();
  }, [filtres]);

  if (!utilisateur) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  // Fonction pour formater la date
  const formatDateFr = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = TYPES_EVENEMENT.find(t => t.value === type);
    return typeInfo?.icone || '📌';
  };

  const getStatutClass = (statut: string) => {
    if (statut === 'PREVU') return 'statut-prevu';
    if (statut === 'EN_COURS') return 'statut-en-cours';
    if (statut === 'TERMINE') return 'statut-termine';
    if (statut === 'ANNULE') return 'statut-annule';
    return '';
  };

  return (
    <div className="calendrier-container">
      <Sidebar />
      
      <div className="calendrier-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Calendrier"
          sousTitre="Gérez vos rendez-vous et échéances"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="calendrier-content">
          {/* Barre d'outils */}
          <div className="calendrier-toolbar">
            <div className="toolbar-left">
              <div className="vue-selector">
                <button 
                  className={`vue-btn ${vueActuelle === 'mois' ? 'active' : ''}`}
                  onClick={() => setVueActuelle('mois')}
                >
                  Mois
                </button>
                <button 
                  className={`vue-btn ${vueActuelle === 'semaine' ? 'active' : ''}`}
                  onClick={() => setVueActuelle('semaine')}
                >
                  Semaine
                </button>
                <button 
                  className={`vue-btn ${vueActuelle === 'jour' ? 'active' : ''}`}
                  onClick={() => setVueActuelle('jour')}
                >
                  Jour
                </button>
                <button 
                  className={`vue-btn ${vueActuelle === 'liste' ? 'active' : ''}`}
                  onClick={() => setVueActuelle('liste')}
                >
                  📋 Liste
                </button>
              </div>
              
              <div className="date-navigation">
                {vueActuelle !== 'liste' && (
                  <>
                    <button 
                      className="nav-btn"
                      onClick={() => {
                        const newDate = new Date(dateActuelle);
                        if (vueActuelle === 'mois') newDate.setMonth(newDate.getMonth() - 1);
                        else if (vueActuelle === 'semaine') newDate.setDate(newDate.getDate() - 7);
                        else newDate.setDate(newDate.getDate() - 1);
                        setDateActuelle(newDate);
                      }}
                    >
                      ←
                    </button>
                    <span className="date-title">
                      {vueActuelle === 'mois' && dateActuelle.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      {vueActuelle === 'semaine' && `Semaine du ${formatDate(dateActuelle)}`}
                      {vueActuelle === 'jour' && formatDate(dateActuelle)}
                    </span>
                    <button 
                      className="nav-btn"
                      onClick={() => {
                        const newDate = new Date(dateActuelle);
                        if (vueActuelle === 'mois') newDate.setMonth(newDate.getMonth() + 1);
                        else if (vueActuelle === 'semaine') newDate.setDate(newDate.getDate() + 7);
                        else newDate.setDate(newDate.getDate() + 1);
                        setDateActuelle(newDate);
                      }}
                    >
                      →
                    </button>
                    <button 
                      className="today-btn"
                      onClick={() => setDateActuelle(new Date())}
                    >
                      Aujourd'hui
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="toolbar-right">
              <div className="filtres-rapides">
                <select
                  value={filtres.type}
                  onChange={(e) => handleFiltreChange('type', e.target.value)}
                  className="filtre-select"
                >
                  <option value="TOUS">Tous les types</option>
                  {TYPES_EVENEMENT.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icone} {type.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filtres.statut}
                  onChange={(e) => handleFiltreChange('statut', e.target.value)}
                  className="filtre-select"
                >
                  <option value="TOUS">Tous les statuts</option>
                  {STATUTS_EVENEMENT.map(statut => (
                    <option key={statut.value} value={statut.value}>
                      {statut.label}
                    </option>
                  ))}
                </select>
                
                <button 
                  className="btn-reset"
                  onClick={handleResetFilters}
                  title="Réinitialiser les filtres"
                >
                  <span className="btn-icon">🔄</span>
                  Réinitialiser
                </button>
              </div>
              
              <div className="actions-right">
                {/* ✅ Bouton Supprimer sélection (visible seulement quand des éléments sont sélectionnés) */}
                {selectedEvenements.length > 0 && vueActuelle === 'liste' && (
                  <button 
                    className="btn-delete-selection"
                    onClick={() => setShowMultipleDeleteConfirm(true)}
                    title="Supprimer la sélection"
                  >
                    <span className="btn-icon">🗑️</span>
                    Supprimer ({selectedEvenements.length})
                  </button>
                )}
                
                <ActionButtons
                  data={filteredEvenements}
                  columns={exportColumns}
                  titre="Liste des événements"
                />
                
                <button 
                  className="btn-add"
                  onClick={handleAddEvenement}
                  title='Nouvel événement'
                >
                  <span className="btn-icon">➕</span>
                  Nouvel événement
                </button>
              </div>
            </div>
          </div>

          {/* Vue calendrier ou liste */}
          {isLoading ? (
            <div className="gestion-loading">
              <div className="loading-spinner"></div>
              <p>Chargement du calendrier...</p>
            </div>
          ) : vueActuelle === 'liste' ? (
            // ✅ Vue Liste avec cases à cocher toujours présentes
            <div className="evenements-liste-container">
              <div className="selection-bar">
                <label className="select-all">
                  <input
                    type="checkbox"
                    checked={selectedEvenements.length === filteredEvenements.length && filteredEvenements.length > 0}
                    onChange={toggleSelectAll}
                    disabled={filteredEvenements.length === 0}
                  />
                  <span>Tout sélectionner ({filteredEvenements.length})</span>
                </label>
                {selectedEvenements.length > 0 && (
                  <span className="selected-count">
                    {selectedEvenements.length} sélectionné(s)
                  </span>
                )}
              </div>
              
              {filteredEvenements.length === 0 ? (
                <div className="gestion-empty">
                  <span className="empty-icon">📅</span>
                  <h3>Aucun événement trouvé</h3>
                  <p>Commencez par créer un nouvel événement</p>
                  <button className="btn-add empty-btn" onClick={handleAddEvenement}>
                    Créer un événement
                  </button>
                </div>
              ) : (
                <div className="evenements-liste">
                  {filteredEvenements.map((event) => (
                    <motion.div
                      key={event.id}
                      className={`evenement-liste-item ${selectedEvenements.includes(event.id) ? 'selected' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* ✅ Case à cocher toujours visible */}
                      <div className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedEvenements.includes(event.id)}
                          onChange={() => toggleSelectEvenement(event.id)}
                        />
                      </div>
                      
                      <div className="item-icon" style={{ background: TYPES_EVENEMENT.find(t => t.value === event.type_evenement)?.couleur || '#8B5CF6' }}>
                        {getTypeIcon(event.type_evenement)}
                      </div>
                      
                      <div className="item-content">
                        <div className="item-header">
                          <h3 className="item-titre">{event.titre}</h3>
                          <span className={`item-statut ${getStatutClass(event.statut)}`}>
                            {STATUTS_EVENEMENT.find(s => s.value === event.statut)?.label || event.statut}
                          </span>
                        </div>
                        
                        <div className="item-details">
                          <span className="detail-date">
                            📅 {formatDateFr(event.date_debut)}
                            {event.date_fin && ` → ${formatDateFr(event.date_fin)}`}
                          </span>
                          {event.lieu && (
                            <span className="detail-lieu">📍 {event.lieu}</span>
                          )}
                          {event.bien_nom && (
                            <span className="detail-bien">🏠 {event.bien_nom}</span>
                          )}
                          {event.locataire_nom && (
                            <span className="detail-locataire">
                              👤 {event.locataire_prenom} {event.locataire_nom}
                            </span>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="item-description">{event.description}</p>
                        )}
                      </div>
                      
                      <div className="item-actions">
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewEvenement(event)}
                          title="Voir détails"
                        >
                          👁️
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditEvenement(event)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteClick(event)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <CalendrierVue
              vue={vueActuelle}
              date={dateActuelle}
              evenements={filteredEvenements}
              onViewEvenement={handleViewEvenement}
              onEditEvenement={handleEditEvenement}
              onDeleteEvenement={handleDeleteClick}
            />
          )}
        </div>
      </div>

      {/* Modales */}
      <AnimatePresence>
        {showForm && (
          <EvenementForm
            evenement={selectedEvenement}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailModal && selectedEvenement && (
          <EvenementDetailModal
            evenement={selectedEvenement}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEditEvenement}
            onDelete={handleDeleteClick}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer l'événement"
        message={`Êtes-vous sûr de vouloir supprimer "${evenementToDelete?.titre}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setEvenementToDelete(null);
        }}
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={showMultipleDeleteConfirm}
        title="Supprimer plusieurs événements"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedEvenements.length} événement(s) ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer tous"
        cancelText="Annuler"
        onConfirm={handleMultipleDelete}
        onCancel={() => setShowMultipleDeleteConfirm(false)}
        isLoading={isDeletingMultiple}        
      />
    </div>
  );
}