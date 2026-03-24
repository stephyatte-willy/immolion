'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { documentPaiementService } from '@/app/services/quittanceService';
import toast from 'react-hot-toast';
import './paiements.css';

interface QuittancePreviewModalProps {
  isOpen: boolean;
  paiement: any | null;
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

  if (!isOpen || !paiement || !locataire || !contrat || !bien || !entreprise) {
    return null;
  }

  const isVente = contrat?.type_contrat === 'VENTE';
  
  const genererDocument = async () => {
    setIsGenerating(true);
    try {
      await onPrint();
      toast.success('Document généré avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
      onClose();
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
        className="modal-content quittance-preview-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <span className="title-icon">📄</span>
            <h2>Générer le document</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="document-summary">
            <div className="summary-icon">
              {isVente ? '🏠💰' : '🏠📄'}
            </div>
            <h3>{isVente ? 'Reçu de versement' : 'Quittance de loyer'}</h3>
            <div className="summary-details">
              <p><strong>Contrat :</strong> {contrat.numero_contrat}</p>
              <p><strong>Client :</strong> {locataire.prenom} {locataire.nom}</p>
              <p><strong>Bien :</strong> {bien.nom}</p>
              <p><strong>Montant :</strong> {parseFloat(paiement.montant).toLocaleString()} FCFA</p>
              <p><strong>Date :</strong> {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Annuler
          </button>
          <button 
            className="btn-submit"
            onClick={genererDocument}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="spinner-small"></span>
                Génération...
              </>
            ) : (
              <>
                <span className="btn-icon">📥</span>
                Télécharger
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}