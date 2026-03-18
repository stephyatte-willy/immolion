'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import BienCard from '@/app/components/biens/BienCard';
import BienForm from '@/app/components/biens/BienForm';
import BienDetailModal from '@/app/components/biens/BienDetailModal';
import BienFilters from '@/app/components/biens/BienFilters';
import BienStats from '@/app/components/biens/BienStats';
import { useTheme } from '@/app/providers/ThemeProvider';
import { DISTRICTS_CI, TYPES_BIENS_CI, STATUTS_BIENS_CI } from '@/app/types/ci';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import './biens.css';

export interface Bien {
  id: number;
  proprietaire_id: number;
  nom: string;
  adresse: string;
  quartier?: string;
  commune: string;
  ville: string;
  district: string;
  pays: string;  // ✅ Ajoutez cette ligne
  type_bien: string;
  statut: string;
  surface: number;
  pieces: number;
  etage?: number;
  description?: string;
  loyer_mensuel: number;
  charges: number;
  depot_garantie?: number;
  date_acquisition?: string;
  latitude?: number;
  longitude?: number;
  photos?: { id: number; url: string; legende?: string; est_principale: boolean | number }[];
  locataire_actuel?: {
    id: number;
    nom: string;
    prenom: string;
  };
  created_at: string;
}

export default function BiensPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [filteredBiens, setFilteredBiens] = useState<Bien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBien, setSelectedBien] = useState<Bien | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBienForDetail, setSelectedBienForDetail] = useState<Bien | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bienToDelete, setBienToDelete] = useState<Bien | null>(null);
  
  const [stats, setStats] = useState({
    total: 0,
    loues: 0,
    disponibles: 0,
    revenusMensuels: 0,
    tauxOccupation: 0
  });
  
  const router = useRouter();
  const { formatMoney } = useTheme();

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    setUtilisateur(JSON.parse(userStr));
    chargerBiens();
    chargerEntreprise();
  }, []);

  const chargerEntreprise = async () => {
    try {
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      if (data.success) setEntreprise(data.entreprise);
    } catch (error) {
      console.error('Erreur chargement entreprise:', error);
    }
  };

  const chargerBiens = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/biens');
      const data = await response.json();
      
      if (data.success) {
        setBiens(data.biens);
        setFilteredBiens(data.biens);
        calculerStats(data.biens);
      } else {
        toast.error('Erreur lors du chargement des biens');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const calculerStats = (biensData: Bien[]) => {
    const total = biensData.length;
    const loues = biensData.filter(b => b.statut === 'LOUE').length;
    const disponibles = biensData.filter(b => b.statut === 'DISPONIBLE').length;
    const revenusMensuels = biensData
      .filter(b => b.statut === 'LOUE')
      .reduce((sum, b) => sum + b.loyer_mensuel, 0);
    const tauxOccupation = total > 0 ? Math.round((loues / total) * 100) : 0;

    setStats({
      total,
      loues,
      disponibles,
      revenusMensuels,
      tauxOccupation
    });
  };

  const handleFilter = (filters: any) => {
    let filtered = [...biens];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(b => 
        b.nom.toLowerCase().includes(searchLower) ||
        b.ville.toLowerCase().includes(searchLower) ||
        b.commune?.toLowerCase().includes(searchLower) ||
        b.quartier?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type && filters.type !== 'TOUS') {
      filtered = filtered.filter(b => b.type_bien === filters.type);
    }

    if (filters.statut && filters.statut !== 'TOUS') {
      filtered = filtered.filter(b => b.statut === filters.statut);
    }

    if (filters.district) {
      filtered = filtered.filter(b => b.district === filters.district);
    }

    if (filters.prixMin) {
      filtered = filtered.filter(b => b.loyer_mensuel >= parseInt(filters.prixMin));
    }

    if (filters.prixMax) {
      filtered = filtered.filter(b => b.loyer_mensuel <= parseInt(filters.prixMax));
    }

    setFilteredBiens(filtered);
  };

  const handleAddBien = () => {
    setSelectedBien(null);
    setShowForm(true);
  };

  const handleEditBien = (bien: Bien) => {
    setSelectedBien(bien);
    setShowForm(true);
  };

  const handleViewBien = (id: number) => {
  const bien = biens.find(b => b.id === id);
  if (bien) {
    setSelectedBienForDetail(bien);
    setShowDetailModal(true);
  }
};

  const handleDeleteBien = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bien ?')) return;

    try {
      const response = await fetch(`/api/biens/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Bien supprimé avec succès');
        chargerBiens();
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteClick = (id: number) => {
  const bien = biens.find(b => b.id === id);
  if (bien) {
    setBienToDelete(bien);
    setShowDeleteConfirm(true);
  }
};

const handleConfirmDelete = async () => {
  if (!bienToDelete) return;
  
  try {
    const response = await fetch(`/api/biens/${bienToDelete.id}`, {
      method: 'DELETE'
    });
    const data = await response.json();

    if (data.success) {
      toast.success('Bien supprimé avec succès');
      chargerBiens();
    } else {
      toast.error(data.erreur || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur lors de la suppression');
  } finally {
    setShowDeleteConfirm(false);
    setBienToDelete(null);
  }
};


  const handleFormSuccess = () => {
    setShowForm(false);
    chargerBiens();
  };

  const districts = useMemo(() => {
    try {
      return biens.length > 0 
        ? Array.from(new Set(biens.map(b => b.district).filter(d => d && d.trim() !== '')))
        : [];
    } catch (error) {
      console.error('Erreur extraction districts:', error);
      return [];
    }
  }, [biens]);

  if (!utilisateur) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="biens-container">
      <Sidebar />
      
      <div className="biens-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Gestion des biens"
          sousTitre="Consultez et gérez votre patrimoine immobilier en Côte d'Ivoire"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="biens-content">
          {/* Statistiques */}
          <BienStats stats={stats} formatMoney={formatMoney} />

          {/* Barre d'actions */}
          <div className="biens-actions-bar">
            <BienFilters 
              onFilter={handleFilter}
              types={TYPES_BIENS_CI.map(t => t.value)}
              statuts={STATUTS_BIENS_CI.map(s => s.value)}
              districts={districts}
            />
            
            <button 
              className="btn-add-bien"
              onClick={handleAddBien}
            >
              <span className="btn-icon">➕</span>
              Nouveau bien
            </button>
          </div>

          {/* Liste des biens */}
          {isLoading ? (
            <div className="biens-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des biens...</p>
            </div>
          ) : filteredBiens.length === 0 ? (
            <div className="biens-empty">
              <div className="empty-icon">🏢</div>
              <h3>Aucun bien trouvé</h3>
              <p>Commencez par ajouter votre premier bien immobilier en Côte d'Ivoire</p>
              <button 
                className="btn-add-bien empty-btn"
                onClick={handleAddBien}
              >
                Ajouter un bien
              </button>
            </div>
          ) : (
            <div className="biens-grid">
              <AnimatePresence>
                {filteredBiens.map((bien) => (
                  <BienCard
                    key={bien.id}
                    bien={bien}
                    onView={handleViewBien}
                    onEdit={handleEditBien}
                    onDelete={handleDeleteClick}
                    formatMoney={formatMoney}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modal Formulaire */}
      <AnimatePresence>
        {showForm && (
          <BienForm
            bien={selectedBien}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
            utilisateurId={utilisateur.id}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailModal && selectedBienForDetail && (
          <BienDetailModal
            bien={selectedBienForDetail}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEditBien}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer le bien"
        message={`Êtes-vous sûr de vouloir supprimer "${bienToDelete?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setBienToDelete(null);
        }}
      />
    </div>
  );
}