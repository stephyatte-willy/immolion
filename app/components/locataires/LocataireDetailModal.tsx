'use client';

// En haut du fichier, remplacez les imports par :
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import { STATUTS_LOCATAIRE } from '@/app/types/locataires';
import ContratCard from '@/app/components/contrats/ContratCard';
import ContratForm from '@/app/components/contrats/ContratForm';
import PaiementForm from '@/app/components/paiements/PaiementForm';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { contratExportService } from '@/app/services/contratExportService';
import { contratVenteService } from '@/app/services/contratVenteService';
import { documentPaiementService } from '@/app/services/quittanceService'; 
import DocumentForm from '@/app/components/documents/DocumentForm';
import DocumentCard from '@/app/components/documents/DocumentCard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import '@/app/locataires/locataires.css';

interface LocataireDetailModalProps {
  locataire: any;
  onClose: () => void;
  onEdit: (locataire: any) => void;
}

export default function LocataireDetailModal({ 
  locataire: initialLocataire, 
  onClose, 
  onEdit 
}: LocataireDetailModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [showContratForm, setShowContratForm] = useState(false);
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<any>(null);
  const [selectedPaiement, setSelectedPaiement] = useState<any>(null);
  const [locataireData, setLocataireData] = useState<any>(initialLocataire);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: string, id: number, item: any} | null>(null);
  const [showQuittancePreview, setShowQuittancePreview] = useState(false);
  const [selectedPaiementForQuittance, setSelectedPaiementForQuittance] = useState<any>(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  
  
  const { formatMoney, formatDate } = useTheme();

  useEffect(() => {
    refreshLocataireData();
  }, []);

  useEffect(() => {
    setLocataireData(initialLocataire);
  }, [initialLocataire]);

  useEffect(() => {
    if (locataireData?.id) {
      chargerPaiements();
    }
  }, [locataireData?.id, refreshKey]);

  const getStatutInfo = (statut: string) => {
    const statutObj = STATUTS_LOCATAIRE.find(s => s.value === statut) || STATUTS_LOCATAIRE[0];
    return {
      label: statutObj.label,
      couleur: statutObj.couleur
    };
  };

  useEffect(() => {
  if (locataireData?.id) {
    chargerDocuments();
  }
}, [locataireData?.id, refreshKey]);

useEffect(() => {
  console.log('🔍 DONNÉES COMPLÈTES:', JSON.stringify(locataireData, null, 2));
}, [locataireData]);

  const statutInfo = getStatutInfo(locataireData.statut);

  const tabs = [
    { id: 'info', label: 'Informations', icon: '👤' },
    { id: 'contrats', label: 'Contrats', icon: '📄' },
    { id: 'paiements', label: 'Paiements', icon: '💰' },
    { id: 'documents', label: 'Documents', icon: '📎' }
  ];

  // Ajoutez ce useEffect temporairement pour voir les données
useEffect(() => {
  console.log('🔍 Données du locataire:', {
    id: locataireData.id,
    nom: locataireData.nom,
    prenom: locataireData.prenom,
    bien_actuel: locataireData.bien_actuel,
    contrats: locataireData.contrats?.map((c: any) => ({
      id: c.id,
      type: c.type_contrat,
      prix_vente: c.prix_vente,
      statut: c.statut,
      bien: c.bien
    }))
  });
}, [locataireData]);

const handleImprimerQuittance = async (paiement: any) => {
  try {
    const contrat = locataireData.contrats?.find((c: any) => c.id === paiement.contrat_id);
    const bien = contrat?.bien || locataireData.bien_actuel;
    
    if (!contrat || !bien) {
      toast.error('Contrat ou bien non trouvé');
      return;
    }

    const isVente = contrat.type_contrat === 'VENTE';

    // Récupérer les informations de l'entreprise
    const response = await fetch('/api/entreprise');
    const entrepriseData = await response.json();
    const entreprise = entrepriseData.entreprise || {
      nom: 'ImmoLion Gestion',
      ville: 'Abidjan',
      telephone: '+225 00 00 00 00',
      email: 'contact@immolion.ci'
    };

    // Calculer l'échéancier pour les ventes
    let echeancier;
    if (isVente) {
      const versements = await fetch(`/api/paiements?contrat_id=${contrat.id}`);
      const data = await versements.json();
      const totalVerse = data.paiements?.reduce((sum: number, p: any) => sum + p.montant, 0) || 0;
      const prixTotal = contrat.prix_vente || 0;
      
      echeancier = {
        total_vente: prixTotal,
        deja_verse: totalVerse,
        reste: prixTotal - totalVerse,
        versement_numero: paiement.versement_numero || 1
      };
    }

    // ✅ Construction de l'objet documentData (sans typage)
    const documentData = {
      numero_document: paiement.numero_quittance || `DOC-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-000001`,
      date_emission: new Date().toISOString(),
      type: isVente ? 'VENTE' : 'LOCATION',
      paiement: {
        reference: paiement.reference || `PAIEMENT-${paiement.id}`,
        montant: paiement.montant,
        date_paiement: paiement.date_paiement,
        mode_paiement: paiement.mode_paiement,
        penalite: paiement.penalite,
        type_versement: paiement.type_vente,
        versement_numero: paiement.versement_numero
      },
      contrat: {
        numero: contrat.numero_contrat,
        date_debut: contrat.date_debut,
        date_fin: contrat.date_fin,
        type: contrat.type_contrat
      },
      client: {
        nom: locataireData.nom,
        prenom: locataireData.prenom,
        telephone: locataireData.telephone,
        type: isVente ? 'acheteur' : 'locataire'
      },
      bien: {
        nom: bien.nom,
        adresse: bien.adresse,
        commune: bien.commune,
        ville: bien.ville,
        quartier: bien.quartier,
        loyer_mensuel: bien.loyer_mensuel,
        prix_vente: bien.prix_vente
      },
      entreprise: {
        nom: entreprise.nom,
        adresse: `${entreprise.ville}, Côte d'Ivoire`,
        telephone: entreprise.telephone,
        email: entreprise.email,
        site_web: entreprise.site_web
      },
      echeancier
    };

    // ✅ Solution radicale : utiliser "as any" pour éviter les erreurs TypeScript
    await (documentPaiementService as any).genererDocument(documentData);
    
    toast.success(isVente ? 'Reçu généré avec succès' : 'Quittance générée avec succès');
  } catch (error) {
    console.error('❌ Erreur génération document:', error);
    toast.error('Erreur lors de la génération');
  }
};

const chargerDocuments = async () => {
  try {
    const response = await fetch(`/api/documents?locataire_id=${locataireData.id}`);
    const data = await response.json();
    if (data.success) {
      setDocuments(data.documents);
    }
  } catch (error) {
    console.error('❌ Erreur chargement documents:', error);
  }
};

// Gestionnaires pour les documents
const handleAddDocument = () => {
  setShowDocumentForm(true);
};

const handleDeleteDocument = async (id: number) => {
  try {
    const response = await fetch(`/api/documents/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
      toast.success('Document supprimé avec succès');
      chargerDocuments();
      setRefreshKey(prev => prev + 1);
    } else {
      toast.error(data.erreur || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error('Erreur de connexion');
  }
};

const handleExporterContratVente = async (contrat: any) => {
  try {
    const response = await fetch('/api/entreprise');
    const entrepriseData = await response.json();
    const entreprise = entrepriseData.entreprise || {
      nom: 'ImmoLion Gestion',
      ville: 'Abidjan',
      adresse: 'Abidjan, Côte d\'Ivoire',
      telephone: '+225 00 00 00 00',
      email: 'contact@immolion.ci'
    };

    // ✅ Construction correcte de l'objet selon l'interface ContratVenteData
    const contratData = {
      numero_contrat: contrat.numero_contrat,
      date_signature: contrat.date_signature || new Date().toISOString(),
      vendeur: {
        nom: 'Admin',
        prenom: 'Super',
        email: 'admin@immolion.com',
        telephone: '+225 00 00 00 00'
      },
      acheteur: {
        nom: locataireData.nom,
        prenom: locataireData.prenom,
        email: locataireData.email,
        telephone: locataireData.telephone,
        date_naissance: locataireData.date_naissance,
        lieu_naissance: locataireData.lieu_naissance,
        nationalite: locataireData.nationalite,
        profession: locataireData.profession
      },
      bien: {
        nom: contrat.bien?.nom || 'Bien',
        adresse: contrat.bien?.adresse || '',
        quartier: contrat.bien?.quartier,
        commune: contrat.bien?.commune || '',
        ville: contrat.bien?.ville || 'Abidjan',
        district: contrat.bien?.district || '',
        surface: contrat.bien?.surface || 0,
        pieces: contrat.bien?.pieces || 1,
        etage: contrat.bien?.etage,
        description: contrat.bien?.description
      },
      prix_vente: contrat.prix_vente || 0,
      clause_particuliere: contrat.clause_particuliere,
      entreprise: {
        nom: entreprise.nom,
        adresse: entreprise.adresse || `${entreprise.ville}, Côte d'Ivoire`,
        telephone: entreprise.telephone,
        email: entreprise.email
      }
    };

    await contratVenteService.genererContratVente(contratData);
    toast.success('Contrat de vente exporté avec succès');
  } catch (error) {
    console.error('❌ Erreur export:', error);
    toast.error('Erreur lors de l\'exportation');
  }
};


