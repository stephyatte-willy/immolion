// app/commissions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import CommissionsProprietaires from '@/app/components/paiements/CommissionsProprietaires';
import { useRouter } from 'next/navigation';
import './commissions.css';

export default function CommissionsPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [selectedProprietaire, setSelectedProprietaire] = useState<number | undefined>(undefined);
  const [proprietaires, setProprietaires] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    setUtilisateur(JSON.parse(userStr));
    chargerEntreprise();
    chargerProprietaires();
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

  const chargerProprietaires = async () => {
    try {
      const response = await fetch('/api/proprietaires');
      const data = await response.json();
      if (data.success) {
        setProprietaires(data.proprietaires);
      }
    } catch (error) {
      console.error('Erreur chargement proprietaires:', error);
    }
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
    <div className="commissions-page-container">
      <Sidebar />
      
      <div className="commissions-page-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Gestion des commissions"
          sousTitre="Suivez et gérez les commissions des propriétaires"
          entreprise={entreprise?.nom}
          entrepriseLogo={entreprise?.logo_url}
        />
        
        <div className="commissions-page-content">
          <div className="filtre-proprietaire">
            <label>Filtrer par propriétaire:</label>
            <select
              value={selectedProprietaire || ''}
              onChange={(e) => setSelectedProprietaire(e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">Tous les propriétaires</option>
              {proprietaires.map(prop => (
                <option key={prop.id} value={prop.id}>
                  {prop.prenom} {prop.nom}
                </option>
              ))}
            </select>
          </div>
          
          <CommissionsProprietaires 
            proprietaireId={selectedProprietaire}
            onVersement={() => {
              // Rafraîchir après versement
            }}
          />
        </div>
      </div>
    </div>
  );
}