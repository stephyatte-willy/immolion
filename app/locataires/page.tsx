'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import LocataireCard from '@/app/components/locataires/LocataireCard';
import LocataireForm from '@/app/components/locataires/LocataireForm';
import LocataireFilters from '@/app/components/locataires/LocataireFilters';
import LocataireDetailModal from '@/app/components/locataires/LocataireDetailModal';
import LocataireStats from '@/app/components/locataires/LocataireStats';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { useTheme } from '@/app/providers/ThemeProvider'; // ✅ Pour formatDate
import { useFormatMoney } from '@/app/hooks/useFormatMoney'; // ✅ Pour formatMoney
import { STATUTS_LOCATAIRE } from '@/app/types/locataires';
import toast from 'react-hot-toast';
import './locataires.css';

interface Locataire {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statut: string;
  bien_actuel?: {
    id: number;
    nom: string;
    statut: string; // ✅ Ajout du statut du bien
  };
  impayes?: number;
  created_at: string;
}

export default function LocatairesPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [filteredLocataires, setFilteredLocataires] = useState<Locataire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLocataire, setSelectedLocataire] = useState<Locataire | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locataireToDelete, setLocataireToDelete] = useState<Locataire | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLocataireForDetail, setSelectedLocataireForDetail] = useState<any>(null);

  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    prospects: 0,
    impayes: 0
  });
  
  const router = useRouter();
  const { formatDate } = useTheme(); // Gardé pour les dates
  const { formatMoney } = useFormatMoney(); // ✅ Nouveau hook pour l'argent

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    setUtilisateur(JSON.parse(userStr));
    chargerLocataires();
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

  const chargerLocataires = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/locataires');
      const data = await response.json();
      
      if (data.success) {
        setLocataires(data.locataires);
        setFilteredLocataires(data.locataires);
        calculerStats(data.locataires);
      } else {
        toast.error('Erreur lors du chargement des locataires');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const calculerStats = (data: Locataire[]) => {
    const total = data.length;
    const actifs = data.filter(l => l.statut === 'ACTIF').length;
    const prospects = data.filter(l => l.statut === 'PROSPECT').length;
    const impayes = data.filter(l => l.impayes && l.impayes > 0).length;

    setStats({ total, actifs, prospects, impayes });
  };

// Dans la fonction handleFilter, ajoutez le filtrage par statut du bien

const handleFilter = (filters: any) => {
  let filtered = [...locataires];

  // Filtre par recherche textuelle
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(l => 
      l.nom.toLowerCase().includes(searchLower) ||
      l.prenom.toLowerCase().includes(searchLower) ||
      l.email.toLowerCase().includes(searchLower) ||
      l.telephone.includes(filters.search)
    );
  }

  // Filtre par statut du locataire
  if (filters.statut && filters.statut !== 'TOUS') {
    filtered = filtered.filter(l => l.statut === filters.statut);
  }

  // ✅ Filtre par statut du bien
  if (filters.statutBien && filters.statutBien !== 'TOUS') {
    filtered = filtered.filter(l => {
      // Si le locataire a un bien et que son statut correspond
      return l.bien_actuel && l.bien_actuel.statut === filters.statutBien;
    });
  }

  // Filtre par présence de logement
  if (filters.hasBien === 'oui') {
    filtered = filtered.filter(l => l.bien_actuel);
  } else if (filters.hasBien === 'non') {
    filtered = filtered.filter(l => !l.bien_actuel);
  }

  setFilteredLocataires(filtered);
};

  const handleAddLocataire = () => {
    setSelectedLocataire(null);
    setShowForm(true);
  };

  const handleEditLocataire = (locataire: Locataire) => {
    setSelectedLocataire(locataire);
    setShowForm(true);
  };

  const handleViewLocataire = (id: number) => {
    const locataire = locataires.find(l => l.id === id);
    if (locataire) {
        setSelectedLocataireForDetail(locataire);
        setShowDetailModal(true);
    }
    };

  const handleDeleteClick = (locataire: Locataire) => {
    setLocataireToDelete(locataire);
    setShowDeleteConfirm(true);
  };

  const refreshLocataires = () => {
  chargerLocataires(); // Recharge la liste des locataires
};

  const handleConfirmDelete = async () => {
    if (!locataireToDelete) return;

    try {
      const response = await fetch(`/api/locataires/${locataireToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Locataire supprimé avec succès');
        chargerLocataires();
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setShowDeleteConfirm(false);
      setLocataireToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    chargerLocataires();
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
    <div className="locataires-container">
      <Sidebar />
      
      <div className="locataires-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Gestion des locataires"
          sousTitre="Consultez et gérez vos locataires"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="locataires-content">
          {/* Statistiques */}
          <LocataireStats stats={stats} />

          {/* Barre d'actions */}
          <div className="locataires-actions-bar">
            <LocataireFilters onFilter={handleFilter} />
            
            <button 
              className="btn-add"
              onClick={handleAddLocataire}
            >
              <span className="btn-icon">➕</span>
              Nouveau locataire
            </button>
          </div>

          {/* Liste des locataires */}
          {isLoading ? (
            <div className="locataires-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des locataires...</p>
            </div>
          ) : filteredLocataires.length === 0 ? (
            <div className="locataires-empty">
              <div className="empty-icon">👥</div>
              <h3>Aucun locataire trouvé</h3>
              <p>Commencez par ajouter votre premier locataire</p>
              <button 
                className="btn-add-locataire empty-btn"
                onClick={handleAddLocataire}
              >
                Ajouter un locataire
              </button>
            </div>
          ) : (
            <div className="locataires-grid">
              <AnimatePresence>
                {filteredLocataires.map((locataire) => (
                  <LocataireCard
                    key={locataire.id}
                    locataire={locataire}
                    onView={handleViewLocataire}
                    onEdit={handleEditLocataire}
                    onDelete={handleDeleteClick}
                    formatMoney={formatMoney} // ✅ Passer formatMoney à la carte
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
          <LocataireForm
            locataire={selectedLocataire}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
  {showDetailModal && selectedLocataireForDetail && (
    <LocataireDetailModal
      locataire={selectedLocataireForDetail}
      onClose={() => setShowDetailModal(false)}
      onEdit={handleEditLocataire}
    />
  )}
</AnimatePresence>

      {/* Modale de confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer le locataire"
        message={`Êtes-vous sûr de vouloir supprimer ${locataireToDelete?.prenom} ${locataireToDelete?.nom} ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setLocataireToDelete(null);
        }}
      />
    </div>
  );
}