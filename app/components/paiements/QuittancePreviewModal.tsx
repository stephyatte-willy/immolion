'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import { documentPaiementService } from '@/app/services/quittanceService'; 
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import './paiements.css';

interface QuittancePreviewModalProps {
  isOpen: boolean;
  paiement: any | null;  // ✅ Peut être null
  locataire: any | null;
  contrat: any | null;
  bien: any | null;
  entreprise: any | null;
  onClose: () => void;
  onPrint: () => void;
}

export default function QuittancePreviewModal({
  isOpen,
  paiement,
  locataire,
  contrat,
  bien,
  entreprise,
  onClose,
  onPrint
}: QuittancePreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  // ✅ Vérification que paiement existe avant d'accéder à ses propriétés
  const [numeroQuittance, setNumeroQuittance] = useState(paiement?.numero_quittance || '');
  const { formatMoney } = useTheme();

  // Générer un nouveau numéro si nécessaire
  useEffect(() => {
    if (isOpen && paiement && !paiement.numero_quittance) {
      genererNumeroQuittance();
    }
  }, [isOpen, paiement]);

  const genererNumeroQuittance = async () => {
    if (!paiement) return; // ✅ Protection supplémentaire
    
    try {
      const date = new Date(paiement.date_paiement);
      const annee = date.getFullYear();
      const mois = date.getMonth() + 1;
      
      const response = await fetch(`/api/quittances/numero?annee=${annee}&mois=${mois}`);
      const data = await response.json();
      
      if (data.success) {
        setNumeroQuittance(data.numero);
      }
    } catch (error) {
      console.error('Erreur génération numéro:', error);
    }
  };

  const handlePrint = async () => {
  setIsGenerating(true);
  try {
    await onPrint();
  } finally {
    setIsGenerating(false);
  }
};

  // ✅ Si pas de paiement ou pas ouvert, ne rien afficher
  if (!isOpen || !paiement || !locataire || !contrat || !bien || !entreprise) {
    return null;
  }

  // Calculs pour l'affichage
  const montantTotal = paiement.montant + (paiement.penalite || 0);
  const moisConcerne = paiement.mois_concerne 
    ? (() => {
        const [annee, mois] = paiement.mois_concerne.split('-');
        const moisList = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                         'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return `${moisList[parseInt(mois) - 1]} ${annee}`;
      })()
    : format(new Date(paiement.date_paiement), 'MMMM yyyy', { locale: fr });

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content quittance-preview-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="title-icon">🖨️</span>
            <h2>Aperçu de la quittance</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Corps - Aperçu de la quittance */}
        <div className="modal-body quittance-preview-body">
          <div className="quittance-paper">
            {/* En-tête entreprise */}
            <div className="quittance-header">
              <h1 className="entreprise-nom">{entreprise.nom?.toUpperCase() || 'IMMOLION GESTION'}</h1>
              <p className="entreprise-adresse">{entreprise.ville || 'Abidjan'}, Côte d'Ivoire</p>
              <p className="entreprise-contact">
                Tél: {entreprise.telephone || '+225 00 00 00 00'} | Email: {entreprise.email || 'contact@immolion.ci'}
                {entreprise.site_web && ` | ${entreprise.site_web}`}
              </p>
            </div>

            {/* Titre et numéro */}
            <div className="quittance-title-section">
              <h2 className="quittance-title">QUITTANCE DE LOYER</h2>
              <div className="quittance-numero">
                <span className="numero-label">N°</span>
                <span className="numero-valeur">{numeroQuittance || paiement.numero_quittance || 'À générer'}</span>
              </div>
            </div>

            {/* Corps du texte */}
            <div className="quittance-corps">
              <p>
                <span className="texte-normal">Je soussigné, </span>
                <span className="texte-gras">{entreprise.nom || 'ImmoLion Gestion'}</span>
                <span className="texte-normal">, propriétaire du bien situé </span>
              </p>
              <p className="texte-gras adresse-bien">
                {bien.adresse}, {bien.quartier && `Quartier ${bien.quartier}, `}{bien.commune}, {bien.ville || 'Abidjan'}
              </p>
              <p>
                <span className="texte-normal">reconnaît avoir reçu de </span>
                <span className="texte-gras">M. {locataire.prenom} {locataire.nom}</span>
                <span className="texte-normal">, locataire, la somme de :</span>
              </p>
            </div>

            {/* Montant en chiffres */}
            <div className="quittance-montant-chiffres">
              {paiement.montant.toLocaleString()} FCFA
            </div>

            {/* Tableau récapitulatif */}
            <table className="quittance-table">
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th>Détails</th>
                  <th>Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Loyer mensuel</td>
                  <td>Mois de {moisConcerne}</td>
                  <td className="montant">{paiement.montant.toLocaleString()}</td>
                </tr>
                {paiement.penalite > 0 && (
                  <tr>
                    <td>Pénalité de retard</td>
                    <td>Application contrat</td>
                    <td className="montant">{paiement.penalite.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td colSpan={2} className="total-label">TOTAL</td>
                  <td className="total-montant">{montantTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Informations complémentaires */}
            <div className="quittance-infos">
              <p>
                <span className="info-label">Mode de paiement :</span>
                <span className="info-valeur"> {paiement.mode_paiement}</span>
              </p>
              <p>
                <span className="info-label">Référence :</span>
                <span className="info-valeur"> {paiement.reference || 'Non fournie'}</span>
              </p>
              <p>
                <span className="info-label">Date de paiement :</span>
                <span className="info-valeur"> {format(new Date(paiement.date_paiement), 'dd MMMM yyyy', { locale: fr })}</span>
              </p>
              <p>
                <span className="info-label">Contrat n° :</span>
                <span className="info-valeur"> {contrat.numero_contrat}</span>
              </p>
              <p>
                <span className="info-label">Locataire :</span>
                <span className="info-valeur"> {locataire.prenom} {locataire.nom} - Tél: {locataire.telephone}</span>
              </p>
            </div>

            {/* Mentions légales */}
            <div className="quittance-mentions">
              <p className="mentions-titre">MENTIONS LÉGALES</p>
              <p className="mentions-texte">
                Cette quittance est délivrée pour servir et valoir ce que de droit. 
                Elle est à conserver pendant toute la durée de la location et jusqu'à 
                trois ans après la fin du bail. En cas de perte, seule une attestation 
                de paiement pourra être délivrée.
              </p>
            </div>

            {/* Date et signatures */}
            <div className="quittance-signatures">
              <div className="signature-date">
                Fait à Abidjan, le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              </div>
              <div className="signatures-container">
                <div className="signature-proprietaire">
                  Signature du propriétaire
                  <span className="signature-mention">(Précédé de la mention "Reçu la somme ci-dessus")</span>
                </div>
                <div className="signature-locataire">
                  Signature du locataire
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied avec boutons */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Fermer
          </button>
          <button 
            className="btn-submit"
            onClick={handlePrint}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="spinner-small"></span>
                Génération...
              </>
            ) : (
              <>
                <span className="btn-icon">🖨️</span>
                Télécharger la quittance
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}