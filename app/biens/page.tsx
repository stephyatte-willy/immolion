'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import BienCard from '@/app/components/biens/BienCard';
import BienForm from '@/app/components/biens/BienForm';
import BienFilters from '@/app/components/biens/BienFilters';
import BienStats from '@/app/components/biens/BienStats';
import BienDetailModal from '@/app/components/biens/BienDetailModal';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import ActionButtons from '@/app/components/common/ActionButtons';
import { ExportColumn } from '@/app/services/exportService';
import { useTheme } from '@/app/providers/ThemeProvider';
import toast from 'react-hot-toast';
import './biens.css';

export interface Bien {
  id: number;
  proprietaire_id: number;
  nom: string;
  adresse: string;
  quartier?: string;
  commune?: string;
  ville: string;
  district: string;
  pays: string;
  type_bien: string;
  statut: string;
  surface: number;
  pieces: number;
  etage?: number;
  description?: string;
  loyer_mensuel: number;
  charges: number;
  depot_garantie?: number;
  prix_vente?: number;
  date_acquisition?: string;
  latitude?: number;
  longitude?: number;
  photos?: { id: number; url: string; legende?: string; est_principale: boolean }[];
  locataire_actuel?: {
    id: number;
    nom: string;
    prenom: string;
  };
  nombre_lots?: number;
  lots?: any[];
  est_principal?: boolean;
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBienForDetail, setSelectedBienForDetail] = useState<Bien | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    loues: 0,
    disponibles: 0,
    enVente: 0,
    revenusMensuels: 0,
    tauxOccupation: 0
  });
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [vueActive, setVueActive] = useState<'grid' | 'list'>('grid');

  // ✅ États pour la sélection multiple
  const [selectedBiens, setSelectedBiens] = useState<number[]>([]);
  const [showMultipleDeleteConfirm, setShowMultipleDeleteConfirm] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  
  const router = useRouter();
  const { formatMoney } = useTheme();

  // Colonnes pour l'export Excel
  const exportColumns: ExportColumn[] = [
    { header: 'ID', key: 'id' },
    { header: 'Nom du bien', key: 'nom' },
    { header: 'Type', key: 'type_bien' },
    { header: 'Adresse', key: 'adresse' },
    { header: 'Quartier', key: 'quartier' },
    { header: 'Commune', key: 'commune' },
    { header: 'Ville', key: 'ville' },
    { header: 'District', key: 'district' },
    { header: 'Surface (m²)', key: 'surface' },
    { header: 'Pièces', key: 'pieces' },
    { header: 'Étage', key: 'etage', format: (v) => v ? v.toString() : '-' },
    { header: 'Statut', key: 'statut' },
    { header: 'Loyer mensuel', key: 'loyer_mensuel', format: (v) => formatMoney(v) },
    { header: 'Charges', key: 'charges', format: (v) => formatMoney(v) },
    { header: 'Dépôt garantie', key: 'depot_garantie', format: (v) => v ? formatMoney(v) : '-' },
    { header: 'Prix de vente', key: 'prix_vente', format: (v) => v ? formatMoney(v) : '-' },
    { header: 'Date acquisition', key: 'date_acquisition', format: (v) => v ? new Date(v).toLocaleDateString('fr-FR') : '-' },
    { header: 'Date création', key: 'created_at', format: (v) => new Date(v).toLocaleDateString('fr-FR') },
    { header: 'Locataire actuel', key: 'locataire_actuel', format: (v) => v ? `${v.prenom} ${v.nom}` : '-' }
  ];

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
        setSelectedBiens([]);
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
  
  // ✅ CORRECTION: S'assurer que la somme est un nombre valide
  const revenusMensuels = biensData
    .filter(b => b.statut === 'LOUE')
    .reduce((sum, b) => {
      const loyer = typeof b.loyer_mensuel === 'string' ? parseFloat(b.loyer_mensuel) : (b.loyer_mensuel || 0);
      return sum + (isNaN(loyer) ? 0 : loyer);
    }, 0);
    
  const tauxOccupation = total > 0 ? Math.round((loues / total) * 100) : 0;

  setStats({
    total,
    loues,
    disponibles,
    enVente,
    revenusMensuels,
    tauxOccupation
  });
};

// Ajouter ces états après les autres useState
const [sortConfig, setSortConfig] = useState<{
  key: string;
  direction: 'asc' | 'desc';
} | null>(null);

