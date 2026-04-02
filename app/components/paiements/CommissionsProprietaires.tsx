// app/components/paiements/CommissionsProprietaires.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CommissionProprietaire } from '@/app/types/paiements';
import './paiements.css';

interface CommissionsProprietairesProps {
  proprietaireId?: number;
  onVersement?: () => void;
}

export default function CommissionsProprietaires({ proprietaireId, onVersement }: CommissionsProprietairesProps) {
  const [commissions, setCommissions] = useState<CommissionProprietaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommission, setSelectedCommission] = useState<CommissionProprietaire | null>(null);
  const [showVersementModal, setShowVersementModal] = useState(false);
  const [versementData, setVersementData] = useState({
    reference: '',
    commentaire: ''
  });

  useEffect(() => {
    chargerCommissions();
  }, [proprietaireId]);

  const chargerCommissions = async () => {
    setIsLoading(true);
    try {
      const url = proprietaireId 
        ? `/api/commissions?proprietaire_id=${proprietaireId}`
        : '/api/commissions';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setCommissions(data.commissions);
      }
    } catch (error) {
      console.error('Erreur chargement commissions:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerserCommission = async () => {
    if (!selectedCommission) return;

    try {
      const response = await fetch(`/api/commissions/${selectedCommission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'VERSEE',
          date_versement: new Date().toISOString(),
          reference_versement: versementData.reference,
          commentaire: versementData.commentaire
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Commission versée avec succès');
        setShowVersementModal(false);
        setSelectedCommission(null);
        setVersementData({ reference: '', commentaire: '' });
        chargerCommissions();
        if (onVersement) onVersement();
      } else {
        toast.error(data.erreur || 'Erreur lors du versement');
      }
    } catch (error) {
      console.error('Erreur versement:', error);
      toast.error('Erreur serveur');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return <span className="badge-attente">⏳ En attente</span>;
      case 'VERSEE':
        return <span className="badge-versee">✅ Versée</span>;
      case 'EN_RETARD':
        return <span className="badge-retard">⚠️ En retard</span>;
      default:
        return <span className="badge-default">{statut}</span>;
    }
  };

  const totalEnAttente = commissions
    .filter(c => c.statut === 'EN_ATTENTE')
    .reduce((sum, c) => sum + c.montant_commission, 0);

  const totalVerse = commissions
    .filter(c => c.statut === 'VERSEE')
    .reduce((sum, c) => sum + c.montant_commission, 0);

  if (isLoading) {
    return (
      <div className="commissions-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des commissions...</p>
      </div>
    );
  }

  return (
    <div className="commissions-container">
      <div className="commissions-header">
        <h3>💰 Commissions propriétaires</h3>
        <div className="commissions-summary">
          <div className="summary-card">
            <span className="summary-label">En attente</span>
            <span className="summary-value en-attente">{formatMoney(totalEnAttente)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Versées</span>
            <span className="summary-value versee">{formatMoney(totalVerse)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total</span>
            <span className="summary-value total">{formatMoney(totalEnAttente + totalVerse)}</span>
          </div>
        </div>
      </div>

      <div className="commissions-list">
        {commissions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💰</span>
            <p>Aucune commission trouvée</p>
          </div>
        ) : (
          commissions.map((commission, index) => (
            <motion.div
              key={commission.id}
              className={`commission-card ${commission.statut.toLowerCase()}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="commission-header">
                <div className="commission-type">
                  <span className="type-icon">
                    {commission.type_transaction === 'LOCATION' ? '🏠' : '💰'}
                  </span>
                  <span className="type-label">
                    {commission.type_transaction === 'LOCATION' ? 'Location' : 'Vente'}
                  </span>
                </div>
                {getStatutBadge(commission.statut)}
              </div>

              <div className="commission-body">
                <div className="commission-montant">
                  <span className="montant-label">Montant</span>
                  <span className="montant-value">{formatMoney(commission.montant_commission)}</span>
                  <span className="taux">({commission.taux_commission}%)</span>
                </div>

                <div className="commission-details">
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">
                      Date: {new Date(commission.date_commission).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🏠</span>
                    <span className="detail-text">
                      Paiement #{commission.paiement_id}
                    </span>
                  </div>
                  {commission.date_versement && (
                    <div className="detail-item">
                      <span className="detail-icon">✅</span>
                      <span className="detail-text">
                        Versée le: {new Date(commission.date_versement).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>

                {commission.commentaire && (
                  <div className="commission-commentaire">
                    <span className="commentaire-icon">📝</span>
                    <span className="commentaire-text">{commission.commentaire}</span>
                  </div>
                )}
              </div>

              {commission.statut === 'EN_ATTENTE' && (
                <div className="commission-actions">
                  <button
                    className="btn-verser"
                    onClick={() => {
                      setSelectedCommission(commission);
                      setShowVersementModal(true);
                    }}
                  >
                    💸 Verser la commission
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Modal de versement */}
      {showVersementModal && selectedCommission && (
        <div className="modal-overlay" onClick={() => setShowVersementModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Verser la commission</h3>
              <button className="close-btn" onClick={() => setShowVersementModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-message">
                <span className="info-icon">💰</span>
                <div>
                  <p><strong>Montant:</strong> {formatMoney(selectedCommission.montant_commission)}</p>
                  <p><strong>Type:</strong> {selectedCommission.type_transaction === 'LOCATION' ? 'Location' : 'Vente'}</p>
                  <p><strong>Date commission:</strong> {new Date(selectedCommission.date_commission).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="form-group">
                <label>Référence de versement</label>
                <input
                  type="text"
                  placeholder="Ex: VIREMENT-001, CHEQUE-123..."
                  value={versementData.reference}
                  onChange={(e) => setVersementData({ ...versementData, reference: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Commentaire (optionnel)</label>
                <textarea
                  rows={3}
                  placeholder="Informations supplémentaires..."
                  value={versementData.commentaire}
                  onChange={(e) => setVersementData({ ...versementData, commentaire: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowVersementModal(false)}>
                Annuler
              </button>
              <button className="btn-submit" onClick={handleVerserCommission}>
                💸 Confirmer le versement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}