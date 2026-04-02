// app/types/contrats.ts
export const TYPES_CONTRAT = [
    { value: 'BAIL_VIDE', label: 'Bail vide', icone: '🏠' },
  { value: 'BAIL_MEUBLE', label: 'Bail meublé', icone: '🛋️' },
  { value: 'VENTE', label: 'Vente', icone: '💰' }
];

export const STATUTS_CONTRAT = [
  { value: 'ACTIF', label: 'Actif', couleur: '#10b981' },
  { value: 'TERMINE', label: 'Terminé', couleur: '#94a3b8' },
  { value: 'RESILIE', label: 'Résilié', couleur: '#ef4444' }
];

export const MODES_VENTE = [
  { value: 'COMPTANT', label: 'Comptant', icone: '💵' },
  { value: 'ECHELONNE', label: 'Échelonné', icone: '📅' }
];

export const TYPES_CONTRAT_VENTE = [
  { value: 'COMPTANT', label: 'Comptant', icone: '💵' },
  { value: 'ECHELONNE', label: 'Échelonné', icone: '📅' }
];

export const MODES_PAIEMENT_VENTE = [
  { value: 'ACOMPTE', label: 'Acompte', icone: '💵' },
  { value: 'VERSEMENT', label: 'Versement', icone: '💰' },
  { value: 'SOLDE', label: 'Solde final', icone: '✅' }
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
  numero_contrat: string;
  bien_id: number;
  locataire_id: number;
  type_contrat: string;
  date_debut: string;
  date_fin: string | null;
  date_signature?: string;
  date_etat_lieux_entree?: string;
  date_etat_lieux_sortie?: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  depot_garantie: number;
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