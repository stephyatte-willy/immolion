// app/types/calendrier.ts
export const TYPES_EVENEMENT = [
  { value: 'VISITE', label: 'Visite', icone: '🏠', couleur: '#10b981' },
  { value: 'MAINTENANCE', label: 'Maintenance', icone: '🔧', couleur: '#f59e0b' },
  { value: 'ECHANCE', label: 'Échéance', icone: '💰', couleur: '#ef4444' },
  { value: 'REUNION', label: 'Réunion', icone: '👥', couleur: '#8b5cf6' },
  { value: 'RAPPEL', label: 'Rappel', icone: '⏰', couleur: '#3b82f6' },
  { value: 'ETAT_LIEUX', label: 'État des lieux', icone: '📋', couleur: '#ec4899' },
  { value: 'SIGNATURE', label: 'Signature contrat', icone: '✍️', couleur: '#d4af37' },
  { value: 'AUTRE', label: 'Autre', icone: '📌', couleur: '#94a3b8' }
];

export const STATUTS_EVENEMENT = [
  { value: 'PREVU', label: 'Prévu', couleur: '#3b82f6' },
  { value: 'EN_COURS', label: 'En cours', couleur: '#f59e0b' },
  { value: 'TERMINE', label: 'Terminé', couleur: '#10b981' },
  { value: 'ANNULE', label: 'Annulé', couleur: '#ef4444' }
];

export const RECURRENCES = [
  { value: 'UNIQUE', label: 'Unique' },
  { value: 'JOURNALIER', label: 'Quotidien' },
  { value: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
  { value: 'MENSUEL', label: 'Mensuel' },
  { value: 'ANNUEL', label: 'Annuel' }
];

export interface Evenement {
  id: number;
  titre: string;
  description?: string;
  type_evenement: string;
  date_debut: string;
  date_fin?: string;
  date_rappel?: string;
  statut: string;
  bien_id?: number;
  locataire_id?: number;
  contrat_id?: number;
  paiement_id?: number;
  lieu?: string;
  couleur?: string;
  recurrence?: string;
  recurrence_fin?: string;
  notification_envoyee?: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
  // Données jointes
  bien_nom?: string;
  locataire_nom?: string;
  locataire_prenom?: string;
  contrat_numero?: string;
}

export interface EvenementFormData {
  titre: string;
  description: string;
  type_evenement: string;
  date_debut: string;
  date_fin: string;
  date_rappel: string;
  statut: string;
  bien_id: string;
  locataire_id: string;
  contrat_id: string;
  lieu: string;
  couleur: string;
  recurrence: string;
  recurrence_fin: string;
}