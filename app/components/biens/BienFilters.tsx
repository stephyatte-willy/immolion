'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TYPES_BIENS_CI, STATUTS_BIENS_CI } from '@/app/types/ci';
import '@/app/biens/biens.css';

interface BienFiltersProps {
  onFilter: (filters: any) => void;
  types: string[];
  statuts: string[];
  districts: string[];
}

export default function BienFilters({ onFilter, types, statuts, districts }: BienFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'TOUS',
    statut: 'TOUS',
    district: '',
    prixMin: '',
    prixMax: ''
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
      statut: 'TOUS',
      district: '',
      prixMin: '',
      prixMax: ''
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'TOUS').length;

  return (
    <div className="biens-filters">
      <div className="filters-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Rechercher un bien (nom, commune, quartier)..."
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
                <label>Type de bien</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="TOUS">Tous les types</option>
                  {TYPES_BIENS_CI.map(type => (
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
                  <option value="TOUS">Tous les statuts</option>
                  {STATUTS_BIENS_CI.map(statut => (
                    <option key={statut.value} value={statut.value}>
                      {statut.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>District</label>
                <select
                  value={filters.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                >
                  <option value="">Tous les districts</option>
                  {districts.map(district => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Prix min (FCFA)</label>
                <input
                  type="number"
                  value={filters.prixMin}
                  onChange={(e) => handleChange('prixMin', e.target.value)}
                  placeholder="100000"
                />
              </div>

              <div className="filter-group">
                <label>Prix max (FCFA)</label>
                <input
                  type="number"
                  value={filters.prixMax}
                  onChange={(e) => handleChange('prixMax', e.target.value)}
                  placeholder="1000000"
                />
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