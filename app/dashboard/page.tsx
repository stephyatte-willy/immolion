'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/providers/ThemeProvider';
import { authService } from '@/app/services/authService';
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import KpiCard from '@/app/components/dashboard/KpiCard';
import KpiFinancier from '@/app/components/dashboard/KpiFinancier';
import EvolutionChart from '@/app/components/dashboard/EvolutionChart';
import RepartitionChart from '@/app/components/dashboard/RepartitionChart';
import TopLocataires from '@/app/components/dashboard/TopLocataires';
import ActivitesRecentes from '@/app/components/dashboard/ActivitesRecentes';
import AlertCard from '@/app/components/dashboard/AlertCard';
import './dashboard.css';

export default function Dashboard() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null); // ✅ AJOUT DE L'ÉTAT entreprise
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

  const chargerEntreprise = async () => {
    try {
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      if (data.success) setEntreprise(data.entreprise);
    } catch (error) {
      console.error('❌ Erreur chargement entreprise:', error);
    }
  };

  const chargerDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.dashboard);
      } else {
        console.error('Erreur chargement dashboard:', data.erreur);
      }
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

  const { kpis, finances, evolutionRevenus, repartitionTypes, topLocataires, dernieresActivites, alertes, canViewFinances } = dashboardData;

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <div className="dashboard-main">
        <Header 
          utilisateur={utilisateur} 
          titre="Tableau de bord"
          sousTitre={`Bienvenue, ${utilisateur?.prenom}`}
          entreprise={entreprise?.nom}        // ✅ Passage du nom de l'entreprise
          entrepriseLogo={entreprise?.logo_url} // ✅ Passage du logo
        />
        
        <div className="dashboard-content">
          {/* KPIs Généraux */}
          <motion.div 
            className="kpi-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <KpiCard
              title="Biens gérés"
              value={kpis.totalBiens.toString()}
              icon="🏢"
              trend={+5.2}
              color="linear-gradient(135deg, #D4AF37, #996515)"
            />
            <KpiCard
              title="Locataires actifs"
              value={kpis.totalLocataires.toString()}
              icon="👥"
              trend={+8.3}
              color="linear-gradient(135deg, #2E5C4E, #1A2F4B)"
            />
            <KpiCard
              title="Contrats actifs"
              value={kpis.totalContratsActifs.toString()}
              icon="📄"
              trend={+3.7}
              color="linear-gradient(135deg, #8B5CF6, #4F46E5)"
            />
            <KpiCard
              title="Taux d'occupation"
              value={`${kpis.tauxOccupation}%`}
              icon="📊"
              trend={+2.1}
              color="linear-gradient(135deg, #F59E0B, #D97706)"
            />
          </motion.div>

          {/* KPIs Financiers (conditionnels) */}
          <motion.div 
            className="kpi-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <KpiFinancier
              title="Revenus du mois"
              value={canViewFinances ? formatMoney(finances?.revenusMoisActuel || 0) : '•••••••'}
              icon="💰"
              trend={canViewFinances ? finances?.variationRevenus : undefined}
              color="linear-gradient(135deg, #10b981, #059669)"
              isLocked={!canViewFinances}
            />
            <KpiFinancier
              title="Impayés"
              value={canViewFinances ? formatMoney(finances?.totalImpayes || 0) : '•••••••'}
              icon="⚠️"
              color="linear-gradient(135deg, #ef4444, #dc2626)"
              isLocked={!canViewFinances}
            />
            <KpiFinancier
              title="Pénalités"
              value={canViewFinances ? formatMoney(finances?.totalPenalites || 0) : '•••••••'}
              icon="📈"
              color="linear-gradient(135deg, #f59e0b, #d97706)"
              isLocked={!canViewFinances}
            />
            <KpiFinancier
              title="Prévision mensuelle"
              value={canViewFinances ? formatMoney(finances?.previsionMensuelle || 0) : '•••••••'}
              icon="🔮"
              color="linear-gradient(135deg, #8B5CF6, #4F46E5)"
              isLocked={!canViewFinances}
            />
          </motion.div>

          {/* Graphiques */}
          <div className="dashboard-grid">
            <motion.div 
              className="grid-item large"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <EvolutionChart 
                data={evolutionRevenus} 
                isLocked={!canViewFinances}
              />
            </motion.div>

            <motion.div 
              className="grid-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <RepartitionChart data={repartitionTypes} />
            </motion.div>

            <motion.div 
              className="grid-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <TopLocataires 
                locataires={topLocataires} 
                isLocked={!canViewFinances}
              />
            </motion.div>

            <motion.div 
              className="grid-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <AlertCard alerts={alertes} />
            </motion.div>

            <motion.div 
              className="grid-item large"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <ActivitesRecentes activites={dernieresActivites} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}