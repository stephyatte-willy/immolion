// services/authService.ts
export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: string;
  avatar?: string;
}

export interface ParametresApp {
  nom_app: string;
  slogan: string;
  logo_url: string | null;
  couleur_principale: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

class AuthService {
  // Authentifier un utilisateur
  async authentifierUtilisateur(email: string, motDePasse: string): Promise<{
    success: boolean;
    utilisateur?: Utilisateur;
    erreur?: string;
  }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, erreur: data.erreur || 'Erreur de connexion' };
      }
      
      return {
        success: true,
        utilisateur: data.utilisateur,
      };
    } catch (error) {
      console.error('Erreur authentification:', error);
      return { success: false, erreur: 'Erreur réseau' };
    }
  }
  
  // Rechercher un utilisateur par email
  async rechercherUtilisateurParEmail(email: string): Promise<{
    success: boolean;
    utilisateur?: { nom: string; prenom: string; role: string } | null;
    erreur?: string;
  }> {
    try {
      if (!email || !email.includes('@')) {
        return { success: true, utilisateur: null };
      }
      
      const response = await fetch(`/api/auth/search?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, erreur: data.erreur };
      }
      
      return {
        success: true,
        utilisateur: data.utilisateur,
      };
    } catch (error) {
      console.error('Erreur recherche:', error);
      return { success: false, erreur: 'Erreur réseau' };
    }
  }
  
  // Obtenir les paramètres de l'application
  async obtenirParametresApp(): Promise<{
    success: boolean;
    parametres?: ParametresApp;
    erreur?: string;
  }> {
    try {
      // Pour ImmoLion, on a des paramètres fixes
      return {
        success: true,
        parametres: {
          nom_app: 'ImmoLion',
          slogan: 'La gestion immobilière nouvelle génération',
          logo_url: '/logo_immolion.png',
          couleur_principale: '#8B5CF6',
          adresse: '15 Avenue de la Grande Armée, 75016 Paris',
          telephone: '+33 1 84 80 00 00',
          email: 'contact@immolion.com',
        },
      };
    } catch (error) {
      console.error('Erreur paramètres:', error);
      return { success: false, erreur: 'Erreur chargement paramètres' };
    }
  }
  
  // Déconnexion
  async deconnecter(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  }
  
  // Obtenir l'utilisateur courant
  async getUtilisateurCourant(): Promise<Utilisateur | null> {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.utilisateur || null;
    } catch (error) {
      console.error('Erreur utilisateur courant:', error);
      return null;
    }
  }
}

export const authService = new AuthService();