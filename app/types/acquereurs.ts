export const TYPES_ACQUEREUR = [
  { value: 'PARTICULIER', label: 'Particulier', icone: '👤', couleur: '#10b981' },
  { value: 'SOCIETE', label: 'Société', icone: '🏢', couleur: '#3b82f6' },
  { value: 'AGENCE', label: 'Agence', icone: '🏪', couleur: '#f59e0b' }
];

export const STATUTS_ACQUEREUR = [
  { value: 'ACTIF', label: 'Actif', icone: '✅', couleur: '#10b981' },
  { value: 'INACTIF', label: 'Inactif', icone: '❌', couleur: '#94a3b8' }
];

export interface Acquereur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  telephone_secondaire?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  nationalite?: string;
  profession?: string;
  employeur?: string;
  revenus_mensuels?: number;
  type_acquereur: 'PARTICULIER' | 'SOCIETE' | 'AGENCE';
  raison_sociale?: string;
  num_identite?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  notes?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
  contrats?: any[];
  paiements?: any[];
  documents?: any[];
}