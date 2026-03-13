// app/dashboard/page.tsx
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
import './dashboard.css';

export default function Dashboard() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) {
      router.push('/connexion');
      return;
    }
    
    setUtilisateur(JSON.parse(userStr));
    chargerDashboard();
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
        />
        
        <div className="dashboard-content">
          {/* KPIs */}
          <motion.div 
            className="kpi-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <KpiCard
              title="Revenus mensuels"
              value={`${dashboardData.revenusMensuels.toLocaleString()} €`}
              icon="💰"
              trend={+12.5}
              color="linear-gradient(135deg, #8B5CF6, #4F46E5)"
            />
            <KpiCard
              title="Biens gérés"
              value={dashboardData.nbBiens.toString()}
              icon="🏢"
              trend={+5.2}
              color="linear-gradient(135deg, #EC4899, #A855F7)"
            />
            <KpiCard
              title="Taux d'occupation"
              value={`${dashboardData.tauxOccupation}%`}
              icon="📊"
              trend={-2.1}
              color="linear-gradient(135deg, #F59E0B, #D97706)"
            />
            <KpiCard
              title="Loyers impayés"
              value={`${dashboardData.impayés.toLocaleString()} €`}
              icon="⚠️"
              trend={-8.3}
              color="linear-gradient(135deg, #EF4444, #DC2626)"
            />
          </motion.div>

          {/* Graphiques et cartes */}
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