// services/dashboardService.ts
export interface DashboardData {
  revenusMensuels: number;
  nbBiens: number;
  tauxOccupation: number;
  impayés: number;
  revenusMensuelsData: {
    mois: string;
    revenus: number;
  }[];
  alertes: {
    id: number;
    type: 'warning' | 'danger' | 'info';
    message: string;
    date: string;
  }[];
  evenements: {
    id: number;
    titre: string;
    date: string;
    type: string;
  }[];
  biens: {
    id: number;
    nom: string;
    adresse: string;
    latitude: number;
    longitude: number;
    statut: string;
  }[];
  paiementsRecents: {
    id: number;
    locataire: string;
    montant: number;
    date: string;
    statut: string;
  }[];
  activitesRecentes: {
    id: number;
    action: string;
    details: string;
    date: string;
    utilisateur: string;
  }[];
}

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Erreur chargement dashboard');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur dashboard:', error);
      
      // Données de démonstration
      return {
        revenusMensuels: 15750,
        nbBiens: 12,
        tauxOccupation: 94,
        impayés: 850,
        revenusMensuelsData: [
          { mois: 'Jan', revenus: 12500 },
          { mois: 'Fév', revenus: 13200 },
          { mois: 'Mar', revenus: 14100 },
          { mois: 'Avr', revenus: 13800 },
          { mois: 'Mai', revenus: 15200 },
          { mois: 'Juin', revenus: 15750 },
        ],
        alertes: [
          { id: 1, type: 'warning', message: 'Révision annuelle des loyers dans 30 jours', date: '2024-07-15' },
          { id: 2, type: 'danger', message: 'Impôt foncier à payer avant le 15 octobre', date: '2024-10-15' },
          { id: 3, type: 'info', message: 'Nouveau locataire pour l\'appartement B23', date: '2024-06-28' },
        ],
        evenements: [
          { id: 1, titre: 'Visite technique - Chaufferie', date: '2024-07-05', type: 'maintenance' },
          { id: 2, titre: 'Signature bail - Martin', date: '2024-07-08', type: 'contrat' },
          { id: 3, titre: 'État des lieux sortie - Dupont', date: '2024-07-12', type: 'etat-lieux' },
        ],
        biens: [
          { 
            id: 1, 
            nom: 'Résidence Victor Hugo', 
            adresse: '15 Rue Victor Hugo, 75016 Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            statut: 'Loué'
          },
          { 
            id: 2, 
            nom: 'Appartement Centre', 
            adresse: '8 Place Bellecour, 69002 Lyon',
            latitude: 45.7578,
            longitude: 4.8320,
            statut: 'Disponible'
          },
          { 
            id: 3, 
            nom: 'Studio Mer', 
            adresse: '45 Promenade des Anglais, 06000 Nice',
            latitude: 43.6953,
            longitude: 7.2716,
            statut: 'Loué'
          },
        ],
        paiementsRecents: [
          { id: 1, locataire: 'Jean Dupont', montant: 850, date: '2024-06-15', statut: 'Effectué' },
          { id: 2, locataire: 'Marie Martin', montant: 1200, date: '2024-06-14', statut: 'Effectué' },
          { id: 3, locataire: 'Pierre Durand', montant: 950, date: '2024-06-10', statut: 'En retard' },
          { id: 4, locataire: 'Sophie Lefebvre', montant: 1100, date: '2024-06-05', statut: 'Effectué' },
        ],
        activitesRecentes: [
          { id: 1, action: 'Nouveau paiement', details: 'Loyer juin - Dupont', date: '2024-06-15T10:30:00', utilisateur: 'Admin' },
          { id: 2, action: 'Contrat créé', details: 'Nouveau bail - Martin', date: '2024-06-14T15:45:00', utilisateur: 'Admin' },
          { id: 3, action: 'Document ajouté', details: 'État des lieux - Durand', date: '2024-06-13T09:20:00', utilisateur: 'Admin' },
          { id: 4, action: 'Maintenance', details: 'Intervention plomberie - Appartement 12', date: '2024-06-12T14:00:00', utilisateur: 'Admin' },
        ],
      };
    }
  }
}

export const dashboardService = new DashboardService();