// app/types/biens.ts
export interface TypeBien {
  id: number;
  nom: string;
  description: string;
  icone: string;
  est_principal: boolean;
  peut_contenir_lots: boolean;
  ordre: number;
}

export interface Lot {
  id: number;
  bien_principal_id: number;
  numero_lot: string;
  etage?: number;
  type_lot?: string;
  nom?: string;
  surface: number;
  pieces?: number;
  loyer_mensuel?: number;
  charges?: number;
  depot_garantie?: number;
  prix_vente?: number;
  description?: string;
  statut: string;
  locataire_id?: number;
  locataire?: {
    id: number;
    nom: string;
    prenom: string;
  };
  created_at: string;
  updated_at: string;
}

export interface LoyerLot {
  id: number;
  lot_id: number;
  mois: string;
  montant_du: number;
  montant_paye: number;
  date_echeance?: string;
  date_paiement?: string;
  statut: string;
  paiement_id?: number;
}

export const TYPES_BIENS_CI_AVANCES = [
  { value: 'IMMEUBLE', label: 'Immeuble', icone: '🏢', peutAvoirLots: true },
  { value: 'APPARTEMENT', label: 'Appartement', icone: '🏢', peutAvoirLots: false },
  { value: 'MAISON', label: 'Maison', icone: '🏠', peutAvoirLots: false },
  { value: 'VILLA', label: 'Villa', icone: '🏛️', peutAvoirLots: false },
  { value: 'STUDIO', label: 'Studio', icone: '🏢', peutAvoirLots: false },
  { value: 'MAGASIN', label: 'Magasin / Boutique', icone: '🏪', peutAvoirLots: false },
  { value: 'ENTREPOT', label: 'Entrepôt', icone: '🏭', peutAvoirLots: false },
  { value: 'BUREAU', label: 'Bureau', icone: '🏢', peutAvoirLots: false },
  { value: 'TERRAIN', label: 'Terrain', icone: '🌲', peutAvoirLots: false },
  { value: 'PARKING', label: 'Parking', icone: '🅿️', peutAvoirLots: false },
  { value: 'CHAMBRE', label: 'Chambre', icone: '🛏️', peutAvoirLots: false },
  { value: 'KIOSQUE', label: 'Kiosque', icone: '🏪', peutAvoirLots: false }
];

export const STATUTS_LOT = [
  { value: 'DISPONIBLE', label: 'Disponible', couleur: '#10b981' },
  { value: 'LOUE', label: 'Loué', couleur: '#3b82f6' },
  { value: 'RESERVE', label: 'Réservé', couleur: '#f59e0b' },
  { value: 'EN_TRAVAUX', label: 'En travaux', couleur: '#ef4444' },
  { value: 'EN_VENTE', label: 'En vente', couleur: '#8b5cf6' }
];