// app/types/roles.ts
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PROPRIETAIRE' | 'GESTIONNAIRE' | 'LOCATAIRE' | 'PRESTATAIRE';

export interface RoleDefinition {
  id: Role;
  nom: string;
  description: string;
  niveau: number;
  couleur: string;
  icone: string;
}

export type Permission = 
  | 'dashboard:view'
  | 'dashboard:view_finances' // ✅ Nouvelle permission pour les finances
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

export const ROLES: Record<Role, RoleDefinition> = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    nom: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    niveau: 100,
    couleur: '#EF4444',
    icone: '👑'
  },
  ADMIN: {
    id: 'ADMIN',
    nom: 'Administrateur',
    description: 'Gestion complète de l\'application',
    niveau: 80,
    couleur: '#F59E0B',
    icone: '⚡'
  },
  PROPRIETAIRE: {
    id: 'PROPRIETAIRE',
    nom: 'Propriétaire',
    description: 'Gère ses biens et locataires',
    niveau: 60,
    couleur: '#8B5CF6',
    icone: '🏢'
  },
  GESTIONNAIRE: {
    id: 'GESTIONNAIRE',
    nom: 'Gestionnaire',
    description: 'Gère les biens pour le compte de propriétaires',
    niveau: 50,
    couleur: '#3B82F6',
    icone: '👔'
  },
  LOCATAIRE: {
    id: 'LOCATAIRE',
    nom: 'Locataire',
    description: 'Accès à son espace locataire',
    niveau: 20,
    couleur: '#10B981',
    icone: '👤'
  },
  PRESTATAIRE: {
    id: 'PRESTATAIRE',
    nom: 'Prestataire',
    description: 'Accès aux interventions de maintenance',
    niveau: 30,
    couleur: '#EC4899',
    icone: '🔧'
  }
};

// ✅ Mise à jour des permissions par rôle
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard:view',
    'dashboard:view_finances', // ✅ Accès aux finances
    'biens:view', 'biens:create', 'biens:edit', 'biens:delete',
    'locataires:view', 'locataires:create', 'locataires:edit', 'locataires:delete',
    'contrats:view', 'contrats:create', 'contrats:edit', 'contrats:delete',
    'paiements:view', 'paiements:create', 'paiements:edit', 'paiements:delete',
    'documents:view', 'documents:upload', 'documents:delete',
    'utilisateurs:view', 'utilisateurs:create', 'utilisateurs:edit', 'utilisateurs:delete',
    'roles:manage',
    'parametres:view', 'parametres:edit',
    'statistiques:view',
    'logs:view',
    'api:manage',
    'notifications:send'
  ],
  
  ADMIN: [
    'dashboard:view',
    'dashboard:view_finances', // ✅ Accès aux finances
    'biens:view', 'biens:create', 'biens:edit', 'biens:delete',
    'locataires:view', 'locataires:create', 'locataires:edit', 'locataires:delete',
    'contrats:view', 'contrats:create', 'contrats:edit', 'contrats:delete',
    'paiements:view', 'paiements:create', 'paiements:edit', 'paiements:delete',
    'documents:view', 'documents:upload', 'documents:delete',
    'utilisateurs:view', 'utilisateurs:create', 'utilisateurs:edit',
    'parametres:view', 'parametres:edit',
    'statistiques:view',
    'logs:view',
    'notifications:send'
  ],
  
  GESTIONNAIRE: [
    'dashboard:view',
    'dashboard:view_finances', // ✅ Accès aux finances
    'biens:view', 'biens:edit',
    'locataires:view', 'locataires:create', 'locataires:edit',
    'contrats:view', 'contrats:create', 'contrats:edit',
    'paiements:view', 'paiements:create',
    'documents:view', 'documents:upload',
    'statistiques:view',
    'notifications:send'
  ],
  
  PROPRIETAIRE: [
    'dashboard:view',
    // ❌ PAS d'accès aux finances globales
    'biens:view', 'biens:create', 'biens:edit',
    'locataires:view', 'locataires:create', 'locataires:edit',
    'contrats:view', 'contrats:create', 'contrats:edit',
    'paiements:view', 'paiements:create',
    'documents:view', 'documents:upload',
    'statistiques:view'
  ],
  
  LOCATAIRE: [
    'dashboard:view',
    // ❌ PAS d'accès aux finances
    'biens:view',
    'documents:view',
    'paiements:view'
  ],
  
  PRESTATAIRE: [
    'dashboard:view',
    // ❌ PAS d'accès aux finances
    'biens:view',
    'documents:view'
  ]
};

// ✅ Fonction utilitaire pour vérifier les permissions
export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) || false;
}