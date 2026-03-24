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
import ConfirmModal from '@/app/components/common/ConfirmModal';
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
  
  const router = useRouter();
  const { formatMoney } = useTheme();

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
  };

  const handleAddPaiement = () => {
    setSelectedPaiement(null);
    setShowForm(true);
  };

  const handleAddPaiementPourContrat = (contratId: number) => {
    setSelectedPaiement(null);
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

  // ✅ Fonction de génération directe de quittance
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

      // ✅ Utilisation de "as any" pour éviter les erreurs TypeScript
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
            <button 
                className="btn-add-paiement"
                onClick={handleAddPaiement}
              >
                <span className="btn-icon">➕</span>
                Nouveau paiement
              </button>
            <div className="actions-right">
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
                className="btn-add-paiement empty-btn"
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
                        formatMoney={formatMoney}
                        compact={false}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {vueActive === 'tableau' && (
                <div className="paiements-table-container">
                  <table className="paiements-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Contrat</th>
                        <th>Locataire</th>
                        <th>Montant</th>
                        <th>Mode</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaiements.map((p) => (
                        <tr key={p.id}>
                          <td>{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</td>
                          <td>{p.contrat_numero}</td>
                          <td>{p.locataire_nom} {p.locataire_prenom}</td>
                          <td className="montant">{p.montant.toLocaleString()} FCFA</td>
                          <td>{p.mode_paiement}</td>
                          <td>
                            <span className={`table-statut ${p.statut.toLowerCase()}`}>
                              {p.statut}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button 
                                onClick={() => handleGenerateQuittance(p)} 
                                title="Télécharger la quittance"
                                disabled={isGeneratingQuittance}
                                className="compact-btn"
                                style={{ background: '#c6fbe3' }}
                              >
                                {isGeneratingQuittance ? '⏳' : '📥'}
                              </button>
                              <button onClick={() => handleEditPaiement(p)} 
                              title="Modifier" 
                              className="compact-btn"
                                >✏️</button>
                              <button onClick={() => handleDeleteClick(p)} 
                              title="Supprimer" 
                              className="compact-btn"
                              style={{ background: '#ffdede' }}>🗑️</button>
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
    </div>
  );
}