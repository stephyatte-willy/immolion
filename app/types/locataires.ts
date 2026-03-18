// app/types/locataires.ts
export const STATUTS_LOCATAIRE = [
  { value: 'ACTIF', label: 'Actif', couleur: '#10b981' },
  { value: 'INACTIF', label: 'Inactif', couleur: '#94a3b8' },
  { value: 'SORTI', label: 'Sorti', couleur: '#ef4444' },
  { value: 'PROSPECT', label: 'Prospect', couleur: '#f59e0b' }
];

export const TYPES_PIECES = [
  { value: 'CNI', label: 'Carte Nationale d\'Identité', icone: '🆔' },
  { value: 'PASSEPORT', label: 'Passeport', icone: '📘' },
  { value: 'PERMIS', label: 'Permis de conduire', icone: '🚗' },
  { value: 'TITRE_SEJOUR', label: 'Titre de séjour', icone: '📋' },
  { value: 'CONTRAT_TRAVAIL', label: 'Contrat de travail', icone: '💼' },
  { value: 'BULLETIN_SALAIRE', label: 'Bulletin de salaire', icone: '📄' },
  { value: 'QUITTANCE_LOYER', label: 'Quittance de loyer', icone: '🏠' },
  { value: 'FACTURE_EAU', label: 'Facture d\'eau', icone: '💧' },
  { value: 'FACTURE_ELECTRICITE', label: 'Facture d\'électricité', icone: '⚡' },
  { value: 'AVIS_IMPOSITION', label: 'Avis d\'imposition', icone: '📊' }
];

export const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export interface Document {
  id: number;
  type: string;
  nom: string;
  url: string;
  date_upload: string;
  taille?: number;
}

export interface Paiement {
  id: number;
  locataire_id: number;
  bien_id: number;
  contrat_id: number;
  montant: number;
  date_paiement: string;
  mois_concerne: string;
  mode_paiement: 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'MOBILE_MONEY' | 'CARTE';
  statut: 'EFFECTUE' | 'EN_ATTENTE' | 'EN_RETARD';
  reference?: string;
  created_at: string;
}

export interface Contrat {
  id: number;
  numero: string;
  bien_id: number;
  bien_nom: string;
  date_debut: string;
  date_fin: string | null;
  loyer_mensuel: number;
  charges: number;
  depot_garantie: number;
  statut: 'ACTIF' | 'TERMINE' | 'RESILIE';
}

export interface Locataire {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  telephone_secondaire?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  nationalite?: string;
  profession?: string;
  employeur?: string;
  revenus_mensuels?: number;
  statut: 'ACTIF' | 'INACTIF' | 'SORTI' | 'PROSPECT';
  notes?: string;
  documents?: Document[];
  contrats?: Contrat[];
  paiements?: Paiement[];
  bien_actuel?: {
    id: number;
    nom: string;
    adresse: string;
  };
  created_at: string;
  updated_at: string;
}