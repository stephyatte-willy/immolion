'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Configuration } from '@/app/types/config';

interface ThemeContextType {
  theme: 'dark' | 'light';
  config: Configuration | null;
  setTheme: (theme: 'dark' | 'light') => void;
  formatMoney: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Fonction pour obtenir le thème initial SYNC
const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  }
  return 'dark'; // thème par défaut
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'dark' | 'light'>(getInitialTheme);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Appliquer le thème immédiatement au montage
  useEffect(() => {
    setIsMounted(true);
    // Appliquer le thème initial
    appliquerTheme(theme);
  }, []);

  // Charger la configuration
  useEffect(() => {
    chargerConfiguration();
  }, []);

  // Fonction pour appliquer le thème
  const appliquerTheme = (nouveauTheme: 'dark' | 'light') => {
    console.log('🎨 Application du thème:', nouveauTheme);
    
    // Appliquer au document
    const root = document.documentElement;
    root.setAttribute('data-theme', nouveauTheme);
    
    // Ajouter/retirer les classes
    if (nouveauTheme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
    
    // Sauvegarder
    localStorage.setItem('app-theme', nouveauTheme);
    setThemeState(nouveauTheme);
    
    // Déclencher un événement
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: nouveauTheme } }));
  };

  const chargerConfiguration = async () => {
    try {
      const response = await fetch('/api/configuration');
      const data = await response.json();
      if (data.success) {
        setConfig(data.configuration);
        
        // Appliquer les couleurs personnalisées
        const root = document.documentElement;
        root.style.setProperty('--primary', data.configuration.couleur_principale);
        root.style.setProperty('--primary-dark', data.configuration.couleur_secondaire);
        root.style.setProperty('--secondary', data.configuration.couleur_accent);
        
        // Si pas de thème sauvegardé, utiliser celui de la config
        const saved = localStorage.getItem('app-theme');
        if (!saved) {
          if (data.configuration.theme_mode === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            appliquerTheme(systemDark ? 'dark' : 'light');
          } else {
            appliquerTheme(data.configuration.theme_mode);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction publique pour changer le thème
  const setTheme = (nouveauTheme: 'dark' | 'light') => {
    appliquerTheme(nouveauTheme);
  };

  // Écouter les changements système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('app-theme');
      if (!saved && config?.theme_mode === 'system') {
        appliquerTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [config]);

  // Ne pas rendre tant que le thème n'est pas appliqué
  if (!isMounted) {
    return null;
  }

  const formatMoney = (amount: number): string => {
    if (!config) return amount.toString();
    
    const formatter = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: config.decimales_monnaie,
      maximumFractionDigits: config.decimales_monnaie
    });

    const formatted = formatter.format(amount)
      .replace(/\s/g, config.separateur_milliers)
      .replace(',', config.separateur_decimal);

    return config.position_monnaie === 'before' 
      ? `${config.symbole_monnaie} ${formatted}`
      : `${formatted} ${config.symbole_monnaie}`;
  };

  const formatDate = (date: Date | string): string => {
    if (!config) return new Date(date).toLocaleDateString('fr-FR');
    
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return config.format_date
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year.toString());
  };

  const formatDateTime = (date: Date | string): string => {
    if (!config) return new Date(date).toLocaleString('fr-FR');
    
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    return `${formatDate(date)} à ${config.format_heure.replace('HH', hours).replace('mm', minutes)}`;
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      config, 
      setTheme,
      formatMoney,
      formatDate,
      formatDateTime
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}