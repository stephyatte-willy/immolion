'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { authService } from './../services/authService';
import { dashboardService, DashboardData } from './../services/dashboardService';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import KpiCard from '@/app/components/dashboard/KpiCard';
import ChartRevenue from '@/app/components/dashboard/ChartRevenue';
import RecentPayments from '@/app/components/dashboard/RecentPayments';
import ActivityFeed from '@/app/components/dashboard/ActivityFeed';
import PropertyMap from '@/app/components/dashboard/PropertyMap';
import CalendarWidget from '@/app/components/dashboard/CalendarWidget';
import AlertCard from '@/app/components/dashboard/AlertCard';
import { useTheme } from '@/app/providers/ThemeProvider';
import './dashboard.css';

export default function Dashboard() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const router = useRouter();
  const { formatMoney } = useTheme();

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    
    setUtilisateur(JSON.parse(userStr));
    chargerDashboard();
    chargerEntreprise();
  }, []);

  useEffect(() => {
  // Vérifier que le thème est appliqué
  const currentTheme = document.documentElement.getAttribute('data-theme');
  console.log('🎨 Thème actuel dans dashboard:', currentTheme);
}, []);

  const chargerDashboard = async () => {
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setChargement(false);
    }
  };

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

  if (chargement || !dashboardData) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de votre espace ImmoLion...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <div className="dashboard-main">
        <Header 
  utilisateur={utilisateur} 
  titre="Tableau de bord"
  sousTitre={`Bienvenue, ${utilisateur?.prenom}`}
  entreprise={entreprise?.nom}
  entrepriseLogo={entreprise?.logo_url}  // Ajouter cette ligne
/>
        
        <div className="dashboard-content">
          <motion.div 
            className="kpi-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <KpiCard
              title="Revenus mensuels"
              value={formatMoney(dashboardData.revenusMensuels)}
              icon="💰"
              trend={+12.5}
              color="linear-gradient(135deg, #D4AF37, #996515)"
            />
            <KpiCard
              title="Biens gérés"
              value={dashboardData.nbBiens.toString()}
              icon="🏢"
              trend={+5.2}
              color="linear-gradient(135deg, #1A2F4B, #2E5C4E)"
            />
            <KpiCard
              title="Taux d'occupation"
              value={`${dashboardData.tauxOccupation}%`}
              icon="📊"
              trend={-2.1}
              color="linear-gradient(135deg, #F4E5B9, #D4AF37)"
            />
            <KpiCard
              title="Loyers impayés"
              value={formatMoney(dashboardData.impayés)}
              icon="⚠️"
              trend={-8.3}
              color="linear-gradient(135deg, #8B6B4D, #996515)"
            />
          </motion.div>

          <div className="dashboard-grid">
            <motion.div 
              className="grid-item large"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <ChartRevenue data={dashboardData.revenusMensuelsData} />
            </motion.div>

            <motion.div 
              className="grid-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <AlertCard alerts={dashboardData.alertes} />
            </motion.div>

            <motion.div 
              className="grid-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <CalendarWidget events={dashboardData.evenements} />
            </motion.div>

            <motion.div 
              className="grid-item large"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <PropertyMap biens={dashboardData.biens} />
            </motion.div>

            <motion.div 
              className="grid-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <RecentPayments paiements={dashboardData.paiementsRecents} />
            </motion.div>

            <motion.div 
              className="grid-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <ActivityFeed activites={dashboardData.activitesRecentes} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