const handleUpdateDocument = async (id: number, type: string, dateExpiration: string) => {
  try {
    const response = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type_document: type, date_expiration: dateExpiration })
    });
    const data = await response.json();
    
    if (data.success) {
      toast.success('Document mis à jour');
      chargerDocuments();
      setRefreshKey(prev => prev + 1);
    } else {
      toast.error(data.erreur || 'Erreur lors de la mise à jour');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error('Erreur de connexion');
  }
};

  const refreshLocataireData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/locataires/${initialLocataire.id}`);
      const data = await response.json();
      
      if (data.success) {
        setLocataireData(data.locataire);
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error('Erreur lors du rechargement');
      }
    } catch (error) {
      console.error('❌ Erreur rechargement:', error);
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const chargerPaiements = async () => {
    try {
      const response = await fetch(`/api/paiements?locataire_id=${locataireData.id}`);
      const data = await response.json();
      if (data.success) {
        setPaiements(data.paiements);
      }
    } catch (error) {
      console.error('❌ Erreur chargement paiements:', error);
    }
  };

  // Gestionnaires pour les contrats
  const handleAddContrat = () => {
    setSelectedContrat(null);
    setShowContratForm(true);
  };

  const handleEditContrat = (contrat: any) => {
    setSelectedContrat(contrat);
    setShowContratForm(true);
  };

  const handleDeleteContrat = (contrat: any) => {
    setItemToDelete({ type: 'contrat', id: contrat.id, item: contrat });
    setShowDeleteConfirm(true);
  };

  // Gestionnaires pour les paiements
  const handleAddPaiement = () => {
    setSelectedPaiement(null);
    setShowPaiementForm(true);
  };

  const handleEditPaiement = (paiement: any) => {
    setSelectedPaiement(paiement);
    setShowPaiementForm(true);
  };

  const handleDeletePaiement = (paiement: any) => {
    setItemToDelete({ type: 'paiement', id: paiement.id, item: paiement });
    setShowDeleteConfirm(true);
  };

  const handleViewContrat = (id: number) => {
    console.log('Voir contrat', id);
  };

  const handleContratSuccess = async () => {
    setShowContratForm(false);
    await refreshLocataireData();
    toast.success('Opération réussie');
  };

  const handlePaiementSuccess = async () => {
    setShowPaiementForm(false);
    await chargerPaiements();
    setRefreshKey(prev => prev + 1);
    toast.success('Paiement enregistré avec succès');
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/${itemToDelete.type}s/${itemToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`${itemToDelete.type === 'contrat' ? 'Contrat' : 'Paiement'} supprimé avec succès`);
        if (itemToDelete.type === 'contrat') {
          await refreshLocataireData();
        } else {
          await chargerPaiements();
          setRefreshKey(prev => prev + 1);
        }
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleExporterContrat = async (contrat: any) => {
    try {
      const contratData = {
        ...contrat,
        bien: locataireData.bien_actuel || contrat.bien || {
          nom: contrat.bien_nom || 'Bien non spécifié',
          adresse: '',
          commune: '',
          district: '',
          surface: 0,
          pieces: 0
        },
        locataire: {
          nom: locataireData.nom,
          prenom: locataireData.prenom,
          email: locataireData.email,
          telephone: locataireData.telephone,
          date_naissance: locataireData.date_naissance,
          lieu_naissance: locataireData.lieu_naissance,
          nationalite: locataireData.nationalite,
          profession: locataireData.profession,
          employeur: locataireData.employeur,
        },
        proprietaire: {
          nom: 'Admin',
          prenom: 'Super',
          email: 'admin@immolion.com',
          telephone: '+225 00 00 00 00',
        }
      };
      
      await contratExportService.genererContratWord(contratData);
      toast.success('Contrat exporté avec succès');
    } catch (error) {
      console.error('❌ Erreur export:', error);
      toast.error('Erreur lors de l\'exportation');
    }
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content locataire-detail-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="modal-header locataire-detail-header">
          <div className="header-left">
            <div className="locataire-detail-avatar">
              <span>{locataireData.prenom?.[0]}{locataireData.nom?.[0]}</span>
            </div>
            <div className="locataire-detail-title">
              <h2>{locataireData.prenom} {locataireData.nom}</h2>
              <div className="locataire-detail-subtitle">
                <span className="detail-email">{locataireData.email}</span>
                <span className="detail-tel">{locataireData.telephone}</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div 
              className="locataire-detail-statut"
              style={{ 
                background: `${statutInfo.couleur}20`,
                color: statutInfo.couleur,
                borderColor: `${statutInfo.couleur}40`
              }}
            >
              {statutInfo.label}
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="locataire-detail-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Corps */}
        <div className="modal-body locataire-detail-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${refreshKey}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="tab-content"
            >
              {/* Onglet Informations */}
              {activeTab === 'info' && (
                <div className="info-tab">
                  <div className="detail-card">
                    <h3>
                      <span className="card-icon">👤</span>
                      Informations personnelles
                    </h3>
                    <div className="detail-grid">
                      <div className="detail-row">
                        <span className="detail-label">Nom complet</span>
                        <span className="detail-value">{locataireData.prenom} {locataireData.nom}</span>
                      </div>
                      {locataireData.date_naissance && (
                        <div className="detail-row">
                          <span className="detail-label">Date de naissance</span>
                          <span className="detail-value">{formatDate(locataireData.date_naissance)}</span>
                        </div>
                      )}
                      {locataireData.lieu_naissance && (
                        <div className="detail-row">
                          <span className="detail-label">Lieu de naissance</span>
                          <span className="detail-value">{locataireData.lieu_naissance}</span>
                        </div>
                      )}
                      {locataireData.nationalite && (
                        <div className="detail-row">
                          <span className="detail-label">Nationalité</span>
                          <span className="detail-value">{locataireData.nationalite}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="detail-card">
                    <h3>
                      <span className="card-icon">📞</span>
                      Contact
                    </h3>
                    <div className="detail-grid">
                      <div className="detail-row">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{locataireData.email}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Téléphone</span>
                        <span className="detail-value">{locataireData.telephone}</span>
                      </div>
                      {locataireData.telephone_secondaire && (
                        <div className="detail-row">
                          <span className="detail-label">Téléphone 2</span>
                          <span className="detail-value">{locataireData.telephone_secondaire}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(locataireData.profession || locataireData.employeur || locataireData.revenus_mensuels) && (
                    <div className="detail-card">
                      <h3>
                        <span className="card-icon">💼</span>
                        Situation professionnelle
                      </h3>
                      <div className="detail-grid">
                        {locataireData.profession && (
                          <div className="detail-row">
                            <span className="detail-label">Profession</span>
                            <span className="detail-value">{locataireData.profession}</span>
                          </div>
                        )}
                        {locataireData.employeur && (
                          <div className="detail-row">
                            <span className="detail-label">Employeur</span>
                            <span className="detail-value">{locataireData.employeur}</span>
                          </div>
                        )}
                        {locataireData.revenus_mensuels && (
                          <div className="detail-row">
                            <span className="detail-label">Revenus mensuels</span>
                            <span className="detail-value highlight">{formatMoney(locataireData.revenus_mensuels)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Logement actuel / Bien en acquisition */}
{(() => {
  // Chercher d'abord dans les contrats de vente
  const contratVente = locataireData.contrats?.find((c: any) => 
    c.type_contrat === 'VENTE' && c.statut === 'ACTIF'
  );
  
  if (contratVente) {
    const bien = contratVente.bien;
    return (
      <div className="detail-card">
        <h3>
          <span className="card-icon">💰</span>
          Contrat de vente
        </h3>
        <div className="detail-grid">
          <div className="detail-row">
            <span className="detail-label">Bien</span>
            <span className="detail-value">{bien?.nom || 'Non spécifié'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Adresse</span>
            <span className="detail-value">
              {bien?.adresse ? `${bien.adresse}, ${bien.commune || ''}`.replace(/, $/, '') : 'Adresse non disponible'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Prix de vente</span>
            <span className="detail-value highlight">
              {formatMoney(contratVente.prix_vente || 0)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date du contrat</span>
            <span className="detail-value">{formatDate(contratVente.date_debut)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">N° contrat</span>
            <span className="detail-value">{contratVente.numero_contrat}</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Sinon, utiliser bien_actuel
  if (locataireData.bien_actuel) {
    const bien = locataireData.bien_actuel;
    return (
      <div className="detail-card">
        <h3>
          <span className="card-icon">🏠</span>
          {bien.statut === 'EN_VENTE' || bien.statut === 'VENDU' ? 'Bien en acquisition' : 'Logement actuel'}
        </h3>
        <div className="detail-grid">
          <div className="detail-row">
            <span className="detail-label">Bien</span>
            <span className="detail-value">{bien.nom}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Adresse</span>
            <span className="detail-value">{bien.adresse}</span>
          </div>
          {bien.prix_vente ? (
            <div className="detail-row">
              <span className="detail-label">Prix de vente</span>
              <span className="detail-value highlight">{formatMoney(bien.prix_vente)}</span>
            </div>
          ) : bien.loyer_mensuel > 0 ? (
            <>
              <div className="detail-row">
                <span className="detail-label">Loyer</span>
                <span className="detail-value highlight">{formatMoney(bien.loyer_mensuel)}</span>
              </div>
              {bien.charges > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Charges</span>
                  <span className="detail-value">{formatMoney(bien.charges)}</span>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
  }
  
  return null;
})()}

                  {locataireData.notes && (
                    <div className="detail-card">
                      <h3>
                        <span className="card-icon">📝</span>
                        Notes
                      </h3>
                      <p className="notes-text">{locataireData.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Contrats */}
              {activeTab === 'contrats' && (
                <div className="contrats-tab">
                  <div className="tab-actions">
                    <button 
                      className="btn-add-bien"
                      onClick={handleAddContrat}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">➕</span>
                      Nouveau contrat
                    </button>
                    <button 
                      className="btn-refresh"
                      onClick={refreshLocataireData}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">🔄</span>
                      {isLoading ? 'Chargement...' : 'Rafraîchir'}
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Chargement des contrats...</p>
                    </div>
                  ) : locataireData.contrats && locataireData.contrats.length > 0 ? (
                    <div className="contrats-list-compact">
                      {locataireData.contrats.map((contrat: any) => (
                        <div key={contrat.id} className="contrat-item-with-actions">
                          <ContratCard
                            contrat={contrat}
                            onView={handleViewContrat}
                            onEdit={handleEditContrat}
                            isCompact={true}
                          />
                          <div className="contrat-actions-group">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEditContrat(contrat)}
                              title="Modifier le contrat"
                            >
                              ✏️
                            </button>
                            <button
  className="action-btn export"
  onClick={() => contrat.type_contrat === 'VENTE' 
    ? handleExporterContratVente(contrat)
    : handleExporterContrat(contrat)}
  title={contrat.type_contrat === 'VENTE' ? "Exporter le contrat de vente" : "Exporter le bail"}
>
  📄
</button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteContrat(contrat)}
                              title="Supprimer le contrat"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-tab">
                      <span className="empty-icon">📄</span>
                      <p>Aucun contrat pour ce locataire</p>
                      <button 
                        className="btn-add-contrat empty-btn"
                        onClick={handleAddContrat}
                      >
                        Créer un contrat
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Paiements */}
              {activeTab === 'paiements' && (
                <div className="paiements-tab">
                  <div className="tab-actions">
                    <button 
                      className="btn-add-bien"
                      onClick={handleAddPaiement}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">➕</span>
                      Nouveau paiement
                    </button>
                    <button 
                      className="btn-refresh"
                      onClick={() => {
                        chargerPaiements();
                        setRefreshKey(prev => prev + 1);
                      }}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">🔄</span>
                      Rafraîchir
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Chargement des paiements...</p>
                    </div>
                  ) : paiements && paiements.length > 0 ? (
                    <div className="paiements-list">
                      {paiements.map((paiement) => (
                        <div key={paiement.id} className="paiement-card">
                          <div className="paiement-header">
                            <div className="paiement-title">
                              <span className="paiement-icon">💰</span>
                              <span className="paiement-reference">{paiement.reference || 'Paiement'}</span>
                            </div>
                            <span className={`paiement-statut ${paiement.statut.toLowerCase()}`}>
                              {paiement.statut}
                            </span>
                          </div>
                          
                          <div className="paiement-body">
                            <div className="paiement-info-row">
                              <div className="paiement-info">
                                <span className="info-label">Montant</span>
                                <span className="info-value highlight">{formatMoney(paiement.montant)}</span>
                              </div>
                              <div className="paiement-info">
                                <span className="info-label">Date</span>
                                <span className="info-value">{formatDate(paiement.date_paiement)}</span>
                              </div>
                            </div>
                            
                            <div className="paiement-info-row">
                              <div className="paiement-info">
                                <span className="info-label">Mode</span>
                                <span className="info-value">{paiement.mode_paiement}</span>
                              </div>
                              <div className="paiement-info">
                                <span className="info-label">Mois</span>
                                <span className="info-value">{paiement.mois_concerne || '-'}</span>
                              </div>
                            </div>
                            
                            {paiement.contrat_numero && (
                              <div className="paiement-contrat">
                                <span className="contrat-icon">📄</span>
                                <span className="contrat-numero">{paiement.contrat_numero}</span>
                              </div>
                            )}
                            
                            {paiement.commentaire && (
                              <div className="paiement-commentaire">
                                <span className="commentaire-icon">📝</span>
                                <span className="commentaire-texte">{paiement.commentaire}</span>
                              </div>
                            )}
                          </div>
                                                  
                        <div className="paiement-footer">
                          <button
                            className="action-btn print"
                            onClick={() => handleImprimerQuittance(paiement)}
                            title="Imprimer la quittance"
                          >
                            🖨️
                          </button>
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditPaiement(paiement)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeletePaiement(paiement)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-tab">
                      <span className="empty-icon">💰</span>
                      <p>Aucun paiement pour ce locataire</p>
                      <button 
                        className="btn-add-bien empty-btn"
                        onClick={handleAddPaiement}
                      >
                        Enregistrer un paiement
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Documents */}
              {activeTab === 'documents' && (
  <div className="documents-tab">
    <div className="tab-actions">
      <button 
        className="btn-add-bien"
        onClick={handleAddDocument}
        disabled={isLoading}
      >
        <span className="btn-icon">➕</span>
        Ajouter des documents
      </button>
      <button 
        className="btn-refresh"
        onClick={() => {
          chargerDocuments();
          setRefreshKey(prev => prev + 1);
        }}
        disabled={isLoading}
      >
        <span className="btn-icon">🔄</span>
        Rafraîchir
      </button>
    </div>
    
    {isLoading ? (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des documents...</p>
      </div>
    ) : documents && documents.length > 0 ? (
      <div className="documents-grid">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onDelete={handleDeleteDocument}
            onUpdate={handleUpdateDocument}
          />
        ))}
      </div>
    ) : (
      <div className="empty-tab">
        <span className="empty-icon">📎</span>
        <p>Aucun document pour ce locataire</p>
        <button 
          className="btn-add-bien empty-btn"
          onClick={handleAddDocument}
        >
          Ajouter des documents
        </button>
      </div>
    )}
  </div>
)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pied */}
        <div className="modal-footer locataire-detail-footer">
          <button className="btn-cancel" onClick={onClose}>
            Fermer
          </button>
          <button 
            className="btn-submit"
            onClick={() => {
              onClose();
              onEdit(locataireData);
            }}
          >
            ✏️ Modifier
          </button>
        </div>
      </motion.div>

      {/* Modale formulaire contrat */}
      <AnimatePresence>
        {showContratForm && (
          <ContratForm
            contrat={selectedContrat}
            locataire_id={locataireData.id}
            onClose={() => setShowContratForm(false)}
            onSuccess={handleContratSuccess}
          />
        )}
      </AnimatePresence>

      {/* Modale formulaire paiement */}
      <AnimatePresence>
        {showPaiementForm && (
          <PaiementForm
            paiement={selectedPaiement}
            locataire_id={locataireData.id}
            onClose={() => setShowPaiementForm(false)}
            onSuccess={handlePaiementSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
  {showDocumentForm && (
    <DocumentForm
      locataire_id={locataireData.id}
      onClose={() => setShowDocumentForm(false)}
      onSuccess={() => {
        setShowDocumentForm(false);
        chargerDocuments();
        setRefreshKey(prev => prev + 1);
        toast.success('Documents uploadés avec succès');
      }}
    />
  )}
</AnimatePresence>

      {/* Modale de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={`Supprimer ${itemToDelete?.type === 'contrat' ? 'le contrat' : 'le paiement'}`}
        message={`Êtes-vous sûr de vouloir supprimer ${itemToDelete?.type === 'contrat' ? 'ce contrat' : 'ce paiement'} ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
      />
    </motion.div>
  );
}