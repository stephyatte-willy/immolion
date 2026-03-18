'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from './../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
      // Charger les paramètres de l'app
      const resultat = await authService.obtenirParametresApp();
      
      // Charger les infos de l'entreprise
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
        setErreur(resultat.erreur || 'Email ou mot de passe incorrect');
      }
    } catch (error) {
      setErreur('Une erreur est survenue');
    } finally {
      setChargement(false);
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
      {/* Éléments décoratifs */}
      <div className="connexion-bg-pattern"></div>
      <div className="connexion-bg-gradient"></div>
      
      <motion.div 
        className="connexion-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Section gauche - Branding */}
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

                <div className="brand-stats">
                  <div className="stat-item">
                    <span className="stat-value">500+</span>
                    <span className="stat-label">Biens gérés</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">98%</span>
                    <span className="stat-label">Satisfaction</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">24/7</span>
                    <span className="stat-label">Support</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Section droite - Formulaire */}
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
                    type="password"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={chargement}
                  />
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
                    ❌ {erreur}
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
                <a href="#">Mot de passe oublié ?</a>
                <a href="#">Créer un compte</a>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}