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
  | 'dashboard:view'
  | 'biens:view'
  | 'biens:create'
  | 'biens:edit'
  | 'biens:delete'
  | 'locataires:view'
  | 'locataires:create'
  | 'locataires:edit'
  | 'locataires:delete'
  | 'contrats:view'
  | 'contrats:create'
  | 'contrats:edit'
  | 'contrats:delete'
  | 'paiements:view'
  | 'paiements:create'
  | 'paiements:edit'
  | 'paiements:delete'
  | 'documents:view'
  | 'documents:upload'
  | 'documents:delete'
  | 'utilisateurs:view'
  | 'utilisateurs:create'
  | 'utilisateurs:edit'
  | 'utilisateurs:delete'
  | 'roles:manage'
  | 'parametres:view'
  | 'parametres:edit'
  | 'statistiques:view'
  | 'logs:view'
  | 'api:manage'
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