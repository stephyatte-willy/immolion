'use client';

import { motion } from 'framer-motion';
import '@/app/locataires/locataires.css';
import '@/app/biens/biens.css';

interface LocataireStatsProps {
  stats: {
    total: number;
    actifs: number;
    prospects: number;
    impayes: number;
  };
}

export default function LocataireStats({ stats }: LocataireStatsProps) {
  const statCards = [
    {
      title: 'Total locataires',
      value: stats.total,
      icon: '👥',
      color: 'linear-gradient(135deg, #D4AF37, #996515)'
    },
    {
      title: 'Locataires actifs',
      value: stats.actifs,
      icon: '✅',
      color: 'linear-gradient(135deg, #10b981, #059669)'
    },
    {
      title: 'Prospects',
      value: stats.prospects,
      icon: '🔍',
      color: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
      title: 'Impayés',
      value: stats.impayes,
      icon: '⚠️',
      color: 'linear-gradient(135deg, #ef4444, #dc2626)'
    }
  ];

  return (
    <div className="locataires-stats">
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