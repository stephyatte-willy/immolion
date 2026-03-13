// app/components/dashboard/AlertCard.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import './AlertCard.css';

interface AlertCardProps {
  alerts: {
    id: number;
    type: 'warning' | 'danger' | 'info';
    message: string;
    date: string;
  }[];
}

export default function AlertCard({ alerts }: AlertCardProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'danger': return '🚨';
      case 'info': return 'ℹ️';
      default: return '📌';
    }
  };

  const getAlertClass = (type: string) => {
    switch (type) {
      case 'warning': return 'alert-warning';
      case 'danger': return 'alert-danger';
      case 'info': return 'alert-info';
      default: return '';
    }
  };

  return (
    <div className="alert-card">
      <h3>Alertes et rappels</h3>
      
      <div className="alerts-list">
        <AnimatePresence>
          {alerts.map((alert, index) => (
            <motion.div 
              key={alert.id}
              className={`alert-item ${getAlertClass(alert.type)}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
            >
              <div className="alert-icon">
                {getAlertIcon(alert.type)}
              </div>
              
              <div className="alert-content">
                <p className="alert-message">{alert.message}</p>
                <span className="alert-date">
                  {new Date(alert.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              
              <button className="alert-action">✓</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <button className="view-all-alerts">
        Voir toutes les alertes
      </button>
    </div>
  );
}