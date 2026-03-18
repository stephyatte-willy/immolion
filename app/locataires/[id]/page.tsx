'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import { useTheme } from '@/app/providers/ThemeProvider';
import { STATUTS_LOCATAIRE, MOIS } from '@/app/types/locataires';
import toast from 'react-hot-toast';
import '@/app/locataires/locataires.css';

export default function LocataireDetail({ params }: { params: Promise<{ id: string }> }) {
  const [locataire, setLocataire] = useState<any>(null);
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const router = useRouter();
  const { formatMoney, formatDate } = useTheme();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    setUtilisateur(JSON.parse(userStr));
    chargerEntreprise();
  }, []);

  useEffect(() => {
    if (id) {
      chargerLocataire();
    }
  }, [id]);

  const chargerEntreprise = async () => {
    try {
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      if (data.success) setEntreprise(data.entreprise);
    } catch (error) {
      console.error('Erreur chargement entreprise:', error);
    }
  };

  const chargerLocataire = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/locataires/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setLocataire(data.locataire);
      } else {
        toast.error('Locataire non trouvé');
        router.push('/locataires');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatutLabel = (statut: string) => {
    const statutObj = STATUTS_LOCATAIRE.find(s => s.value === statut);
    return statutObj?.label || statut;
  };

  if (isLoading || !locataire) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du locataire...</p>
      </div>
    );
  }

  return (
    <div className="locataires-container">
      <Sidebar />
      
      <div className="locataires-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Détail du locataire"
          sousTitre={`${locataire.prenom} ${locataire.nom}`}
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="locataires-content">
          <div className="detail-header">
            <button 
              className="back-button"
              onClick={() => router.push('/locataires')}
            >
              ← Retour
            </button>
            <button 
              className="edit-button"
              onClick={() => router.push(`/locataires/${id}/edit`)}
            >
              ✏️ Modifier
            </button>
          </div>

          <div className="detail-tabs">
            <button 
              className={`tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Informations
            </button>
            <button 
              className={`tab ${activeTab === 'contrats' ? 'active' : ''}`}
              onClick={() => setActiveTab('contrats')}
            >
              Contrats
            </button>
            <button 
              className={`tab ${activeTab === 'paiements' ? 'active' : ''}`}
              onClick={() => setActiveTab('paiements')}
            >
              Paiements
            </button>
            <button 
              className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
          </div>

          <motion.div 
            className="detail-content"
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'info' && (
              <div className="info-section">
                <div className="info-card">
                  <h3>Identité</h3>
                  <div className="info-grid">
                    <div className="info-row">
                      <span className="label">Nom complet</span>
                      <span className="value">{locataire.prenom} {locataire.nom}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Date de naissance</span>
                      <span className="value">
                        {locataire.date_naissance ? formatDate(locataire.date_naissance) : 'Non renseignée'}
                        {locataire.lieu_naissance && ` à ${locataire.lieu_naissance}`}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Nationalité</span>
                      <span className="value">{locataire.nationalite || 'Non renseignée'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <h3>Contact</h3>
                  <div className="info-grid">
                    <div className="info-row">
                      <span className="label">Email</span>
                      <span className="value">{locataire.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Téléphone</span>
                      <span className="value">{locataire.telephone}</span>
                    </div>
                    {locataire.telephone_secondaire && (
                      <div className="info-row">
                        <span className="label">Téléphone 2</span>
                        <span className="value">{locataire.telephone_secondaire}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="info-card">
                  <h3>Situation professionnelle</h3>
                  <div className="info-grid">
                    <div className="info-row">
                      <span className="label">Profession</span>
                      <span className="value">{locataire.profession || 'Non renseignée'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Employeur</span>
                      <span className="value">{locataire.employeur || 'Non renseigné'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Revenus mensuels</span>
                      <span className="value">
                        {locataire.revenus_mensuels ? formatMoney(locataire.revenus_mensuels) : 'Non renseignés'}
                      </span>
                    </div>
                  </div>
                </div>

                {locataire.bien_actuel && (
                  <div className="info-card">
                    <h3>Logement actuel</h3>
                    <div className="info-grid">
                      <div className="info-row">
                        <span className="label">Bien</span>
                        <span className="value">{locataire.bien_actuel.nom}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Adresse</span>
                        <span className="value">{locataire.bien_actuel.adresse}</span>
                      </div>
                    </div>
                  </div>
                )}

                {locataire.notes && (
                  <div className="info-card">
                    <h3>Notes</h3>
                    <p className="notes-text">{locataire.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contrats' && (
              <div className="contrats-section">
                {locataire.contrats && locataire.contrats.length > 0 ? (
                  <div className="contrats-list">
                    {locataire.contrats.map((contrat: any) => (
                      <div key={contrat.id} className="contrat-card">
                        <div className="contrat-header">
                          <span className="contrat-numero">Contrat n°{contrat.numero}</span>
                          <span className={`contrat-statut ${contrat.statut.toLowerCase()}`}>
                            {contrat.statut}
                          </span>
                        </div>
                        <div className="contrat-body">
                          <p><strong>Bien:</strong> {contrat.bien_nom}</p>
                          <p><strong>Période:</strong> {formatDate(contrat.date_debut)} - {contrat.date_fin ? formatDate(contrat.date_fin) : 'En cours'}</p>
                          <p><strong>Loyer:</strong> {formatMoney(contrat.loyer_mensuel)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">Aucun contrat pour ce locataire</p>
                )}
              </div>
            )}

            {activeTab === 'paiements' && (
              <div className="paiements-section">
                {locataire.paiements && locataire.paiements.length > 0 ? (
                  <table className="paiements-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Mois concerné</th>
                        <th>Montant</th>
                        <th>Mode</th>
                        <th>Statut</th>
                        <th>Référence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locataire.paiements.map((paiement: any) => (
                        <tr key={paiement.id}>
                          <td>{formatDate(paiement.date_paiement)}</td>
                          <td>{paiement.mois_concerne}</td>
                          <td>{formatMoney(paiement.montant)}</td>
                          <td>{paiement.mode_paiement}</td>
                          <td>
                            <span className={`statut-badge ${paiement.statut.toLowerCase()}`}>
                              {paiement.statut}
                            </span>
                          </td>
                          <td>{paiement.reference || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="empty-message">Aucun paiement pour ce locataire</p>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="documents-section">
                {locataire.documents && locataire.documents.length > 0 ? (
                  <div className="documents-grid">
                    {locataire.documents.map((doc: any) => (
                      <div key={doc.id} className="document-card">
                        <div className="document-icon">📄</div>
                        <div className="document-info">
                          <h4>{doc.nom}</h4>
                          <p>{doc.type}</p>
                          <span className="document-date">Ajouté le {formatDate(doc.date_upload)}</span>
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="document-download"
                        >
                          📥
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">Aucun document pour ce locataire</p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}