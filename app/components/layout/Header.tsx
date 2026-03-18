'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from './../../services/authService';
import './Header.css';

interface HeaderProps {
  utilisateur: any;
  titre: string;
  sousTitre?: string;
  entreprise?: string;
  entrepriseLogo?: string | null;
}

export default function Header({ 
  utilisateur, 
  titre, 
  sousTitre, 
  entreprise, 
  entrepriseLogo 
}: HeaderProps) {
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
    <header className="immolion-header">
      <div className="header-left">
        <div className="header-title-wrapper">
          <h1 className="header-titre">{titre}</h1>
          
        </div>
        <div className="header-entreprise">
            {entrepriseLogo ? (
              <div className="header-entreprise-logo">
                <img 
                  src={entrepriseLogo} 
                  alt={entreprise}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <span className="entreprise-icon">🏢</span>
            )}
            <span className="entreprise-name">{entreprise || 'ImmoLion'}</span>
          </div>
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
                <button>Tout marquer</button>
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
                    <p>Intervention terminée</p>
                    <span>Il y a 2 heures</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

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
              
              {/* ✅ Lien Paramètres visible seulement pour SUPER_ADMIN et ADMIN */}
              {utilisateur && (utilisateur.role === 'SUPER_ADMIN' || utilisateur.role === 'ADMIN') && (
                <a href="/parametres" id='parametres' className="dropdown-item">
                  <span>⚙️</span> Paramètres
                </a>
              )}
              
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