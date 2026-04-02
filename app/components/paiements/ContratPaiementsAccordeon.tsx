'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import './paiements.css';

interface ContratPaiementsAccordeonProps {
  contrat: {
    id: number;
    numero_contrat: string;
    locataire?: {
      id?: number;
      nom?: string;
      prenom?: string;
    };
    acquereur?: {
      id?: number;
      nom?: string;
      prenom?: string;
    };
    bien: {
      id?: number;
      nom?: string;
    };
    type_contrat?: string;
  };
  paiements: any[];
  onEditPaiement: (paiement: any) => void;
  onDeletePaiement: (paiement: any) => void;
  onAddPaiement: (contratId: number, clientId?: number, bienId?: number) => void;
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
  
  // ✅ CHAQUE ACCORDEON GÈRE SON PROPRE ÉTAT
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const isVente = contrat.type_contrat === 'VENTE';
  const clientNom = isVente 
    ? `${contrat.acquereur?.prenom || ''} ${contrat.acquereur?.nom || ''}`
    : `${contrat.locataire?.prenom || ''} ${contrat.locataire?.nom || ''}`;

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

  const getTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'CAUTION': 'Caution',
      'AVANCE': 'Avance loyer',
      'LOYER': 'Loyer mensuel',
      'ACOMPTE': 'Acompte vente',
      'VERSEMENT': 'Versement',
      'SOLDE': 'Solde final',
      'AUTRE': 'Autre'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'CAUTION': '🔒',
      'AVANCE': '⏩',
      'LOYER': '🏠',
      'ACOMPTE': '💵',
      'VERSEMENT': '💰',
      'SOLDE': '✅',
      'AUTRE': '📝'
    };
    return icons[type] || '💳';
  };

  const getStatutLabel = (statut: string): string => {
    const status: Record<string, string> = {
      'EFFECTUE': 'Effectué',
      'EN_ATTENTE': 'En attente',
      'EN_RETARD': 'En retard',
      'VALIDE': 'Validé'
    };
    return status[statut] || statut;
  };

  const getStatutClass = (statut: string): string => {
    const classes: Record<string, string> = {
      'EFFECTUE': 'effectue',
      'EN_ATTENTE': 'attente',
      'EN_RETARD': 'retard',
      'VALIDE': 'valide'
    };
    return classes[statut] || '';
  };

  const totalPaye = paiements.reduce((sum, p) => {
    const montant = Number(p.montant) || 0;
    return sum + montant;
  }, 0);
  
  const dernierPaiement = paiements.length > 0 ? paiements[0]?.date_paiement : null;
  
  const effectues = paiements.filter(p => p.statut === 'EFFECTUE' || p.statut === 'VALIDE').length;
  const enAttente = paiements.filter(p => p.statut === 'EN_ATTENTE').length;
  const enRetard = paiements.filter(p => p.statut === 'EN_RETARD').length;

  const getStatutCouleur = () => {
    if (enRetard > 0) return '#ef4444';
    if (enAttente > 0) return '#f59e0b';
    return '#10b981';
  };

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
      {/* En-tête du contrat - cliquable */}
      <motion.div 
        className={`contrat-accordeon-header ${isVente ? 'vente' : 'location'}`}
        onClick={toggleExpand}
        style={{ borderLeftColor: getStatutCouleur() }}
        whileHover={{ backgroundColor: '#f8fafc' }}
      >
        <div className="contrat-header-info">
          <div className="contrat-header-left">
            <span className="contrat-icon">{isVente ? '💰' : '🏠'}</span>
            <div>
              <h3 className="contrat-titre">
                {contrat.numero_contrat}
                {isVente && <span className="badge-vente">VENTE</span>}
              </h3>
              <p className="contrat-sous-titre">
                {clientNom || 'Client'} • {contrat.bien?.nom || 'Bien'}
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

      {/* Contenu expansible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="contrat-accordeon-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {paiements.length === 0 ? (
              <div className="empty-paiements">
                <span className="empty-icon">💰</span>
                <p>Aucun paiement enregistré pour ce contrat</p>
                <button 
                  className="btn-add-small"
                  onClick={() => onAddPaiement(contrat.id, isVente ? contrat.acquereur?.id : contrat.locataire?.id, contrat.bien?.id)}
                >
                  + Ajouter un {isVente ? 'versement' : 'paiement'}
                </button>
              </div>
            ) : (
              <div className="paiements-table-container">
                <table className="paiements-table-simple">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Montant</th>
                      <th>Mode</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiements.map((paiement, index) => (
                      <tr key={paiement.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                        <td>{formatDate(paiement.date_paiement)}</td>
                        <td>
                          <span className="type-badge-simple">
                            {getTypeIcon(paiement.type_paiement)} {getTypeLabel(paiement.type_paiement)}
                          </span>
                        </td>
                        <td className="montant">{safeFormatMoney(paiement.montant)}</td>
                        <td>{paiement.mode_paiement}</td>
                        <td>
                          <span className={`statut-badge-simple ${getStatutClass(paiement.statut)}`}>
                            {getStatutLabel(paiement.statut)}
                          </span>
                        </td>
                        <td>
                          <div className="actions-simple">
                            <button 
                              onClick={() => onEditPaiement(paiement)} 
                              title="Modifier"
                              className="action-btn edit"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => onDeletePaiement(paiement)} 
                              title="Supprimer"
                              className="action-btn delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="contrat-footer">
              <button 
                className="btn-add"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPaiement(contrat.id, isVente ? contrat.acquereur?.id : contrat.locataire?.id, contrat.bien?.id);
                }}
              >
                <span className="btn-icon">➕</span>
                Ajouter un {isVente ? 'versement' : 'paiement'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}