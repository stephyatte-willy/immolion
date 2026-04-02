// app/types/proprietaires.ts
export const TYPES_PROPRIETAIRE = [
  { value: 'PARTICULIER', label: 'Particulier', icone: '👤' },
  { value: 'SOCIETE', label: 'Société', icone: '🏢' },
  { value: 'AGENCE', label: 'Agence immobilière', icone: '🏪' }
];

export interface Proprietaire {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  telephone_secondaire?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  type: string;
  num_identite?: string;
  date_naissance?: string;
  profession?: string;
  notes?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
  biens?: BienProprietaire[];
}

export interface BienProprietaire {
  id: number;
  nom: string;
  type_bien: string;
  statut: string;
  adresse: string;
  ville: string;
  loyer_mensuel?: number;
  prix_vente?: number;
  locataire_actuel?: {
    id: number;
    nom: string;
    prenom: string;
  };
}
