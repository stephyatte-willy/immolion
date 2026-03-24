'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import PaiementCard from './PaiementCard';
import './paiements.css';

interface ContratPaiementsAccordeonProps {
  contrat: {
    id: number;
    numero_contrat: string;
    type_contrat?: string;
    locataire: {
      nom?: string;
      prenom?: string;
    };
    bien: {
      nom?: string;
    };
  };
  paiements: any[];
  onEditPaiement: (paiement: any) => void;
  onDeletePaiement: (paiement: any) => void;
  onAddPaiement: (contratId: number) => void;
  formatMoney: (amount: number) => string;
}

export default function ContratPaiementsAccordeon({
  contrat,
  paiements,
  onEditPaiement,
  onDeletePaiement,
  onAddPaiement,
  formatMoney
}: ContratPaiementsAccordeonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Trier les paiements du plus récent au plus ancien
  const paiementsTries = [...paiements].sort((a, b) => 
    new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime()
  );
  
  // ✅ CORRECTION: Calculer les totaux avec vérification des valeurs
  const totalPaye = paiements.reduce((sum, p) => {
    const montant = Number(p.montant) || 0;
    return sum + montant;
  }, 0);
  
  const totalPenalites = paiements.reduce((sum, p) => {
    const penalite = Number(p.penalite) || 0;
    return sum + penalite;
  }, 0);
  
  const dernierPaiement = paiementsTries[0]?.date_paiement;
  
  // Compter par statut
  const effectues = paiements.filter(p => p.statut === 'EFFECTUE').length;
  const enAttente = paiements.filter(p => p.statut === 'EN_ATTENTE').length;
  const enRetard = paiements.filter(p => p.statut === 'EN_RETARD').length;

  // Déterminer la couleur du statut global
  const getStatutCouleur = () => {
    if (enRetard > 0) return '#ef4444';
    if (enAttente > 0) return '#f59e0b';
    return '#10b981';
  };

  // Formater la date du dernier paiement
  const formatDate = (date: string) => {
    if (!date) return 'Aucun';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Date invalide';
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Date invalide';
    }
  };

  // ✅ Fonction de formatage sécurisée
  const safeFormatMoney = (amount: number) => {
    try {
      if (isNaN(amount) || amount === null || amount === undefined) {
        return '0 FCFA';
      }
      return formatMoney(amount);
    } catch {
      return amount?.toLocaleString() + ' FCFA' || '0 FCFA';
    }
  };

  return (
    <div className="contrat-accordeon">
      {/* En-tête du contrat - toujours visible */}
      <motion.div 
        className="contrat-accordeon-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ borderLeftColor: getStatutCouleur() }}
        whileHover={{ backgroundColor: 'var(--hover-bg)' }}
      >
        <div className="contrat-header-info">
          <div className="contrat-header-left">
            <span className="contrat-icon">📄</span>
            <div>
              <h3 className="contrat-titre">{contrat.numero_contrat}</h3>
              <p className="contrat-sous-titre">
                {contrat.locataire?.prenom} {contrat.locataire?.nom} • {contrat.bien?.nom || 'Bien'}
              </p>
            </div>
          </div>
          
          <div className="contrat-header-stats">
            <div className="stat-chip">
              <span className="stat-label">Paiements</span>
              <span className="stat-valeur">{paiements.length}</span>
            </div>
            
            <div className="stat-chip">
              <span className="stat-label">Total</span>
              <span className="stat-valeur highlight">{safeFormatMoney(totalPaye)}</span>
            </div>
            
            <div className="stat-chip date-chip">
              <span className="stat-label">Dernier</span>
              <span className="stat-valeur small">{formatDate(dernierPaiement)}</span>
            </div>
            
            <div className="statuts">
              {effectues > 0 && (
                <span className="statut-badge effectue" title={`${effectues} effectué(s)`}>
                  {effectues} ✅
                </span>
              )}
              {enAttente > 0 && (
                <span className="statut-badge attente" title={`${enAttente} en attente`}>
                  {enAttente} ⏳
                </span>
              )}
              {enRetard > 0 && (
                <span className="statut-badge retard" title={`${enRetard} en retard`}>
                  {enRetard} ⚠️
                </span>
              )}
            </div>
          </div>
          
          <button className="expand-btn">
            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
          </button>
        </div>
      </motion.div>

      {/* Liste des paiements - expansible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="contrat-accordeon-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="paiements-liste">
              {paiementsTries.map((paiement, index) => (
                <motion.div
                  key={paiement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PaiementCard
                    paiement={paiement}
                    onEdit={onEditPaiement}
                    onDelete={onDeletePaiement}
                    formatMoney={formatMoney}
                    compact={true} 
                  />
                </motion.div>
              ))}
            </div>
            
            <div className="contrat-footer">
              <button 
                className="btn-add-paiement small"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPaiement(contrat.id);
                }}
              >
                <span className="btn-icon">➕</span>
                Ajouter un paiement
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}