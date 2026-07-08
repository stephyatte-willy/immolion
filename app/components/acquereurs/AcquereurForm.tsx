'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TYPES_ACQUEREUR, STATUTS_ACQUEREUR } from '@/app/types/acquereurs';
import toast from 'react-hot-toast';
import '@/app/acquereurs/acquereurs.css';

interface AcquereurFormProps {
  acquereur: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AcquereurForm({ 
  acquereur, 
  onClose, 
  onSuccess 
}: AcquereurFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    telephone_secondaire: '',
    date_naissance: '',
    lieu_naissance: '',
    nationalite: 'Ivoirienne',
    profession: '',
    employeur: '',
    revenus_mensuels: '',
    type_acquereur: 'PARTICULIER',
    biens_ids: [] as number[],
    raison_sociale: '',
    num_identite: '',
    adresse: '',
    ville: '',
    pays: 'Côte d\'Ivoire',
    notes: '',
    actif: true
  });

  const [biens, setBiens] = useState<any[]>([]);
  const [biensAvecAttributions, setBiensAvecAttributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBiens, setIsLoadingBiens] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEntite = formData.type_acquereur === 'SOCIETE' || formData.type_acquereur === 'AGENCE';

  useEffect(() => {
    chargerBiensAvecAttributions();
    
    if (acquereur) {
      console.log('📝 Chargement acquéreur pour édition:', acquereur);
      
      const biensIds = acquereur.biens?.map((b: any) => b.id) || [];
      
      setFormData({
        nom: acquereur.nom || '',
        prenom: acquereur.prenom || '',
        email: acquereur.email || '',
        telephone: acquereur.telephone || '',
        telephone_secondaire: acquereur.telephone_secondaire || '',
        date_naissance: acquereur.date_naissance?.split('T')[0] || '',
        lieu_naissance: acquereur.lieu_naissance || '',
        nationalite: acquereur.nationalite || 'Ivoirienne',
        profession: acquereur.profession || '',
        employeur: acquereur.employeur || '',
        revenus_mensuels: acquereur.revenus_mensuels?.toString() || '',
        type_acquereur: acquereur.type_acquereur || 'PARTICULIER',
        biens_ids: biensIds,
        raison_sociale: acquereur.raison_sociale || '',
        num_identite: acquereur.num_identite || '',
        adresse: acquereur.adresse || '',
        ville: acquereur.ville || '',
        pays: acquereur.pays || 'Côte d\'Ivoire',
        notes: acquereur.notes || '',
        actif: acquereur.actif !== undefined ? acquereur.actif : true
      });
    }
  }, [acquereur]);

  const chargerBiensAvecAttributions = async () => {
    setIsLoadingBiens(true);
    try {
      // Récupérer tous les biens en vente
      const response = await fetch('/api/biens?statut=EN_VENTE');
      const data = await response.json();
      
      if (data.success && data.biens) {
        // Récupérer les attributions existantes
        const attributionsResponse = await fetch('/api/acquereur-biens-attributions');
        const attributionsData = await attributionsResponse.json();
        const attributions = attributionsData.success ? attributionsData.attributions : [];
        
        // Enrichir les biens avec les informations d'attribution
        const biensEnrichis = data.biens.map((bien: any) => {
          const attribution = attributions.find((a: any) => a.bien_id === bien.id);
          return {
            ...bien,
            est_attribue: !!attribution,
            attribue_a: attribution ? {
              id: attribution.acquereur_id,
              nom: attribution.acquereur_nom,
              prenom: attribution.acquereur_prenom,
              raison_sociale: attribution.acquereur_raison_sociale,
              type: attribution.acquereur_type
            } : null
          };
        });
        
        setBiensAvecAttributions(biensEnrichis);
        setBiens(data.biens);
      }
    } catch (error) {
      console.error('Erreur chargement biens avec attributions:', error);
      // Fallback: charger juste les biens
      const response = await fetch('/api/biens?statut=EN_VENTE');
      const data = await response.json();
      if (data.success) {
        setBiens(data.biens);
      }
    } finally {
      setIsLoadingBiens(false);
    }
  };

  const handleBienToggle = (bienId: number) => {
    const bien = biensAvecAttributions.find(b => b.id === bienId);
    
    // Si le bien est déjà attribué à un autre acquéreur, on ne peut pas le sélectionner
    if (bien?.est_attribue && !formData.biens_ids.includes(bienId)) {
      const acquereurNom = bien.attribue_a?.type === 'PARTICULIER'
        ? `${bien.attribue_a?.prenom} ${bien.attribue_a?.nom}`
        : bien.attribue_a?.raison_sociale;
      toast.error(`Ce bien est déjà attribué à ${acquereurNom}`);
      return;
    }
    
    setFormData(prev => {
      const currentIds = prev.biens_ids;
      if (currentIds.includes(bienId)) {
        return { ...prev, biens_ids: currentIds.filter(id => id !== bienId) };
      } else {
        return { ...prev, biens_ids: [...currentIds, bienId] };
      }
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isEntite) {
      if (!formData.raison_sociale.trim()) {
        newErrors.raison_sociale = 'La raison sociale est requise';
      }
    } else {
      if (!formData.nom.trim()) {
        newErrors.nom = 'Le nom est requis';
      }
      if (!formData.prenom.trim()) {
        newErrors.prenom = 'Le prénom est requis';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
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
      const dataToSend = {
        nom: isEntite ? formData.raison_sociale : formData.nom,
        prenom: isEntite ? '' : formData.prenom,
        email: formData.email,
        telephone: formData.telephone || null,
        telephone_secondaire: formData.telephone_secondaire || null,
        date_naissance: formData.date_naissance || null,
        lieu_naissance: formData.lieu_naissance || null,
        nationalite: formData.nationalite || 'Ivoirienne',
        profession: formData.profession || null,
        employeur: formData.employeur || null,
        revenus_mensuels: formData.revenus_mensuels ? parseFloat(formData.revenus_mensuels) : null,
        type_acquereur: formData.type_acquereur,
        biens_ids: formData.biens_ids,
        raison_sociale: isEntite ? formData.raison_sociale : null,
        num_identite: formData.num_identite || null,
        adresse: formData.adresse || null,
        ville: formData.ville || null,
        pays: formData.pays || 'Côte d\'Ivoire',
        notes: formData.notes || null,
        actif: formData.actif
      };

      console.log('📦 Envoi des données acquéreur:', dataToSend);

      const url = acquereur 
        ? `/api/acquereurs/${acquereur.id}`
        : '/api/acquereurs';
      
      const method = acquereur ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(acquereur ? 'Acquéreur modifié avec succès' : 'Acquéreur créé avec succès');
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

  const getBienDisplay = (bien: any) => {
    if (bien.type_bien === 'IMMEUBLE') {
      return `${bien.nom} (Immeuble) - ${bien.ville} - ${bien.prix_vente?.toLocaleString()} FCFA`;
    }
    return `${bien.nom} - ${bien.ville} - ${bien.prix_vente?.toLocaleString()} FCFA`;
  };

  const getAttributionText = (bien: any) => {
    if (!bien.est_attribue) return null;
    const acquereur = bien.attribue_a;
    if (!acquereur) return 'Attribué';
    
    if (acquereur.type === 'PARTICULIER') {
      return `Attribué à ${acquereur.prenom} ${acquereur.nom}`;
    }
    return `Attribué à ${acquereur.raison_sociale}`;
  };

  // Vérifier si un bien est sélectionné par l'acquéreur actuel
  const isSelectedByCurrentAcquereur = (bienId: number) => {
    return formData.biens_ids.includes(bienId);
  };

  // Vérifier si un bien est attribué à un autre acquéreur
  const isAttributedToOther = (bien: any) => {
    if (!bien.est_attribue) return false;
    if (acquereur && isSelectedByCurrentAcquereur(bien.id)) return false;
    return true;
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
        className="modal-content acquereur-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{acquereur ? 'Modifier l\'acquéreur' : 'Nouvel acquéreur'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="acquereur-form">
            <div className="form-sections">
              {/* Type d'acquéreur */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🏷️</span> Type d'acquéreur
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Type *</label>
                    <select
                      value={formData.type_acquereur}
                      onChange={(e) => {
                        setFormData({...formData, type_acquereur: e.target.value});
                        setErrors(prev => {
                          const newErrors = {...prev};
                          delete newErrors.nom;
                          delete newErrors.prenom;
                          delete newErrors.raison_sociale;
                          return newErrors;
                        });
                      }}
                      className="select-with-arrow"
                    >
                      {TYPES_ACQUEREUR.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icone} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Identité */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>👤</span> {isEntite ? 'Informations de l\'entité' : 'Identité'}
                </div>
                <div className="form-grid">
                  {isEntite ? (
                    <div className="form-group full-width">
                      <label>Raison sociale / Nom de l'entité *</label>
                      <input
                        type="text"
                        value={formData.raison_sociale}
                        onChange={(e) => setFormData({...formData, raison_sociale: e.target.value})}
                        className={errors.raison_sociale ? 'error' : ''}
                        placeholder="Nom de la société ou agence"
                      />
                      {errors.raison_sociale && <span className="error-message">{errors.raison_sociale}</span>}
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Nom *</label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData({...formData, nom: e.target.value})}
                          className={errors.nom ? 'error' : ''}
                        />
                        {errors.nom && <span className="error-message">{errors.nom}</span>}
                      </div>

                      <div className="form-group">
                        <label>Prénom *</label>
                        <input
                          type="text"
                          value={formData.prenom}
                          onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                          className={errors.prenom ? 'error' : ''}
                        />
                        {errors.prenom && <span className="error-message">{errors.prenom}</span>}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={errors.email ? 'error' : ''}
                      placeholder="contact@example.com"
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                      placeholder="+225 00 00 00 00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone secondaire</label>
                    <input
                      type="tel"
                      value={formData.telephone_secondaire}
                      onChange={(e) => setFormData({...formData, telephone_secondaire: e.target.value})}
                    />
                  </div>

                  {!isEntite && (
                    <>
                      <div className="form-group">
                        <label>Date de naissance</label>
                        <input
                          type="date"
                          value={formData.date_naissance}
                          onChange={(e) => setFormData({...formData, date_naissance: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label>Lieu de naissance</label>
                        <input
                          type="text"
                          value={formData.lieu_naissance}
                          onChange={(e) => setFormData({...formData, lieu_naissance: e.target.value})}
                          placeholder="Abidjan"
                        />
                      </div>

                      <div className="form-group">
                        <label>Nationalité</label>
                        <input
                          type="text"
                          value={formData.nationalite}
                          onChange={(e) => setFormData({...formData, nationalite: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label>Profession</label>
                        <input
                          type="text"
                          value={formData.profession}
                          onChange={(e) => setFormData({...formData, profession: e.target.value})}
                          placeholder="Ingénieur, Commerçant..."
                        />
                      </div>

                      <div className="form-group">
                        <label>Employeur</label>
                        <input
                          type="text"
                          value={formData.employeur}
                          onChange={(e) => setFormData({...formData, employeur: e.target.value})}
                          placeholder="Nom de l'entreprise"
                        />
                      </div>

                      <div className="form-group">
                        <label>Revenus mensuels (FCFA)</label>
                        <input
                          type="number"
                          step="10000"
                          value={formData.revenus_mensuels}
                          onChange={(e) => setFormData({...formData, revenus_mensuels: e.target.value})}
                          placeholder="300000"
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>N° d'identité</label>
                    <input
                      type="text"
                      value={formData.num_identite}
                      onChange={(e) => setFormData({...formData, num_identite: e.target.value})}
                      placeholder={isEntite ? 'RCCM, NIF...' : 'CNI, Passeport...'}
                    />
                  </div>
                </div>
              </div>

              {/* ✅ Biens à acquérir - AVEC INDICATEUR D'ATTRIBUTION */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🏠</span> Biens à acquérir
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Biens</label>
                    {isLoadingBiens ? (
                      <div className="loading-small">Chargement des biens...</div>
                    ) : biensAvecAttributions.length === 0 ? (
                      <div className="no-biens-message">
                        <span>🏢</span>
                        <p>Aucun bien en vente disponible</p>
                      </div>
                    ) : (
                      <div className="biens-multiple-select">
                        <div className="biens-checkbox-list">
                          {biensAvecAttributions.map(bien => {
                            const isSelected = isSelectedByCurrentAcquereur(bien.id);
                            const isAttributed = isAttributedToOther(bien);
                            const attributionText = getAttributionText(bien);
                            
                            return (
                              <label 
                                key={bien.id} 
                                className={`bien-checkbox-item ${isAttributed ? 'attributed' : ''} ${isSelected ? 'selected' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleBienToggle(bien.id)}
                                  disabled={isAttributed && !isSelected}
                                />
                                <span className="bien-checkbox-content">
                                  <span className="bien-checkbox-name">{getBienDisplay(bien)}</span>
                                  {isAttributed && (
                                    <span className="bien-attribution-indicator" title={attributionText || undefined}>
                                      🔒 {attributionText}
                                    </span>
                                  )}
                                  {isSelected && !isAttributed && (
                                    <span className="bien-selected-indicator">
                                      ✅ Sélectionné
                                    </span>
                                  )}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <small className="field-hint">
                      {formData.biens_ids.length} bien(x) sélectionné(s)
                      {biensAvecAttributions.some(b => b.est_attribue && !formData.biens_ids.includes(b.id)) && (
                        <span className="hint-warning"> - Les biens grisés sont déjà attribués à d'autres acquéreurs</span>
                      )}
                    </small>
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📍</span> Adresse
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Adresse</label>
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                      placeholder="Rue, numéro, lieu-dit..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Ville</label>
                    <input
                      type="text"
                      value={formData.ville}
                      onChange={(e) => setFormData({...formData, ville: e.target.value})}
                      placeholder="Abidjan"
                    />
                  </div>

                  <div className="form-group">
                    <label>Pays</label>
                    <input
                      type="text"
                      value={formData.pays}
                      onChange={(e) => setFormData({...formData, pays: e.target.value})}
                      placeholder="Côte d'Ivoire"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📝</span> Notes
                </div>
                <div className="form-group full-width">
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    placeholder="Informations complémentaires..."
                  />
                </div>
              </div>

              {/* Statut */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>⚙️</span> Statut
                </div>
                <div className="form-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={formData.actif}
                      onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                    />
                    <span className="toggle-text">Actif</span>
                  </label>
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
              acquereur ? '💾 Modifier' : '💾 Créer'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}