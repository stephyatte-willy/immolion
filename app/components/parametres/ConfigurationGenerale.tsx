'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChromePicker } from 'react-color';
import { 
  Configuration, 
  MONNAIES, 
  FUSEAUX_HORAIRES, 
  LANGUES, 
  FORMATS_DATE, 
  FORMATS_HEURE 
} from '@/app/types/config';
import { useTheme } from '@/app/hooks/useTheme';
import './parametres.css';

export default function ConfigurationGenerale() {
  const [config, setConfig] = useState<Configuration | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme('dark');

  // Charger la configuration
  useEffect(() => {
    chargerConfiguration();
  }, []);

  useEffect(() => {
  const handleThemeChange = (e: CustomEvent) => {
    // Forcer le re-rendu
    setForceUpdate(prev => prev + 1);
  };

  window.addEventListener('themeChange', handleThemeChange as EventListener);
  return () => window.removeEventListener('themeChange', handleThemeChange as EventListener);
}, []);

  const chargerConfiguration = async () => {
    try {
      const response = await fetch('/api/configuration');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.configuration);
      } else {
        toast.error('Erreur lors du chargement de la configuration');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    }
  };

const handleSave = async () => {
  if (!config) return;
  
  setIsLoading(true);
  try {
    const response = await fetch('/api/configuration', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const data = await response.json();

    if (data.success) {
      toast.success('Configuration mise à jour avec succès');
      setIsEditing(false);
      
      // Appliquer le nouveau thème immédiatement
      if (config.theme_mode === 'dark' || config.theme_mode === 'light') {
        document.documentElement.setAttribute('data-theme', config.theme_mode);
        localStorage.setItem('app-theme', config.theme_mode);
        
        // Forcer le re-rendu
        window.dispatchEvent(new CustomEvent('themeChange', { 
          detail: { theme: config.theme_mode } 
        }));
        
        // Recharger la page pour être sûr (optionnel)
        // window.location.reload();
      } else if (config.theme_mode === 'system') {
        localStorage.removeItem('app-theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const newTheme = systemDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        window.dispatchEvent(new CustomEvent('themeChange', { 
          detail: { theme: newTheme } 
        }));
      }
      
      await chargerConfiguration();
    } else {
      toast.error(data.erreur || 'Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur lors de la sauvegarde');
  } finally {
    setIsLoading(false);
  }
};
  if (!config) {
    return (
      <div className="param-card loading">
        <div className="loading-spinner"></div>
        <p>Chargement de la configuration...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="param-card config-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="param-header">
        <div className="param-title">
          <span className="param-icon">⚙️</span>
          <h2>Configuration générale</h2>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <button 
              className="edit-button"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Modifier
            </button>
          ) : (
            <>
              <button 
                className="save-button"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Enregistrement...' : '💾 Enregistrer'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => {
                  setIsEditing(false);
                  chargerConfiguration();
                }}
                disabled={isLoading}
              >
                Annuler
              </button>
            </>
          )}
        </div>
      </div>

      <div className="config-sections">
        {/* Thème et Apparence */}
        <motion.section 
          className="config-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3>
            <span className="section-icon">🎨</span>
            Thème et Apparence
          </h3>
          
          <div className="config-grid">
            <div className="config-item">
              <label>Mode du thème</label>
              <div className="theme-selector">
                {['dark', 'light', 'system'].map((mode) => (
                  <button
                    key={mode}
                    className={`theme-option ${config.theme_mode === mode ? 'active' : ''}`}
                    onClick={() => isEditing && setConfig({...config, theme_mode: mode as any})}
                    disabled={!isEditing}
                  >
                    {mode === 'dark' && '🌙 Sombre'}
                    {mode === 'light' && '☀️ Clair'}
                    {mode === 'system' && '💻 Système'}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-item color-pickers">
              <label>Couleur principale</label>
              <div className="color-input-group">
                <div 
                  className="color-preview"
                  style={{ background: config.couleur_principale }}
                  onClick={() => isEditing && setShowColorPicker(
                    showColorPicker === 'primary' ? null : 'primary'
                  )}
                />
                <input
                  type="text"
                  value={config.couleur_principale}
                  onChange={(e) => isEditing && setConfig({...config, couleur_principale: e.target.value})}
                  disabled={!isEditing}
                  className="color-input"
                />
              </div>
              <AnimatePresence>
                {showColorPicker === 'primary' && isEditing && (
                  <motion.div 
                    className="color-picker-popup"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ChromePicker
                      color={config.couleur_principale}
                      onChange={(color) => setConfig({...config, couleur_principale: color.hex})}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="config-item">
              <label>Couleur secondaire</label>
              <div className="color-input-group">
                <div 
                  className="color-preview"
                  style={{ background: config.couleur_secondaire }}
                  onClick={() => isEditing && setShowColorPicker(
                    showColorPicker === 'secondary' ? null : 'secondary'
                  )}
                />
                <input
                  type="text"
                  value={config.couleur_secondaire}
                  onChange={(e) => isEditing && setConfig({...config, couleur_secondaire: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              <AnimatePresence>
                {showColorPicker === 'secondary' && isEditing && (
                  <motion.div 
                    className="color-picker-popup"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ChromePicker
                      color={config.couleur_secondaire}
                      onChange={(color) => setConfig({...config, couleur_secondaire: color.hex})}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="config-item">
              <label>Couleur d'accent</label>
              <div className="color-input-group">
                <div 
                  className="color-preview"
                  style={{ background: config.couleur_accent }}
                  onClick={() => isEditing && setShowColorPicker(
                    showColorPicker === 'accent' ? null : 'accent'
                  )}
                />
                <input
                  type="text"
                  value={config.couleur_accent}
                  onChange={(e) => isEditing && setConfig({...config, couleur_accent: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              <AnimatePresence>
                {showColorPicker === 'accent' && isEditing && (
                  <motion.div 
                    className="color-picker-popup"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ChromePicker
                      color={config.couleur_accent}
                      onChange={(color) => setConfig({...config, couleur_accent: color.hex})}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        {/* Paramètres régionaux */}
        <motion.section 
          className="config-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>
            <span className="section-icon">🌍</span>
            Paramètres régionaux
          </h3>
          
          <div className="config-grid">
            <div className="config-item">
              <label>Langue</label>
              <select
                value={config.langue}
                onChange={(e) => isEditing && setConfig({...config, langue: e.target.value as any})}
                disabled={!isEditing}
              >
                {LANGUES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.drapeau} {l.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="config-item">
              <label>Fuseau horaire</label>
              <select
                value={config.fuseau_horaire}
                onChange={(e) => isEditing && setConfig({...config, fuseau_horaire: e.target.value as any})}
                disabled={!isEditing}
              >
                {FUSEAUX_HORAIRES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="config-item">
              <label>Format de date</label>
              <select
                value={config.format_date}
                onChange={(e) => isEditing && setConfig({...config, format_date: e.target.value})}
                disabled={!isEditing}
              >
                {FORMATS_DATE.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="config-item">
              <label>Format d'heure</label>
              <select
                value={config.format_heure}
                onChange={(e) => isEditing && setConfig({...config, format_heure: e.target.value})}
                disabled={!isEditing}
              >
                {FORMATS_HEURE.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="config-item">
              <label>Premier jour de la semaine</label>
              <select
                value={config.premier_jour_semaine}
                onChange={(e) => isEditing && setConfig({...config, premier_jour_semaine: parseInt(e.target.value)})}
                disabled={!isEditing}
              >
                <option value={1}>Lundi</option>
                <option value={0}>Dimanche</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Configuration monétaire */}
        <motion.section 
          className="config-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>
            <span className="section-icon">💰</span>
            Configuration monétaire
          </h3>
          
          <div className="config-grid">
            <div className="config-item">
              <label>Monnaie</label>
              <select
                value={config.monnaie}
                onChange={(e) => {
                  const monnaie = e.target.value as any;
                  setConfig({
                    ...config,
                    monnaie,
                    symbole_monnaie: MONNAIES[monnaie].symbole,
                    decimales_monnaie: MONNAIES[monnaie].decimales
                  });
                }}
                disabled={!isEditing}
              >
                {Object.entries(MONNAIES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {code} - {info.nom} ({info.symbole})
                  </option>
                ))}
              </select>
            </div>

            <div className="config-item">
              <label>Symbole monnaie</label>
              <input
                type="text"
                value={config.symbole_monnaie}
                onChange={(e) => isEditing && setConfig({...config, symbole_monnaie: e.target.value})}
                disabled={!isEditing}
              />
            </div>

            <div className="config-item">
              <label>Position du symbole</label>
              <select
                value={config.position_monnaie}
                onChange={(e) => isEditing && setConfig({...config, position_monnaie: e.target.value as any})}
                disabled={!isEditing}
              >
                <option value="before">Avant le montant (€ 100)</option>
                <option value="after">Après le montant (100 €)</option>
              </select>
            </div>

            <div className="config-item">
              <label>Nombre de décimales</label>
              <input
                type="number"
                min="0"
                max="3"
                value={config.decimales_monnaie}
                onChange={(e) => isEditing && setConfig({...config, decimales_monnaie: parseInt(e.target.value)})}
                disabled={!isEditing}
              />
            </div>

            <div className="config-item">
              <label>Séparateur milliers</label>
              <input
                type="text"
                maxLength={1}
                value={config.separateur_milliers}
                onChange={(e) => isEditing && setConfig({...config, separateur_milliers: e.target.value})}
                disabled={!isEditing}
                placeholder=" "
              />
            </div>

            <div className="config-item">
              <label>Séparateur décimal</label>
              <input
                type="text"
                maxLength={1}
                value={config.separateur_decimal}
                onChange={(e) => isEditing && setConfig({...config, separateur_decimal: e.target.value})}
                disabled={!isEditing}
                placeholder=","
              />
            </div>
          </div>

          {/* Aperçu du format monétaire */}
          <div className="currency-preview">
            <span className="preview-label">Aperçu:</span>
            <span className="preview-value">
              {config.position_monnaie === 'before' ? config.symbole_monnaie : ''}
              {' '}
              1{config.separateur_milliers}234{config.separateur_decimal}
              {config.decimales_monnaie > 0 ? '56'.slice(0, config.decimales_monnaie) : ''}
              {' '}
              {config.position_monnaie === 'after' ? config.symbole_monnaie : ''}
            </span>
          </div>
        </motion.section>

        {/* Application */}
        <motion.section 
          className="config-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3>
            <span className="section-icon">📱</span>
            Application
          </h3>
          
          <div className="config-grid">
            <div className="config-item">
              <label>Nom de l'application</label>
              <input
                type="text"
                value={config.nom_application}
                onChange={(e) => isEditing && setConfig({...config, nom_application: e.target.value})}
                disabled={!isEditing}
              />
            </div>

            <div className="config-item">
              <label>Email de contact</label>
              <input
                type="email"
                value={config.email_contact || ''}
                onChange={(e) => isEditing && setConfig({...config, email_contact: e.target.value})}
                disabled={!isEditing}
                placeholder="contact@immolion.com"
              />
            </div>

            <div className="config-item">
              <label>Téléphone</label>
              <input
                type="tel"
                value={config.telephone_contact || ''}
                onChange={(e) => isEditing && setConfig({...config, telephone_contact: e.target.value})}
                disabled={!isEditing}
                placeholder="+225 00 00 00 00"
              />
            </div>
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section 
          className="config-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>
            <span className="section-icon">🔔</span>
            Notifications
          </h3>
          
          <div className="config-grid">
            <div className="config-item toggle-item">
              <label>Notifications Email</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.notifications_email}
                  onChange={(e) => isEditing && setConfig({...config, notifications_email: e.target.checked})}
                  disabled={!isEditing}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="config-item toggle-item">
              <label>Notifications SMS</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.notifications_sms}
                  onChange={(e) => isEditing && setConfig({...config, notifications_sms: e.target.checked})}
                  disabled={!isEditing}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="config-item toggle-item">
              <label>Notifications Push</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.notifications_push}
                  onChange={(e) => isEditing && setConfig({...config, notifications_push: e.target.checked})}
                  disabled={!isEditing}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </motion.section>

        {/* Sécurité */}
        <motion.section 
          className="config-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3>
            <span className="section-icon">🔒</span>
            Sécurité
          </h3>
          
          <div className="config-grid">
            <div className="config-item">
              <label>Timeout de session (minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={config.session_timeout}
                onChange={(e) => isEditing && setConfig({...config, session_timeout: parseInt(e.target.value)})}
                disabled={!isEditing}
              />
            </div>

            <div className="config-item">
              <label>Tentatives max de connexion</label>
              <input
                type="number"
                min="3"
                max="10"
                value={config.tentative_connexion_max}
                onChange={(e) => isEditing && setConfig({...config, tentative_connexion_max: parseInt(e.target.value)})}
                disabled={!isEditing}
              />
            </div>

            <div className="config-item">
              <label>Verrouillage compte (minutes)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={config.verrouillage_compte}
                onChange={(e) => isEditing && setConfig({...config, verrouillage_compte: parseInt(e.target.value)})}
                disabled={!isEditing}
              />
            </div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}