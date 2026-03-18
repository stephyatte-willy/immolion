// app/types/roles.ts
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PROPRIETAIRE' | 'GESTIONNAIRE' | 'LOCATAIRE' | 'PRESTATAIRE';

export interface RoleDefinition {
  id: Role;
  nom: string;
  description: string;
  niveau: number; // Pour hiérarchie (plus haut = plus de droits)
  couleur: string;
  icone: string;
}

export type Permission = 
  | 'dashboard:voir'
  | 'biens:voir'
  | 'biens:créer'
  | 'biens:modifier'
  | 'biens:supprimer'
  | 'locataires:voir'
  | 'locataires:créer'
  | 'locataires:modifier'
  | 'locataires:supprimer'
  | 'contrats:voir'
  | 'contrats:créer'
  | 'contrats:modifier'
  | 'contrats:supprimer'
  | 'paiements:voir'
  | 'paiements:créer'
  | 'paiements:modifier'
  | 'paiements:supprimer'
  | 'documents:voir'
  | 'documents:upload'
  | 'documents:supprimer'
  | 'utilisateurs:voir'
  | 'utilisateurs:créer'
  | 'utilisateurs:modifier'
  | 'utilisateurs:supprimer'
  | 'roles:paramétrer'
  | 'parametres:voir'
  | 'parametres:modifier'
  | 'statistiques:voir'
  | 'logs:voir'
  | 'api:paramétrer'
  | 'notifications:send';

export interface PermissionDefinition {
  id: Permission;
  nom: string;
  description: string;
  module: string;
  categorie: 'consultation' | 'creation' | 'modification' | 'suppression' | 'administration';
}

export interface RolePermissions {
  role: Role;
  permissions: Permission[];
}

export interface UtilisateurWithRoles {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  roles_secondaires?: Role[];
  permissions_specifiques?: Permission[];
}

export interface Entreprise {
  id: number;
  nom: string;
  siret: string;
  tva_intra: string;
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
  telephone: string;
  email: string;
  site_web: string;
  logo_url: string;
  date_creation: Date;
  capital_social: string;
  forme_juridique: string;
  rcs: string;
  ape: string;
}