// app/components/dashboard/KpiCard.tsx
'use client';

import { motion } from 'framer-motion';
import './KpiCard.css';

interface KpiCardProps {
  title: string;
  value: string;
  icon: string;
  trend: number;
  color: string;
}

export default function KpiCard({ title, value, icon, trend, color }: KpiCardProps) {
  const isPositive = trend >= 0;

  return (
    <motion.div 
      className="kpi-card"
      style={{ background: color }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="kpi-header">
        <span className="kpi-icon">{icon}</span>
        <span className={`kpi-trend ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      </div>
      
      <div className="kpi-content">
        <h3 className="kpi-title">{title}</h3>
        <p className="kpi-value">{value}</p>
      </div>
      
      <div className="kpi-footer">
        <span className="kpi-period">vs mois précédent</span>
      </div>

      {/* Effet de brillance */}
      <div className="kpi-shine"></div>
    </motion.div>
  );
}