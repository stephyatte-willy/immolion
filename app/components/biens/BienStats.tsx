// app/components/biens/BienStats.tsx
'use client';

import { motion } from 'framer-motion';
import '@/app/biens/biens.css';

interface BienStatsProps {
  stats: {
    total: number;
    loues: number;
    disponibles: number;
    enVente: number;
    revenusMensuels: number;
  };
  formatMoney: (amount: number) => string;
}

export default function BienStats({ stats, formatMoney }: BienStatsProps) {
  // ✅ Fonction de formatage sécurisée
  const safeFormatMoney = (amount: any): string => {
    // Vérifier si la valeur est valide
    if (amount === undefined || amount === null || amount === '') {
      return '0 FCFA';
    }
    
    // Convertir en nombre si c'est une chaîne
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Vérifier si c'est un nombre valide
    if (isNaN(numAmount)) {
      return '0 FCFA';
    }
    
    return formatMoney(numAmount);
  };

  const statCards = [
    {
      title: 'Total biens',
      value: stats.total,
      icon: '🏢',
      color: 'linear-gradient(135deg, #D4AF37, #996515)'
    },
    {
      title: 'Biens loués',
      value: stats.loues,
      icon: '🔑',
      color: 'linear-gradient(135deg, #2E5C4E, #1A2F4B)'
    },
    {
      title: 'Disponibles',
      value: stats.disponibles,
      icon: '✅',
      color: 'linear-gradient(135deg, #10b981, #059669)'
    },
    {
      title: 'En vente',
      value: stats.enVente,
      icon: '💰',
      color: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
      title: 'Revenus mensuels',
      value: safeFormatMoney(stats.revenusMensuels),
      icon: '📊',
      color: 'linear-gradient(135deg, #8B5CF6, #4F46E5)'
    }
  ];

  return (
    <div className="biens-stats">
      {statCards.map((stat, index) => (
        <motion.div
          key={index}
          className="stat-card"
          style={{ background: stat.color }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
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