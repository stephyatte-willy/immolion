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

export default function Sidebar() {
  const [estReduit, setEstReduit] = useState(false); // ✅ Toujours false au départ
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<any>(null);
  const pathname = usePathname();

  // Charger les infos utilisateur
  useEffect(() => {
    const userStr = localStorage.getItem('utilisateur');
    if (userStr) {
      try {
        setUtilisateur(JSON.parse(userStr));
      } catch (e) {
        console.error('Erreur parsing utilisateur');
      }
    }

    fetch('/api/entreprise')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEntreprise(data.entreprise);
      });
  }, []);

  // Charger l'état sauvegardé APRÈS le premier affichage
  useEffect(() => {
    // Utiliser setTimeout pour ne pas bloquer le premier affichage
    const timer = setTimeout(() => {
      const savedState = localStorage.getItem('sidebar-reduit');
      if (savedState !== null) {
        setEstReduit(savedState === 'true');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setMobileOuvert(false);
  }, [pathname]);

  // Gérer le redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOuvert(false);
      } else {
        // Sur mobile, on force l'état normal (non réduit)
        setEstReduit(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      // Sur mobile, on ouvre/ferme le menu overlay
      setMobileOuvert(!mobileOuvert);
    } else {
      // Sur desktop, on réduit/agrandit
      const newState = !estReduit;
      setEstReduit(newState);
      localStorage.setItem('sidebar-reduit', String(newState));
    }
  };

  const closeMobileSidebar = () => {
    setMobileOuvert(false);
  };

  const resetSidebar = () => {
    setEstReduit(false);
    localStorage.setItem('sidebar-reduit', 'false');
  };

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
      {/* Overlay pour mobile */}
      <AnimatePresence>
        {mobileOuvert && (
          <motion.div 
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Bouton menu mobile */}
      <button 
        className="mobile-menu-button"
        onClick={toggleSidebar}
        aria-label="Menu"
      >
        <span className="menu-icon">☰</span>
      </button>

      {/* Sidebar */}
      <div 
        className={`immolion-sidebar ${estReduit ? 'reduit' : ''} ${mobileOuvert ? 'mobile-ouvert' : ''}`}
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
                <span className="brand-name">DANFEKIMMO</span>
                <span className="brand-tagline">Gestion Immobilière</span>
              </div>
            )}
          </div>
          
          {/* Bouton de réduction (visible sur desktop) */}
          {window.innerWidth > 768 && (
            <button 
              className="toggle-sidebar"
              onClick={toggleSidebar}
              title={estReduit ? "Développer" : "Réduire"}
            >
              {estReduit ? '→' : '←'}
            </button>
          )}
          
          {/* Bouton de fermeture pour mobile */}
          {window.innerWidth <= 768 && mobileOuvert && (
            <button 
              className="close-sidebar-mobile"
              onClick={closeMobileSidebar}
              title="Fermer"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => {
            const badge = 0;
            return (
              <Link 
                key={item.id}
                href={item.path}
                className={`nav-item ${pathname === item.path ? 'actif' : ''} ${pathname?.startsWith(item.path + '/') ? 'actif' : ''}`}
                title={estReduit ? item.label : ''}
                onClick={closeMobileSidebar}
              >
                <span className="nav-icon">{item.icon}</span>
                {!estReduit && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {badge > 0 && (
                      <span className="nav-badge">{badge}</span>
                    )}
                  </>
                )}
                {estReduit && badge > 0 && (
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
                <span className="avatar-initials">{getUserInitials()}</span>
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
                // ✅ Réinitialiser l'état du menu au prochain chargement
                localStorage.removeItem('sidebar-reduit');
                window.location.href = '/connexion';
              }}
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Déconnexion</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}