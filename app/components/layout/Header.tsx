'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from './../../services/authService';
import toast from 'react-hot-toast';
import '@/app/globals.css';
import './Header.css';

interface HeaderProps {
  utilisateur: any;
  titre: string;
  sousTitre?: string;
  entreprise?: string;
  entrepriseLogo?: string | null;
}

interface Notification {
  id: number;
  titre: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  date_envoi: string;
  lu: boolean;
  lien?: string;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Charger les notifications
  useEffect(() => {
    chargerNotifications();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(chargerNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const chargerNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        const nonLuesCount = data.notifications.filter((n: Notification) => !n.lu).length;
        setNonLues(nonLuesCount);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const marquerCommeLu = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lu: true })
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, lu: true } : n)
        );
        setNonLues(prev => prev - 1);
      }
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const marquerToutesCommeLues = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
        setNonLues(0);
        toast.success('Toutes les notifications marquées comme lues');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du marquage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    marquerCommeLu(notification.id);
    if (notification.lien) {
      router.push(notification.lien);
    }
    setNotificationsOuvert(false);
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'danger': '🚨',
      'success': '✅'
    };
    return icons[type] || '📌';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      'info': '#3b82f6',
      'warning': '#f59e0b',
      'danger': '#ef4444',
      'success': '#10b981'
    };
    return colors[type] || '#94a3b8';
  };

  // ✅ Fonction formatDate corrigée
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "Date inconnue";
      
      const date = new Date(dateStr);
      const now = new Date();
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "Date inconnue";
      }
      
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMinutes < 1) return "À l'instant";
      if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      if (diffDays === 1) return "Hier";
      if (diffDays < 7) return `Il y a ${diffDays} j`;
      
      // Pour les dates plus anciennes
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return "Date inconnue";
    }
  };

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
            {nonLues > 0 && (
              <span className="notifications-badge">{nonLues > 9 ? '9+' : nonLues}</span>
            )}
          </button>
          
          <AnimatePresence>
            {notificationsOuvert && (
              <motion.div 
                className="notifications-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="notifications-header">
                  <h3>Notifications</h3>
                  {nonLues > 0 && (
                    <button 
                      onClick={marquerToutesCommeLues}
                      disabled={isLoading}
                    >
                      Tout marquer
                    </button>
                  )}
                </div>
                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <div className="notifications-empty">
                      <span className="empty-icon">🔔</span>
                      <p>Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`notification-item ${!notification.lu ? 'non-lu' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div 
                          className="notification-icon"
                          style={{ background: getNotificationColor(notification.type) }}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="notification-content">
                          <p>{notification.titre}</p>
                          <span>{notification.message}</span>
                          <div className="notification-time">
                            {formatDate(notification.date_envoi)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                <span className="avatar-initials">
                  {utilisateur?.prenom?.[0]}{utilisateur?.nom?.[0]}
                </span>
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">{utilisateur?.prenom} {utilisateur?.nom}</span>
              <span className="profile-role">{utilisateur?.role}</span>
            </div>
          </button>

          <AnimatePresence>
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
                
                {utilisateur && (utilisateur.role === 'SUPER_ADMIN' || utilisateur.role === 'ADMIN') && (
                  <a href="/parametres" className="dropdown-item">
                    <span>⚙️</span> Paramètres
                  </a>
                )}
                
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout">
                  <span>🚪</span> Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}