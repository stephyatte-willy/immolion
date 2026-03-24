'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from './../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import './connexion.css';

export default function PageConnexion() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [chargementParametres, setChargementParametres] = useState(true);
  const [erreur, setErreur] = useState('');
  const [parametresApp, setParametresApp] = useState<any>(null);
  const [utilisateurTrouve, setUtilisateurTrouve] = useState<{nom: string, prenom: string, role: string} | null>(null);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [entreprise, setEntreprise] = useState<any>(null);
  
  // ✅ Nouveaux états pour le mot de passe oublié et l'œil
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetTelephone, setResetTelephone] = useState('');
  const [resetMethod, setResetMethod] = useState<'email' | 'telephone'>('email');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    const rechercherUtilisateur = async () => {
      if (email && email.includes('@')) {
        setRechercheEnCours(true);
        const resultat = await authService.rechercherUtilisateurParEmail(email);
        if (resultat.success) {
          setUtilisateurTrouve(resultat.utilisateur || null);
        } else {
          setUtilisateurTrouve(null);
        }
        setRechercheEnCours(false);
      } else {
        setUtilisateurTrouve(null);
      }
    };

    const timeoutId = setTimeout(rechercherUtilisateur, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const chargerDonnees = async () => {
    try {
      const resultat = await authService.obtenirParametresApp();
      const response = await fetch('/api/entreprise');
      const data = await response.json();
      
      if (data.success && data.entreprise) {
        setEntreprise(data.entreprise);
      }
      
      if (resultat.success && resultat.parametres) {
        setParametresApp(resultat.parametres);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setChargementParametres(false);
    }
  };

  const gererSoumission = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');

    try {
      const resultat = await authService.authentifierUtilisateur(email, motDePasse);
      
      if (resultat.success && resultat.utilisateur) {
        localStorage.setItem('utilisateur', JSON.stringify(resultat.utilisateur));
        localStorage.setItem('estConnecte', 'true');
        router.push('/dashboard');
      } else {
        setErreur(resultat.erreur || '');
      }
    } catch (error) {
      setErreur('Une erreur est survenue');
    } finally {
      setChargement(false);
    }
  };

  // ✅ Fonction pour réinitialiser le mot de passe
const handleResetPassword = async () => {
  setIsResetting(true);
  setResetMessage('');
  
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setResetMessage(data.message);
      toast.success('Email envoyé !');
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);
    } else {
      setResetMessage(data.erreur || 'Une erreur est survenue');
      toast.error(data.erreur || 'Erreur');
    }
  } catch (error) {
    console.error('Erreur reset password:', error);
    setResetMessage('Erreur de connexion au serveur');
    toast.error('Erreur de connexion');
  } finally {
    setIsResetting(false);
  }
};

  const formaterRole = (role: string) => {
    const roles: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'PROPRIETAIRE': 'Propriétaire',
      'GESTIONNAIRE': 'Gestionnaire',
      'LOCATAIRE': 'Locataire'
    };
    return roles[role] || role;
  };

  return (
    <div className="connexion-container">
      <div className="connexion-bg-pattern"></div>
      <div className="connexion-bg-gradient"></div>
      
      <motion.div 
        className="connexion-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="connexion-brand"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="brand-content">
            {chargementParametres ? (
              <div className="brand-loading">
                <div className="spinner-luxury"></div>
              </div>
            ) : (
              <>
                <div className="form-logo-mini">
                  <img src="/logo_immolion.png" alt="ImmoLion" />
                </div>
                <div className="brand-divider">
                  <span className="divider-line"></span>
                  <span className="divider-icon">ImmoLion</span>
                  <span className="divider-line"></span>
                </div>               
                
                <div className="brand-company">
                  <div className="company-header">
                    {entreprise?.logo_url ? (
                      <div className="company-logo-mini">
                        <img 
                          src={entreprise.logo_url} 
                          alt={entreprise.nom}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="company-logo-placeholder">
                        <span>🏢</span>
                      </div>
                    )}
                    <h2>{entreprise?.nom || 'Gestion Immobilière'}</h2>
                  </div>
                  
                  <div className="company-details">
                    <div className="company-item">
                      <span className="company-icon">📍</span>
                      <span>{entreprise?.ville || 'Côte d\'Ivoire'}</span>
                    </div>
                    <div className="company-item">
                      <span className="company-icon">📞</span>
                      <span>{entreprise?.telephone || '+225 00 00 00 00'}</span>
                    </div>
                    <div className="company-item">
                      <span className="company-icon">✉️</span>
                      <span>{entreprise?.email || 'contact@immolion.ci'}</span>
                    </div>
                    {entreprise?.site_web && (
                      <div className="company-item">
                        <span className="company-icon">🌐</span>
                        <span>{entreprise.site_web}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="brand-stats-connexion">
                  <div className="stat-item-connexion">
                    <span className="stat-value-connexion">500+</span>
                    <span className="stat-label-connexion">Biens gérés</span>
                  </div>
                  <div className="stat-item-connexion">
                    <span className="stat-value-connexion">98%</span>
                    <span className="stat-label-connexion">Satisfaction</span>
                  </div>
                  <div className="stat-item-connexion">
                    <span className="stat-value-connexion">24/7</span>
                    <span className="stat-label-connexion">Support</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="connexion-form-section"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="form-content">
            <motion.div 
              className="form-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <AnimatePresence>
                {utilisateurTrouve && (
                  <motion.div 
                    className="user-hint"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="user-info-mini">
                      <span className="user-name-mini">
                        Bienvenue 😀 ! {utilisateurTrouve.prenom} {utilisateurTrouve.nom}
                      </span>
                      <span className="user-role-mini">
                        {formaterRole(utilisateurTrouve.role)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>                 
              <span className="divider-line2">Connectez-vous pour accéder aux services</span>
            </motion.div>

            <form onSubmit={gererSoumission} className="connexion-form">
              <motion.div 
                className="form-group"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label>Email professionnel</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-champ"
                    placeholder="Votre email"
                    required
                    disabled={chargement}
                  />
                </div>
              </motion.div>

              <motion.div 
                className="form-group"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <label>Mot de passe</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={chargement}
                  />
                  {/* ✅ Œil pour afficher/masquer le mot de passe */}
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </motion.div>

              <AnimatePresence>
                {erreur && (
                  <motion.div 
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    ❌ Les informations que vous avez saisies sont incorrectes. <button 
                  type="button"
                  className="link-button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  style={{ color: '#0037ff', fontWidth: '600' }}
                >
                  Réinitialiser votre mot de passe.
                </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={chargement}
                className={`connexion-button ${chargement ? 'loading' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {chargement ? (
                  <>
                    <div className="button-spinner"></div>
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </motion.button>

              <motion.div 
                className="form-links"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <button 
                  type="button"
                  className="link-button"
                  onClick={() => setShowForgotPasswordModal(true)}
                >
                  Mot de passe oublié ?
                </button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>

      {/* ✅ Modale Mot de passe oublié */}
      <AnimatePresence>
        {showForgotPasswordModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForgotPasswordModal(false)}
          >
            <motion.div 
              className="modal-content reset-password-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Réinitialisation du mot de passe</h2>
                <button className="modal-close-btn" onClick={() => setShowForgotPasswordModal(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            <div className="modal-body">
              <p className="reset-info">
                Entrez votre adresse email pour recevoir un nouveau mot de passe.
              </p>

              <div className="form-group">
                <label>Adresse email</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="votre@email.com"
                    disabled={isResetting}
                    autoFocus
                  />
                </div>
              </div>

              {resetMessage && (
                <div className={`reset-message ${resetMessage.includes('envoyé') ? 'success' : 'error'}`}>
                  {resetMessage}
                </div>
              )}

              <div className="reset-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowForgotPasswordModal(false)}
                  disabled={isResetting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleResetPassword}
                  disabled={isResetting || !resetEmail}
                >
                  {isResetting ? (
                    <>
                      <span className="spinner-small"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer'
                  )}
                </button>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}