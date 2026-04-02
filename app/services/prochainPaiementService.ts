// app/services/prochainPaiementService.ts

export interface ProchainPaiement {
  mois_concerne: string;
  montant: number;
  date_echeance: string;
  estEnRetard: boolean;
  type: 'LOYER' | 'VERSEMENT';
  numero_versement?: number;
}

export class ProchainPaiementService {
  
  /**
   * Calcule le prochain paiement à effectuer pour un contrat de location
   */
  calculerProchainPaiementLocation(
    dateDebut: Date,
    loyerMensuel: number,
    chargesMensuelles: number,
    nombreMoisAvance: number,
    paiementsExistants: any[]
  ): ProchainPaiement | null {
    
    const totalMensuel = loyerMensuel + chargesMensuelles;
    const dateCourante = new Date();
    
    // Déterminer le prochain mois à payer (après l'avance)
    const premierMoisAPayer = new Date(dateDebut);
    premierMoisAPayer.setMonth(premierMoisAPayer.getMonth() + nombreMoisAvance);
    premierMoisAPayer.setDate(1);
    
    // Récupérer les mois déjà payés
    const moisPayes = paiementsExistants
      .filter(p => p.type_paiement === 'LOYER' && p.mois_concerne)
      .map(p => p.mois_concerne);
    
    // Trouver le prochain mois non payé
    let moisRecherche = new Date(premierMoisAPayer);
    let prochainMois = null;
    
    while (!prochainMois) {
      const moisKey = `${moisRecherche.getFullYear()}-${String(moisRecherche.getMonth() + 1).padStart(2, '0')}`;
      
      if (!moisPayes.includes(moisKey)) {
        prochainMois = moisRecherche;
      } else {
        moisRecherche.setMonth(moisRecherche.getMonth() + 1);
      }
    }
    
    if (!prochainMois) return null;
    
    // Définir la date d'échéance (le 5 du mois)
    const dateEcheance = new Date(prochainMois);
    dateEcheance.setDate(5);
    
    // Vérifier si le paiement est en retard
    const estEnRetard = dateCourante > dateEcheance;
    
    return {
      mois_concerne: prochainMois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      montant: totalMensuel,
      date_echeance: dateEcheance.toLocaleDateString('fr-FR'),
      estEnRetard,
      type: 'LOYER'
    };
  }
  
  /**
   * Calcule le prochain versement à effectuer pour un contrat de vente
   */
  calculerProchainVersementVente(
    prixVente: number,
    versementsExistants: any[]
  ): ProchainPaiement | null {
    
    const totalDejaVerse = versementsExistants.reduce((sum, v) => sum + (parseFloat(v.montant) || 0), 0);
    const resteAPayer = prixVente - totalDejaVerse;
    
    if (resteAPayer <= 0) return null;
    
    const prochainNumero = versementsExistants.length + 1;
    
    return {
      mois_concerne: `Versement n°${prochainNumero}`,
      montant: resteAPayer,
      date_echeance: 'À convenir',
      estEnRetard: false,
      type: 'VERSEMENT',
      numero_versement: prochainNumero
    };
  }
  
  /**
   * Détermine si on est dans la période de paiement (1er au 10 du mois)
   */
  estDansPeriodePaiement(): boolean {
    const aujourdhui = new Date();
    const jour = aujourdhui.getDate();
    return jour >= 1 && jour <= 10;
  }
  
  /**
   * Génère le message d'état du paiement
   */
  getMessageStatut(prochainPaiement: ProchainPaiement | null, paiementsExistants: any[]): string {
    if (!prochainPaiement) {
      return '✅ Aucun paiement en attente. Tous les paiements sont à jour.';
    }
    
    if (prochainPaiement.estEnRetard) {
      return `⚠️ Paiement en retard - ${prochainPaiement.mois_concerne} (échéance: ${prochainPaiement.date_echeance})`;
    }
    
    if (this.estDansPeriodePaiement()) {
      return `📅 Paiement à effectuer - ${prochainPaiement.mois_concerne} (à payer avant le 10 du mois)`;
    }
    
    return `📅 Prochain paiement - ${prochainPaiement.mois_concerne} (échéance: ${prochainPaiement.date_echeance})`;
  }
}

export const prochainPaiementService = new ProchainPaiementService();