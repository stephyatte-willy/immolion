'use client';

import { motion } from 'framer-motion';
import '@/app/paiements/paiements.css';

interface PaiementStatsProps {
  stats: {
    total: number;
    montantTotal: number;
    effectues: number;
    enAttente: number;
    enRetard: number;
    penalites: number;
  };
  formatMoney: (amount: number) => string;
}

export default function PaiementStats({ stats, formatMoney }: PaiementStatsProps) {
  
  // ✅ Fonction de formatage sécurisée pour les montants
  const safeFormatMoney = (amount: any): string => {
    // Vérifier si la valeur est valide
    if (amount === undefined || amount === null || amount === '') {
      return formatMoney(0);
    }
    
    // Convertir en nombre si c'est une chaîne
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Vérifier si c'est un nombre valide
    if (isNaN(numAmount)) {
      return formatMoney(0);
    }
    
    return formatMoney(numAmount);
  };

  // ✅ S'assurer que les valeurs sont des nombres
  const safeStats = {
    total: stats.total || 0,
    montantTotal: stats.montantTotal || 0,
    effectues: stats.effectues || 0,
    enAttente: stats.enAttente || 0,
    enRetard: stats.enRetard || 0,
    penalites: stats.penalites || 0
  };

  const statCards = [
    {
      title: 'Total paiements',
      value: safeStats.total,
      icon: '📊',
      color: 'linear-gradient(135deg, #D4AF37, #996515)',
      type: 'number'
    },
    {
      title: 'Montant total',
      value: safeFormatMoney(safeStats.montantTotal),
      icon: '💰',
      color: 'linear-gradient(135deg, #2E5C4E, #1A2F4B)',
      type: 'money'
    },
    {
      title: 'Effectués',
      value: safeStats.effectues,
      icon: '✅',
      color: 'linear-gradient(135deg, #10b981, #059669)',
      type: 'number'
    },
    {
      title: 'En attente',
      value: safeStats.enAttente,
      icon: '⏳',
      color: 'linear-gradient(135deg, #f59e0b, #d97706)',
      type: 'number'
    },
    {
      title: 'En retard',
      value: safeStats.enRetard,
      icon: '⚠️',
      color: 'linear-gradient(135deg, #ef4444, #dc2626)',
      type: 'number'
    },
    {
      title: 'Pénalités',
      value: safeFormatMoney(safeStats.penalites),
      icon: '📈',
      color: 'linear-gradient(135deg, #8B5CF6, #4F46E5)',
      type: 'money'
    }
  ];

  return (
    <div className="paiements-stats">
      {statCards.map((stat, index) => (
        <motion.div
          key={index}
          className="stat-card"
          style={{ background: stat.color }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02, y: -5 }}
        >
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-content">
            <span className="stat-title">{stat.title}</span>
            <span className="stat-value">{stat.value}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}