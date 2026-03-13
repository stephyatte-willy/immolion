'use client';

import { useEffect, useState } from 'react';

export function useTheme(initialTheme: 'dark' | 'light' | 'system' = 'dark') {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Récupérer le thème sauvegardé
    const saved = localStorage.getItem('theme-mode');
    if (saved === 'dark' || saved === 'light') return saved;
    
    // Déterminer selon la préférence système
    if (initialTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return initialTheme as 'dark' | 'light';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Appliquer le thème au document
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    localStorage.setItem('theme-mode', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme, systemPrefersDark };
}