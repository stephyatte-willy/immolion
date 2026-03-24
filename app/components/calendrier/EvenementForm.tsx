'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TYPES_EVENEMENT, STATUTS_EVENEMENT, RECURRENCES } from '@/app/types/calendrier';
import toast from 'react-hot-toast';
import '@/app/calendrier/calendrier.css';

interface EvenementFormProps {
  evenement: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EvenementForm({ evenement, onClose, onSuccess }: EvenementFormProps) {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type_evenement: 'VISITE',
    date_debut: '',
    date_fin: '',
    date_rappel: '',
    statut: 'PREVU',
    bien_id: '',
    locataire_id: '',
    contrat_id: '',
    lieu: '',
    couleur: '',
    recurrence: 'UNIQUE',
    recurrence_fin: ''
  });

  const [biens, setBiens] = useState<any[]>([]);
  const [locataires, setLocataires] = useState<any[]>([]);
  const [contrats, setContrats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Fonction pour formater une date en datetime-local
  const formatDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // ✅ Fonction pour formater une date en YYYY-MM-DD
  const formatDateForInputDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    chargerDonnees();
    
    if (evenement) {
      console.log('📦 Événement reçu pour édition:', evenement);
      
      // ✅ Correction: formater correctement les dates
      const dateDebutFormatee = formatDateForInput(evenement.date_debut);
      const dateFinFormatee = formatDateForInput(evenement.date_fin);
      const dateRappelFormatee = formatDateForInput(evenement.date_rappel);
      const recurrenceFinFormatee = formatDateForInputDate(evenement.recurrence_fin);
      
      console.log('📅 Dates formatées:', {
        date_debut: dateDebutFormatee,
        date_fin: dateFinFormatee,
        date_rappel: dateRappelFormatee,
        recurrence_fin: recurrenceFinFormatee
      });
      
      setFormData({
        titre: evenement.titre || '',
        description: evenement.description || '',
        type_evenement: evenement.type_evenement || 'VISITE',
        date_debut: dateDebutFormatee,
        date_fin: dateFinFormatee,
        date_rappel: dateRappelFormatee,
        statut: evenement.statut || 'PREVU',
        bien_id: evenement.bien_id?.toString() || '',
        locataire_id: evenement.locataire_id?.toString() || '',
        contrat_id: evenement.contrat_id?.toString() || '',
        lieu: evenement.lieu || '',
        couleur: evenement.couleur || '',
        recurrence: evenement.recurrence || 'UNIQUE',
        recurrence_fin: recurrenceFinFormatee
      });
    } else {
      // Valeurs par défaut pour un nouvel événement
      const now = new Date();
      const debut = new Date(now);
      debut.setHours(9, 0, 0, 0);
      setFormData(prev => ({
        ...prev,
        date_debut: formatDateForInput(debut.toISOString())
      }));
    }
  }, [evenement]);

  const chargerDonnees = async () => {
    try {
      const [biensRes, locatairesRes, contratsRes] = await Promise.all([
        fetch('/api/biens'),
        fetch('/api/locataires?statut=ACTIF'),
        fetch('/api/contrats?statut=ACTIF')
      ]);
      
      const biensData = await biensRes.json();
      const locatairesData = await locatairesRes.json();
      const contratsData = await contratsRes.json();
      
      if (biensData.success) setBiens(biensData.biens);
      if (locatairesData.success) setLocataires(locatairesData.locataires);
      if (contratsData.success) setContrats(contratsData.contrats);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titre.trim()) newErrors.titre = 'Le titre est requis';
    if (!formData.type_evenement) newErrors.type_evenement = 'Le type est requis';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';

    if (formData.date_debut && formData.date_fin) {
      if (new Date(formData.date_fin) <= new Date(formData.date_debut)) {
        newErrors.date_fin = 'La date de fin doit être après la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsLoading(true);

    try {
      const url = evenement 
        ? `/api/evenements/${evenement.id}`
        : '/api/evenements';
      
      const method = evenement ? 'PUT' : 'POST';

      // ✅ Nettoyer les données avant envoi
      const dataToSend = {
        titre: formData.titre,
        description: formData.description || null,
        type_evenement: formData.type_evenement,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin || null,  // ✅ Envoyer null si vide
        date_rappel: formData.date_rappel || null,  // ✅ Envoyer null si vide
        statut: formData.statut,
        bien_id: formData.bien_id || null,
        locataire_id: formData.locataire_id || null,
        contrat_id: formData.contrat_id || null,
        lieu: formData.lieu || null,
        couleur: formData.couleur || null,
        recurrence: formData.recurrence,
        recurrence_fin: formData.recurrence_fin || null,
        created_by: JSON.parse(localStorage.getItem('utilisateur') || '{}').id
      };

      console.log('📤 Envoi des données:', dataToSend);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(evenement ? 'Événement modifié avec succès' : 'Événement créé avec succès');
        onSuccess();
      } else {
        toast.error(data.erreur || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content evenement-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{evenement ? 'Modifier l\'événement' : 'Nouvel événement'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="evenement-form">
            <div className="form-sections">
              {/* Informations générales */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📋</span> Informations générales
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Titre *</label>
                    <input
                      type="text"
                      value={formData.titre}
                      onChange={(e) => setFormData({...formData, titre: e.target.value})}
                      className={errors.titre ? 'error' : ''}
                      placeholder="Ex: Visite appartement Cocody"
                    />
                    {errors.titre && <span className="error-message">{errors.titre}</span>}
                  </div>

                  <div className="form-group">
                    <label>Type d'événement *</label>
                    <select
                      value={formData.type_evenement}
                      onChange={(e) => setFormData({...formData, type_evenement: e.target.value})}
                    >
                      {TYPES_EVENEMENT.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icone} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    >
                      {STATUTS_EVENEMENT.map(statut => (
                        <option key={statut.value} value={statut.value}>
                          {statut.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      placeholder="Description détaillée..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Lieu</label>
                    <input
                      type="text"
                      value={formData.lieu}
                      onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                      placeholder="Adresse ou lieu"
                    />
                  </div>

                  <div className="form-group">
                    <label>Couleur personnalisée</label>
                    <input
                      type="color"
                      value={formData.couleur || '#8B5CF6'}
                      onChange={(e) => setFormData({...formData, couleur: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📅</span> Dates
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Date de début *</label>
                    <input
                      type="datetime-local"
                      value={formData.date_debut}
                      onChange={(e) => setFormData({...formData, date_debut: e.target.value})}
                      className={errors.date_debut ? 'error' : ''}
                    />
                    {errors.date_debut && <span className="error-message">{errors.date_debut}</span>}
                  </div>

                  <div className="form-group">
                    <label>Date de fin</label>
                    <input
                      type="datetime-local"
                      value={formData.date_fin}
                      onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                      className={errors.date_fin ? 'error' : ''}
                    />
                    {errors.date_fin && <span className="error-message">{errors.date_fin}</span>}
                    <small className="field-hint">Laissez vide si c'est un événement ponctuel</small>
                  </div>

                  <div className="form-group">
                    <label>Date de rappel</label>
                    <input
                      type="datetime-local"
                      value={formData.date_rappel}
                      onChange={(e) => setFormData({...formData, date_rappel: e.target.value})}
                    />
                    <small className="field-hint">Laissez vide pour ne pas recevoir de rappel</small>
                  </div>
                </div>
              </div>

              {/* Récurrence */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🔄</span> Récurrence
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Récurrence</label>
                    <select
                      value={formData.recurrence}
                      onChange={(e) => setFormData({...formData, recurrence: e.target.value})}
                    >
                      {RECURRENCES.map(rec => (
                        <option key={rec.value} value={rec.value}>
                          {rec.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.recurrence !== 'UNIQUE' && (
                    <div className="form-group">
                      <label>Date de fin de récurrence</label>
                      <input
                        type="date"
                        value={formData.recurrence_fin}
                        onChange={(e) => setFormData({...formData, recurrence_fin: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Liens */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🔗</span> Liens avec les entités
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bien immobilier</label>
                    <select
                      value={formData.bien_id}
                      onChange={(e) => setFormData({...formData, bien_id: e.target.value})}
                    >
                      <option value="">Aucun bien</option>
                      {biens.map(bien => (
                        <option key={bien.id} value={bien.id}>
                          {bien.nom} - {bien.ville}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Locataire/Client</label>
                    <select
                      value={formData.locataire_id}
                      onChange={(e) => setFormData({...formData, locataire_id: e.target.value})}
                    >
                      <option value="">Aucun client</option>
                      {locataires.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.prenom} {loc.nom} - {loc.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Contrat</label>
                    <select
                      value={formData.contrat_id}
                      onChange={(e) => setFormData({...formData, contrat_id: e.target.value})}
                    >
                      <option value="">Aucun contrat</option>
                      {contrats.map(contrat => (
                        <option key={contrat.id} value={contrat.id}>
                          {contrat.numero_contrat} - {contrat.bien?.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn-submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                Enregistrement...
              </>
            ) : (
              evenement ? '💾 Modifier' : '💾 Créer'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}