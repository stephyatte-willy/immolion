'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import DocumentCard from '@/app/components/documents/DocumentCard';
import DocumentForm from '@/app/components/documents/DocumentForm';
import DocumentFilters from '@/app/components/documents/DocumentFilters';
import DocumentStats from '@/app/components/documents/DocumentStats';
import ConfirmModal from '@/app/components/common/ConfirmModal';
import { useTheme } from '@/app/providers/ThemeProvider';
import { TYPES_DOCUMENTS } from '@/app/types/documents';
import toast from 'react-hot-toast';
import '@/app/components/documents/documents.css';

interface Document {
  id: number;
  bien_id?: number;
  locataire_id?: number;
  contrat_id?: number;
  type_document: string;
  nom: string;
  url: string;
  taille?: number;
  date_upload: string;
  date_expiration?: string;
  created_at: string;
  locataire_nom?: string;
  locataire_prenom?: string;
}

export default function DocumentsPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedLocataire, setSelectedLocataire] = useState<any>(null);
  const [showLocataireModal, setShowLocataireModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    parType: {} as Record<string, number>,
    parLocataire: {} as Record<string, number>,
    expirant: 0,
    expires: 0,
    tailleTotale: 0
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
    chargerDocuments();
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

  const chargerDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
        setFilteredDocuments(data.documents);
        calculerStats(data.documents);
      } else {
        toast.error('Erreur lors du chargement des documents');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const calculerStats = (data: Document[]) => {
    const total = data.length;
    
    // Compter par type
    const parType: Record<string, number> = {};
    data.forEach(doc => {
      const type = doc.type_document;
      parType[type] = (parType[type] || 0) + 1;
    });
    
    // Compter par locataire
    const parLocataire: Record<string, number> = {};
    data.forEach(doc => {
      if (doc.locataire_id) {
        const nom = `${doc.locataire_prenom || ''} ${doc.locataire_nom || ''}`.trim();
        if (nom) {
          parLocataire[nom] = (parLocataire[nom] || 0) + 1;
        }
      }
    });
    
    const today = new Date();
    const expirant = data.filter(doc => {
      if (!doc.date_expiration) return false;
      const expiration = new Date(doc.date_expiration);
      const diffDays = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return diffDays > 0 && diffDays <= 30;
    }).length;
    
    const expires = data.filter(doc => {
      if (!doc.date_expiration) return false;
      return new Date(doc.date_expiration) < today;
    }).length;
    
    const tailleTotale = data.reduce((sum, doc) => sum + (doc.taille || 0), 0);
    
    setStats({
      total,
      parType,
      parLocataire,
      expirant,
      expires,
      tailleTotale
    });
  };

  const handleFilter = (filters: any) => {
    let filtered = [...documents];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.nom.toLowerCase().includes(searchLower) ||
        `${doc.locataire_prenom} ${doc.locataire_nom}`.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type && filters.type !== 'TOUS') {
      filtered = filtered.filter(doc => doc.type_document === filters.type);
    }

    if (filters.locataire_id && filters.locataire_id !== 'TOUS') {
      filtered = filtered.filter(doc => doc.locataire_id?.toString() === filters.locataire_id);
    }

    if (filters.statut && filters.statut !== 'TOUS') {
      const today = new Date();
      if (filters.statut === 'EXPIRES') {
        filtered = filtered.filter(doc => {
          if (!doc.date_expiration) return false;
          return new Date(doc.date_expiration) < today;
        });
      } else if (filters.statut === 'EXPIRANT') {
        filtered = filtered.filter(doc => {
          if (!doc.date_expiration) return false;
          const diffDays = Math.ceil((new Date(doc.date_expiration).getTime() - today.getTime()) / (1000 * 3600 * 24));
          return diffDays > 0 && diffDays <= 30;
        });
      } else if (filters.statut === 'VALIDE') {
        filtered = filtered.filter(doc => {
          if (!doc.date_expiration) return true;
          return new Date(doc.date_expiration) >= today;
        });
      }
    }

    if (filters.dateDebut) {
      filtered = filtered.filter(doc => new Date(doc.date_upload) >= new Date(filters.dateDebut));
    }

    if (filters.dateFin) {
      filtered = filtered.filter(doc => new Date(doc.date_upload) <= new Date(filters.dateFin));
    }

    setFilteredDocuments(filtered);
  };

  const handleAddDocument = () => {
    setSelectedDocument(null);
    setShowLocataireModal(true);
  };

  const handleSelectLocataire = (locataire: any) => {
    setSelectedLocataire(locataire);
    setShowLocataireModal(false);
    setShowForm(true);
  };

  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    setSelectedLocataire(null);
    setShowForm(true);
  };

  const handleDeleteClick = (id: number) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setDocumentToDelete(doc);
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Document supprimé avec succès');
        await chargerDocuments();
        setShowDeleteConfirm(false);
        setDocumentToDelete(null);
      } else {
        toast.error(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
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
      } else {
        toast.error(data.erreur || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedLocataire(null);
    chargerDocuments();
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
    <div className="documents-container">
      <Sidebar />
      
      <div className="documents-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Gestion des documents"
          sousTitre="Centralisez et gérez tous les documents par client"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="documents-content">
          <DocumentStats stats={stats} formatDate={formatDate} />

          <div className="documents-actions-bar">
            <DocumentFilters onFilter={handleFilter} />
            
            <div className="actions-right">
              <div className="vue-selector-documents">
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
                onClick={handleAddDocument}
              >
                <span className="btn-icon">➕</span>
                Ajouter un document
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="documents-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="documents-empty">
              <span className="empty-icon">📎</span>
              <h3>Aucun document trouvé</h3>
              <p>Commencez par ajouter des documents pour vos clients</p>
              <button 
                className="btn-add empty-btn"
                onClick={handleAddDocument}
              >
                Ajouter un document
              </button>
            </div>
          ) : vueActive === 'grid' ? (
            <div className="documents-grid">
              <AnimatePresence>
                {filteredDocuments.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onDelete={handleDeleteClick}
                    onUpdate={handleUpdateDocument}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="documents-table-container">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Date d'upload</th>
                    <th>Expiration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        {doc.locataire_prenom && doc.locataire_nom ? 
                          `${doc.locataire_prenom} ${doc.locataire_nom}` : 
                          'Client inconnu'}
                      </td>
                      <td className="doc-name">
                        <span className="doc-icon">
                          {TYPES_DOCUMENTS.find(t => t.value === doc.type_document)?.icone || '📄'}
                        </span>
                        <span>{doc.nom}</span>
                      </td>
                      <td>
                        <span className="doc-type-badge">
                          {TYPES_DOCUMENTS.find(t => t.value === doc.type_document)?.label || doc.type_document}
                        </span>
                      </td>
                      <td>{new Date(doc.date_upload).toLocaleDateString('fr-FR')}</td>
                      <td>
                        {doc.date_expiration ? (
                          <span className={new Date(doc.date_expiration) < new Date() ? 'expired-text' : 'valid-text'}>
                            {new Date(doc.date_expiration).toLocaleDateString('fr-FR')}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => {
                            const win = window.open();
                            if (win) {
                              win.document.write(`<iframe src="${doc.url}" style="width:100%;height:100%;border:none;"></iframe>`);
                              win.document.close();
                            }
                          }} title="Voir">👁️</button>
                          <button onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.url;
                            link.download = doc.nom;
                            link.click();
                          }} title="Télécharger">📥</button>
                          <button onClick={() => handleEditDocument(doc)} title="Modifier">✏️</button>
                          <button onClick={() => handleDeleteClick(doc.id)} title="Supprimer">🗑️</button>
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

      {/* Modale de sélection du locataire */}
      <AnimatePresence>
        {showLocataireModal && (
          <LocataireSelectionModal
            onSelect={handleSelectLocataire}
            onClose={() => setShowLocataireModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Modale Formulaire Document */}
      <AnimatePresence>
        {showForm && (
          <DocumentForm
            locataire_id={selectedLocataire?.id}
            locataire_nom={selectedLocataire ? `${selectedLocataire.prenom} ${selectedLocataire.nom}` : undefined}
            document={selectedDocument}
            onClose={() => {
              setShowForm(false);
              setSelectedLocataire(null);
            }}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer le document"
        message={`Êtes-vous sûr de vouloir supprimer "${documentToDelete?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDocumentToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}

// ✅ Composant de sélection du locataire
function LocataireSelectionModal({ onSelect, onClose }: { onSelect: (locataire: any) => void; onClose: () => void }) {
  const [locataires, setLocataires] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    chargerLocataires();
  }, []);

  const chargerLocataires = async () => {
    try {
      const response = await fetch('/api/locataires');
      const data = await response.json();
      if (data.success) {
        setLocataires(data.locataires);
      }
    } catch (error) {
      console.error('Erreur chargement locataires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLocataires = locataires.filter(loc => 
    `${loc.prenom} ${loc.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    loc.email?.toLowerCase().includes(search.toLowerCase()) ||
    loc.telephone?.includes(search)
  );

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content locataire-selection-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <span className="title-icon">👥</span>
            <h2>Sélectionner un client</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Rechercher un client (nom, email, téléphone)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement des clients...</p>
            </div>
          ) : filteredLocataires.length === 0 ? (
            <div className="empty-tab">
              <span className="empty-icon">👥</span>
              <p>Aucun client trouvé</p>
            </div>
          ) : (
            <div className="locataires-list">
              {filteredLocataires.map((loc) => (
                <motion.div
                  key={loc.id}
                  className="locataire-item"
                  onClick={() => onSelect(loc)}
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="locataire-avatar">
                    {loc.prenom?.[0]}{loc.nom?.[0]}
                  </div>
                  <div className="locataire-info">
                    <div className="locataire-nom">{loc.prenom} {loc.nom}</div>
                    <div className="locataire-details">
                      <span className="locataire-email">{loc.email}</span>
                      <span className="locataire-tel">{loc.telephone}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Annuler
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}