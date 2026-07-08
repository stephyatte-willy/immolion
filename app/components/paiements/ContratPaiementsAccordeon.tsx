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
    mode_vente?: string;
    nombre_versements?: number;
    acompte?: number;
    prix_vente?: number;
  };
  paiements: any[];
  onEditPaiement: (paiement: any) => void;
  onDeletePaiement: (paiement: any) => void;
  onAddPaiement: (contratId: number, clientId?: number, bienId?: number, type?: string) => void;
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
  const [sortField, setSortField] = useState<string>('date_paiement');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const isVente = contrat.type_contrat === 'VENTE';
  const isComptant = isVente && contrat.mode_vente === 'COMPTANT';
  const isEchelonne = isVente && contrat.mode_vente === 'ECHELONNE';
  
  const clientNom = isVente 
    ? `${contrat.acquereur?.prenom || ''} ${contrat.acquereur?.nom || ''}`.trim() || 'Client'
    : `${contrat.locataire?.prenom || ''} ${contrat.locataire?.nom || ''}`.trim() || 'Client';

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

  const getTypeLabelWithNumber = (paiement: any): string => {
    const type = paiement.type_paiement;
    
    switch (type) {
      case 'ACOMPTE':
        return 'Acompte';
      case 'VERSEMENT':
        const versementNum = paiement.versement_numero || getVersementNumeroFromList(paiement);
        return `Versement ${versementNum}`;
      case 'SOLDE':
        return isComptant ? 'Paiement total' : 'Solde final';
      case 'CAUTION':
        return 'Caution';
      case 'AVANCE':
        return 'Avance loyer';
      case 'LOYER':
        return 'Loyer mensuel';
      default:
        return type || 'Paiement';
    }
  };

  const getVersementNumeroFromList = (paiement: any): number => {
    const versements = paiements
      .filter(p => p.type_paiement === 'VERSEMENT')
      .sort((a, b) => new Date(a.date_paiement).getTime() - new Date(b.date_paiement).getTime());
    
    const index = versements.findIndex(v => v.id === paiement.id);
    return index + 1;
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

  const getSortedPaiements = () => {
    const sorted = [...paiements];
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortField) {
        case 'date_paiement':
          aVal = new Date(a.date_paiement).getTime();
          bVal = new Date(b.date_paiement).getTime();
          break;
        case 'type_paiement':
          aVal = getTypeLabelWithNumber(a);
          bVal = getTypeLabelWithNumber(b);
          break;
        case 'montant':
          aVal = parseFloat(a.montant) || 0;
          bVal = parseFloat(b.montant) || 0;
          break;
        case 'mode_paiement':
          aVal = a.mode_paiement || '';
          bVal = b.mode_paiement || '';
          break;
        case 'statut':
          aVal = getStatutLabel(a.statut);
          bVal = getStatutLabel(b.statut);
          break;
        default:
          aVal = new Date(a.date_paiement).getTime();
          bVal = new Date(b.date_paiement).getTime();
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
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

  // ✅ Affichage des informations d'échelonnement (uniquement pour les ventes échelonnées)
  const getEchelonInfo = () => {
    if (!isVente) return null;
    
    // ✅ Pour le paiement comptant, on n'affiche rien
    if (isComptant) {
      return <span className="mode-info comptant">💵 Paiement comptant</span>;
    }
    
    // ✅ Pour l'échelonné, on affiche la progression
    if (isEchelonne) {
      const versementsEffectues = paiements.filter(p => p.type_paiement === 'VERSEMENT').length;
      const totalVersements = contrat.nombre_versements || 1;
      return (
        <span className="mode-info echelonne">
          📅 Versements: {versementsEffectues}/{totalVersements}
        </span>
      );
    }
    
    return null;
  };

  const sortedPaiements = getSortedPaiements();

  return (
    <div className="contrat-accordeon">
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
                {getEchelonInfo()}
              </h3>
              <p className="contrat-sous-titre">
                {clientNom} • {contrat.bien?.nom || 'Bien'}
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
                  onClick={() => onAddPaiement(contrat.id, isVente ? contrat.acquereur?.id : contrat.locataire?.id, contrat.bien?.id, isVente ? 'VENTE' : 'LOCATION')}
                >
                  + Ajouter un {isVente ? 'versement' : 'paiement'}
                </button>
              </div>
            ) : (
              <div className="paiements-table-container">
                <table className="paiements-table-simple">
                  <thead>
                    <tr>
                      <th 
                        className={`sortable ${sortField === 'date_paiement' ? 'active' : ''}`}
                        onClick={() => handleSort('date_paiement')}
                      >
                        Date {sortField === 'date_paiement' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        className={`sortable ${sortField === 'type_paiement' ? 'active' : ''}`}
                        onClick={() => handleSort('type_paiement')}
                      >
                        Type {sortField === 'type_paiement' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        className={`sortable montant ${sortField === 'montant' ? 'active' : ''}`}
                        onClick={() => handleSort('montant')}
                      >
                        Montant {sortField === 'montant' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        className={`sortable ${sortField === 'mode_paiement' ? 'active' : ''}`}
                        onClick={() => handleSort('mode_paiement')}
                      >
                        Mode {sortField === 'mode_paiement' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        className={`sortable ${sortField === 'statut' ? 'active' : ''}`}
                        onClick={() => handleSort('statut')}
                      >
                        Statut {sortField === 'statut' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPaiements.map((paiement, index) => (
                      <tr key={paiement.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                        <td>{formatDate(paiement.date_paiement)}</td>
                        <td>
                          <span className="type-badge-simple">
                            {getTypeIcon(paiement.type_paiement)} {getTypeLabelWithNumber(paiement)}
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
                  onAddPaiement(contrat.id, isVente ? contrat.acquereur?.id : contrat.locataire?.id, contrat.bien?.id, isVente ? 'VENTE' : 'LOCATION');
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