// app/components/dashboard/RecentPayments.tsx
'use client';

import { motion } from 'framer-motion';
import './RecentPayments.css';

interface RecentPaymentsProps {
  paiements: {
    id: number;
    locataire: string;
    montant: number;
    date: string;
    statut: string;
  }[];
}

export default function RecentPayments({ paiements }: RecentPaymentsProps) {
  const getStatusClass = (statut: string) => {
    switch (statut) {
      case 'Effectué':
        return 'statut-effectue';
      case 'En retard':
        return 'statut-retard';
      default:
        return '';
    }
  };

  return (
    <div className="recent-payments">
      <h3>Paiements récents</h3>
      
      <div className="payments-list">
        {paiements.map((paiement, index) => (
          <motion.div 
            key={paiement.id}
            className="payment-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="payment-avatar">
              {paiement.locataire.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="payment-info">
              <span className="payment-locataire">{paiement.locataire}</span>
              <span className="payment-date">{new Date(paiement.date).toLocaleDateString('fr-FR')}</span>
            </div>
            
            <div className="payment-amount">
              {paiement.montant.toLocaleString()} €
            </div>
            
            <div className={`payment-status ${getStatusClass(paiement.statut)}`}>
              {paiement.statut}
            </div>
          </motion.div>
        ))}
      </div>
      
      <button className="view-all-button">
        Voir tous les paiements
      </button>
    </div>
  );
}