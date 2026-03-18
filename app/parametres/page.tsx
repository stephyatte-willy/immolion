// app/parametres/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import InfoEntreprise from '@/app/components/parametres/InfoEntreprise';
import GestionRoles from '@/app/components/parametres/GestionRoles';
import ConfigurationGenerale from '@/app/components/parametres/ConfigurationGenerale';
import '@/app/components/layout/Header.css';

export default function Parametres() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null); // ✅ Ajout de l'état entreprise
  const [activeTab, setActiveTab] = useState('entreprise');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    setUtilisateur(JSON.parse(userStr));
    
    // ✅ Charger les informations de l'entreprise
    chargerEntreprise();
  }, []);

  // ✅ Fonction pour charger l'entreprise
  const chargerEntreprise = async () => {
    try {
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      if (data.success) {
        setEntreprise(data.entreprise);
      }
    } catch (error) {
      console.error('Erreur chargement entreprise:', error);
    }
  };

  const tabs = [
    { id: 'entreprise', label: 'Entreprise', icon: '🏢' },
    { id: 'roles', label: 'Rôles & Permissions', icon: '👥' },
    { id: 'general', label: 'Configuration', icon: '⚙️' }
  ];

  if (!utilisateur) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de vos paramètres...</p>
      </div>
    );
  }

  return (
    <div className="parametres-container">
      <Sidebar />
      <div className="parametres-main">
      
        <Header 
          utilisateur={utilisateur} 
          titre="Paramètres"
          sousTitre={`Bienvenue, ${utilisateur?.prenom}`}
          entreprise={entreprise?.nom}       
          entrepriseLogo={entreprise?.logo_url} 
        />
        
        <div className="parametres-content">
          <div className="tabs-container">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <motion.div 
            className="tab-content"
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'entreprise' && <InfoEntreprise />}
            {activeTab === 'roles' && <GestionRoles />}
            {activeTab === 'general' && <ConfigurationGenerale />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}