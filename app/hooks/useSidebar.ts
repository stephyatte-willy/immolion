// app/hooks/useSidebar.ts
import { useState, useEffect } from 'react';

export function useSidebar() {
  const [estReduit, setEstReduit] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    // Vérifier si c'est la première visite
    const hasVisited = sessionStorage.getItem('sidebar-visited');
    
    if (!hasVisited) {
      // Première visite : menu normal
      setEstReduit(false);
      sessionStorage.setItem('sidebar-visited', 'true');
      // Ne pas charger l'état sauvegardé
      return;
    }
    
    // Visites suivantes : charger l'état sauvegardé
    const savedState = localStorage.getItem('sidebar-reduit');
    if (savedState !== null) {
      setEstReduit(savedState === 'true');
    }
    
    setIsFirstLoad(false);
  }, []);

  const toggleSidebar = () => {
    const newState = !estReduit;
    setEstReduit(newState);
    localStorage.setItem('sidebar-reduit', String(newState));
  };

  const resetSidebar = () => {
    setEstReduit(false);
    localStorage.setItem('sidebar-reduit', 'false');
  };

  return { estReduit, toggleSidebar, resetSidebar, isFirstLoad };
}