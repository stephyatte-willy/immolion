// app/connexion/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from './../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [erreurLogo, setErreurLogo] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    chargerParametresApp();
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

  const chargerParametresApp = async () => {
    try {
      setChargementParametres(true);
      const resultat = await authService.obtenirParametresApp();
      
      if (resultat.success && resultat.parametres) {
        setParametresApp(resultat.parametres);
      } else {
        setParametresApp({
          nom_app: "ImmoLion",
          adresse: "15 Avenue de la Grande Armée, 75016 Paris",
          telephone: "+33 1 84 80 00 00",
          email: "contact@immolion.com",
          logo_url: null,
          couleur_principale: "#8B5CF6",
          slogan: "La gestion immobilière nouvelle génération"
        });
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
    <div className="conteneur-connexion-immolion">
      {/* Éléments flottants animés */}
      <div className="floating-elements">
        <div className="floating-circle circle-1" style={{ transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)` }} />
        <div className="floating-circle circle-2" style={{ transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)` }} />
        <div className="floating-circle circle-3" style={{ transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)` }} />
      </div>

      <motion.div 
        className="carte-connexion-immolion"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Section gauche - Informations */}
        <motion.div 
          className="section-gauche-immolion"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="contenu-gauche-immolion">
            {chargementParametres ? (
              <div className="chargement-immolion">
                <div className="spinner-luxury"></div>
                <p>Chargement de l'expérience ImmoLion...</p>
              </div>
            ) : parametresApp ? (
              <>
                <motion.div 
                  className="logo-container-immolion"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <div className="cercle-logo-immolion" style={{ background: `linear-gradient(135deg, ${parametresApp.couleur_principale}, #4F46E5)` }}>
                    {!erreurLogo && parametresApp.logo_url ? (
                      <img 
                        src={parametresApp.logo_url} 
                        alt="ImmoLion"
                        onError={() => setErreurLogo(true)}
                      />
                    ) : (
                      <span className="icone-immolion">🦁</span>
                    )}
                  </div>
                </motion.div>
                
                <motion.h1 
                  className="nom-app-immolion"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {parametresApp.nom_app}
                </motion.h1>
                
                <motion.p 
                  className="slogan-immolion"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {parametresApp.slogan}
                </motion.p>
                
                <motion.div 
                  className="stats-preview-immolion"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="stat-item">
                    <span className="stat-value">500+</span>
                    <span className="stat-label">Biens gérés</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">98%</span>
                    <span className="stat-label">Taux d'occupation</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">24/7</span>
                    <span className="stat-label">Support</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="informations-contact-immolion"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="item-contact-immolion">
                    <span className="icone-contact">📍</span>
                    <span>{parametresApp.adresse}</span>
                  </div>
                  <div className="item-contact-immolion">
                    <span className="icone-contact">📞</span>
                    <span>{parametresApp.telephone}</span>
                  </div>
                  <div className="item-contact-immolion">
                    <span className="icone-contact">✉️</span>
                    <span>{parametresApp.email}</span>
                  </div>
                </motion.div>
                
                <AnimatePresence>
                  {utilisateurTrouve && (
                    <motion.div 
                      className="info-utilisateur-trouve-immolion"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="avatar-utilisateur">
                        {utilisateurTrouve.prenom[0]}{utilisateurTrouve.nom[0]}
                      </div>
                      <div className="details-utilisateur">
                        <div className="nom-complet">
                          {utilisateurTrouve.prenom} {utilisateurTrouve.nom}
                        </div>
                        <div className="role-utilisateur">
                          {formaterRole(utilisateurTrouve.role)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {rechercheEnCours && (
                  <div className="recherche-en-cours-immolion">
                    <div className="spinner-mini"></div>
                    <span>Recherche en cours...</span>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </motion.div>

        {/* Section droite - Formulaire */}
        <motion.div 
          className="section-droite-immolion"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="contenu-droite-immolion">
            <motion.div 
              className="en-tete-connexion-immolion"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2>Bienvenue sur ImmoLion</h2>
              <p>Connectez-vous pour gérer votre patrimoine</p>
            </motion.div>

            <form onSubmit={gererSoumission} className="formulaire-connexion-immolion">
              <motion.div 
                className="groupe-champ-immolion"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="email">
                  Adresse Email
                </label>
                <div className="conteneur-input-immolion">
                  <span className="icone-input">✉️</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    disabled={chargement}
                  />
                </div>
              </motion.div>

              <motion.div 
                className="groupe-champ-immolion"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <label htmlFor="motDePasse">
                  Mot de Passe
                </label>
                <div className="conteneur-input-immolion">
                  <span className="icone-input">🔒</span>
                  <input
                    id="motDePasse"
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
                    className="message-erreur-immolion"
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
                className={`bouton-connexion-immolion ${chargement ? 'chargement' : ''}`}
                style={{ background: `linear-gradient(135deg, ${parametresApp?.couleur_principale || '#8B5CF6'}, #4F46E5)` }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {chargement ? (
                  <>
                    <div className="spinner-button"></div>
                    Connexion en cours...
                  </>
                ) : (
                  'Se Connecter'
                )}
              </motion.button>

              <motion.div 
                className="liens-supplementaires-immolion"
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