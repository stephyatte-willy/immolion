// app/services/penaliteService.ts
export class PenaliteService {
  
  /**
   * Calcule la pénalité de retard pour un loyer
   * En Côte d'Ivoire, les pénalités sont souvent de 5% par mois de retard
   */
  calculerPenaliteRetard(
    montant: number,
    dateEcheance: Date,
    datePaiement: Date,
    tauxMensuel: number = 5
  ): { montant: number; joursRetard: number; tauxApplique: number } {
    // Calculer le nombre de jours de retard
    const diffTime = datePaiement.getTime() - dateEcheance.getTime();
    const joursRetard = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    if (joursRetard === 0) {
      return { montant: 0, joursRetard: 0, tauxApplique: 0 };
    }
    
    // Calculer le nombre de mois de retard (arrondi au supérieur)
    const moisRetard = Math.ceil(joursRetard / 30);
    
    // Taux total = taux mensuel * nombre de mois de retard
    const tauxApplique = tauxMensuel * moisRetard;
    
    // Montant de la pénalité
    const montantPenalite = (montant * tauxApplique) / 100;
    
    return {
      montant: Math.round(montantPenalite),
      joursRetard,
      tauxApplique
    };
  }
  
  /**
   * Vérifie si un paiement est en retard
   */
  estEnRetard(dateEcheance: Date, datePaiement?: Date): boolean {
    if (!datePaiement) return new Date() > dateEcheance;
    return datePaiement > dateEcheance;
  }
  
  /**
   * Génère le numéro de versement pour un échéancier
   */
  genererNumeroVersement(echeancierId: number, numeroVersement: number): string {
    return `ECH-${String(echeancierId).padStart(4, '0')}-V${String(numeroVersement).padStart(3, '0')}`;
  }
}

export const penaliteService = new PenaliteService();