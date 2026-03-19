// app/types/contrats.ts
export const TYPES_CONTRAT = [
  { value: 'BAIL_VIDE', label: 'Bail vide (location)', icone: '🏠' },
  { value: 'BAIL_MEUBLE', label: 'Bail meublé (location)', icone: '🛋️' },
  { value: 'BAIL_COMMERCIAL', label: 'Bail commercial (location)', icone: '🏪' },
  { value: 'SOUS_LOCATION', label: 'Sous-location', icone: '📄' },
  { value: 'VENTE', label: 'Contrat de vente', icone: '💰' } // ✅ Nouveau
];

export const STATUTS_CONTRAT = [
  { value: 'ACTIF', label: 'Actif', couleur: '#10b981' },
  { value: 'TERMINE', label: 'Terminé', couleur: '#94a3b8' },
  { value: 'RESILIE', label: 'Résilié', couleur: '#ef4444' },
  { value: 'EN_ATTENTE', label: 'En attente', couleur: '#f59e0b' }
];

export const MODES_PAIEMENT = [
  { value: 'ESPECES', label: 'Espèces', icone: '💵' },
  { value: 'CHEQUE', label: 'Chèque', icone: '📝' },
  { value: 'VIREMENT', label: 'Virement bancaire', icone: '🏦' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money', icone: '📱' },
  { value: 'WAVE', label: 'Wave', icone: '🌊' },
  { value: 'CARTE', label: 'Carte bancaire', icone: '💳' }
];

export interface Contrat {
  id: number;
  bien_id: number;
  locataire_id: number;
  numero_contrat: string;
  type_contrat: string;
  date_debut: string;
  date_fin: string | null;
  date_signature?: string;
  date_etat_lieux_entree?: string;
  date_etat_lieux_sortie?: string;
  loyer_mensuel?: number;      // Optionnel pour la vente
  charges_mensuelles?: number;  // Optionnel pour la vente
  depot_garantie?: number;      // Optionnel pour la vente
  prix_vente?: number;          // ✅ Nouveau pour la vente
  indexation?: boolean;
  indice_reference?: string;
  clause_particuliere?: string;
  statut: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  type: string;
  nom: string;
  url: string;
  date_upload: string;
}

export interface Paiement {
  id: number;
  montant: number;
  date_paiement: string;
  mois_concerne: string;
  mode_paiement: string;
  statut: string;
  reference?: string;
}