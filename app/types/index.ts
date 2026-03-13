// types/index.ts
export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: 'ADMIN' | 'PROPRIETAIRE' | 'GESTIONNAIRE' | 'LOCATAIRE';
  avatar?: string;
  actif: boolean;
  date_creation?: Date;
  derniere_connexion?: Date;
}

export interface Bien {
  id: number;
  proprietaire_id: number;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
  type_bien: 'APPARTEMENT' | 'MAISON' | 'COMMERCIAL' | 'PARKING';
  statut: 'DISPONIBLE' | 'LOUE' | 'EN_TRAVAUX' | 'EN_VENTE';
  surface: number;
  pieces: number;
  etage?: number;
  dpe?: string;
  ges?: string;
  annee_construction?: number;
  description?: string;
  loyer_mensuel: number;
  charges: number;
  depot_garantie?: number;
  latitude?: number;
  longitude?: number;
  created_at: Date;
}

export interface Locataire {
  id: number;
  bien_id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_naissance?: Date;
  profession?: string;
  revenus_mensuels?: number;
  actif: boolean;
  created_at: Date;
}

export interface Contrat {
  id: number;
  bien_id: number;
  locataire_id: number;
  numero_contrat: string;
  type_contrat: 'BAIL_VIDE' | 'BAIL_MEUBLE' | 'COMMERCIAL';
  date_debut: Date;
  date_fin?: Date;
  loyer_mensuel: number;
  charges_mensuelles: number;
  depot_garantie: number;
  statut: 'ACTIF' | 'TERMINE' | 'RESILIE';
  created_at: Date;
}

export interface Paiement {
  id: number;
  contrat_id: number;
  montant: number;
  date_paiement: Date;
  date_echeance?: Date;
  mode_paiement: 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'PRELEVEMENT';
  statut: 'EFFECTUE' | 'EN_ATTENTE' | 'EN_RETARD';
  mois_concerne?: string;
  created_at: Date;
}