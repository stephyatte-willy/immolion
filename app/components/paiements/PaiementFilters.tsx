'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STATUTS_PAIEMENT, MODES_PAIEMENT, TYPES_PAIEMENT, MOIS } from '@/app/types/paiements';
import '@/app/paiements/paiements.css';

interface PaiementFiltersProps {
  onFilter: (filters: any) => void;
}

export default function PaiementFilters({ onFilter }: PaiementFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    statut: 'TOUS',
    mode: 'TOUS',
    type: 'TOUS',
    type_transaction: 'TOUS',
    mois: '',
    dateDebut: '',
    dateFin: '',
    versement_numero: ''
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
      mode: 'TOUS',
      type: 'TOUS',
      type_transaction: 'TOUS',
      mois: '',
      dateDebut: '',
      dateFin: '',
      versement_numero: ''
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => 
    v && v !== 'TOUS' && v !== ''
  ).length;

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="filters">
      <div className="filters-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Rechercher (client, contrat, référence, versement)..."
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
              {/* Type de transaction (Location/Vente) */}
              <div className="filter-group">
                <label>Type de transaction</label>
                <select
                  value={filters.type_transaction}
                  onChange={(e) => handleChange('type_transaction', e.target.value)}
                >
                  <option value="TOUS">Tous</option>
                  <option value="LOCATION">🏠 Location</option>
                  <option value="VENTE">💰 Vente</option>
                </select>
              </div>

              {/* Statut */}
              <div className="filter-group">
                <label>Statut</label>
                <select
                  value={filters.statut}
                  onChange={(e) => handleChange('statut', e.target.value)}
                >
                  <option value="TOUS">Tous les statuts</option>
                  {STATUTS_PAIEMENT.map(statut => (
                    <option key={statut.value} value={statut.value}>
                      {statut.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode de paiement */}
              <div className="filter-group">
                <label>Mode de paiement</label>
                <select
                  value={filters.mode}
                  onChange={(e) => handleChange('mode', e.target.value)}
                >
                  <option value="TOUS">Tous les modes</option>
                  {MODES_PAIEMENT.map(mode => (
                    <option key={mode.value} value={mode.value}>
                      {mode.icone} {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type de paiement */}
              <div className="filter-group">
                <label>Type de paiement</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="TOUS">Tous les types</option>
                  {TYPES_PAIEMENT.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icone} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Numéro de versement (nouveau) */}
              <div className="filter-group">
                <label>N° de versement</label>
                <input
                  type="number"
                  min="1"
                  value={filters.versement_numero}
                  onChange={(e) => handleChange('versement_numero', e.target.value)}
                  placeholder="Ex: 1, 2, 3..."
                  className="small-input"
                />
                <small className="field-hint">Pour les versements échelonnés</small>
              </div>

              {/* Mois concerné */}
              <div className="filter-group">
                <label>Mois concerné</label>
                <select
                  value={filters.mois}
                  onChange={(e) => handleChange('mois', e.target.value)}
                >
                  <option value="">Tous les mois</option>
                  {years.map(annee => (
                    <optgroup key={annee} label={`Année ${annee}`}>
                      {MOIS.map((mois, index) => {
                        const value = `${annee}-${String(index + 1).padStart(2, '0')}`;
                        return (
                          <option key={value} value={value}>
                            {mois} {annee}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Période de paiement */}
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