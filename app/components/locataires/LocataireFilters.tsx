'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STATUTS_LOCATAIRE } from '@/app/types/locataires';
import '@/app/locataires/locataires.css';

interface LocataireFiltersProps {
  onFilter: (filters: any) => void;
}

export default function LocataireFilters({ onFilter }: LocataireFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    statut: 'TOUS',
    hasBien: 'tous'
  });

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      search: '',
      statut: 'TOUS',
      hasBien: 'tous'
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'TOUS' && v !== 'tous').length;

  return (
    <div className="filters">
      <div className="filters-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Rechercher un locataire (nom, email, téléphone)..."
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
                <label>Statut locataire</label>
                <select
                  value={filters.statut}
                  onChange={(e) => handleChange('statut', e.target.value)}
                >
                  <option value="TOUS">Tous les statuts</option>
                  {STATUTS_LOCATAIRE.map(statut => (
                    <option key={statut.value} value={statut.value}>
                      {statut.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Logement</label>
                <select
                  value={filters.hasBien}
                  onChange={(e) => handleChange('hasBien', e.target.value)}
                >
                  <option value="tous">Tous</option>
                  <option value="oui">Avec logement</option>
                  <option value="non">Sans logement</option>
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