'use client';

import { motion } from 'framer-motion';
import '@/app/acquereurs/acquereurs.css';

interface AcquereurStatsProps {
  stats: {
    total: number;
    particuliers: number;
    societes: number;
    agences: number;
    actifs: number;
    contratsTotal: number;
  };
}

export default function AcquereurStats({ stats }: AcquereurStatsProps) {
  const statCards = [
    {
      title: 'Total acquéreurs',
      value: stats.total,
      icon: '🤝',
      color: 'linear-gradient(135deg, #D4AF37, #996515)'
    },
    {
      title: 'Particuliers',
      value: stats.particuliers,
      icon: '👤',
      color: 'linear-gradient(135deg, #10b981, #059669)'
    },
    {
      title: 'Sociétés',
      value: stats.societes,
      icon: '🏢',
      color: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    },
    {
      title: 'Agences',
      value: stats.agences,
      icon: '🏪',
      color: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
      title: 'Actifs',
      value: stats.actifs,
      icon: '✅',
      color: 'linear-gradient(135deg, #8B5CF6, #4F46E5)'
    },
    {
      title: 'Contrats de vente',
      value: stats.contratsTotal,
      icon: '📄',
      color: 'linear-gradient(135deg, #EC4899, #A855F7)'
    }
  ];

  return (
    <div className="acquereurs-stats">
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