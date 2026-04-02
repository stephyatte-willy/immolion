'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import './paiements.css';

interface ProchainsPaiementsProps {
  contratId: number;
}

export default function ProchainsPaiements({ contratId }: ProchainsPaiementsProps) {
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { formatMoney } = useTheme();

  useEffect(() => {
    chargerPeriodes();
  }, [contratId]);

  const chargerPeriodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/periodes-location?contrat_id=${contratId}&statut=EN_ATTENTE,EN_RETARD`);
      const data = await response.json();
      if (data.success) {
        setPeriodes(data.periodes);
      }
    } catch (error) {
      console.error('Erreur chargement périodes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading-spinner-small"></div>;
  }

  if (periodes.length === 0) {
    return (
      <div className="info-message success">
        ✅ Aucun paiement en attente. Tous les loyers sont à jour.
      </div>
    );
  }

  const prochainePeriode = periodes[0];
  const totalARegler = periodes.reduce((sum, p) => sum + p.total_du, 0);

  return (
    <div className="prochains-paiements">
      <h4>📅 Prochains paiements</h4>
      
      <div className="periode-prochaine">
        <div className="periode-header">
          <span className="periode-label">Prochain loyer</span>
          <span className="periode-mois">{prochainePeriode.mois_concerne}</span>
        </div>
        <div className="periode-montant">
          <span className="montant-label">Montant</span>
          <span className="montant-valeur">{formatMoney(prochainePeriode.total_du)}</span>
        </div>
        <div className="periode-echeance">
          <span className="echeance-label">Échéance</span>
          <span className={`echeance-valeur ${prochainePeriode.statut === 'EN_RETARD' ? 'retard' : ''}`}>
            {prochainePeriode.date_echeance}
            {prochainePeriode.statut === 'EN_RETARD' && ' (En retard)'}
          </span>
        </div>
      </div>

      {periodes.length > 1 && (
        <div className="periodes-suivantes">
          <details>
            <summary>Voir les prochains mois ({periodes.length - 1} mois)</summary>
            {periodes.slice(1).map((periode, index) => (
              <div key={index} className="periode-suivante">
                <span>{periode.mois_concerne}</span>
                <span>{formatMoney(periode.total_du)}</span>
                <span className={periode.statut === 'EN_RETARD' ? 'retard' : ''}>
                  {periode.date_echeance}
                </span>
              </div>
            ))}
          </details>
        </div>
      )}

      <div className="total-attente">
        <span>Total à régler</span>
        <span className="total-montant">{formatMoney(totalARegler)}</span>
      </div>
    </div>
  );
}