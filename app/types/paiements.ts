// app/types/paiements.ts
export const MODES_PAIEMENT = [
  { value: 'ESPECES', label: 'Espèces', icone: '💵' },
  { value: 'CHEQUE', label: 'Chèque', icone: '📝' },
  { value: 'VIREMENT', label: 'Virement bancaire', icone: '🏦' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money (Orange Money, MTN)', icone: '📱' },
  { value: 'WAVE', label: 'Wave', icone: '🌊' },
  { value: 'CARTE', label: 'Carte bancaire', icone: '💳' }
];

export const STATUTS_PAIEMENT = [
  { value: 'EFFECTUE', label: 'Effectué', couleur: '#10b981' },
  { value: 'EN_ATTENTE', label: 'En attente', couleur: '#f59e0b' },
  { value: 'EN_RETARD', label: 'En retard', couleur: '#ef4444' }
];

export const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export interface Paiement {
  id: number;
  contrat_id: number;
  bien_id: number;
  locataire_id: number;
  gestionnaire_id?: number;
  type_paiement: string;
  montant: number;
  date_paiement: string;
  date_echeance?: string;
  mode_paiement: string;
  reference?: string;
  statut: string;
  mois_concerne?: string;
  penalite?: number;
  commentaire?: string;
  justificatif?: string;
  created_at: string;
  updated_at: string;
}

export interface PaiementWithDetails extends Paiement {
  contrat_numero?: string;
  bien_nom?: string;
  locataire_nom?: string;
  locataire_prenom?: string;
}