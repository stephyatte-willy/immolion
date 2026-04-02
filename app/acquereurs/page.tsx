'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import AcquereurCard from '@/app/components/acquereurs/AcquereurCard';
import AcquereurForm from '@/app/components/acquereurs/AcquereurForm';
import AcquereurFilters from '@/app/components/acquereurs/AcquereurFilters';
import AcquereurStats from '@/app/components/acquereurs/AcquereurStats';
import AcquereurDetailModal from '@/app/components/acquereurs/AcquereurDetailModal';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { useTheme } from '@/app/providers/ThemeProvider';
import { TYPES_ACQUEREUR, STATUTS_ACQUEREUR } from '@/app/types/acquereurs';
import toast from 'react-hot-toast';
import './acquereurs.css';

interface Acquereur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  type_acquereur: string;
  actif: boolean;
  contrats?: any[];
  created_at: string;
}

export default function AcquereursPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [acquereurs, setAcquereurs] = useState<Acquereur[]>([]);
  const [filteredAcquereurs, setFilteredAcquereurs] = useState<Acquereur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAcquereur, setSelectedAcquereur] = useState<Acquereur | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [acquereurToDelete, setAcquereurToDelete] = useState<Acquereur | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAcquereurForDetail, setSelectedAcquereurForDetail] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    particuliers: 0,
    societes: 0,
    agences: 0,
    actifs: 0,
    contratsTotal: 0
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
    chargerAcquereurs();
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

  const chargerAcquereurs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/acquereurs');
      const data = await response.json();
      
      if (data.success) {
        setAcquereurs(data.acquereurs);
        setFilteredAcquereurs(data.acquereurs);
        calculerStats(data.acquereurs);
      } else {
        toast.error('Erreur lors du chargement des acquéreurs');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const calculerStats = (data: Acquereur[]) => {
    const total = data.length;
    const particuliers = data.filter(a => a.type_acquereur === 'PARTICULIER').length;
    const societes = data.filter(a => a.type_acquereur === 'SOCIETE').length;
    const agences = data.filter(a => a.type_acquereur === 'AGENCE').length;
    const actifs = data.filter(a => a.actif).length;
    const contratsTotal = data.reduce((sum, a) => sum + (a.contrats?.length || 0), 0);

    setStats({
      total,
      particuliers,
      societes,
      agences,
      actifs,
      contratsTotal
    });
  };

  const handleFilter = (filters: any) => {
    let filtered = [...acquereurs];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(a => 
        `${a.prenom} ${a.nom}`.toLowerCase().includes(searchLower) ||
        a.email.toLowerCase().includes(searchLower) ||
        a.telephone?.includes(filters.search)
      );
    }

    if (filters.type && filters.type !== 'TOUS') {
      filtered = filtered.filter(a => a.type_acquereur === filters.type);
    }

    if (filters.statut && filters.statut !== 'TOUS') {
      filtered = filtered.filter(a => a.actif === (filters.statut === 'ACTIF'));
    }

    setFilteredAcquereurs(filtered);
  };

  const handleAddAcquereur = () => {
    setSelectedAcquereur(null);
    setShowForm(true);
  };

  const handleEditAcquereur = (acquereur: Acquereur) => {
    setSelectedAcquereur(acquereur);
    setShowForm(true);
  };

  // ✅ Correction: handleViewAcquereur pour ouvrir la modale
  const handleViewAcquereur = (id: number) => {
    const acquereur = acquereurs.find(a => a.id === id);
    if (acquereur) {
      setSelectedAcquereurForDetail(acquereur);
      setShowDetailModal(true);
    }
  };

  const handleDeleteClick = (acquereur: Acquereur) => {
    setAcquereurToDelete(acquereur);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!acquereurToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/acquereurs/${acquereurToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Acquéreur supprimé avec succès');
        chargerAcquereurs();
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setAcquereurToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    chargerAcquereurs();
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
    <div className="acquereurs-container">
      <Sidebar />
      
      <div className="acquereurs-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Gestion des acquéreurs"
          sousTitre="Suivez et gérez vos clients acquéreurs"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="acquereurs-content">
          <AcquereurStats stats={stats} />

          <div className="acquereurs-actions-bar">
            <AcquereurFilters onFilter={handleFilter} />
            
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
                onClick={handleAddAcquereur}
              >
                <span className="btn-icon">➕</span>
                Nouvel acquéreur
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="gestion-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des acquéreurs...</p>
            </div>
          ) : filteredAcquereurs.length === 0 ? (
            <div className="gestion-empty">
              <div className="empty-icon">🤝</div>
              <h3>Aucun acquéreur trouvé</h3>
              <p>Commencez par ajouter un acquéreur</p>
              <button 
                className="btn-add empty-btn"
                onClick={handleAddAcquereur}
              >
                Ajouter un acquéreur
              </button>
            </div>
          ) : vueActive === 'grid' ? (
            <div className="acquereurs-grid">
              <AnimatePresence>
                {filteredAcquereurs.map((acquereur) => (
                  <AcquereurCard
                    key={acquereur.id}
                    acquereur={acquereur}
                    onView={handleViewAcquereur}
                    onEdit={handleEditAcquereur}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="acquereurs-table-container">
              <table className="acquereurs-table">
                <thead>
                  <tr>
                    <th>Acquéreur</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Contrats</th>
                    <th>Statut</th>
                    <th>Date création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAcquereurs.map((a) => (
                    <tr key={a.id}>
                      <td className="acquereur-cell">
                        <div className="acquereur-info">
                          <div className="acquereur-avatar-small">
                            {a.prenom?.[0]}{a.nom?.[0]}
                          </div>
                          <div>
                            <div className="acquereur-nom">{a.prenom} {a.nom}</div>
                            <div className="acquereur-email">{a.email}</div>
                          </div>
                        </div>
                       </td>
                      <td>{a.telephone || '-'}</td>
                      <td>
                        <span className={`type-badge ${a.type_acquereur.toLowerCase()}`}>
                          {a.type_acquereur === 'PARTICULIER' && '👤 Particulier'}
                          {a.type_acquereur === 'SOCIETE' && '🏢 Société'}
                          {a.type_acquereur === 'AGENCE' && '🏪 Agence'}
                        </span>
                       </td>
                      <td className="contrats-count">
                        <span className="count-badge">{a.contrats?.length || 0}</span>
                       </td>
                      <td>
                        <span className={`status-badge ${a.actif ? 'actif' : 'inactif'}`}>
                          {a.actif ? 'Actif' : 'Inactif'}
                        </span>
                       </td>
                      <td>{formatDate(a.created_at)}</td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => handleViewAcquereur(a.id)} title="Voir">👁️</button>
                          <button onClick={() => handleEditAcquereur(a)} title="Modifier">✏️</button>
                          <button onClick={() => handleDeleteClick(a)} title="Supprimer">🗑️</button>
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

      {/* Modale Formulaire */}
      <AnimatePresence>
        {showForm && (
          <AcquereurForm
            acquereur={selectedAcquereur}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>

      {/* Modale Détail */}
      <AnimatePresence>
        {showDetailModal && selectedAcquereurForDetail && (
          <AcquereurDetailModal
            acquereur={selectedAcquereurForDetail}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEditAcquereur}
          />
        )}
      </AnimatePresence>

      {/* Modale de confirmation suppression */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer l'acquéreur"
        message={`Êtes-vous sûr de vouloir supprimer "${acquereurToDelete?.prenom} ${acquereurToDelete?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setAcquereurToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}