// app/types/config.ts
export type ThemeMode = 'dark' | 'light' | 'system';
export type Langue = 'fr' | 'en' | 'es';
export type Monnaie = 'XOF' | 'XAF' | 'EUR' | 'USD' | 'GBP';
export type FuseauHoraire = 
  | 'Africa/Abidjan' 
  | 'Africa/Dakar' 
  | 'Africa/Lagos' 
  | 'Europe/Paris' 
  | 'America/New_York';

export interface Configuration {
  id?: number;
  
  // Thème et apparence
  theme_mode: ThemeMode;
  couleur_principale: string;
  couleur_secondaire: string;
  couleur_accent: string;
  font_family: string;
  
  // Régional
  langue: Langue;
  fuseau_horaire: FuseauHoraire;
  format_date: string;
  format_heure: string;
  premier_jour_semaine: number;
  
  // Monnaie
  monnaie: Monnaie;
  symbole_monnaie: string;
  position_monnaie: 'before' | 'after';
  decimales_monnaie: number;
  separateur_milliers: string;
  separateur_decimal: string;
  
  // Application
  nom_application: string;
  logo_url: string | null;
  favicon_url: string | null;
  email_contact: string | null;
  telephone_contact: string | null;
  adresse_contact: string | null;
  
  // Notifications
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_push: boolean;
  
  // Sécurité
  session_timeout: number;
  tentative_connexion_max: number;
  verrouillage_compte: number;
}

export interface MonnaieInfo {
  code: Monnaie;
  nom: string;
  symbole: string;
  decimales: number;
  pays: string[];
}

export const MONNAIES: Record<Monnaie, MonnaieInfo> = {
  XOF: {
    code: 'XOF',
    nom: 'Franc CFA (UEMOA)',
    symbole: 'FCFA',
    decimales: 0,
    pays: ['Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinée-Bissau', 'Mali', 'Niger', 'Sénégal', 'Togo']
  },
  XAF: {
    code: 'XAF',
    nom: 'Franc CFA (CEMAC)',
    symbole: 'FCFA',
    decimales: 0,
    pays: ['Cameroun', 'Centrafrique', 'Congo', 'Gabon', 'Guinée Équatoriale', 'Tchad']
  },
  EUR: {
    code: 'EUR',
    nom: 'Euro',
    symbole: '€',
    decimales: 2,
    pays: ['France', 'Allemagne', 'Espagne', 'Italie', 'Belgique', 'Pays-Bas', 'Luxembourg']
  },
  USD: {
    code: 'USD',
    nom: 'Dollar US',
    symbole: '$',
    decimales: 2,
    pays: ['États-Unis']
  },
  GBP: {
    code: 'GBP',
    nom: 'Livre Sterling',
    symbole: '£',
    decimales: 2,
    pays: ['Royaume-Uni']
  }
};

export const FUSEAUX_HORAIRES = [
  { value: 'Africa/Abidjan', label: 'Abidjan (GMT+0)' },
  { value: 'Africa/Dakar', label: 'Dakar (GMT+0)' },
  { value: 'Africa/Lagos', label: 'Lagos (GMT+1)' },
  { value: 'Africa/Casablanca', label: 'Casablanca (GMT+1)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (GMT+2)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1/2)' },
  { value: 'Europe/London', label: 'Londres (GMT+0/1)' },
  { value: 'America/New_York', label: 'New York (GMT-4/5)' }
];

export const LANGUES = [
  { code: 'fr', nom: 'Français', drapeau: '🇫🇷' },
  { code: 'en', nom: 'English', drapeau: '🇬🇧' },
  { code: 'es', nom: 'Español', drapeau: '🇪🇸' }
];

export const FORMATS_DATE = [
  { value: 'DD/MM/YYYY', label: '31/12/2024' },
  { value: 'MM/DD/YYYY', label: '12/31/2024' },
  { value: 'YYYY-MM-DD', label: '2024-12-31' },
  { value: 'DD.MM.YYYY', label: '31.12.2024' }
];

export const FORMATS_HEURE = [
  { value: 'HH:mm', label: '14:30 (24h)' },
  { value: 'hh:mm A', label: '02:30 PM (12h)' },
  { value: 'HH:mm:ss', label: '14:30:45' }
];