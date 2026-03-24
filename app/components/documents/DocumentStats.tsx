'use client';

import { motion } from 'framer-motion';
import { TYPES_DOCUMENTS } from '@/app/types/documents';
import './documents.css';

interface DocumentStatsProps {
  stats: {
    total: number;
    parType: Record<string, number>;
    expirant: number;
    expires: number;
    tailleTotale: number;
  };
  formatDate: (date: string) => string;
}

export default function DocumentStats({ stats, formatDate }: DocumentStatsProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Trouver le type le plus utilisé
  const topType = Object.entries(stats.parType).sort((a, b) => b[1] - a[1])[0];
  const topTypeLabel = topType ? TYPES_DOCUMENTS.find(t => t.value === topType[0])?.label || topType[0] : 'Aucun';

  const statCards = [
    {
      title: 'Total documents',
      value: stats.total,
      icon: '📎',
      color: 'linear-gradient(135deg, #D4AF37, #996515)'
    },
    {
      title: 'Type le plus utilisé',
      value: topTypeLabel,
      icon: '📑',
      color: 'linear-gradient(135deg, #2E5C4E, #1A2F4B)'
    },
    {
      title: 'Expirant (30j)',
      value: stats.expirant,
      icon: '⚠️',
      color: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
      title: 'Expirés',
      value: stats.expires,
      icon: '❌',
      color: 'linear-gradient(135deg, #ef4444, #dc2626)'
    },
    {
      title: 'Espace utilisé',
      value: formatFileSize(stats.tailleTotale),
      icon: '💾',
      color: 'linear-gradient(135deg, #8B5CF6, #4F46E5)'
    }
  ];

  return (
    <div className="documents-stats">
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