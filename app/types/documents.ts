// app/types/documents.ts
export const TYPES_DOCUMENTS = [
  { value: 'CNI', label: 'Carte Nationale d\'Identité', icone: '🆔' },
  { value: 'PASSEPORT', label: 'Passeport', icone: '📘' },
  { value: 'PERMIS', label: 'Permis de conduire', icone: '🚗' },
  { value: 'TITRE_SEJOUR', label: 'Titre de séjour', icone: '📋' },
  { value: 'CONTRAT_TRAVAIL', label: 'Contrat de travail', icone: '💼' },
  { value: 'BULLETIN_SALAIRE', label: 'Bulletin de salaire', icone: '📄' },
  { value: 'AVIS_IMPOSITION', label: 'Avis d\'imposition', icone: '📊' },
  { value: 'QUITTANCE_LOYER', label: 'Quittance de loyer', icone: '🏠' },
  { value: 'FACTURE_EAU', label: 'Facture d\'eau', icone: '💧' },
  { value: 'FACTURE_ELECTRICITE', label: 'Facture d\'électricité', icone: '⚡' },
  { value: 'BAIL', label: 'Contrat de bail', icone: '📜' },
  { value: 'ETAT_LIEUX', label: 'État des lieux', icone: '📝' },
  { value: 'AUTRE', label: 'Autre document', icone: '📎' }
];

export interface Document {
  id: number;
  bien_id?: number;
  locataire_id?: number;
  contrat_id?: number;
  type_document: string;
  nom: string;
  url: string;
  taille?: number;
  date_upload: string;
  date_expiration?: string;
  created_at: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  id?: number;
  url?: string;
  erreur?: string;
}