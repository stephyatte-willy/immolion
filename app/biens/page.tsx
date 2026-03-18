'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import BienCard from '@/app/components/biens/BienCard';
import BienForm from '@/app/components/biens/BienForm';
import BienFilters from '@/app/components/biens/BienFilters';
import BienStats from '@/app/components/biens/BienStats';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { useTheme } from '@/app/providers/ThemeProvider';
import toast from 'react-hot-toast';
import './biens.css';

export interface Bien {
  id: number;
  proprietaire_id: number;
  nom: string;
  type_bien: string;
  statut: string;
  adresse: string;
  quartier?: string;
  commune: string;
  ville: string;
  district: string;
  pays: string;
  surface: number;
  pieces: number;
  etage?: number;
  description?: string;
  loyer_mensuel?: number;      // ✅ Optionnel
  charges?: number;             // ✅ Optionnel
  depot_garantie?: number;      // ✅ Optionnel
  prix_vente?: number;          // ✅ Nouveau champ
  date_acquisition?: string;
  latitude?: number;
  longitude?: number;
  photos?: { id: number; url: string; legende?: string; est_principale: boolean }[];
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bienToDelete, setBienToDelete] = useState<Bien | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    loues: 0,
    disponibles: 0,
    enVente: 0,
    revenusMensuels: 0
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
    const enVente = biensData.filter(b => b.statut === 'EN_VENTE').length;
    const revenusMensuels = biensData
      .filter(b => b.statut === 'LOUE' && b.loyer_mensuel)
      .reduce((sum, b) => sum + (b.loyer_mensuel || 0), 0);

    setStats({
      total,
      loues,
      disponibles,
      enVente,
      revenusMensuels
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
      const prixMin = parseInt(filters.prixMin);
      filtered = filtered.filter(b => {
        if (b.statut === 'EN_VENTE') {
          return (b.prix_vente || 0) >= prixMin;
        } else {
          return (b.loyer_mensuel || 0) >= prixMin;
        }
      });
    }

    if (filters.prixMax) {
      const prixMax = parseInt(filters.prixMax);
      filtered = filtered.filter(b => {
        if (b.statut === 'EN_VENTE') {
          return (b.prix_vente || 0) <= prixMax;
        } else {
          return (b.loyer_mensuel || 0) <= prixMax;
        }
      });
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
    router.push(`/biens/${id}`);
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
          sousTitre="Consultez et gérez votre patrimoine immobilier"
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
              types={['APPARTEMENT', 'MAISON', 'COMMERCIAL', 'TERRAIN', 'ENTREPOT', 'VILLA', 'STUDIO', 'BUREAU']}
              statuts={['DISPONIBLE', 'LOUE', 'EN_TRAVAUX', 'EN_VENTE', 'RESERVE']}
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
              <p>Commencez par ajouter votre premier bien immobilier</p>
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

      {/* Modale Formulaire */}
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

      {/* Modale de confirmation */}
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