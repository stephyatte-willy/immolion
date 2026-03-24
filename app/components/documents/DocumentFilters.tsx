'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TYPES_DOCUMENTS } from '@/app/types/documents';
import './documents.css';

interface DocumentFiltersProps {
  onFilter: (filters: any) => void;
}

export default function DocumentFilters({ onFilter }: DocumentFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'TOUS',
    statut: 'TOUS',
    dateDebut: '',
    dateFin: ''
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
      dateDebut: '',
      dateFin: ''
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => 
    v && v !== 'TOUS' && v !== ''
  ).length;

  const statutOptions = [
    { value: 'TOUS', label: 'Tous' },
    { value: 'VALIDE', label: 'Valides' },
    { value: 'EXPIRANT', label: 'Expirant (30j)' },
    { value: 'EXPIRES', label: 'Expirés' }
  ];

  return (
    <div className="filters">
      <div className="filters-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Rechercher un document..."
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
              {/* Type de document */}
              <div className="filter-group">
                <label>Type de document</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="TOUS">Tous les types</option>
                  {TYPES_DOCUMENTS.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icone} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div className="filter-group">
                <label>Statut</label>
                <select
                  value={filters.statut}
                  onChange={(e) => handleChange('statut', e.target.value)}
                >
                  {statutOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Période d'upload */}
              <div className="filter-group">
                <label>Date début</label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => handleChange('dateDebut', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Date fin</label>
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => handleChange('dateFin', e.target.value)}
                />
              </div>
            </div>

            <button className="reset-filters" onClick={resetFilters}>
              Réinitialiser tous les filtres
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}