// app/lib/roles.ts
import { Role, RoleDefinition, RolePermissions, Permission } from '@/app/types/roles';

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

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard:voir',
    'biens:voir', 'biens:créer', 'biens:modifier', 'biens:supprimer',
    'locataires:voir', 'locataires:créer', 'locataires:modifier', 'locataires:supprimer',
    'contrats:voir', 'contrats:créer', 'contrats:modifier', 'contrats:supprimer',
    'paiements:voir', 'paiements:créer', 'paiements:modifier', 'paiements:supprimer',
    'documents:voir', 'documents:upload', 'documents:supprimer',
    'utilisateurs:voir', 'utilisateurs:créer', 'utilisateurs:modifier', 'utilisateurs:supprimer',
    'roles:paramétrer',
    'parametres:voir', 'parametres:modifier',
    'statistiques:voir',
    'logs:voir',
    'api:paramétrer',
    'notifications:send'
  ],
  
  ADMIN: [
    'dashboard:voir',
    'biens:voir', 'biens:créer', 'biens:modifier', 'biens:supprimer',
    'locataires:voir', 'locataires:créer', 'locataires:modifier', 'locataires:supprimer',
    'contrats:voir', 'contrats:créer', 'contrats:modifier', 'contrats:supprimer',
    'paiements:voir', 'paiements:créer', 'paiements:modifier', 'paiements:supprimer',
    'documents:voir', 'documents:upload', 'documents:supprimer',
    'utilisateurs:voir', 'utilisateurs:créer', 'utilisateurs:modifier',
    'parametres:voir', 'parametres:modifier',
    'statistiques:voir',
    'logs:voir',
    'notifications:send'
  ],
  
  PROPRIETAIRE: [
    'dashboard:voir',
    'biens:voir', 'biens:créer', 'biens:modifier',
    'locataires:voir', 'locataires:créer', 'locataires:modifier',
    'contrats:voir', 'contrats:créer', 'contrats:modifier',
    'paiements:voir', 'paiements:créer',
    'documents:voir', 'documents:upload',
    'statistiques:voir',
    'notifications:send'
  ],
  
  GESTIONNAIRE: [
    'dashboard:voir',
    'biens:voir', 'biens:modifier',
    'locataires:voir', 'locataires:créer', 'locataires:modifier',
    'contrats:voir', 'contrats:créer', 'contrats:modifier',
    'paiements:voir', 'paiements:créer',
    'documents:voir', 'documents:upload'
  ],
  
  LOCATAIRE: [
    'biens:voir',
    'documents:voir',
    'paiements:voir'
  ],
  
  PRESTATAIRE: [
    'biens:voir',
    'documents:voir'
  ]
};