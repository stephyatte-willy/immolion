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
import ActionButtons from '@/app/components/common/ActionButtons';
import { ExportColumn } from '@/app/services/exportService';
import { useTheme } from '@/app/providers/ThemeProvider';
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
    statut: string;
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
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [vueActive, setVueActive] = useState<'grid' | 'list'>('grid');

  // États pour la sélection multiple
  const [selectedLocataires, setSelectedLocataires] = useState<number[]>([]);
  const [showMultipleDeleteConfirm, setShowMultipleDeleteConfirm] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // ✅ État pour le tri
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    prospects: 0,
    impayes: 0
  });
  
  const router = useRouter();
  const { formatDate, formatMoney } = useTheme();

  // Colonnes pour l'export Excel
  const exportColumns: ExportColumn[] = [
    { header: 'ID', key: 'id' },
    { header: 'Prénom', key: 'prenom' },
    { header: 'Nom', key: 'nom' },
    { header: 'Email', key: 'email' },
    { header: 'Téléphone', key: 'telephone' },
    { header: 'Statut', key: 'statut' },
    { header: 'Bien actuel', key: 'bien_actuel', format: (v) => v ? v.nom : '-' },
    { header: 'Statut du bien', key: 'bien_actuel', format: (v) => v ? v.statut : '-' },
    { header: 'Impayés', key: 'impayes', format: (v) => v ? v.toString() : '0' },
    { header: 'Date d\'inscription', key: 'created_at', format: (v) => new Date(v).toLocaleDateString('fr-FR') }
  ];

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
        setSelectedLocataires([]);
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

  const handleFilter = (filters: any) => {
    setCurrentFilters(filters);
    let filtered = [...locataires];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(l => 
        l.nom.toLowerCase().includes(searchLower) ||
        l.prenom.toLowerCase().includes(searchLower) ||
        l.email.toLowerCase().includes(searchLower) ||
        l.telephone.includes(filters.search)
      );
    }

    if (filters.statut && filters.statut !== 'TOUS') {
      filtered = filtered.filter(l => l.statut === filters.statut);
    }

    if (filters.statutBien && filters.statutBien !== 'TOUS') {
      filtered = filtered.filter(l => {
        return l.bien_actuel && l.bien_actuel.statut === filters.statutBien;
      });
    }

    if (filters.hasBien === 'oui') {
      filtered = filtered.filter(l => l.bien_actuel);
    } else if (filters.hasBien === 'non') {
      filtered = filtered.filter(l => !l.bien_actuel);
    }

    setFilteredLocataires(filtered);
    setSelectedLocataires([]);
  };

  // ✅ Fonction de tri
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
    
    const sorted = [...filteredLocataires];
    
    sorted.sort((a, b) => {
      let aValue: any = a[key as keyof Locataire];
      let bValue: any = b[key as keyof Locataire];
      
      // Gestion spéciale pour certaines colonnes
      if (key === 'bien_actuel') {
        aValue = a.bien_actuel?.nom || '';
        bValue = b.bien_actuel?.nom || '';
      }
      
      if (key === 'impayes') {
        aValue = a.impayes || 0;
        bValue = b.impayes || 0;
      }
      
      if (key === 'statut') {
        const statutMap: Record<string, number> = {
          'ACTIF': 1,
          'PROSPECT': 2,
          'INACTIF': 3
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
    
    setFilteredLocataires(sorted);
  };

  // Gestion de la sélection multiple
  const toggleSelectLocataire = (id: number) => {
    setSelectedLocataires(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLocataires.length === filteredLocataires.length) {
      setSelectedLocataires([]);
    } else {
      setSelectedLocataires(filteredLocataires.map(l => l.id));
    }
  };

  // Suppression multiple
  const handleMultipleDelete = async () => {
    if (selectedLocataires.length === 0) return;
    
    setShowMultipleDeleteConfirm(false);
    setIsDeletingMultiple(true);
    
    try {
      const promises = selectedLocataires.map(id => 
        fetch(`/api/locataires/${id}`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res.ok);
      
      if (allSuccess) {
        toast.success(`${selectedLocataires.length} locataire(s) supprimé(s) avec succès`);
        chargerLocataires();
      } else {
        toast.error('Erreur lors de la suppression de certains locataires');
      }
    } catch (error) {
      console.error('❌ Erreur suppression multiple:', error);
      toast.error('Erreur lors de la suppression multiple');
    } finally {
      setIsDeletingMultiple(false);
    }
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
            
            <div className="actions-right">
              <ActionButtons
                data={filteredLocataires}
                columns={exportColumns}
                titre="Liste des locataires"
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
                onClick={handleAddLocataire}
                title='Nouveau Locataire'
              >
                <span className="btn-icon">➕</span>
                Nouveau
              </button>
            </div>
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
                className="btn-add empty-btn"
                onClick={handleAddLocataire}
              >
                Ajouter un locataire
              </button>
            </div>
          ) : vueActive === 'grid' ? (
            <div className="locataires-grid">
              <AnimatePresence>
                {filteredLocataires.map((locataire) => (
                  <LocataireCard
                    key={locataire.id}
                    locataire={locataire}
                    onView={handleViewLocataire}
                    onEdit={handleEditLocataire}
                    onDelete={handleDeleteClick}
                    formatMoney={formatMoney}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            // Vue Liste avec cases à cocher, numérotation et tri
            <div className="locataires-liste-container">
              {/* Barre de sélection */}
              <div className="selection-bar">
                <label className="select-all">
                  <input
                    type="checkbox"
                    checked={selectedLocataires.length === filteredLocataires.length && filteredLocataires.length > 0}
                    onChange={toggleSelectAll}
                    disabled={filteredLocataires.length === 0}
                  />
                  <span>Tout sélectionner ({filteredLocataires.length})</span>
                </label>
                {selectedLocataires.length > 0 && (
                  <>
                    <span className="selected-count">
                      {selectedLocataires.length} sélectionné(s)
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

              {/* Tableau des locataires avec tri */}
              <div className="locataires-table-container">
                <table className="locataires-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedLocataires.length === filteredLocataires.length && filteredLocataires.length > 0}
                          onChange={toggleSelectAll}
                          disabled={filteredLocataires.length === 0}
                        />
                      </th>
                      <th style={{ width: '60px' }}>N°</th>
                      <th className={`sortable ${sortConfig?.key === 'nom' ? 'active' : ''}`} onClick={() => handleSort('nom')}>
                        Nom
                        <span className="sort-icon">
                          {sortConfig?.key === 'nom' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'prenom' ? 'active' : ''}`} onClick={() => handleSort('prenom')}>
                        Prénom
                        <span className="sort-icon">
                          {sortConfig?.key === 'prenom' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'email' ? 'active' : ''}`} onClick={() => handleSort('email')}>
                        Email
                        <span className="sort-icon">
                          {sortConfig?.key === 'email' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'telephone' ? 'active' : ''}`} onClick={() => handleSort('telephone')}>
                        Téléphone
                        <span className="sort-icon">
                          {sortConfig?.key === 'telephone' ? (
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
                      <th className={`sortable ${sortConfig?.key === 'bien_actuel' ? 'active' : ''}`} onClick={() => handleSort('bien_actuel')}>
                        Bien actuel
                        <span className="sort-icon">
                          {sortConfig?.key === 'bien_actuel' ? (
                            sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          ) : (
                            ' ↕️'
                          )}
                        </span>
                      </th>
                      <th className={`sortable ${sortConfig?.key === 'impayes' ? 'active' : ''}`} onClick={() => handleSort('impayes')}>
                        Impayés
                        <span className="sort-icon">
                          {sortConfig?.key === 'impayes' ? (
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
                    {filteredLocataires.map((loc, index) => (
                      <tr key={loc.id} className={selectedLocataires.includes(loc.id) ? 'selected-row' : ''}>
                        <td className="checkbox-cell">
                          <input
                            type="checkbox"
                            checked={selectedLocataires.includes(loc.id)}
                            onChange={() => toggleSelectLocataire(loc.id)}
                          />
                        </td>
                        <td className="row-number">{index + 1}</td>
                        <td>{loc.nom}</td>
                        <td>{loc.prenom}</td>
                        <td>{loc.email}</td>
                        <td>{loc.telephone}</td>
                        <td>
                          <span className={`statut-badge ${loc.statut === 'ACTIF' ? 'actif' : loc.statut === 'PROSPECT' ? 'prospect' : 'inactif'}`}>
                            {loc.statut === 'ACTIF' ? 'Actif' : loc.statut === 'PROSPECT' ? 'Prospect' : 'Inactif'}
                          </span>
                        </td>
                        <td>{loc.bien_actuel?.nom || '-'}</td>
                        <td>{loc.impayes && loc.impayes > 0 ? `${loc.impayes} ⚠️` : '-'}</td>
                        <td>
                          <div className="table-actions">
                            <button onClick={() => handleViewLocataire(loc.id)} title="Voir détails">👁️</button>
                            <button onClick={() => handleEditLocataire(loc)} title="Modifier">✏️</button>
                            <button onClick={() => handleDeleteClick(loc)} title="Supprimer">🗑️</button>
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

      {/* Modale de confirmation suppression simple */}
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

      {/* Modale de confirmation suppression multiple */}
      <ConfirmModal
        isOpen={showMultipleDeleteConfirm}
        title="Supprimer plusieurs locataires"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedLocataires.length} locataire(s) ? Cette action est irréversible.`}
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