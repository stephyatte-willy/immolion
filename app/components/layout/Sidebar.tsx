'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLES } from '@/app/lib/roles';
import './Sidebar.css';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { 
    id: 'dashboard', 
    label: 'Tableau de bord', 
    icon: '📊', 
    path: '/dashboard',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROPRIETAIRE', 'GESTIONNAIRE']
  },
  { 
    id: 'biens', 
    label: 'Biens', 
    icon: '🏢', 
    path: '/biens',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROPRIETAIRE', 'GESTIONNAIRE']
  },
  { 
    id: 'locataires', 
    label: 'Locataires', 
    icon: '👥', 
    path: '/locataires',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROPRIETAIRE', 'GESTIONNAIRE']
  },
  { 
    id: 'paiements', 
    label: 'Paiements', 
    icon: '💰', 
    path: '/paiements',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROPRIETAIRE', 'GESTIONNAIRE']
  },
  { 
    id: 'documents', 
    label: 'Documents', 
    icon: '📄', 
    path: '/documents',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROPRIETAIRE', 'GESTIONNAIRE', 'LOCATAIRE']
  },
  { 
    id: 'calendrier', 
    label: 'Calendrier', 
    icon: '📅', 
    path: '/calendrier',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROPRIETAIRE', 'GESTIONNAIRE']
  },
  { 
    id: 'parametres', 
    label: 'Paramètres', 
    icon: '⚙️', 
    path: '/parametres',
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
];

const getBadgeCount = (itemId: string): number | undefined => {
  const badges: Record<string, number> = {
    'documents': 3,
    'paiements': 2,
    'calendrier': 1
  };
  return badges[itemId];
};

export default function Sidebar() {
  const [estReduit, setEstReduit] = useState(false);
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (userStr) {
      try {
        setUtilisateur(JSON.parse(userStr));
      } catch (e) {
        console.error('Erreur parsing utilisateur');
      }
    }

    // Charger les infos de l'entreprise
    fetch('/api/entreprise')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEntreprise(data.entreprise);
      });
  }, []);

  useEffect(() => {
    setMobileOuvert(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setEstReduit(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredMenuItems = menuItems.filter(item => {
    if (!utilisateur) return true;
    if (!item.roles) return true;
    return item.roles.includes(utilisateur.role);
  });

  const getUserInitials = () => {
    if (!utilisateur) return '👤';
    return `${utilisateur.prenom?.[0] || ''}${utilisateur.nom?.[0] || ''}`.toUpperCase();
  };

  const getRoleLabel = () => {
    if (!utilisateur) return 'Visiteur';
    return ROLES[utilisateur.role as keyof typeof ROLES]?.nom || utilisateur.role;
  };

  return (
    <>
      <AnimatePresence>
        {mobileOuvert && (
          <motion.div 
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOuvert(false)}
          />
        )}
      </AnimatePresence>

      <button 
        className="mobile-menu-button"
        onClick={() => setMobileOuvert(!mobileOuvert)}
      >
        <span className="menu-icon">☰</span>
      </button>

      <motion.aside 
        className={`immolion-sidebar ${estReduit ? 'reduit' : ''} ${mobileOuvert ? 'mobile-ouvert' : ''}`}
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-wrapper">
              <div className="logo-glow"></div>
              <div className="logo-icon">
                <img src="/logo_immolion.png" alt="ImmoLion" />
                </div>
            </div>
            {!estReduit && (
              <div className="brand-text">
                <span className="brand-name">ImmoLion</span>
                <div className="sidebar-company">
            <div className="company-badge">
              <span className="company-badge-name">Gestion Immobilière</span>
            </div>
          </div>
              </div>
              
            )}
          </div>
          
          <button 
            className="toggle-sidebar"
            onClick={() => setEstReduit(!estReduit)}
          >
            {estReduit ? '→' : '←'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => {
            const badge = getBadgeCount(item.id);
            return (
              <Link 
                key={item.id}
                href={item.path}
                className={`nav-item ${pathname === item.path ? 'actif' : ''} ${pathname?.startsWith(item.path + '/') ? 'actif' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {!estReduit && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {badge && badge > 0 && (
                      <span className="nav-badge">{badge}</span>
                    )}
                  </>
                )}
                {estReduit && badge && badge > 0 && (
                  <span className="nav-badge-mini">{badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {utilisateur?.avatar ? (
                <img src={utilisateur.avatar} alt="Avatar" />
              ) : (
                getUserInitials()
              )}
            </div>
            {!estReduit && (
              <div className="user-details">
                <span className="user-name">
                  {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Invité'}
                </span>
                <span className="user-role">
                  {getRoleLabel()}
                </span>
              </div>
            )}
          </div>
          
          {!estReduit && (
            <button 
              className="logout-button"
              onClick={() => {
                localStorage.removeItem('utilisateur');
                localStorage.removeItem('estConnecte');
                window.location.href = '/connexion';
              }}
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Déconnexion</span>
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}