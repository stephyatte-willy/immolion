'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import PaiementForm from '@/app/components/paiements/PaiementForm';
import PaiementVenteForm from '@/app/components/paiements/PaiementVenteForm';
import PaiementCard from '@/app/components/paiements/PaiementCard';
import PaiementFilters from '@/app/components/paiements/PaiementFilters';
import PaiementStats from '@/app/components/paiements/PaiementStats';
import PaiementsOverview from '@/app/components/paiements/PaiementsOverview';
import VueSelector from '@/app/components/paiements/VueSelector';
import ActionButtons from '@/app/components/common/ActionButtons';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { ExportColumn } from '@/app/services/exportService';
import { useTheme } from '@/app/providers/ThemeProvider';
import { quittanceService } from '@/app/services/quittanceService';
import toast from 'react-hot-toast';
import './paiements.css';

interface Paiement {
  id: number;
  contrat_id: number;
  bien_id: number;
  locataire_id: number;
  acquereur_id?: number;
  type_paiement: string;
  type_vente?: string;
  type_transaction?: string;
  montant: number;
  montant_total_vente?: number;
  versement_numero?: number;
  date_paiement: string;
  date_echeance?: string;
  mode_paiement: string;
  reference?: string;
  numero_quittance?: string;
  statut: string;
  mois_concerne?: string;
  penalite?: number;
  commentaire?: string;
  created_at: string;
  contrat_numero?: string;
  bien_nom?: string;
  locataire_nom?: string;
  locataire_prenom?: string;
  acquereur_nom?: string;
  acquereur_prenom?: string;
  acquereur_type?: string;        // ✅ Ajouté
  acquereur_raison_sociale?: string; // ✅ Ajouté
}

