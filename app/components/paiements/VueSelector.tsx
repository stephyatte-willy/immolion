// app/components/paiements/VueSelector.tsx
'use client';

interface VueSelectorProps {
  vueActive: 'accordeon' | 'cards' | 'tableau';
  onVueChange: (vue: 'accordeon' | 'cards' | 'tableau') => void;
}

export default function VueSelector({ vueActive, onVueChange }: VueSelectorProps) {
  return (
    <div className="vue-selector">
      <button 
        className={`vue-btn ${vueActive === 'accordeon' ? 'active' : ''}`}
        onClick={() => onVueChange('accordeon')}
        title="Vue groupée par contrat (recommandée)"
      >
        <span className="vue-icon">📂</span>
        <span className="vue-label">Par contrat</span>
      </button>
      
      <button 
        className={`vue-btn ${vueActive === 'cards' ? 'active' : ''}`}
        onClick={() => onVueChange('cards')}
        title="Tous les paiements individuellement"
      >
        <span className="vue-icon">📇</span>
        <span className="vue-label">Tous</span>
      </button>
      
      <button 
        className={`vue-btn ${vueActive === 'tableau' ? 'active' : ''}`}
        onClick={() => onVueChange('tableau')}
        title="Vue tableau pour export"
      >
        <span className="vue-icon">📊</span>
        <span className="vue-label">Tableau</span>
      </button>
    </div>
  );
}