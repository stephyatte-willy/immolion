// app/types/paiements.ts
export const MODES_PAIEMENT = [
  { value: 'ESPECES', label: 'Espèces', icone: '💵' },
  { value: 'CHEQUE', label: 'Chèque', icone: '📝' },
  { value: 'VIREMENT', label: 'Virement bancaire', icone: '🏦' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money', icone: '📱' },
  { value: 'WAVE', label: 'Wave', icone: '🌊' },
  { value: 'CARTE', label: 'Carte bancaire', icone: '💳' }
];

export const STATUTS_PAIEMENT = [
  { value: 'EFFECTUE', label: 'Effectué', couleur: '#10b981' },
  { value: 'EN_ATTENTE', label: 'En attente', couleur: '#f59e0b' },
  { value: 'EN_RETARD', label: 'En retard', couleur: '#ef4444' }
];

export const TYPES_PAIEMENT = [
  { value: 'LOYER', label: 'Loyer', icone: '🏠' },
  { value: 'ACOMPTE', label: 'Acompte', icone: '💵' },
  { value: 'SOLDE', label: 'Solde', icone: '💰' },
  { value: 'VERSEMENT', label: 'Versement', icone: '💳' },
  { value: 'PENALITE', label: 'Pénalité', icone: '⚠️' }
];

export const TYPES_TRANSACTION = [
  { value: 'LOCATION', label: 'Location', icone: '🏠' },
  { value: 'VENTE', label: 'Vente', icone: '💰' }
];

export const FREQUENCES = [
  { value: 'MENSUEL', label: 'Mensuel' },
  { value: 'TRIMESTRIEL', label: 'Trimestriel' },
  { value: 'SEMESTRIEL', label: 'Semestriel' },
  { value: 'ANNUEL', label: 'Annuel' }
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
  proprietaire_id?: number;
  acquereur_id?: number;
  gestionnaire_id?: number;
  type_paiement: string;
  type_transaction: 'LOCATION' | 'VENTE';
  type_vente?: 'ACOMPTE' | 'SOLDE' | 'VERSEMENT';
  montant: number;
  montant_total_vente?: number;
  versement_numero?: number;
  echeancier_id?: string;
  date_paiement: string;
  date_echeance?: string;
  mode_paiement: string;
  banque?: string;
  numero_compte?: string;
  reference?: string;
  numero_quittance?: string;
  statut: string;
  mois_concerne?: string;
  penalite?: number;
  frais_agence?: number;
  commission_proprietaire?: number;
  date_encaissement_proprietaire?: string;
  date_versement_proprietaire?: string;
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
  proprietaire_nom?: string;
  proprietaire_prenom?: string;
  acquereur_nom?: string;
  acquereur_prenom?: string;
  total_deja_verse?: number;
  reste_a_payer?: number;
}

export interface CommissionProprietaire {
  id: number;
  proprietaire_id: number;
  paiement_id: number;
  bien_id: number;
  contrat_id: number;
  type_transaction: 'LOCATION' | 'VENTE';
  montant_commission: number;
  taux_commission: number;
  date_commission: string;
  statut: 'EN_ATTENTE' | 'VERSEE' | 'EN_RETARD';
  date_versement?: string;
  reference_versement?: string;
  commentaire?: string;
  created_at: string;
  updated_at: string;
}

export interface EcheancierVente {
  id: number;
  contrat_id: number;
  acquereur_id: number;
  bien_id: number;
  montant_total: number;
  montant_verse: number;
  nombre_versements: number;
  versements_effectues: number;
  frequence: 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL';
  date_premier_versement: string;
  date_dernier_versement?: string;
  date_echeance_final: string;
  statut: 'ACTIF' | 'TERMINE' | 'EN_RETARD' | 'RESILIE';
  taux_interet: number;
  montant_interet: number;
  created_at: string;
  updated_at: string;
}