'use client';

import { motion } from 'framer-motion';
import '@/app/dashboard/dashboard.css';

interface KpiFinancierProps {
  title: string;
  value: string;
  icon: string;
  trend?: number;
  color: string;
  isLocked?: boolean;
}

export default function KpiFinancier({ title, value, icon, trend, color, isLocked = false }: KpiFinancierProps) {
  const isPositive = trend && trend >= 0;

  if (isLocked) {
    return (
      <motion.div 
        className="kpi-card locked"
        style={{ background: color }}
        whileHover={{ scale: 1.02, y: -5 }}
      >
        <div className="kpi-header">
          <span className="kpi-icon">🔒</span>
        </div>
        <div className="kpi-content">
          <h3 className="kpi-title">{title}</h3>
          <p className="kpi-value-locked">•••••••</p>
        </div>
        <div className="kpi-footer">
          <span className="kpi-period">Accès restreint</span>
        </div>
        <div className="kpi-shine"></div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="kpi-card"
      style={{ background: color }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      <div className="kpi-header">
        <span className="kpi-icon">{icon}</span>
        {trend !== undefined && (
          <span className={`kpi-trend ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="kpi-content">
        <h3 className="kpi-title">{title}</h3>
        <p className="kpi-value">{value}</p>
      </div>
      <div className="kpi-footer">
        <span className="kpi-period">vs mois précédent</span>
      </div>
      <div className="kpi-shine"></div>
    </motion.div>
  );
}