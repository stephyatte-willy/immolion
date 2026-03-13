// app/components/dashboard/ActivityFeed.tsx
'use client';

import { motion } from 'framer-motion';
import './ActivityFeed.css';

interface ActivityFeedProps {
  activites: {
    id: number;
    action: string;
    details: string;
    date: string;
    utilisateur: string;
  }[];
}

export default function ActivityFeed({ activites }: ActivityFeedProps) {
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
  };

  const getActivityIcon = (action: string) => {
    const icons: { [key: string]: string } = {
      'Nouveau paiement': '💰',
      'Contrat créé': '📄',
      'Document ajouté': '📎',
      'Maintenance': '🔧',
    };
    return icons[action] || '📌';
  };

  return (
    <div className="activity-feed">
      <h3>Activités récentes</h3>
      
      <div className="activities-list">
        {activites.map((activite, index) => (
          <motion.div 
            key={activite.id}
            className="activity-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="activity-icon">
              {getActivityIcon(activite.action)}
            </div>
            
            <div className="activity-content">
              <div className="activity-header">
                <span className="activity-action">{activite.action}</span>
                <span className="activity-time">{getTimeAgo(activite.date)}</span>
              </div>
              
              <p className="activity-details">{activite.details}</p>
              
              <span className="activity-user">{activite.utilisateur}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}