// app/components/layout/Header.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from './../../services/authService';
import ThemeToggle from '@/app/components/dashboard/ThemeToggle';
import './Header.css';

interface HeaderProps {
  utilisateur: any;
  titre: string;
  sousTitre?: string;
}

export default function Header({ utilisateur, titre, sousTitre }: HeaderProps) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [notificationsOuvert, setNotificationsOuvert] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await authService.deconnecter();
    localStorage.removeItem('utilisateur');
    localStorage.removeItem('estConnecte');
    router.push('/connexion');
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1 className="header-titre">{titre}</h1>
        {sousTitre && <p className="header-sous-titre">{sousTitre}</p>}
      </div>

      <div className="header-right">
        {/* Recherche */}
        <div className="header-search">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Rechercher..."
            className="search-input"
          />
        </div>

        {/* Notifications */}
        <div className="header-notifications">
          <button 
            className="notifications-button"
            onClick={() => setNotificationsOuvert(!notificationsOuvert)}
          >
            <span className="notifications-icon">🔔</span>
            <span className="notifications-badge">3</span>
          </button>
          
          {notificationsOuvert && (
            <motion.div 
              className="notifications-dropdown"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="notifications-header">
                <h3>Notifications</h3>
                <button>Marquer tout comme lu</button>
              </div>
              <div className="notifications-list">
                <div className="notification-item non-lu">
                  <div className="notification-icon">💰</div>
                  <div className="notification-content">
                    <p>Paiement reçu - Appartement A12</p>
                    <span>Il y a 5 minutes</span>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon">🔧</div>
                  <div className="notification-content">
                    <p>Intervention terminée - Chauffage</p>
                    <span>Il y a 2 heures</span>
                  </div>
                </div>
                <div className="notification-item non-lu">
                  <div className="notification-icon">📄</div>
                  <div className="notification-content">
                    <p>Nouveau document - Bail Martin</p>
                    <span>Il y a 1 jour</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profil */}
        <div className="header-profile">
          <button 
            className="profile-button"
            onClick={() => setMenuOuvert(!menuOuvert)}
          >
            <div className="profile-avatar">
              {utilisateur?.avatar ? (
                <img src={utilisateur.avatar} alt={utilisateur.prenom} />
              ) : (
                <span>{utilisateur?.prenom?.[0]}{utilisateur?.nom?.[0]}</span>
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">{utilisateur?.prenom} {utilisateur?.nom}</span>
              <span className="profile-role">{utilisateur?.role}</span>
            </div>
          </button>

          {menuOuvert && (
            <motion.div 
              className="profile-dropdown"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <a href="/profil" className="dropdown-item">
                <span>👤</span> Mon profil
              </a>
              <a href="/parametres" className="dropdown-item">
                <span>⚙️</span> Paramètres
              </a>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout">
                <span>🚪</span> Déconnexion
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}