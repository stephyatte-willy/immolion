'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import PaiementForm from '@/app/components/paiements/PaiementForm';
import PaiementCard from '@/app/components/paiements/PaiementCard';
import PaiementFilters from '@/app/components/paiements/PaiementFilters';
import PaiementStats from '@/app/components/paiements/PaiementStats';
import ContratPaiementsAccordeon from '@/app/components/paiements/ContratPaiementsAccordeon';
import VueSelector from '@/app/components/paiements/VueSelector';
import ActionButtons from '@/app/components/common/ActionButtons';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { ExportColumn } from '@/app/services/exportService';
import { useTheme } from '@/app/providers/ThemeProvider';
import { documentPaiementService } from '@/app/services/quittanceService';
import toast from 'react-hot-toast';
import './paiements.css';

interface Paiement {
  id: number;
  contrat_id: number;
  bien_id: number;
  locataire_id: number;
  type_paiement: string;
  type_vente?: string;
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
}

export default function PaiementsPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [filteredPaiements, setFilteredPaiements] = useState<Paiement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paiementToDelete, setPaiementToDelete] = useState<Paiement | null>(null);
  const [vueActive, setVueActive] = useState<'accordeon' | 'cards' | 'tableau'>('accordeon');
  const [stats, setStats] = useState({
    total: 0,
    montantTotal: 0,
    effectues: 0,
    enAttente: 0,
    enRetard: 0,
    penalites: 0
  });
  const [isGeneratingQuittance, setIsGeneratingQuittance] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<any>({});
  
  // États pour la sélection multiple
  const [selectedPaiements, setSelectedPaiements] = useState<number[]>([]);
  const [showMultipleDeleteConfirm, setShowMultipleDeleteConfirm] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // ✅ État pour le tri
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const [openAccordeonId, setOpenAccordeonId] = useState<number | null>(null);
  
  const router = useRouter();
  const { formatMoney } = useTheme();

  // Colonnes pour l'export Excel
  const exportColumns: ExportColumn[] = [
    { header: 'ID', key: 'id' },
    { header: 'Date de paiement', key: 'date_paiement' },
    { header: 'Contrat', key: 'contrat_numero' },
    { header: 'Locataire', key: 'locataire_nom' },
    { header: 'Prénom locataire', key: 'locataire_prenom' },
    { header: 'Montant', key: 'montant' },
    { header: 'Mode de paiement', key: 'mode_paiement' },
    { header: 'Statut', key: 'statut' },
    { header: 'Type', key: 'type_paiement' },
    { header: 'Mois concerné', key: 'mois_concerne' },
    { header: 'Pénalité', key: 'penalite' },
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
      // ✅ Log pour vérifier les données
      console.log('📦 Paiements reçus:', data.paiements);
      console.log('🔍 Premier paiement:', data.paiements[0]);
      
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
    
    const montantTotal = data.reduce((sum, p) => {
      const montant = typeof p.montant === 'string' ? parseFloat(p.montant) : (p.montant || 0);
      return sum + (isNaN(montant) ? 0 : montant);
    }, 0);
    
    const effectues = data.filter(p => p.statut === 'EFFECTUE').length;
    const enAttente = data.filter(p => p.statut === 'EN_ATTENTE').length;
    const enRetard = data.filter(p => p.statut === 'EN_RETARD').length;
    
    const penalites = data.reduce((sum, p) => {
      const penalite = typeof p.penalite === 'string' ? parseFloat(p.penalite) : (p.penalite || 0);
      return sum + (isNaN(penalite) ? 0 : penalite);
    }, 0);

    setStats({
      total,
      montantTotal,
      effectues,
      enAttente,
      enRetard,
      penalites
    });
  };

  const handleFilter = (filters: any) => {
    setCurrentFilters(filters);
    let filtered = [...paiements];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.locataire_nom?.toLowerCase().includes(searchLower) ||
        p.locataire_prenom?.toLowerCase().includes(searchLower) ||
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

    if (filters.mois) {
      filtered = filtered.filter(p => p.mois_concerne?.startsWith(filters.mois));
    }

    if (filters.type && filters.type !== 'TOUS') {
      filtered = filtered.filter(p => p.type_paiement === filters.type);
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

  // ✅ Fonction de tri
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
      
      if (key === 'statut') {
        const statutMap: Record<string, number> = {
          'EFFECTUE': 1,
          'EN_ATTENTE': 2,
          'EN_RETARD': 3
        };
        aValue = statutMap[a.statut] || 99;
        bValue = statutMap[b.statut] || 99;
      }
      
      if (key === 'locataire_nom') {
        aValue = `${a.locataire_nom || ''} ${a.locataire_prenom || ''}`.trim();
        bValue = `${b.locataire_nom || ''} ${b.locataire_prenom || ''}`.trim();
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
    
    setFilteredPaiements(sorted);
  };

  // Gestion de la sélection multiple
  const toggleSelectPaiement = (id: number) => {
    setSelectedPaiements(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPaiements.length === filteredPaiements.length) {
      setSelectedPaiements([]);
    } else {
      setSelectedPaiements(filteredPaiements.map(p => p.id));
    }
  };

  // Suppression multiple
  const handleMultipleDelete = async () => {
    if (selectedPaiements.length === 0) return;
    
    setShowMultipleDeleteConfirm(false);
    setIsDeletingMultiple(true);
    
    try {
      const promises = selectedPaiements.map(id => 
        fetch(`/api/paiements/${id}`, { method: 'DELETE' })
      );
      
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

  const handleAddPaiement = () => {
    setSelectedPaiement(null);
    setShowForm(true);
  };

  const handleAddPaiementPourContrat = (
    contratId: number, 
    locataireId?: number, 
    bienId?: number, 
    loyerMensuel?: number
  ) => {
    const paiementPreRempli = {
      contrat_id: contratId,
      locataire_id: locataireId,
      bien_id: bienId,
      montant: loyerMensuel,
      type_paiement: 'LOYER'
    };
    
    setSelectedPaiement(paiementPreRempli as any);
    setShowForm(true);
  };

  const handleEditPaiement = (paiement: Paiement) => {
    setSelectedPaiement(paiement);
    setShowForm(true);
  };

  const handleDeleteClick = (paiement: Paiement) => {
    setPaiementToDelete(paiement);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!paiementToDelete) return;

    try {
      const response = await fetch(`/api/paiements/${paiementToDelete.id}`, {
        method: 'DELETE'
      });
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

  // Fonction de génération directe de quittance
  const handleGenerateQuittance = async (paiement: Paiement) => {
    setIsGeneratingQuittance(true);
    
    try {
      const contratResponse = await fetch(`/api/contrats/${paiement.contrat_id}`);
      const contratData = await contratResponse.json();
      const contrat = contratData.contrat;
      
      const locataireResponse = await fetch(`/api/locataires/${paiement.locataire_id}`);
      const locataireData = await locataireResponse.json();
      const locataire = locataireData.locataire;
      
      const bienResponse = await fetch(`/api/biens/${paiement.bien_id}`);
      const bienData = await bienResponse.json();
      const bien = bienData.bien;

      const isVente = contrat.type_contrat === 'VENTE';

      let totalDejaVerse = 0;
      if (isVente) {
        const versementsResponse = await fetch(`/api/paiements?contrat_id=${contrat.id}&type_paiement=ACOMPTE,VERSEMENT,SOLDE`);
        const versementsData = await versementsResponse.json();
        if (versementsData.success && versementsData.paiements) {
          totalDejaVerse = versementsData.paiements.reduce((sum: number, p: any) => {
            const montant = typeof p.montant === 'string' ? parseFloat(p.montant) : (p.montant || 0);
            return sum + (isNaN(montant) ? 0 : montant);
          }, 0);
        }
      }

      const quittanceData: any = {
        type: isVente ? 'VENTE' : 'LOCATION',
        numero_document: paiement.numero_quittance || `QUIT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(paiement.id).padStart(6, '0')}`,
        date_emission: new Date().toISOString(),
        paiement: {
          reference: paiement.reference || `PAIEMENT-${paiement.id}`,
          montant: typeof paiement.montant === 'string' ? parseFloat(paiement.montant) : paiement.montant,
          date_paiement: paiement.date_paiement,
          mode_paiement: paiement.mode_paiement,
          penalite: paiement.penalite ? (typeof paiement.penalite === 'string' ? parseFloat(paiement.penalite) : paiement.penalite) : 0,
          type_versement: paiement.type_vente,
          versement_numero: paiement.versement_numero
        },
        contrat: {
          numero: contrat.numero_contrat,
          date_debut: contrat.date_debut,
          date_fin: contrat.date_fin,
          type: contrat.type_contrat,
          loyer_mensuel: bien.loyer_mensuel ? (typeof bien.loyer_mensuel === 'string' ? parseFloat(bien.loyer_mensuel) : bien.loyer_mensuel) : 0,
          prix_vente: contrat.prix_vente ? (typeof contrat.prix_vente === 'string' ? parseFloat(contrat.prix_vente) : contrat.prix_vente) : 0
        },
        client: {
          nom: locataire.nom,
          prenom: locataire.prenom,
          telephone: locataire.telephone,
          type: isVente ? 'acheteur' : 'locataire'
        },
        bien: {
          nom: bien.nom,
          adresse: bien.adresse,
          commune: bien.commune,
          ville: bien.ville,
          quartier: bien.quartier,
          loyer_mensuel: bien.loyer_mensuel ? (typeof bien.loyer_mensuel === 'string' ? parseFloat(bien.loyer_mensuel) : bien.loyer_mensuel) : 0,
          prix_vente: contrat.prix_vente ? (typeof contrat.prix_vente === 'string' ? parseFloat(contrat.prix_vente) : contrat.prix_vente) : 0
        },
        entreprise: {
          nom: entreprise?.nom || 'ImmoLion Gestion',
          adresse: entreprise?.ville ? `${entreprise.ville}, Côte d'Ivoire` : 'Abidjan, Côte d\'Ivoire',
          telephone: entreprise?.telephone || '+225 00 00 00 00',
          email: entreprise?.email || 'contact@immolion.ci',
          site_web: entreprise?.site_web
        },
        echeancier: isVente ? {
          total_vente: contrat.prix_vente ? (typeof contrat.prix_vente === 'string' ? parseFloat(contrat.prix_vente) : contrat.prix_vente) : 0,
          deja_verse: totalDejaVerse,
          reste: (contrat.prix_vente ? (typeof contrat.prix_vente === 'string' ? parseFloat(contrat.prix_vente) : contrat.prix_vente) : 0) - totalDejaVerse,
          versement_numero: paiement.versement_numero || 1
        } : undefined
      };

      await documentPaiementService.genererDocument(quittanceData);
      toast.success(isVente ? 'Reçu généré avec succès' : 'Quittance générée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur génération quittance:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGeneratingQuittance(false);
    }
  };

  // Grouper les paiements par contrat pour la vue accordéon
  const paiementsParContrat = filteredPaiements.reduce((acc, paiement) => {
    const contratId = paiement.contrat_id;
    if (!acc[contratId]) {
      acc[contratId] = {
        contrat: {
          id: contratId,
          numero_contrat: paiement.contrat_numero || `Contrat #${contratId}`,
          locataire: {
            nom: paiement.locataire_nom || '',
            prenom: paiement.locataire_prenom || ''
          },
          bien: {
            nom: paiement.bien_nom || 'Bien'
          }
        },
        paiements: []
      };
    }
    acc[contratId].paiements.push(paiement);
    return acc;
  }, {} as Record<number, any>);

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
          sousTitre="Suivez et gérez tous les paiements"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="paiements-content">
          <PaiementStats stats={stats} formatMoney={formatMoney} />

          <div className="paiements-actions-bar">
            <PaiementFilters onFilter={handleFilter} />
            
            <div className="actions-right">
              <ActionButtons
                data={filteredPaiements}
                columns={exportColumns}
                titre="Liste des paiements"
              />

              <button 
                className="btn-add"
                onClick={handleAddPaiement}
                title='Nouveau Paiement'
              >
                <span className="btn-icon">➕</span>
                Nouveau
              </button>
              
              <VueSelector vueActive={vueActive} onVueChange={setVueActive} />
            </div>
          </div>

          {isLoading ? (
            <div className="paiements-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des paiements...</p>
            </div>
          ) : filteredPaiements.length === 0 ? (
            <div className="paiements-empty">
              <span className="empty-icon">💰</span>
              <h3>Aucun paiement trouvé</h3>
              <p>Commencez par enregistrer un premier paiement</p>
              <button 
                className="btn-add empty-btn"
                onClick={handleAddPaiement}
              >
                Nouveau paiement
              </button>
            </div>
          ) : (
            <>
              {vueActive === 'accordeon' && (
                <div className="paiements-accordeon">
                  <AnimatePresence>
                    {Object.values(paiementsParContrat).map((groupe: any) => (
                      <ContratPaiementsAccordeon
                        key={groupe.contrat.id}
                        contrat={groupe.contrat}
                        paiements={groupe.paiements}
                        onEditPaiement={handleEditPaiement}
                        onDeletePaiement={handleDeleteClick}
                        onAddPaiement={handleAddPaiementPourContrat}
                        formatMoney={formatMoney}
                        isExpanded={openAccordeonId === groupe.contrat.id}
                        onToggle={() => setOpenAccordeonId(openAccordeonId === groupe.contrat.id ? null : groupe.contrat.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
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
    {/* Barre de sélection */}
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
          <span className="selected-count">
            {selectedPaiements.length} sélectionné(s)
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

    {/* Tableau avec cases à cocher, numérotation et tri */}
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
          <th style={{ width: '60px' }}>N°</th>
          <th className={`sortable ${sortConfig?.key === 'date_paiement' ? 'active' : ''}`} onClick={() => handleSort('date_paiement')}>
            Date
            <span className="sort-icon">
              {sortConfig?.key === 'date_paiement' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th className={`sortable ${sortConfig?.key === 'contrat_numero' ? 'active' : ''}`} onClick={() => handleSort('contrat_numero')}>
            Contrat
            <span className="sort-icon">
              {sortConfig?.key === 'contrat_numero' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th className={`sortable ${sortConfig?.key === 'locataire_nom' ? 'active' : ''}`} onClick={() => handleSort('locataire_nom')}>
            Locataire
            <span className="sort-icon">
              {sortConfig?.key === 'locataire_nom' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th className={`sortable ${sortConfig?.key === 'montant' ? 'active' : ''}`} onClick={() => handleSort('montant')}>
            Montant
            <span className="sort-icon">
              {sortConfig?.key === 'montant' ? (
                sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
              ) : (
                ' ↕️'
              )}
            </span>
          </th>
          <th className={`sortable ${sortConfig?.key === 'mode_paiement' ? 'active' : ''}`} onClick={() => handleSort('mode_paiement')}>
            Mode
            <span className="sort-icon">
              {sortConfig?.key === 'mode_paiement' ? (
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
          <th style={{ width: '120px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredPaiements.map((p, index) => (
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
            <td>{p.contrat_numero || '-'}</td>
            <td>
              {/* ✅ CORRECTION: Affichage correct du locataire */}
              {p.locataire_prenom && p.locataire_nom ? 
                `${p.locataire_prenom} ${p.locataire_nom}` : 
                p.locataire_nom || '-'}
            </td>
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
              <div className="table-actions">
                <button 
                  onClick={() => handleGenerateQuittance(p)} 
                  title="Télécharger la quittance"
                  disabled={isGeneratingQuittance}
                >
                  📥
                </button>
                <button 
                  onClick={() => handleEditPaiement(p)} 
                  title="Modifier"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => handleDeleteClick(p)} 
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        ))}
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
          <PaiementForm
            paiement={selectedPaiement}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer le paiement"
        message={`Êtes-vous sûr de vouloir supprimer ce paiement de ${paiementToDelete?.montant?.toLocaleString()} FCFA ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPaiementToDelete(null);
        }}
      />

      {/* Modale de confirmation suppression multiple */}
      <ConfirmModal
        isOpen={showMultipleDeleteConfirm}
        title="Supprimer plusieurs paiements"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedPaiements.length} paiement(s) ? Cette action est irréversible.`}
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