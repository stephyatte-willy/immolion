'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { STATUTS_PAIEMENT, MODES_PAIEMENT, TYPES_PAIEMENT } from '@/app/types/paiements';
import { documentPaiementService } from '@/app/services/quittanceService';
import toast from 'react-hot-toast';
import './paiements.css';

interface PaiementCardProps {
  paiement: any;
  onEdit: (paiement: any) => void;
  onDelete: (paiement: any) => void;
  formatMoney: (amount: number) => string;
  compact?: boolean;
  contrat?: any;
  locataire?: any;
  bien?: any;
  entreprise?: any;
}

export default function PaiementCard({ 
  paiement, 
  onEdit, 
  onDelete, 
  formatMoney,
  compact = false,
  contrat: propContrat,
  locataire: propLocataire,
  bien: propBien,
  entreprise: propEntreprise
}: PaiementCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const getStatutInfo = (statut: string) => {
    const statutObj = STATUTS_PAIEMENT.find(s => s.value === statut) || STATUTS_PAIEMENT[0];
    return {
      label: statutObj.label,
      couleur: statutObj.couleur
    };
  };

  const getModeIcon = (mode: string) => {
    const modeObj = MODES_PAIEMENT.find(m => m.value === mode);
    return modeObj?.icone || '💳';
  };

  const getTypeInfo = (type: string) => {
    const typeObj = TYPES_PAIEMENT.find(t => t.value === type);
    return {
      icone: typeObj?.icone || '💰',
      label: typeObj?.label || type
    };
  };

  const statutInfo = getStatutInfo(paiement.statut);
  const typeInfo = getTypeInfo(paiement.type_paiement);
  const modeIcon = getModeIcon(paiement.mode_paiement);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getMoisConcerne = () => {
    if (!paiement.mois_concerne) return null;
    const [annee, mois] = paiement.mois_concerne.split('-');
    const moisList = ['Janv', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    return `${moisList[parseInt(mois) - 1]} ${annee}`;
  };

  const moisConcerne = getMoisConcerne();

  // ✅ Génération directe de la quittance
  const handleGenerateQuittance = async () => {
    setIsGenerating(true);
    
    try {
      // Récupérer les données nécessaires si non fournies en props
      let contrat = propContrat;
      let locataire = propLocataire;
      let bien = propBien;
      let entreprise = propEntreprise;

      // Si les données ne sont pas fournies, les récupérer depuis l'API
      if (!contrat && paiement.contrat_id) {
        const contratRes = await fetch(`/api/contrats/${paiement.contrat_id}`);
        const contratData = await contratRes.json();
        contrat = contratData.contrat;
      }
      
      if (!locataire && paiement.locataire_id) {
        const locataireRes = await fetch(`/api/locataires/${paiement.locataire_id}`);
        const locataireData = await locataireRes.json();
        locataire = locataireData.locataire;
      }
      
      if (!bien && paiement.bien_id) {
        const bienRes = await fetch(`/api/biens/${paiement.bien_id}`);
        const bienData = await bienRes.json();
        bien = bienData.bien;
      }
      
      if (!entreprise) {
        const entrepriseRes = await fetch('/api/entreprise');
        const entrepriseData = await entrepriseRes.json();
        entreprise = entrepriseData.entreprise;
      }

      if (!contrat || !locataire || !bien || !entreprise) {
        toast.error('Impossible de récupérer toutes les informations');
        return;
      }

      const isVente = contrat.type_contrat === 'VENTE';
      
      // Calculer le total déjà versé pour les ventes
      let totalDejaVerse = 0;
      if (isVente) {
        const versementsRes = await fetch(`/api/paiements?contrat_id=${contrat.id}&type_paiement=ACOMPTE,VERSEMENT,SOLDE`);
        const versementsData = await versementsRes.json();
        if (versementsData.success && versementsData.paiements) {
          totalDejaVerse = versementsData.paiements.reduce((sum: number, p: any) => sum + (parseFloat(p.montant) || 0), 0);
        }
      }

      // ✅ Type explicite pour quittanceData
      const quittanceData: any = {
        type: isVente ? 'VENTE' : 'LOCATION',
        numero_document: paiement.numero_quittance || `QUIT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(paiement.id).padStart(6, '0')}`,
        date_emission: new Date().toISOString(),
        paiement: {
          reference: paiement.reference || `PAIEMENT-${paiement.id}`,
          montant: parseFloat(paiement.montant),
          date_paiement: paiement.date_paiement,
          mode_paiement: paiement.mode_paiement,
          penalite: paiement.penalite ? parseFloat(paiement.penalite) : 0,
          type_versement: paiement.type_vente,
          versement_numero: paiement.versement_numero
        },
        contrat: {
          numero: contrat.numero_contrat,
          date_debut: contrat.date_debut,
          date_fin: contrat.date_fin,
          type: contrat.type_contrat,
          loyer_mensuel: bien.loyer_mensuel ? parseFloat(bien.loyer_mensuel) : 0,
          prix_vente: contrat.prix_vente ? parseFloat(contrat.prix_vente) : 0
        },
        client: {
          nom: locataire.nom,
          prenom: locataire.prenom,
          telephone: locataire.telephone || '',
          type: isVente ? 'acheteur' : 'locataire'
        },
        bien: {
          nom: bien.nom,
          adresse: bien.adresse || '',
          commune: bien.commune || '',
          ville: bien.ville || '',
          quartier: bien.quartier || '',
          loyer_mensuel: bien.loyer_mensuel ? parseFloat(bien.loyer_mensuel) : 0,
          prix_vente: contrat.prix_vente ? parseFloat(contrat.prix_vente) : 0
        },
        entreprise: {
          nom: entreprise.nom || 'ImmoLion Gestion',
          adresse: entreprise.ville ? `${entreprise.ville}, Côte d'Ivoire` : 'Abidjan, Côte d\'Ivoire',
          telephone: entreprise.telephone || '+225 00 00 00 00',
          email: entreprise.email || 'contact@immolion.ci',
          site_web: entreprise.site_web
        },
        echeancier: isVente ? {
          total_vente: parseFloat(contrat.prix_vente || 0),
          deja_verse: totalDejaVerse,
          reste: parseFloat(contrat.prix_vente || 0) - totalDejaVerse,
          versement_numero: paiement.versement_numero || 1
        } : undefined
      };

      await documentPaiementService.genererDocument(quittanceData);
      toast.success('Document généré avec succès');
      
    } catch (error) {
      console.error('Erreur génération:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ Version compacte
  if (compact) {
    return (
      <motion.div 
        className={`paiement-card compact ${paiement.statut.toLowerCase()}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className="paiement-card-compact">
          <div className="compact-row">
            <div className="compact-left">
              <span className="compact-date">
                {formatDate(paiement.date_paiement)}
              </span>
              <span className="compact-montant highlight">
                {formatMoney(paiement.montant)}
              </span>
            </div>
            
            <div className="compact-right">
              <span 
                className={`compact-statut ${paiement.statut.toLowerCase()}`}
                style={{ 
                  backgroundColor: `${statutInfo.couleur}20`,
                  color: statutInfo.couleur
                }}
              >
                {statutInfo.label}
              </span>
              
              <div className="compact-actions">
                <button 
                  onClick={handleGenerateQuittance} 
                  title="Télécharger la quittance"
                  className="compact-btn quittance"
                  disabled={isGenerating}
                >
                  {isGenerating ? '⏳' : '📥'}
                </button>
                <button 
                  onClick={() => onEdit(paiement)} 
                  title="Modifier"
                  className="compact-btn edit"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => onDelete(paiement)} 
                  title="Supprimer"
                  className="compact-btn delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          {moisConcerne && (
            <div className="compact-details">
              <span className="compact-mois">📅 Le mois : {moisConcerne}</span>
              {paiement.reference && (
                <span className="compact-reference">
                  Réf: {paiement.reference}
                </span>
              )}
              <span className="compact-mode">
                {modeIcon} {paiement.mode_paiement} 
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ✅ Version normale
  return (
    <motion.div 
      className={`paiement-card ${paiement.statut.toLowerCase()}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.3 }}
    >
      <div className="paiement-card-header">
        <div className="paiement-type">
          <span className="type-icon">{typeInfo.icone}</span>
          <span className="type-label">{typeInfo.label}</span>
        </div>
        <div 
          className="paiement-statut-badge"
          style={{ 
            background: `${statutInfo.couleur}20`,
            color: statutInfo.couleur,
            borderColor: `${statutInfo.couleur}40`
          }}
        >
          {statutInfo.label}
        </div>
      </div>

      <div className="paiement-card-body">
        <div className="paiement-montant">
          <span className="montant-valeur">{formatMoney(paiement.montant)}</span>
          {paiement.penalite > 0 && (
            <span className="montant-penalite">
              + {formatMoney(paiement.penalite)} (pénalité)
            </span>
          )}
        </div>

        <div className="paiement-infos">
          <div className="paiement-client">
            <span className="info-icon">👤</span>
            <span className="info-text">
              {paiement.locataire_prenom} {paiement.locataire_nom}
            </span>
          </div>
          
          <div className="paiement-bien">
            <span className="info-icon">🏠</span>
            <span className="info-text">{paiement.bien_nom || 'Bien'}</span>
          </div>

          {paiement.contrat_numero && (
            <div className="paiement-contrat">
              <span className="info-icon">📄</span>
              <span className="info-text">{paiement.contrat_numero}</span>
            </div>
          )}
        </div>

        <div className="paiement-dates">
          <div className="paiement-date">
            <span className="date-icon">📅</span>
            <span className="date-text">{formatDate(paiement.date_paiement)}</span>
          </div>
          
          {moisConcerne && (
            <div className="paiement-mois">
              <span className="mois-icon">🗓️</span>
              <span className="mois-text">{moisConcerne}</span>
            </div>
          )}

          <div className="paiement-mode">
            <span className="mode-icon">{modeIcon}</span>
            <span className="mode-text">{paiement.mode_paiement}</span>
          </div>
        </div>

        <div className="paiement-references">
          {paiement.reference && (
            <div className="paiement-reference">
              <span className="ref-label">Réf:</span>
              <span className="ref-valeur">{paiement.reference}</span>
            </div>
          )}
          
          {paiement.numero_quittance && (
            <div className="paiement-quittance">
              <span className="quittance-label">N°</span>
              <span className="quittance-valeur">{paiement.numero_quittance}</span>
            </div>
          )}
        </div>

        {paiement.commentaire && (
          <div className="paiement-commentaire">
            <span className="commentaire-icon">📝</span>
            <span className="commentaire-texte">{paiement.commentaire}</span>
          </div>
        )}
      </div>

      <div className={`paiement-card-actions ${isHovered ? 'visible' : ''}`}>
        <button
          className="action-btn quittance"
          onClick={handleGenerateQuittance}
          title="Télécharger la quittance"
          disabled={isGenerating}
        >
          {isGenerating ? '⏳' : '📥'}
        </button>
        <button
          className="action-btn edit"
          onClick={() => onEdit(paiement)}
          title="Modifier"
        >
          ✏️
        </button>
        <button
          className="action-btn delete"
          onClick={() => onDelete(paiement)}
          title="Supprimer"
        >
          🗑️
        </button>
      </div>

      {paiement.versement_numero && (
        <div className="paiement-versement-badge">
          Versement #{paiement.versement_numero}
        </div>
      )}
    </motion.div>
  );
}