export default function PaiementsPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [filteredPaiements, setFilteredPaiements] = useState<Paiement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [formType, setFormType] = useState<'LOCATION' | 'VENTE'>('LOCATION');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paiementToDelete, setPaiementToDelete] = useState<Paiement | null>(null);
  const [vueActive, setVueActive] = useState<'accordeon' | 'cards' | 'tableau'>('accordeon');
  const [stats, setStats] = useState({
    total: 0,
    montantTotal: 0,
    effectues: 0,
    enAttente: 0,
    enRetard: 0,
    penalites: 0,
    locations: 0,
    ventes: 0
  });
  const [isGeneratingQuittance, setIsGeneratingQuittance] = useState<number | null>(null);
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [selectedPaiements, setSelectedPaiements] = useState<number[]>([]);
  const [showMultipleDeleteConfirm, setShowMultipleDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const router = useRouter();
  const { formatMoney } = useTheme();

  const exportColumns: ExportColumn[] = [
    { header: 'ID', key: 'id' },
    { header: 'Date de paiement', key: 'date_paiement' },
    { header: 'Type', key: 'type_transaction' },
    { header: 'Contrat', key: 'contrat_numero' },
    { header: 'Client', key: 'client_nom' },
    { header: 'Montant', key: 'montant' },
    { header: 'Mode de paiement', key: 'mode_paiement' },
    { header: 'Statut', key: 'statut' },
    { header: 'Type paiement', key: 'type_paiement' },
    { header: 'Référence', key: 'reference' },
    { header: 'N° Quittance', key: 'numero_quittance' },
    { header: 'Bien', key: 'bien_nom' }
  ];

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    setUtilisateur(JSON.parse(userStr));
    chargerPaiements();
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

  const chargerPaiements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/paiements');
      const data = await response.json();
      
      if (data.success) {
        setPaiements(data.paiements);
        setFilteredPaiements(data.paiements);
        calculerStats(data.paiements);
        setSelectedPaiements([]);
      } else {
        toast.error('Erreur lors du chargement des paiements');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const calculerStats = (data: Paiement[]) => {
    const total = data.length;
    const montantTotal = data.reduce((sum, p) => sum + (parseFloat(p.montant as any) || 0), 0);
    const effectues = data.filter(p => p.statut === 'EFFECTUE').length;
    const enAttente = data.filter(p => p.statut === 'EN_ATTENTE').length;
    const enRetard = data.filter(p => p.statut === 'EN_RETARD').length;
    const penalites = data.reduce((sum, p) => sum + (parseFloat(p.penalite as any) || 0), 0);
    const locations = data.filter(p => p.type_transaction === 'LOCATION' || !p.type_transaction).length;
    const ventes = data.filter(p => p.type_transaction === 'VENTE').length;

    setStats({ total, montantTotal, effectues, enAttente, enRetard, penalites, locations, ventes });
  };

  const handleFilter = (filters: any) => {
    setCurrentFilters(filters);
    let filtered = [...paiements];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.contrat_numero?.toLowerCase().includes(searchLower) ||
        p.reference?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.statut && filters.statut !== 'TOUS') {
      filtered = filtered.filter(p => p.statut === filters.statut);
    }

    if (filters.mode && filters.mode !== 'TOUS') {
      filtered = filtered.filter(p => p.mode_paiement === filters.mode);
    }

    if (filters.type && filters.type !== 'TOUS') {
      filtered = filtered.filter(p => p.type_transaction === filters.type);
    }

    if (filters.dateDebut) {
      filtered = filtered.filter(p => new Date(p.date_paiement) >= new Date(filters.dateDebut));
    }

    if (filters.dateFin) {
      filtered = filtered.filter(p => new Date(p.date_paiement) <= new Date(filters.dateFin));
    }

    setFilteredPaiements(filtered);
    setSelectedPaiements([]);
  };

const handleSort = (key: string) => {
  let direction: 'asc' | 'desc' = 'asc';
  if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }
  setSortConfig({ key, direction });
  
  const sorted = [...filteredPaiements];
  sorted.sort((a, b) => {
    let aValue: any = a[key as keyof Paiement];
    let bValue: any = b[key as keyof Paiement];
    
    // Gestion spéciale pour certaines colonnes
    if (key === 'montant') {
      aValue = a.montant || 0;
      bValue = b.montant || 0;
    }
    if (key === 'date_paiement') {
      aValue = new Date(a.date_paiement).getTime();
      bValue = new Date(b.date_paiement).getTime();
    }
    if (key === 'type_transaction') {
      aValue = a.type_transaction || 'LOCATION';
      bValue = b.type_transaction || 'LOCATION';
    }
    if (key === 'type_paiement') {
      aValue = a.type_paiement || '';
      bValue = b.type_paiement || '';
    }
    if (key === 'contrat_numero') {
      aValue = a.contrat_numero || '';
      bValue = b.contrat_numero || '';
    }
    if (key === 'client_nom') {
      aValue = getClientName(a);
      bValue = getClientName(b);
    }
    if (key === 'mode_paiement') {
      aValue = a.mode_paiement || '';
      bValue = b.mode_paiement || '';
    }
    if (key === 'statut') {
      aValue = a.statut || '';
      bValue = b.statut || '';
    }
    if (key === 'versement_numero') {
      aValue = a.versement_numero || 999; // Les non-versements à la fin
      bValue = b.versement_numero || 999;
      // Pour les versements, prioriser ceux qui ont un numéro
      if (a.type_paiement === 'VERSEMENT' && aValue === 999) aValue = 9999;
      if (b.type_paiement === 'VERSEMENT' && bValue === 999) bValue = 9999;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue, 'fr', { sensitivity: 'base' })
        : bValue.localeCompare(aValue, 'fr', { sensitivity: 'base' });
    }
    
    return direction === 'asc' 
      ? (aValue > bValue ? 1 : -1)
      : (bValue > aValue ? 1 : -1);
  });
  setFilteredPaiements(sorted);
};

  const toggleSelectPaiement = (id: number) => {
    setSelectedPaiements(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPaiements.length === filteredPaiements.length) {
      setSelectedPaiements([]);
    } else {
      setSelectedPaiements(filteredPaiements.map(p => p.id));
    }
  };

  const handleMultipleDelete = async () => {
    if (selectedPaiements.length === 0) return;
    setShowMultipleDeleteConfirm(false);
    setIsDeletingMultiple(true);
    
    try {
      const promises = selectedPaiements.map(id => fetch(`/api/paiements/${id}`, { method: 'DELETE' }));
      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res.ok);
      
      if (allSuccess) {
        toast.success(`${selectedPaiements.length} paiement(s) supprimé(s) avec succès`);
        chargerPaiements();
      } else {
        toast.error('Erreur lors de la suppression de certains paiements');
      }
    } catch (error) {
      console.error('❌ Erreur suppression multiple:', error);
      toast.error('Erreur lors de la suppression multiple');
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const handleAddPaiement = (type: 'LOCATION' | 'VENTE' = 'LOCATION') => {
    setSelectedPaiement(null);
    setFormType(type);
    setShowForm(true);
  };

  const handleAddPaiementPourContrat = (
    contratId: number, 
    locataireId: number | undefined, 
    acquereurId: number | undefined, 
    bienId: number, 
    type: string
  ) => {
    const paiementPreRempli = {
      contrat_id: contratId,
      locataire_id: locataireId,
      acquereur_id: acquereurId,
      bien_id: bienId,
      type_transaction: type
    };
    setSelectedPaiement(paiementPreRempli as any);
    setFormType(type as 'LOCATION' | 'VENTE');
    setShowForm(true);
  };

  const handleEditPaiement = (paiement: Paiement) => {
    setSelectedPaiement(paiement);
    setFormType(paiement.type_transaction === 'VENTE' ? 'VENTE' : 'LOCATION');
    setShowForm(true);
  };

  const handleDeleteClick = (paiement: Paiement) => {
    setPaiementToDelete(paiement);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!paiementToDelete) return;
    try {
      const response = await fetch(`/api/paiements/${paiementToDelete.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast.success('Paiement supprimé avec succès');
        chargerPaiements();
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setShowDeleteConfirm(false);
      setPaiementToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    chargerPaiements();
  };

  // ✅ Fonction pour générer la quittance avec loading
  const handleGenerateQuittance = async (paiement: Paiement) => {
    setIsGeneratingQuittance(paiement.id);
    
    try {
      const contratResponse = await fetch(`/api/contrats/${paiement.contrat_id}`);
      const contratData = await contratResponse.json();
      const contrat = contratData.contrat;
      
      const isVente = contrat.type_contrat === 'VENTE';
      
      let client;
      if (isVente) {
        const acquereurResponse = await fetch(`/api/acquereurs/${paiement.acquereur_id || contrat.acquereur_id}`);
        const acquereurData = await acquereurResponse.json();
        client = acquereurData.acquereur;
      } else {
        const locataireResponse = await fetch(`/api/locataires/${paiement.locataire_id || contrat.locataire_id}`);
        const locataireData = await locataireResponse.json();
        client = locataireData.locataire;
      }
      
      const bienResponse = await fetch(`/api/biens/${paiement.bien_id}`);
      const bienData = await bienResponse.json();
      const bien = bienData.bien;

      let totalDejaVerse = 0;
      if (isVente) {
        const versementsResponse = await fetch(`/api/paiements?contrat_id=${contrat.id}&type_transaction=VENTE`);
        const versementsData = await versementsResponse.json();
        if (versementsData.success && versementsData.paiements) {
          totalDejaVerse = versementsData.paiements.reduce((sum: number, p: any) => sum + (parseFloat(p.montant) || 0), 0);
        }
      }

      const quittanceData: any = {
        type: isVente ? 'VENTE' : 'LOCATION',
        numero_document: paiement.numero_quittance || `QUIT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(paiement.id).padStart(6, '0')}`,
        date_emission: new Date().toISOString(),
        paiement: {
          reference: paiement.reference || `PAIEMENT-${paiement.id}`,
          montant: parseFloat(paiement.montant as any),
          date_paiement: paiement.date_paiement,
          mode_paiement: paiement.mode_paiement,
          penalite: parseFloat(paiement.penalite as any) || 0,
          type_versement: paiement.type_vente,
          versement_numero: paiement.versement_numero
        },
        contrat: {
          numero: contrat.numero_contrat,
          date_debut: contrat.date_debut,
          date_fin: contrat.date_fin,
          type: contrat.type_contrat,
          loyer_mensuel: bien.loyer_mensuel ? parseFloat(bien.loyer_mensuel) : 0,
          prix_vente: contrat.prix_vente ? parseFloat(contrat.prix_vente) : 0
        },
        client: {
          nom: client.nom,
          prenom: client.prenom,
          telephone: client.telephone || '',
          type: isVente ? 'acheteur' : 'locataire'
        },
        bien: {
          nom: bien.nom,
          adresse: bien.adresse || '',
          commune: bien.commune || '',
          ville: bien.ville || '',
          quartier: bien.quartier || '',
          loyer_mensuel: bien.loyer_mensuel ? parseFloat(bien.loyer_mensuel) : 0,
          prix_vente: contrat.prix_vente ? parseFloat(contrat.prix_vente) : 0
        },
        entreprise: {
          nom: entreprise?.nom || 'ImmoLion Gestion',
          adresse: entreprise?.ville ? `${entreprise.ville}, Côte d'Ivoire` : 'Abidjan, Côte d\'Ivoire',
          telephone: entreprise?.telephone || '+225 00 00 00 00',
          email: entreprise?.email || 'contact@immolion.ci',
          site_web: entreprise?.site_web
        },
        echeancier: isVente ? {
          total_vente: contrat.prix_vente ? parseFloat(contrat.prix_vente) : 0,
          deja_verse: totalDejaVerse,
          reste: (contrat.prix_vente ? parseFloat(contrat.prix_vente) : 0) - totalDejaVerse,
          versement_numero: paiement.versement_numero || 1
        } : undefined
      };

      await quittanceService.genererQuittance(quittanceData);
      toast.success(isVente ? 'Reçu généré avec succès' : 'Quittance générée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur génération quittance:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGeneratingQuittance(null);
    }
  };

  // ✅ Fonction pour obtenir le nom du client
  // ✅ Fonction pour obtenir le nom du client (améliorée)
