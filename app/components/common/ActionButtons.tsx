'use client';

import { useState } from 'react';
import { ExportService, ExportColumn } from '@/app/services/exportService';
import './ActionButtons.css';

interface ActionButtonsProps {
  data: any[];
  columns: ExportColumn[];
  titre: string;
  onExport?: () => void;
  onPrint?: () => void;
  disabled?: boolean;
}

export default function ActionButtons({ 
  data, 
  columns, 
  titre, 
  onExport, 
  onPrint, 
  disabled = false 
}: ActionButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleExport = () => {
    if (disabled || data.length === 0) return;
    
    setIsExporting(true);
    try {
      ExportService.exporterExcel(data, columns, titre);
      if (onExport) onExport();
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (disabled || data.length === 0) return;
    
    setIsPrinting(true);
    try {
      ExportService.imprimerDonnees(data, columns, titre);
      if (onPrint) onPrint();
    } catch (error) {
      console.error('Erreur impression:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="action-buttons">
      <button 
        className="btn-export-excel"
        onClick={handleExport}
        disabled={disabled || data.length === 0 || isExporting}
        title="Exporter en Excel"
      >
        {isExporting ? (
          <>
            <span className="spinner-mini"></span>
            Export...
          </>
        ) : (
          <>
            <span className="btn-icon">📊</span>
            Excel
          </>
        )}
      </button>
      
      <button 
        className="btn-imprimer"
        onClick={handlePrint}
        disabled={disabled || data.length === 0 || isPrinting}
        title="Imprimer"
      >
        {isPrinting ? (
          <>
            <span className="spinner-mini"></span>
            Impression...
          </>
        ) : (
          <>
            <span className="btn-icon">🖨️</span>
            Imprimer
          </>
        )}
      </button>
    </div>
  );
}