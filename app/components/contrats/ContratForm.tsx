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
    clause_particuliere: '',
    statut: 'ACTIF'
  });

  const [biens, setBiens] = useState<any[]>([]);
  const [locataires, setLocataires] = useState<any[]>([]);
  const [bienSelectionne, setBienSelectionne] = useState<any>(null);
  const [locataireSelectionne, setLocataireSelectionne] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    chargerBiens();
    chargerLocataires();
  }, []);

// ✅ Mode édition : charger les données du contrat
useEffect(() => {
  if (contrat) {
    console.log('📦 Contrat reçu pour édition:', contrat);
    
    // Extraire et formater les dates
    const formatDate = (date: string | null | undefined) => {
      if (!date) return '';
      // Si la date est au format ISO (avec T)
      if (typeof date === 'string' && date.includes('T')) {
        return date.split('T')[0];
      }
      return date || '';
    };

    // Mettre à jour le formulaire avec TOUTES les données
    setFormData({
      bien_id: contrat.bien_id?.toString() || '',
      locataire_id: contrat.locataire_id?.toString() || '',
      type_contrat: contrat.type_contrat || 'BAIL_VIDE',
      date_debut: formatDate(contrat.date_debut),
      date_fin: formatDate(contrat.date_fin),
      date_signature: formatDate(contrat.date_signature),
      date_etat_lieux_entree: formatDate(contrat.date_etat_lieux_entree),
      date_etat_lieux_sortie: formatDate(contrat.date_etat_lieux_sortie),
      loyer_mensuel: contrat.loyer_mensuel?.toString() || '',
      charges_mensuelles: contrat.charges_mensuelles?.toString() || '',
      depot_garantie: contrat.depot_garantie?.toString() || '',
      clause_particuliere: contrat.clause_particuliere || '',
      statut: contrat.statut || 'ACTIF'
    });

    if (contrat.bien) setBienSelectionne(contrat.bien);
    if (contrat.locataire) setLocataireSelectionne(contrat.locataire);
  }
}, [contrat]);

  // ✅ Charger les données initiales quand locataire_id est fourni
  useEffect(() => {
    if (locataire_id && locataires.length > 0) {
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
  }, [locataire_id, locataires]);

  // ✅ Charger les données initiales quand bien_id est fourni
  useEffect(() => {
    if (bien_id && biens.length > 0) {
      const bien = biens.find(b => b.id === bien_id);
      if (bien) {
        setBienSelectionne(bien);
        setFormData(prev => ({
          ...prev,
          bien_id: bien_id.toString(),
          loyer_mensuel: bien.loyer_mensuel?.toString() || prev.loyer_mensuel,
          charges_mensuelles: bien.charges?.toString() || prev.charges_mensuelles,
          depot_garantie: bien.depot_garantie?.toString() || prev.depot_garantie
        }));

        if (bien.locataire_actuel) {
          setFormData(prev => ({
            ...prev,
            locataire_id: bien.locataire_actuel.id.toString()
          }));
        }
      }
    }
  }, [bien_id, biens]);

  // ✅ Quand on sélectionne un bien, pré-remplir les infos financières
  useEffect(() => {
    if (bienSelectionne) {
      setFormData(prev => ({
        ...prev,
        loyer_mensuel: bienSelectionne.loyer_mensuel?.toString() || prev.loyer_mensuel,
        charges_mensuelles: bienSelectionne.charges?.toString() || prev.charges_mensuelles,
        depot_garantie: bienSelectionne.depot_garantie?.toString() || prev.depot_garantie
      }));
    }
  }, [bienSelectionne]);

  // ✅ Pré-remplissage bidirectionnel : quand le locataire change
  useEffect(() => {
    if (locataireSelectionne) {
      if (locataireSelectionne.bien_actuel) {
        setFormData(prev => ({
          ...prev,
          bien_id: locataireSelectionne.bien_actuel.id.toString()
        }));
        
        const bienAssocie = biens.find(b => b.id === locataireSelectionne.bien_actuel.id);
        if (bienAssocie) {
          setBienSelectionne(bienAssocie);
        }
      }
    }
  }, [locataireSelectionne, biens]);

  // ✅ Pré-remplissage bidirectionnel : quand le bien change
  useEffect(() => {
    if (bienSelectionne && bienSelectionne.locataire_actuel) {
      setFormData(prev => ({
        ...prev,
        locataire_id: bienSelectionne.locataire_actuel.id.toString()
      }));
      
      const locataireAssocie = locataires.find(l => l.id === bienSelectionne.locataire_actuel.id);
      if (locataireAssocie) {
        setLocataireSelectionne(locataireAssocie);
      }
    }
  }, [bienSelectionne, locataires]);



  const chargerBiens = async () => {
    try {
      const response = await fetch('/api/biens?statut=DISPONIBLE,LOUE');
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
    if (!formData.loyer_mensuel) {
      newErrors.loyer_mensuel = 'Le loyer mensuel est requis';
    } else if (parseFloat(formData.loyer_mensuel) <= 0) {
      newErrors.loyer_mensuel = 'Le loyer doit être positif';
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

      const data = await response.json();

      if (data.success) {
        toast.success(contrat ? 'Contrat modifié avec succès' : 'Contrat créé avec succès');
        onSuccess();
      } else {
        console.error('❌ Erreur réponse:', data);
        toast.error(data.erreur || 'Une erreur est survenue');
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
          <h2>{contrat ? 'Modifier le contrat' : 'Nouveau contrat de location'}</h2>
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
                    <label>Locataire *</label>
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
                      <option value="">Sélectionnez un locataire</option>
                      {locataires.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.prenom} {loc.nom} - {loc.email}
                          {loc.bien_actuel && ' (👤 avec logement)'}
                        </option>
                      ))}
                    </select>
                    {errors.locataire_id && <span className="error-message">{errors.locataire_id}</span>}
                    
                    {locataireSelectionne && locataireSelectionne.bien_actuel && (
                      <small className="field-hint">
                        ⚡ Ce locataire a déjà un logement ({locataireSelectionne.bien_actuel.nom})
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
                          {bien.statut === 'LOUE' ? ' (🔒 Déjà loué)' : ' (✅ Disponible)'}
                          {bien.locataire_actuel && ' (👤 avec locataire)'}
                        </option>
                      ))}
                    </select>
                    {errors.bien_id && <span className="error-message">{errors.bien_id}</span>}
                    
                    {bienSelectionne && bienSelectionne.locataire_actuel && (
                      <small className="field-hint">
                        ⚡ Ce bien a déjà un locataire ({bienSelectionne.locataire_actuel.prenom} {bienSelectionne.locataire_actuel.nom})
                      </small>
                    )}
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
                      <div><strong>Loyer:</strong> {bienSelectionne.loyer_mensuel?.toLocaleString()} FCFA</div>
                      {bienSelectionne.charges > 0 && (
                        <div><strong>Charges:</strong> {bienSelectionne.charges?.toLocaleString()} FCFA</div>
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

                  <div className="form-group">
                    <label>Date de fin (optionnel)</label>
                    <input
                      type="date"
                      value={formData.date_fin}
                      onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                    />
                  </div>

                  <div className="form-group" key={`signature-${contrat?.id || 'new'}`}>
  <label>Date de signature</label>
  <input
    type="date"
    value={formData.date_signature}
    onChange={(e) => setFormData({...formData, date_signature: e.target.value})}
  />
</div>

                  <div className="form-group" key={`entree-${contrat?.id || 'new'}`}>
  <label>Date état des lieux entrée</label>
  <input
    type="date"
    value={formData.date_etat_lieux_entree}
    onChange={(e) => setFormData({...formData, date_etat_lieux_entree: e.target.value})}
  />
</div>

                  <div className="form-group" key={`sortie-${contrat?.id || 'new'}`}>
  <label>Date état des lieux sortie</label>
  <input
    type="date"
    value={formData.date_etat_lieux_sortie}
    onChange={(e) => setFormData({...formData, date_etat_lieux_sortie: e.target.value})}
  />
</div>
                </div>
              </div>

              {/* Aspects financiers */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>💰</span> Aspects financiers
                </div>
                <div className="form-grid">
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
                </div>
              </div>

              {/* Clauses */}
              <div className="form-section">
                <div className="modal-section-title">
                  <span>📝</span> Clauses particulières
                </div>
                <div className="form-group full-width" key={`clauses-${contrat?.id || 'new'}`}>
  <label>Clauses particulières</label>
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
              contrat ? '💾 Modifier le contrat' : '💾 Créer le contrat'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}