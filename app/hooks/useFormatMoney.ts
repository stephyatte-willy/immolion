// app/hooks/useFormatMoney.ts
import { useState, useEffect } from 'react';

interface ConfigMonnaie {
  monnaie: string;
  symbole_monnaie: string;
  position_monnaie: 'before' | 'after';
  decimales_monnaie: number;
  separateur_milliers: string;
  separateur_decimal: string;
}

export function useFormatMoney() {
  const [config, setConfig] = useState<ConfigMonnaie | null>(null);

  useEffect(() => {
    chargerConfig();
  }, []);

  const chargerConfig = async () => {
    try {
      const response = await fetch('/api/configuration');
      const data = await response.json();
      if (data.success && data.configuration) {
        setConfig({
          monnaie: data.configuration.monnaie || 'XOF',
          symbole_monnaie: data.configuration.symbole_monnaie || 'FCFA',
          position_monnaie: data.configuration.position_monnaie || 'after',
          decimales_monnaie: data.configuration.decimales_monnaie || 0,
          separateur_milliers: data.configuration.separateur_milliers || ' ',
          separateur_decimal: data.configuration.separateur_decimal || ','
        });
      }
    } catch (error) {
      console.error('Erreur chargement config monnaie:', error);
    }
  };

  const formatMoney = (montant: number | string | undefined | null): string => {
    if (montant === undefined || montant === null) return '0 FCFA';
    
    const valeur = typeof montant === 'string' ? parseFloat(montant) : montant;
    if (isNaN(valeur)) return '0 FCFA';

    // Utiliser la configuration si disponible, sinon valeurs par défaut
    const symbole = config?.symbole_monnaie || 'FCFA';
    const position = config?.position_monnaie || 'after';
    const decimales = config?.decimales_monnaie || 0;
    const separateurMilliers = config?.separateur_milliers || ' ';
    const separateurDecimal = config?.separateur_decimal || ',';

    // Formater le nombre sans décimales inutiles
    let partieEntiere = Math.floor(valeur).toString();
    let partieDecimale = '';

    // Ajouter les séparateurs de milliers
    partieEntiere = partieEntiere.replace(/\B(?=(\d{3})+(?!\d))/g, separateurMilliers);

    // Gérer les décimales si nécessaire
    if (decimales > 0) {
      const dec = Math.round((valeur - Math.floor(valeur)) * Math.pow(10, decimales));
      if (dec > 0) {
        partieDecimale = separateurDecimal + dec.toString().padStart(decimales, '0');
      }
    }

    const montantFormate = partieEntiere + partieDecimale;

    return position === 'before' 
      ? `${symbole} ${montantFormate}`
      : `${montantFormate} ${symbole}`;
  };

  return { formatMoney };
}