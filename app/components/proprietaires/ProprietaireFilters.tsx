'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TYPES_PROPRIETAIRE } from '@/app/types/proprietaires';
import '@/app/proprietaires/proprietaires.css';

interface ProprietaireFiltersProps {
  onFilter: (filters: any) => void;
}

export default function ProprietaireFilters({ onFilter }: ProprietaireFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'TOUS',
    statut: 'TOUS'
  });

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      search: '',
      type: 'TOUS',
      statut: 'TOUS'
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'TOUS').length;

  return (
    <div className="filters">
      <div className="filters-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Rechercher un propriétaire (nom, email, téléphone)..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="search-input"
        />
      </div>

      <button 
        className={`filters-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="filters-icon">⚙️</span>
        Filtres
        {activeFiltersCount > 0 && (
          <span className="filters-badge">{activeFiltersCount}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="filters-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="filters-grid">
              <div className="filter-group">
                <label>Type de propriétaire</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="TOUS">Tous les types</option>
                  {TYPES_PROPRIETAIRE.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icone} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Statut</label>
                <select
                  value={filters.statut}
                  onChange={(e) => handleChange('statut', e.target.value)}
                >
                  <option value="TOUS">Tous</option>
                  <option value="ACTIF">Actifs</option>
                  <option value="INACTIF">Inactifs</option>
                </select>
              </div>
            </div>

            <button className="reset-filters" onClick={resetFilters}>
              Réinitialiser les filtres
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}