// app/services/paiementLocationService.ts

export interface ConditionsLocation {
  caution_paye: boolean;
  avance_paye: boolean;
  montant_caution: number;
  montant_avance: number;
  nombre_mois_avance: number;
}

export interface PeriodeLocation {
  id: number;
  mois_concerne: string;
  montant_du: number;
  date_echeance: string;
  statut: 'EN_ATTENTE' | 'PAYE' | 'EN_RETARD';
}

export interface ProchainPaiement {
  type: 'CAUTION' | 'AVANCE' | 'LOYER';
  montant: number;
  description: string;
  mois_concerne?: string;
  estPrioritaire: boolean;
}

export class PaiementLocationService {
  
  /**
   * Détermine le prochain paiement à effectuer
   * Règle: Caution → Avance → Loyers dans l'ordre chronologique
   */
  static getProchainPaiement(
    conditions: ConditionsLocation,
    periodes: PeriodeLocation[],
    loyerMensuel: number
  ): ProchainPaiement | null {
    
    // ÉTAPE 1: Vérifier si la caution est payée
    if (!conditions.caution_paye && conditions.montant_caution > 0) {
      return {
        type: 'CAUTION',
        montant: conditions.montant_caution,
        description: `Paiement de la caution (${conditions.montant_caution.toLocaleString()} FCFA)`,
        estPrioritaire: true
      };
    }
    
    // ÉTAPE 2: Vérifier si l'avance est payée
    if (!conditions.avance_paye && conditions.montant_avance > 0) {
      return {
        type: 'AVANCE',
        montant: conditions.montant_avance,
        description: `Paiement de l'avance (${conditions.nombre_mois_avance} mois - ${conditions.montant_avance.toLocaleString()} FCFA)`,
        estPrioritaire: true
      };
    }
    
    // ÉTAPE 3: Trouver le premier loyer non payé
    const periodeNonPayee = periodes.find(p => p.statut === 'EN_ATTENTE' || p.statut === 'EN_RETARD');
    
    if (periodeNonPayee) {
      return {
        type: 'LOYER',
        montant: periodeNonPayee.montant_du,
        description: `Loyer du ${periodeNonPayee.mois_concerne}`,
        mois_concerne: periodeNonPayee.mois_concerne,
        estPrioritaire: false
      };
    }
    
    return null; // Tout est payé
  }
  
  /**
   * Vérifie si le paiement est autorisé
   */
  static isPaiementAutorise(
    conditions: ConditionsLocation,
    periodes: PeriodeLocation[],
    typePaiement: string,
    moisConcerne?: string
  ): { autorise: boolean; message: string } {
    
    // Cas de la caution
    if (typePaiement === 'CAUTION') {
      if (conditions.caution_paye) {
        return { autorise: false, message: 'La caution a déjà été payée' };
      }
      return { autorise: true, message: '' };
    }
    
    // Cas de l'avance
    if (typePaiement === 'AVANCE') {
      if (!conditions.caution_paye && conditions.montant_caution > 0) {
        return { autorise: false, message: 'Veuillez d\'abord payer la caution' };
      }
      if (conditions.avance_paye) {
        return { autorise: false, message: 'L\'avance a déjà été payée' };
      }
      return { autorise: true, message: '' };
    }
    
    // Cas du loyer
    if (typePaiement === 'LOYER') {
      // Vérifier que caution et avance sont payées
      if (conditions.montant_caution > 0 && !conditions.caution_paye) {
        return { autorise: false, message: 'Veuillez d\'abord payer la caution' };
      }
      if (conditions.montant_avance > 0 && !conditions.avance_paye) {
        return { autorise: false, message: 'Veuillez d\'abord payer l\'avance' };
      }
      
      // Vérifier que le mois concerne est valide
      const periode = periodes.find(p => p.mois_concerne === moisConcerne);
      if (!periode) {
        return { autorise: false, message: 'Période non trouvée' };
      }
      if (periode.statut === 'PAYE') {
        return { autorise: false, message: 'Ce loyer a déjà été payé' };
      }
      
      return { autorise: true, message: '' };
    }
    
    return { autorise: false, message: 'Type de paiement non reconnu' };
  }
  
  /**
   * Calcule les montants totaux à payer initialement
   */
  static calculerMontantsInitiaux(loyerMensuel: number, moisAvance: number, moisCaution: number) {
    return {
      caution: loyerMensuel * moisCaution,
      avance: loyerMensuel * moisAvance,
      totalInitial: loyerMensuel * (moisAvance + moisCaution)
    };
  }
}