const getClientName = (p: Paiement) => {
  // Pour les ventes, utiliser les données de l'acquéreur
  if (p.type_transaction === 'VENTE') {
    // Pour les sociétés/agences, afficher la raison sociale
    if (p.acquereur_type === 'SOCIETE' || p.acquereur_type === 'AGENCE') {
      return p.acquereur_raison_sociale || p.acquereur_nom || '-';
    }
    // Pour les particuliers
    if (p.acquereur_prenom && p.acquereur_nom) {
      return `${p.acquereur_prenom} ${p.acquereur_nom}`;
    }
    return p.acquereur_nom || '-';
  }
  
  // Pour les locations, utiliser les données du locataire
  if (p.locataire_prenom && p.locataire_nom) {
    return `${p.locataire_prenom} ${p.locataire_nom}`;
  }
  return p.locataire_nom || '-';
};

  // ✅ Fonction pour obtenir le type de transaction
  const getTransactionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'LOCATION': '🏠 Location',
      'VENTE': '💰 Vente'
    };
    return types[type] || type;
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
    <div className="paiements-container">
      <Sidebar />
      
      <div className="paiements-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Gestion des paiements"
          sousTitre="Suivez et gérez tous les paiements (locations et ventes)"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="paiements-content">
          <PaiementStats stats={stats} formatMoney={formatMoney} />

          <div className="paiements-actions-bar">
            <PaiementFilters onFilter={handleFilter} />
            
            <div className="actions-right">
              <ActionButtons
                data={filteredPaiements.map(p => ({ ...p, client_nom: getClientName(p) }))}
                columns={exportColumns}
                titre="Liste des paiements"
              />

              <div className="btn-group">
                <button 
                  className="btn-add location"
                  onClick={() => handleAddPaiement('LOCATION')}
                  title='Nouveau paiement location'
                >
                  🏠 Location
                </button>
                <button 
                  className="btn-add vente"
                  onClick={() => handleAddPaiement('VENTE')}
                  title='Nouveau versement vente'
                >
                  💰 Vente
                </button>
              </div>
              
              <VueSelector vueActive={vueActive} onVueChange={setVueActive} />
            </div>
          </div>

          {isLoading ? (
            <div className="gestion-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des paiements...</p>
            </div>
          ) : filteredPaiements.length === 0 ? (
            <div className="gestion-empty">
              <span className="empty-icon">💰</span>
              <h3>Aucun paiement trouvé</h3>
              <p>Commencez par enregistrer un premier paiement</p>
              <div className="empty-buttons">
                <button className="btn-add location" onClick={() => handleAddPaiement('LOCATION')}>
                  🏠 Paiement location
                </button>
                <button className="btn-add vente" onClick={() => handleAddPaiement('VENTE')}>
                  💰 Versement vente
                </button>
              </div>
            </div>
          ) : (
            <>
              {vueActive === 'accordeon' && (
                <PaiementsOverview
                  paiements={filteredPaiements}
                  onEdit={handleEditPaiement}
                  onDelete={handleDeleteClick}
                  onAddPaiement={handleAddPaiementPourContrat}
                  onGenerateQuittance={handleGenerateQuittance}
                />
              )}

              {vueActive === 'cards' && (
                <div className="paiements-grid">
                  <AnimatePresence>
                    {filteredPaiements.map((paiement) => (
                      <PaiementCard
                        key={paiement.id}
                        paiement={paiement}
                        onEdit={handleEditPaiement}
                        onDelete={handleDeleteClick}
                        onGenerateQuittance={handleGenerateQuittance}
                        formatMoney={formatMoney}
                        compact={false}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
{vueActive === 'tableau' && (
  <div className="paiements-table-container">
    <div className="selection-bar">
      <label className="select-all">
        <input
          type="checkbox"
          checked={selectedPaiements.length === filteredPaiements.length && filteredPaiements.length > 0}
          onChange={toggleSelectAll}
          disabled={filteredPaiements.length === 0}
        />
        <span>Tout sélectionner ({filteredPaiements.length})</span>
      </label>
      {selectedPaiements.length > 0 && (
        <>
          <span className="selected-count">{selectedPaiements.length} sélectionné(s)</span>
          <button 
            className="btn-delete-selection"
            onClick={() => setShowMultipleDeleteConfirm(true)}
            disabled={isDeletingMultiple}
          >
            🗑️ Supprimer la sélection
          </button>
        </>
      )}
    </div>

    <table className="paiements-table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}>
            <input
              type="checkbox"
              checked={selectedPaiements.length === filteredPaiements.length && filteredPaiements.length > 0}
              onChange={toggleSelectAll}
              disabled={filteredPaiements.length === 0}
            />
          </th>
          <th style={{ width: '50px' }}>N°</th>
          <th 
            className={`sortable ${sortConfig?.key === 'date_paiement' ? 'active' : ''}`}
            onClick={() => handleSort('date_paiement')}
          >
            Date
            <span className="sort-icon">
              {sortConfig?.key === 'date_paiement' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th 
            className={`sortable ${sortConfig?.key === 'type_transaction' ? 'active' : ''}`}
            onClick={() => handleSort('type_transaction')}
          >
            Type
            <span className="sort-icon">
              {sortConfig?.key === 'type_transaction' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th 
            className={`sortable ${sortConfig?.key === 'type_paiement' ? 'active' : ''}`}
            onClick={() => handleSort('type_paiement')}
          >
            Type paiement
            <span className="sort-icon">
              {sortConfig?.key === 'type_paiement' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th 
            className={`sortable ${sortConfig?.key === 'contrat_numero' ? 'active' : ''}`}
            onClick={() => handleSort('contrat_numero')}
          >
            Contrat
            <span className="sort-icon">
              {sortConfig?.key === 'contrat_numero' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th 
            className={`sortable ${sortConfig?.key === 'client_nom' ? 'active' : ''}`}
            onClick={() => handleSort('client_nom')}
          >
            Client
            <span className="sort-icon">
              {sortConfig?.key === 'client_nom' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th 
            className={`sortable ${sortConfig?.key === 'montant' ? 'active' : ''}`}
            onClick={() => handleSort('montant')}
          >
            Montant
            <span className="sort-icon">
              {sortConfig?.key === 'montant' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th 
            className={`sortable ${sortConfig?.key === 'mode_paiement' ? 'active' : ''}`}
            onClick={() => handleSort('mode_paiement')}
          >
            Mode
            <span className="sort-icon">
              {sortConfig?.key === 'mode_paiement' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th 
            className={`sortable ${sortConfig?.key === 'statut' ? 'active' : ''}`}
            onClick={() => handleSort('statut')}
          >
            Statut
            <span className="sort-icon">
              {sortConfig?.key === 'statut' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th style={{ width: '100px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredPaiements.map((p, index) => {
          // ✅ Déterminer le numéro de versement
          let versementNumero = null;
          if (p.type_paiement === 'VERSEMENT') {
            versementNumero = p.versement_numero;
            // Si pas de versement_numero, essayer de le déduire
            if (!versementNumero && p.reference) {
              const match = p.reference.match(/VERSEMENT[_-]?(\d+)/i);
              if (match) versementNumero = parseInt(match[1]);
            }
          }
          
          // ✅ Libellé du type de paiement avec numéro
          let typePaiementLabel = p.type_paiement || '-';
          if (p.type_paiement === 'ACOMPTE') typePaiementLabel = 'Acompte';
          else if (p.type_paiement === 'VERSEMENT') {
            typePaiementLabel = versementNumero ? `${versementNumero}e Versement` : 'Versement';
          }
          else if (p.type_paiement === 'SOLDE') typePaiementLabel = 'Solde final';
          else if (p.type_paiement === 'CAUTION') typePaiementLabel = 'Caution';
          else if (p.type_paiement === 'AVANCE') typePaiementLabel = 'Avance';
          else if (p.type_paiement === 'LOYER') typePaiementLabel = 'Loyer';
          
          return (
            <tr key={p.id} className={selectedPaiements.includes(p.id) ? 'selected-row' : ''}>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectedPaiements.includes(p.id)}
                  onChange={() => toggleSelectPaiement(p.id)}
                />
              </td>
              <td className="row-number">{index + 1}</td>
              <td>{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</td>
              <td>
                <span className={`type-badge-table ${p.type_transaction === 'VENTE' ? 'vente' : 'location'}`}>
                  {getTransactionTypeLabel(p.type_transaction || 'LOCATION')}
                </span>
              </td>
              <td>
                <span className="type-paiement-label">
                  {typePaiementLabel}
                </span>
              </td>
              <td>{p.contrat_numero || '-'}</td>
              <td className="client-name">{getClientName(p)}</td>
              <td className="montant">{formatMoney(p.montant)}</td>
              <td>{p.mode_paiement}</td>
              <td>
                <span className={`table-statut ${p.statut.toLowerCase()}`}>
                  {p.statut === 'EFFECTUE' ? 'Effectué' : 
                   p.statut === 'EN_ATTENTE' ? 'En attente' : 
                   p.statut === 'EN_RETARD' ? 'En retard' : p.statut}
                </span>
              </td>
              <td>
                <div className="actions-simple">
                  <button 
                    onClick={() => handleGenerateQuittance(p)} 
                    title="Télécharger"
                    className="action-btn view"
                    disabled={isGeneratingQuittance === p.id}
                  >
                    {isGeneratingQuittance === p.id ? (
                      <span className="spinner-mini"></span>
                    ) : (
                      '📥'
                    )}
                  </button>
                  <button 
                    onClick={() => handleEditPaiement(p)} 
                    title="Modifier"
                    className="action-btn edit"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(p)} 
                    title="Supprimer"
                    className="action-btn deleted"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          formType === 'VENTE' ? (
            <PaiementVenteForm
              paiement={selectedPaiement}
              acquereur_id={selectedPaiement?.acquereur_id}
              contrat_id={selectedPaiement?.contrat_id}
              bien_id={selectedPaiement?.bien_id}
              onClose={() => setShowForm(false)}
              onSuccess={handleFormSuccess}
            />
          ) : (
            <PaiementForm
              paiement={selectedPaiement}
              locataire_id={selectedPaiement?.locataire_id}
              contrat_id={selectedPaiement?.contrat_id}
              bien_id={selectedPaiement?.bien_id}
              onClose={() => setShowForm(false)}
              onSuccess={handleFormSuccess}
            />
          )
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer le paiement"
        message={`Êtes-vous sûr de vouloir supprimer ce paiement ?`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPaiementToDelete(null);
        }}
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={showMultipleDeleteConfirm}
        title="Supprimer plusieurs paiements"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedPaiements.length} paiement(s) ?`}
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