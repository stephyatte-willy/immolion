// app/components/layout/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import './Sidebar.css';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊', path: '/dashboard' },
  { id: 'biens', label: 'Biens', icon: '🏢', path: '/biens' },
  { id: 'locataires', label: 'Locataires', icon: '👥', path: '/locataires' },
  { id: 'paiements', label: 'Paiements', icon: '💰', path: '/paiements' },
  { id: 'documents', label: 'Documents', icon: '📄', path: '/documents' },
  { id: 'calendrier', label: 'Calendrier', icon: '📅', path: '/calendrier' },
  { id: 'parametres', label: 'Paramètres', icon: '⚙️', path: '/parametres' },
];

export default function Sidebar() {
  const [estReduit, setEstReduit] = useState(false);
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const pathname = usePathname();

  // Fermer la sidebar mobile quand on change de page
  useEffect(() => {
    setMobileOuvert(false);
  }, [pathname]);

  // Gérer le redimensionnement
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

  return (
    <>
      {/* Overlay mobile */}
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

      {/* Bouton menu mobile */}
      <button 
        className="mobile-menu-button"
        onClick={() => setMobileOuvert(!mobileOuvert)}
      >
        <span className="menu-icon">☰</span>
      </button>

      {/* Sidebar */}
      <motion.aside 
        className={`sidebar ${estReduit ? 'reduit' : ''} ${mobileOuvert ? 'mobile-ouvert' : ''}`}
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">🦁</div>
            {!estReduit && <span className="logo-text">ImmoLion</span>}
          </div>
          
          <button 
            className="toggle-sidebar"
            onClick={() => setEstReduit(!estReduit)}
          >
            {estReduit ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link 
              key={item.id}
              href={item.path}
              className={`nav-item ${pathname === item.path ? 'actif' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!estReduit && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </>
              )}
              {estReduit && item.badge && (
                <span className="nav-badge-mini">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            {!estReduit && (
              <div className="user-details">
                <span className="user-name">Admin</span>
                <span className="user-role">Super Admin</span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}