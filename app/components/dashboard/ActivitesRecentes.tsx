'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import '@/app/dashboard/dashboard.css';

interface ActivitesRecentesProps {
  activites: {
    type: string;
    id: number;
    valeur: number;
    date: string;
    nom: string;
    details: string;
  }[];
}

export default function ActivitesRecentes({ activites }: ActivitesRecentesProps) {
  const { formatMoney } = useTheme();

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'paiement': '💰',
      'contrat': '📄',
      'bien': '🏠'
    };
    return icons[type] || '📌';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'paiement': 'Paiement',
      'contrat': 'Contrat',
      'bien': 'Bien'
    };
    return labels[type] || 'Activité';
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
  };

  return (
    <div className="activites-recentes">
      <h3>📝 Activités récentes</h3>
      <div className="activites-list">
        {activites.map((activite, index) => (
          <motion.div
            key={`${activite.type}-${activite.id}`}
            className="activite-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="activite-icon">{getTypeIcon(activite.type)}</div>
            <div className="activite-content">
              <div className="activite-header">
                <span className="activite-type">{getTypeLabel(activite.type)}</span>
                <span className="activite-time">{getTimeAgo(activite.date)}</span>
              </div>
              <div className="activite-details">
                <span className="activite-nom">{activite.nom}</span>
                {activite.valeur > 0 && (
                  <span className="activite-montant">{formatMoney(activite.valeur)}</span>
                )}
              </div>
              <div className="activite-info">{activite.details}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}