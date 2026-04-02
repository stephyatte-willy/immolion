'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import ProprietaireCard from '@/app/components/proprietaires/ProprietaireCard';
import ProprietaireForm from '@/app/components/proprietaires/ProprietaireForm';
import ProprietaireFilters from '@/app/components/proprietaires/ProprietaireFilters';
import ProprietaireStats from '@/app/components/proprietaires/ProprietaireStats';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { useTheme } from '@/app/providers/ThemeProvider';
import ProprietaireDetailModal from '@/app/components/proprietaires/ProprietaireDetailModal';
import { TYPES_PROPRIETAIRE } from '@/app/types/proprietaires';
import toast from 'react-hot-toast';
import './proprietaires.css';

interface Proprietaire {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  type: string;
  actif: boolean;
  biens?: any[];
  created_at: string;
}

export default function ProprietairesPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([]);
  const [filteredProprietaires, setFilteredProprietaires] = useState<Proprietaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProprietaire, setSelectedProprietaire] = useState<Proprietaire | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [proprietaireToDelete, setProprietaireToDelete] = useState<Proprietaire | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProprietaireForDetail, setSelectedProprietaireForDetail] = useState<any>(null);
 
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    particuliers: 0,
    societes: 0,
    agences: 0,
    actifs: 0,
    biensTotal: 0
  });
  const [vueActive, setVueActive] = useState<'grid' | 'list'>('grid');
  const router = useRouter();
  const { formatDate } = useTheme();

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    setUtilisateur(JSON.parse(userStr));
    chargerProprietaires();
    chargerEntreprise();
  }, []);

  const handleViewProprietaire = (id: number) => {
  const proprietaire = proprietaires.find(p => p.id === id);
  if (proprietaire) {
    setSelectedProprietaireForDetail(proprietaire);
    setShowDetailModal(true);
  }
};

  const chargerEntreprise = async () => {
    try {
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      if (data.success) setEntreprise(data.entreprise);
    } catch (error) {
      console.error('❌ Erreur chargement entreprise:', error);
    }
  };

  const chargerProprietaires = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/proprietaires');
      const data = await response.json();
      
      if (data.success) {
        setProprietaires(data.proprietaires);
        setFilteredProprietaires(data.proprietaires);
        calculerStats(data.proprietaires);
      } else {
        toast.error('Erreur lors du chargement des propriétaires');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const calculerStats = (data: Proprietaire[]) => {
    const total = data.length;
    const particuliers = data.filter(p => p.type === 'PARTICULIER').length;
    const societes = data.filter(p => p.type === 'SOCIETE').length;
    const agences = data.filter(p => p.type === 'AGENCE').length;
    const actifs = data.filter(p => p.actif).length;
    const biensTotal = data.reduce((sum, p) => sum + (p.biens?.length || 0), 0);

    setStats({
      total,
      particuliers,
      societes,
      agences,
      actifs,
      biensTotal
    });
  };

  const handleFilter = (filters: any) => {
    let filtered = [...proprietaires];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        `${p.prenom} ${p.nom}`.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower) ||
        p.telephone?.includes(filters.search)
      );
    }

    if (filters.type && filters.type !== 'TOUS') {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    if (filters.statut && filters.statut !== 'TOUS') {
      filtered = filtered.filter(p => p.actif === (filters.statut === 'ACTIF'));
    }

    setFilteredProprietaires(filtered);
  };

  const handleAddProprietaire = () => {
    setSelectedProprietaire(null);
    setShowForm(true);
  };

  const handleEditProprietaire = (proprietaire: Proprietaire) => {
    setSelectedProprietaire(proprietaire);
    setShowForm(true);
  };

  const handleDeleteClick = (proprietaire: Proprietaire) => {
    setProprietaireToDelete(proprietaire);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!proprietaireToDelete) return;

    try {
      const response = await fetch(`/api/proprietaires/${proprietaireToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Propriétaire supprimé avec succès');
        chargerProprietaires();
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setShowDeleteConfirm(false);
      setProprietaireToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    chargerProprietaires();
  };

  if (!utilisateur) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="proprietaires-container">
      <Sidebar />
      
      <div className="proprietaires-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Gestion des propriétaires"
          sousTitre="Gérez les propriétaires et leurs biens immobiliers"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="proprietaires-content">
          <ProprietaireStats stats={stats} />

          <div className="proprietaires-actions-bar">
            <ProprietaireFilters onFilter={handleFilter} />
            
            <div className="actions-right">
              <div className="vue-selector">
                <button 
                  className={`vue-btn ${vueActive === 'grid' ? 'active' : ''}`}
                  onClick={() => setVueActive('grid')}
                  title="Vue grille"
                >
                  <span className="vue-icon">📇</span>
                </button>
                <button 
                  className={`vue-btn ${vueActive === 'list' ? 'active' : ''}`}
                  onClick={() => setVueActive('list')}
                  title="Vue liste"
                >
                  <span className="vue-icon">📋</span>
                </button>
              </div>
              
              <button 
                className="btn-add"
                onClick={handleAddProprietaire}
              >
                <span className="btn-icon">➕</span>
                Nouveau propriétaire
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="gestion-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des propriétaires...</p>
            </div>
          ) : filteredProprietaires.length === 0 ? (
            <div className="gestion-empty">
              <div className="empty-icon">🤵</div>
              <h3>Aucun propriétaire trouvé</h3>
              <p>Commencez par ajouter un propriétaire</p>
              <button 
                className="btn-add empty-btn"
                onClick={handleAddProprietaire}
              >
                Ajouter un propriétaire
              </button>
            </div>
          ) : vueActive === 'grid' ? (
            <div className="proprietaires-grid">
              <AnimatePresence>
                {filteredProprietaires.map((proprietaire) => (
                  <ProprietaireCard
                    key={proprietaire.id}
                    proprietaire={proprietaire}
                    onView={handleViewProprietaire}
                    onEdit={handleEditProprietaire}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="proprietaires-table-container">
              <table className="proprietaires-table">
                <thead>
                  <tr>
                    <th>Propriétaire</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Biens</th>
                    <th>Statut</th>
                    <th>Date création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProprietaires.map((p) => (
                    <tr key={p.id}>
                      <td className="proprietaire-cell">
                        <div className="proprietaire-info">
                          <div className="proprietaire-avatar-small">
                            {p.prenom?.[0]}{p.nom?.[0]}
                          </div>
                          <div>
                            <div className="proprietaire-nom">{p.prenom} {p.nom}</div>
                            <div className="proprietaire-email">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.telephone || '-'}</td>
                      <td>
                        <span className={`type-badge ${p.type.toLowerCase()}`}>
                          {p.type === 'PARTICULIER' && '👤 Particulier'}
                          {p.type === 'SOCIETE' && '🏢 Société'}
                          {p.type === 'AGENCE' && '🏪 Agence'}
                        </span>
                      </td>
                      <td className="biens-count">
                        <span className="count-badge">{p.biens?.length || 0}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${p.actif ? 'actif' : 'inactif'}`}>
                          {p.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>{formatDate(p.created_at)}</td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => handleViewProprietaire(p.id)} title="Voir">👁️</button>
                          <button onClick={() => handleEditProprietaire(p)} title="Modifier">✏️</button>
                          <button onClick={() => handleDeleteClick(p)} title="Supprimer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <ProprietaireForm
            proprietaire={selectedProprietaire}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
    {showDetailModal && selectedProprietaireForDetail && (
        <ProprietaireDetailModal
        proprietaire={selectedProprietaireForDetail}
        onClose={() => setShowDetailModal(false)}
        onEdit={handleEditProprietaire}
        onAddBien={handleEditProprietaire}
        />
    )}
    </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer le propriétaire"
        message={`Êtes-vous sûr de vouloir supprimer "${proprietaireToDelete?.prenom} ${proprietaireToDelete?.nom}" ? Les biens associés ne seront pas supprimés.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setProprietaireToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}