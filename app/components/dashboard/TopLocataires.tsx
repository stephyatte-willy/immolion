'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import '@/app/dashboard/dashboard.css';

interface TopLocatairesProps {
  locataires: {
    id: number;
    nom: string;
    prenom: string;
    nb_paiements: number;
    total_paye: number;
  }[];
  isLocked?: boolean;
}

export default function TopLocataires({ locataires, isLocked = false }: TopLocatairesProps) {
  const { formatMoney } = useTheme();

  if (isLocked) {
    return (
      <div className="top-locataires locked">
        <h3>🏆 Top locataires</h3>
        <div className="locked-content">
          <div className="locked-icon-small">🔒</div>
          <p>Accès restreint</p>
        </div>
      </div>
    );
  }

  return (
    <div className="top-locataires">
      <h3>🏆 Top locataires</h3>
      <div className="locataires-list">
        {locataires.map((loc, index) => (
          <motion.div
            key={loc.id}
            className="locataire-item-top"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="locataire-rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}ᵉ`}
            </div>
            <div className="locataire-info">
              <div className="locataire-name">{loc.prenom} {loc.nom}</div>
              <div className="locataire-stats">
                <span className="stat-badge">{loc.nb_paiements} paiements</span>
              </div>
            </div>
            <div className="locataire-total">
              {formatMoney(loc.total_paye)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}