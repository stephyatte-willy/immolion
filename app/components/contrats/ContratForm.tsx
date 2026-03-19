'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TYPES_CONTRAT, STATUTS_CONTRAT } from '@/app/types/contrats';
import toast from 'react-hot-toast';
import './contrats.css';

interface ContratFormProps {
  contrat: any | null;
  locataire_id?: number;
  bien_id?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContratForm({ contrat, locataire_id, bien_id, onClose, onSuccess }: ContratFormProps) {
  const [formData, setFormData] = useState({
    bien_id: bien_id || '',
    locataire_id: locataire_id || '',
    type_contrat: 'BAIL_VIDE',
    date_debut: '',
    date_fin: '',
    date_signature: '',
    date_etat_lieux_entree: '',
    date_etat_lieux_sortie: '',
    loyer_mensuel: '',
    charges_mensuelles: '',
    depot_garantie: '',
    prix_vente: '',
    clause_particuliere: '',
    statut: 'ACTIF'
  });

  const [biens, setBiens] = useState<any[]>([]);
  const [locataires, setLocataires] = useState<any[]>([]);
  const [bienSelectionne, setBienSelectionne] = useState<any>(null);
  const [locataireSelectionne, setLocataireSelectionne] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Déterminer si c'est une vente (basé sur type_contrat)
  const isVente = formData.type_contrat === 'VENTE';

  useEffect(() => {
    chargerBiens();
    chargerLocataires();
  }, []);

  // ✅ Mode édition - CORRIGÉ
  useEffect(() => {
    if (contrat) {
      console.log('📦 Contrat reçu pour édition:', contrat);
      
      const formatDate = (date: string | null | undefined) => {
        if (!date) return '';
        if (typeof date === 'string' && date.includes('T')) {
          return date.split('T')[0];
        }
        return date || '';
      };

      const typeContrat = contrat.type_contrat || 'BAIL_VIDE';
      const estVente = typeContrat === 'VENTE';

      setFormData({
        bien_id: contrat.bien_id?.toString() || '',
        locataire_id: contrat.locataire_id?.toString() || '',
        type_contrat: typeContrat,
        date_debut: formatDate(contrat.date_debut),
        date_fin: formatDate(contrat.date_fin),
        date_signature: formatDate(contrat.date_signature),
        date_etat_lieux_entree: formatDate(contrat.date_etat_lieux_entree),
        date_etat_lieux_sortie: formatDate(contrat.date_etat_lieux_sortie),
        // ✅ Pour une vente, on utilise prix_vente, sinon loyer_mensuel
        loyer_mensuel: !estVente ? (contrat.loyer_mensuel?.toString() || '') : '',
        charges_mensuelles: !estVente ? (contrat.charges_mensuelles?.toString() || '') : '',
        depot_garantie: !estVente ? (contrat.depot_garantie?.toString() || '') : '',
        prix_vente: estVente ? (contrat.prix_vente?.toString() || '') : '',
        clause_particuliere: contrat.clause_particuliere || '',
        statut: contrat.statut || 'ACTIF'
      });

      if (contrat.bien) setBienSelectionne(contrat.bien);
      if (contrat.locataire) setLocataireSelectionne(contrat.locataire);
    }
  }, [contrat]);

  // ✅ Charger les données initiales quand locataire_id est fourni
  useEffect(() => {
    if (locataire_id && locataires.length > 0 && !contrat) {
      const locataire = locataires.find(l => l.id === locataire_id);
      if (locataire) {
        setLocataireSelectionne(locataire);
        setFormData(prev => ({
          ...prev,
          locataire_id: locataire_id.toString()
        }));

        if (locataire.bien_actuel) {
          setFormData(prev => ({
            ...prev,
            bien_id: locataire.bien_actuel.id.toString()
          }));
        }
      }
    }
  }, [locataire_id, locataires, contrat]);

  // ✅ Charger les données initiales quand bien_id est fourni (pour création)
  useEffect(() => {
    if (bien_id && biens.length > 0 && !contrat) {
      const bien = biens.find(b => b.id === bien_id);
      if (bien) {
        setBienSelectionne(bien);
        // ✅ Pré-remplir selon le statut du bien
        if (bien.statut === 'EN_VENTE') {
          setFormData(prev => ({
            ...prev,
            bien_id: bien_id.toString(),
            type_contrat: 'VENTE',
            prix_vente: bien.prix_vente?.toString() || prev.prix_vente,
            loyer_mensuel: '',
            charges_mensuelles: '',
            depot_garantie: ''
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            bien_id: bien_id.toString(),
            loyer_mensuel: bien.loyer_mensuel?.toString() || prev.loyer_mensuel,
            charges_mensuelles: bien.charges?.toString() || prev.charges_mensuelles,
            depot_garantie: bien.depot_garantie?.toString() || prev.depot_garantie
          }));
        }

        if (bien.locataire_actuel) {
          setFormData(prev => ({
            ...prev,
            locataire_id: bien.locataire_actuel.id.toString()
          }));
        }
      }
    }
  }, [bien_id, biens, contrat]);

  // ✅ Quand on sélectionne un bien (manuellement), pré-remplir selon son statut
  useEffect(() => {
    if (bienSelectionne && !contrat) {
      if (bienSelectionne.statut === 'EN_VENTE' || bienSelectionne.prix_vente) {
        setFormData(prev => ({
          ...prev,
          type_contrat: 'VENTE',
          prix_vente: bienSelectionne.prix_vente?.toString() || prev.prix_vente,
          loyer_mensuel: '',
          charges_mensuelles: '',
          depot_garantie: ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          type_contrat: prev.type_contrat === 'VENTE' ? 'BAIL_VIDE' : prev.type_contrat,
          loyer_mensuel: bienSelectionne.loyer_mensuel?.toString() || prev.loyer_mensuel,
          charges_mensuelles: bienSelectionne.charges?.toString() || prev.charges_mensuelles,
          depot_garantie: bienSelectionne.depot_garantie?.toString() || prev.depot_garantie,
          prix_vente: ''
        }));
      }
    }
  }, [bienSelectionne, contrat]);

  // ✅ Pré-remplissage bidirectionnel
  useEffect(() => {
    if (locataireSelectionne && locataireSelectionne.bien_actuel && !contrat) {
      setFormData(prev => ({
        ...prev,
        bien_id: locataireSelectionne.bien_actuel.id.toString()
      }));
      
      const bienAssocie = biens.find(b => b.id === locataireSelectionne.bien_actuel.id);
      if (bienAssocie) {
        setBienSelectionne(bienAssocie);
      }
    }
  }, [locataireSelectionne, biens, contrat]);

  useEffect(() => {
    if (bienSelectionne && bienSelectionne.locataire_actuel && !contrat) {
      setFormData(prev => ({
        ...prev,
        locataire_id: bienSelectionne.locataire_actuel.id.toString()
      }));
      
      const locataireAssocie = locataires.find(l => l.id === bienSelectionne.locataire_actuel.id);
      if (locataireAssocie) {
        setLocataireSelectionne(locataireAssocie);
      }
    }
  }, [bienSelectionne, locataires, contrat]);

  const chargerBiens = async () => {
    try {
      const response = await fetch('/api/biens?statut=DISPONIBLE,LOUE,EN_VENTE');
      const data = await response.json();
      if (data.success) {
        setBiens(data.biens);
      }
    } catch (error) {
      console.error('Erreur chargement biens:', error);
    }
  };

  const chargerLocataires = async () => {
    try {
      const response = await fetch('/api/locataires?statut=ACTIF,PROSPECT');
      const data = await response.json();
      if (data.success) {
        setLocataires(data.locataires);
      }
    } catch (error) {
      console.error('Erreur chargement locataires:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bien_id) newErrors.bien_id = 'Le bien est requis';
    if (!formData.locataire_id) newErrors.locataire_id = 'Le locataire est requis';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    
    // ✅ Validation selon le type de contrat
    if (isVente) {
      if (!formData.prix_vente) {
        newErrors.prix_vente = 'Le prix de vente est requis';
      } else if (parseFloat(formData.prix_vente) <= 0) {
        newErrors.prix_vente = 'Le prix doit être positif';
      }
    } else {
      if (!formData.loyer_mensuel) {
        newErrors.loyer_mensuel = 'Le loyer mensuel est requis';
      } else if (parseFloat(formData.loyer_mensuel) <= 0) {
        newErrors.loyer_mensuel = 'Le loyer doit être positif';
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
      const url = contrat 
        ? `/api/contrats/${contrat.id}`
        : '/api/contrats';
      
      const method = contrat ? 'PUT' : 'POST';

      console.log('📤 Envoi des données:', formData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const responseText = await response.text();
      console.log('📦 Réponse brute:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ La réponse n\'est pas du JSON valide:', responseText);
        toast.error('Erreur de format de réponse du serveur');
        setIsLoading(false);
        return;
      }

      if (response.ok && data.success) {
        toast.success(contrat ? 'Contrat modifié avec succès' : 
          (formData.type_contrat === 'VENTE' ? 'Contrat de vente créé avec succès' : 'Contrat créé avec succès'));
        onSuccess();
      } else {
        console.error('❌ Erreur réponse:', data);
        toast.error(data.erreur || `Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
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
        className="modal-content contrat-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{contrat ? 'Modifier le contrat' : (isVente ? 'Nouveau contrat de vente' : 'Nouveau contrat de location')}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="contrat-form">
            <div className="form-sections">
              {/* Parties prenantes */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>🤝</span> Parties prenantes
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>{isVente ? 'Acheteur *' : 'Locataire *'}</label>
                    <select
                      value={formData.locataire_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        setFormData({...formData, locataire_id: id});
                        const loc = locataires.find(l => l.id.toString() === id);
                        setLocataireSelectionne(loc || null);
                      }}
                      className={errors.locataire_id ? 'error' : ''}
                      disabled={!!contrat}
                    >
                      <option value="">{isVente ? 'Sélectionnez un acheteur' : 'Sélectionnez un locataire'}</option>
                      {locataires.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.prenom} {loc.nom} - {loc.email}
                          {loc.bien_actuel && ' (👤 avec bien)'}
                        </option>
                      ))}
                    </select>
                    {errors.locataire_id && <span className="error-message">{errors.locataire_id}</span>}
                    
                    {locataireSelectionne && locataireSelectionne.bien_actuel && (
                      <small className="field-hint">
                        ⚡ Ce client a déjà un bien ({locataireSelectionne.bien_actuel.nom})
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Bien *</label>
                    <select
                      value={formData.bien_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        setFormData({...formData, bien_id: id});
                        const bien = biens.find(b => b.id.toString() === id);
                        setBienSelectionne(bien || null);
                      }}
                      className={errors.bien_id ? 'error' : ''}
                      disabled={!!contrat}
                    >
                      <option value="">Sélectionnez un bien</option>
                      {biens.map(bien => (
                        <option key={bien.id} value={bien.id}>
                          {bien.nom} - {bien.ville} 
                          {bien.statut === 'EN_VENTE' ? ' (💰 En vente)' : bien.statut === 'LOUE' ? ' (🔒 Loué)' : ' (✅ Disponible)'}
                        </option>
                      ))}
                    </select>
                    {errors.bien_id && <span className="error-message">{errors.bien_id}</span>}
                  </div>
                </div>

                {/* Affichage des infos du bien sélectionné */}
                {bienSelectionne && (
                  <div className="info-panel">
                    <h4>Informations du bien</h4>
                    <div className="info-grid">
                      <div><strong>Adresse:</strong> {bienSelectionne.adresse}, {bienSelectionne.commune}</div>
                      <div><strong>Surface:</strong> {bienSelectionne.surface} m²</div>
                      <div><strong>Pièces:</strong> {bienSelectionne.pieces}</div>
                      
                      {/* ✅ Affichage conditionnel : prix de vente OU loyer */}
                      {bienSelectionne.statut === 'EN_VENTE' || bienSelectionne.prix_vente ? (
                        <div>
                          <strong>Prix de vente:</strong> {bienSelectionne.prix_vente?.toLocaleString()} FCFA
                        </div>
                      ) : (
                        <>
                          <div>
                            <strong>Loyer:</strong> {bienSelectionne.loyer_mensuel?.toLocaleString()} FCFA
                          </div>
                          {bienSelectionne.charges > 0 && (
                            <div>
                              <strong>Charges:</strong> {bienSelectionne.charges?.toLocaleString()} FCFA
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Type et dates */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📅</span> Type et dates
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Type de contrat *</label>
                    <select
                      value={formData.type_contrat}
                      onChange={(e) => setFormData({...formData, type_contrat: e.target.value})}
                    >
                      {TYPES_CONTRAT.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icone} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Statut *</label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    >
                      {STATUTS_CONTRAT.map(statut => (
                        <option key={statut.value} value={statut.value}>
                          {statut.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date de début *</label>
                    <input
                      type="date"
                      value={formData.date_debut}
                      onChange={(e) => setFormData({...formData, date_debut: e.target.value})}
                      className={errors.date_debut ? 'error' : ''}
                    />
                    {errors.date_debut && <span className="error-message">{errors.date_debut}</span>}
                  </div>

                  {!isVente && (
                    <div className="form-group">
                      <label>Date de fin (optionnel)</label>
                      <input
                        type="date"
                        value={formData.date_fin}
                        onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Date de signature</label>
                    <input
                      type="date"
                      value={formData.date_signature}
                      onChange={(e) => setFormData({...formData, date_signature: e.target.value})}
                    />
                  </div>

                  {!isVente && (
                    <>
                      <div className="form-group">
                        <label>Date état des lieux entrée</label>
                        <input
                          type="date"
                          value={formData.date_etat_lieux_entree}
                          onChange={(e) => setFormData({...formData, date_etat_lieux_entree: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label>Date état des lieux sortie</label>
                        <input
                          type="date"
                          value={formData.date_etat_lieux_sortie}
                          onChange={(e) => setFormData({...formData, date_etat_lieux_sortie: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ✅ Aspects financiers adaptés - comme dans BienForm */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>💰</span> {isVente ? 'Prix de vente' : 'Aspects financiers'}
                </div>
                <div className="form-grid">
                  {isVente ? (
                    // ✅ Mode vente
                    <div className="form-group full-width">
                      <label>Prix de vente (FCFA) *</label>
                      <input
                        type="number"
                        step="10000"
                        value={formData.prix_vente}
                        onChange={(e) => setFormData({...formData, prix_vente: e.target.value})}
                        className={errors.prix_vente ? 'error' : ''}
                        placeholder="50 000 000"
                      />
                      {errors.prix_vente && <span className="error-message">{errors.prix_vente}</span>}
                      {bienSelectionne && bienSelectionne.prix_vente && (
                        <small className="field-hint">✓ Pré-rempli depuis le bien</small>
                      )}
                    </div>
                  ) : (
                    // ✅ Mode location
                    <>
                      <div className="form-group">
                        <label>Loyer mensuel (FCFA) *</label>
                        <input
                          type="number"
                          step="1000"
                          value={formData.loyer_mensuel}
                          onChange={(e) => setFormData({...formData, loyer_mensuel: e.target.value})}
                          className={errors.loyer_mensuel ? 'error' : ''}
                          placeholder="150000"
                        />
                        {errors.loyer_mensuel && <span className="error-message">{errors.loyer_mensuel}</span>}
                        {bienSelectionne && (
                          <small className="field-hint">✓ Pré-rempli depuis le bien</small>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Charges mensuelles (FCFA)</label>
                        <input
                          type="number"
                          step="1000"
                          value={formData.charges_mensuelles}
                          onChange={(e) => setFormData({...formData, charges_mensuelles: e.target.value})}
                          placeholder="25000"
                        />
                        {bienSelectionne && bienSelectionne.charges > 0 && (
                          <small className="field-hint">✓ Pré-rempli depuis le bien</small>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Dépôt de garantie (FCFA)</label>
                        <input
                          type="number"
                          step="1000"
                          value={formData.depot_garantie}
                          onChange={(e) => setFormData({...formData, depot_garantie: e.target.value})}
                          placeholder="300000"
                        />
                        {bienSelectionne && bienSelectionne.depot_garantie > 0 && (
                          <small className="field-hint">✓ Pré-rempli depuis le bien</small>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Clauses */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📝</span> Clauses particulières
                </div>
                <div className="form-group full-width">
                  <textarea
                    value={formData.clause_particuliere}
                    onChange={(e) => setFormData({...formData, clause_particuliere: e.target.value})}
                    rows={3}
                    placeholder="Clauses particulières du contrat (optionnel)..."
                  />
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
              contrat ? '💾 Modifier' : '💾 Créer'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}