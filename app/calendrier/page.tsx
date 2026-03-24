'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import CalendrierVue from '@/app/components/calendrier/CalendrierVue';
import EvenementForm from '@/app/components/calendrier/EvenementForm';
import EvenementDetailModal from '@/app/components/calendrier/EvenementDetailModal';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { useTheme } from '@/app/providers/ThemeProvider';
import { TYPES_EVENEMENT, STATUTS_EVENEMENT } from '@/app/types/calendrier';
import toast from 'react-hot-toast';
import './calendrier.css';

export default function CalendrierPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [evenements, setEvenements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvenement, setSelectedEvenement] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [evenementToDelete, setEvenementToDelete] = useState<any>(null);
  const [vueActuelle, setVueActuelle] = useState<'mois' | 'semaine' | 'jour'>('mois');
  const [dateActuelle, setDateActuelle] = useState(new Date());
  const [filtres, setFiltres] = useState({
    type: 'TOUS',
    statut: 'TOUS'
  });
  
  const router = useRouter();
  const { formatDate } = useTheme();

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
      
      // Ajouter les filtres
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

  // Appliquer les filtres après changement
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
              </div>
              
              <div className="date-navigation">
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
              </div>
              
              <button 
                className="btn-add"
                onClick={handleAddEvenement}
              >
                <span className="btn-icon">➕</span>
                Nouvel événement
              </button>
            </div>
          </div>

          {/* Vue calendrier */}
          {isLoading ? (
            <div className="calendrier-loading">
              <div className="loading-spinner"></div>
              <p>Chargement du calendrier...</p>
            </div>
          ) : (
            <CalendrierVue
              vue={vueActuelle}
              date={dateActuelle}
              evenements={evenements}
              onViewEvenement={handleViewEvenement}
              onEditEvenement={handleEditEvenement}
              onDeleteEvenement={handleDeleteClick}
            />
          )}
        </div>
      </div>

      {/* Modale Formulaire */}
      <AnimatePresence>
        {showForm && (
          <EvenementForm
            evenement={selectedEvenement}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>

      {/* Modale Détail */}
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

      {/* Modale de confirmation */}
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
      />
    </div>
  );
}