// Fonction de tri
const handleSort = (key: string) => {
  let direction: 'asc' | 'desc' = 'asc';
  
  if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }
  
  setSortConfig({ key, direction });
  
  const sorted = [...filteredBiens];
  
  sorted.sort((a, b) => {
    let aValue: any = a[key as keyof Bien];
    let bValue: any = b[key as keyof Bien];
    
    // Gestion spéciale pour certaines colonnes
    if (key === 'loyer_mensuel' || key === 'surface' || key === 'pieces') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    }
    
    if (key === 'locataire_actuel') {
      aValue = a.locataire_actuel ? `${a.locataire_actuel.prenom} ${a.locataire_actuel.nom}` : '';
      bValue = b.locataire_actuel ? `${b.locataire_actuel.prenom} ${b.locataire_actuel.nom}` : '';
    }
    
    if (key === 'type_bien') {
      const typeMap: Record<string, number> = {
        'APPARTEMENT': 1,
        'MAISON': 2,
        'VILLA': 3,
        'STUDIO': 4,
        'COMMERCIAL': 5,
        'TERRAIN': 6
      };
      aValue = typeMap[a.type_bien] || 99;
      bValue = typeMap[b.type_bien] || 99;
    }
    
    if (key === 'statut') {
      const statutMap: Record<string, number> = {
        'DISPONIBLE': 1,
        'LOUE': 2,
        'RESERVE': 3,
        'EN_TRAVAUX': 4,
        'EN_VENTE': 5
      };
      aValue = statutMap[a.statut] || 99;
      bValue = statutMap[b.statut] || 99;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return direction === 'asc'
      ? (aValue > bValue ? 1 : -1)
      : (bValue > aValue ? 1 : -1);
  });
  
  setFilteredBiens(sorted);
};

  const handleFilter = (filters: any) => {
    setCurrentFilters(filters);
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
    setSelectedBiens([]);
  };

  // ✅ Gestion de la sélection multiple
  const toggleSelectBien = (id: number) => {
    setSelectedBiens(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBiens.length === filteredBiens.length) {
      setSelectedBiens([]);
    } else {
      setSelectedBiens(filteredBiens.map(b => b.id));
    }
  };

  // ✅ Suppression multiple
  const handleMultipleDelete = async () => {
  if (selectedBiens.length === 0) return;
  
  setShowMultipleDeleteConfirm(false);
  setIsDeletingMultiple(true);
  
  try {
    const promises = selectedBiens.map(id => 
      fetch(`/api/biens/${id}`, { method: 'DELETE' })
    );
    
    const results = await Promise.all(promises);
    const allSuccess = results.every(res => res.ok);
    
    if (allSuccess) {
      toast.success(`${selectedBiens.length} bien(s) supprimé(s) avec succès`);
      chargerBiens();
    } else {
      toast.error('Erreur lors de la suppression de certains biens');
    }
  } catch (error) {
    console.error('❌ Erreur suppression multiple:', error);
    toast.error('Erreur lors de la suppression multiple');
  } finally {
    setIsDeletingMultiple(false);
  }
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

  const handleDeleteClick = (id: number) => {
    const bien = biens.find(b => b.id === id);
    if (bien) {
      setBienToDelete(bien);
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = async () => {
  if (!bienToDelete) return;
  
  setIsDeleting(true);
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
    setIsDeleting(false);
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
              types={['APPARTEMENT', 'MAISON', 'COMMERCIAL', 'PARKING', 'TERRAIN']}
              statuts={['DISPONIBLE', 'LOUE', 'EN_TRAVAUX', 'EN_VENTE', 'RESERVE']}
              districts={districts}
            />
            <ActionButtons
                data={filteredBiens}
                columns={exportColumns}
                titre="Liste des biens"
              /> 
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
                onClick={handleAddBien}
                title='Nouveau Bien'
              >
                <span className="btn-icon">➕</span>
                Nouveau
              </button>
            </div>

          {/* Liste des biens */}
          {isLoading ? (
            <div className="gestion-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des biens...</p>
            </div>
          ) : filteredBiens.length === 0 ? (
            <div className="gestion-empty">
              <div className="empty-icon">🏢</div>
              <h3>Aucun bien trouvé</h3>
              <p>Commencez par ajouter votre premier bien immobilier</p>
              <button 
                className="btn-add empty-btn"
                onClick={handleAddBien}
              >
                Ajouter un bien
              </button>
            </div>
          ) : vueActive === 'grid' ? (
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
          ) : (
            // ✅ Vue Liste avec cases à cocher et numérotation
            <div className="biens-liste-container">
              {/* Barre de sélection */}
              <div className="selection-bar">
                <label className="select-all">
                  <input
                    type="checkbox"
                    checked={selectedBiens.length === filteredBiens.length && filteredBiens.length > 0}
                    onChange={toggleSelectAll}
                    disabled={filteredBiens.length === 0}
                  />
                  <span>Tout sélectionner ({filteredBiens.length})</span>
                </label>
                {selectedBiens.length > 0 && (
                  <>
                    <span className="selected-count">
                      {selectedBiens.length} sélectionné(s)
                    </span>
                    <button 
                      className="btn-delete-selection"
                      onClick={() => setShowMultipleDeleteConfirm(true)}
                      title="Supprimer la sélection"
                      disabled={isDeletingMultiple}
                    >
                      <span className="btn-icon">🗑️</span>
                      Supprimer la sélection
                    </button>
                  </>
                )}
              </div>

              {/* Tableau des biens */}
              <div className="biens-table-container">
                <table className="biens-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedBiens.length === filteredBiens.length && filteredBiens.length > 0}
                          onChange={toggleSelectAll}
                          disabled={filteredBiens.length === 0}
                        />
                      </th>
                      <th style={{ width: '60px' }}>N°</th>
                      <th className={`sortable ${sortConfig?.key === 'nom' ? 'active' : ''}`} onClick={() => handleSort('nom')}>
                        Nom du bien
                        <span className="sort-icon">
                          {sortConfig?.key === 'nom' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'type_bien' ? 'active' : ''}`} onClick={() => handleSort('type_bien')}>
                        Type
                        <span className="sort-icon">
                          {sortConfig?.key === 'type_bien' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'adresse' ? 'active' : ''}`} onClick={() => handleSort('adresse')}>
                        Adresse
                        <span className="sort-icon">
                          {sortConfig?.key === 'adresse' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'ville' ? 'active' : ''}`} onClick={() => handleSort('ville')}>
                        Ville
                        <span className="sort-icon">
                          {sortConfig?.key === 'ville' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'surface' ? 'active' : ''}`} onClick={() => handleSort('surface')}>
                        Surface
                        <span className="sort-icon">
                          {sortConfig?.key === 'surface' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'pieces' ? 'active' : ''}`} onClick={() => handleSort('pieces')}>
                        Pièces
                        <span className="sort-icon">
                          {sortConfig?.key === 'pieces' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'loyer_mensuel' ? 'active' : ''}`} onClick={() => handleSort('loyer_mensuel')}>
                        Loyer mensuel
                        <span className="sort-icon">
                          {sortConfig?.key === 'loyer_mensuel' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'statut' ? 'active' : ''}`} onClick={() => handleSort('statut')}>
                        Statut
                        <span className="sort-icon">
                          {sortConfig?.key === 'statut' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'locataire_actuel' ? 'active' : ''}`} onClick={() => handleSort('locataire_actuel')}>
                        Locataire actuel
                        <span className="sort-icon">
                          {sortConfig?.key === 'locataire_actuel' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBiens.map((bien, index) => (
                      <tr key={bien.id} className={selectedBiens.includes(bien.id) ? 'selected-row' : ''}>
                        <td className="checkbox-cell">
                          <input
                            type="checkbox"
                            checked={selectedBiens.includes(bien.id)}
                            onChange={() => toggleSelectBien(bien.id)}
                          />
                        </td>
                        <td className="row-number">{index + 1}</td>
                        <td className="bien-nom">{bien.nom}</td>
                        <td>
                          <span className="type-badge">
                            {bien.type_bien === 'APPARTEMENT' ? 'Appartement' :
                            bien.type_bien === 'MAISON' ? 'Maison' :
                            bien.type_bien === 'VILLA' ? 'Villa' :
                            bien.type_bien === 'COMMERCIAL' ? 'Commercial' :
                            bien.type_bien === 'TERRAIN' ? 'Terrain' : bien.type_bien}
                          </span>
                        </td>
                        <td>{bien.adresse}, {bien.commune}</td>
                        <td>{bien.ville}</td>
                        <td>{bien.surface} m²</td>
                        <td>{bien.pieces}</td>
                        <td className="montant">{formatMoney(bien.loyer_mensuel)}</td>
                        <td>
                          <span className={`statut-badge ${bien.statut === 'LOUE' ? 'loue' : bien.statut === 'DISPONIBLE' ? 'disponible' : 'autre'}`}>
                            {bien.statut === 'LOUE' ? 'Loué' : 
                            bien.statut === 'DISPONIBLE' ? 'Disponible' :
                            bien.statut === 'EN_VENTE' ? 'En vente' :
                            bien.statut === 'EN_TRAVAUX' ? 'En travaux' : bien.statut}
                          </span>
                        </td>
                        <td>{bien.locataire_actuel ? `${bien.locataire_actuel.prenom} ${bien.locataire_actuel.nom}` : '-'}</td>
                        <td>
                          <div className="table-actions">
                            <button onClick={() => handleViewBien(bien.id)} title="Voir détails">👁️</button>
                            <button onClick={() => handleEditBien(bien)} title="Modifier">✏️</button>
                            <button onClick={() => handleDeleteClick(bien.id)} title="Supprimer">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Modale de détail du bien */}
      <AnimatePresence>
        {showDetailModal && selectedBienForDetail && (
          <BienDetailModal
            bien={selectedBienForDetail}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEditBien}
          />
        )}
      </AnimatePresence>

      {/* Modale de confirmation suppression simple */}
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
  isLoading={isDeleting}
/>

      {/* ✅ Modale de confirmation suppression multiple */}
      <ConfirmModal
  isOpen={showMultipleDeleteConfirm}
  title="Supprimer plusieurs biens"
  message={`Êtes-vous sûr de vouloir supprimer ${selectedBiens.length} bien(s) ? Cette action est irréversible.`}
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