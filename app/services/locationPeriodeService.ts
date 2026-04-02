// app/services/locationPeriodeService.ts
import { queryRows, queryInsert } from '@/app/lib/database';

interface PeriodeLocation {
  contrat_id: number;
  mois_concerne: Date;
  loyer_du: number;
  charges_du: number;
  total_du: number;
  date_echeance: Date;
}

export class LocationPeriodeService {
  
  /**
   * Génère les périodes de location pour un contrat
   * @param contrat_id ID du contrat
   * @param date_debut Date de début du contrat
   * @param date_fin Date de fin du contrat (optionnel)
   * @param avance_mois Nombre de mois d'avance payés
   */
  async genererPeriodesLocation(
    contrat_id: number,
    date_debut: Date,
    date_fin: Date | null,
    avance_mois: number = 0
  ): Promise<any[]> {
    
    const periodes: PeriodeLocation[] = [];
    const loyerMensuel = await this.getLoyerMensuel(contrat_id);
    const chargesMensuelles = await this.getChargesMensuelles(contrat_id);
    const totalMensuel = loyerMensuel + chargesMensuelles;
    
    // Déterminer la date de début du premier loyer à payer
    // Si avance_mois > 0, les premiers mois sont couverts par l'avance
    const datePremierLoyer = new Date(date_debut);
    datePremierLoyer.setMonth(datePremierLoyer.getMonth() + avance_mois);
    
    // Calculer la date de fin (max 3 ans si non définie)
    const dateFinLocation = date_fin || new Date(date_debut);
    if (!date_fin) {
      dateFinLocation.setFullYear(dateFinLocation.getFullYear() + 3);
    }
    
    // Générer les périodes
    let dateCourante = new Date(datePremierLoyer);
    dateCourante.setDate(1); // Premier jour du mois
    
    while (dateCourante <= dateFinLocation) {
      const dateEcheance = new Date(dateCourante);
      dateEcheance.setDate(5); // Échéance le 5 du mois
      
      periodes.push({
        contrat_id,
        mois_concerne: new Date(dateCourante),
        loyer_du: loyerMensuel,
        charges_du: chargesMensuelles,
        total_du: totalMensuel,
        date_echeance: dateEcheance
      });
      
      dateCourante.setMonth(dateCourante.getMonth() + 1);
    }
    
    // Insérer les périodes en base
    for (const periode of periodes) {
      await queryInsert(
        `INSERT INTO periodes_location (
          contrat_id, mois_concerne, loyer_du, charges_du, total_du, date_echeance, statut
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          periode.contrat_id,
          periode.mois_concerne.toISOString().split('T')[0],
          periode.loyer_du,
          periode.charges_du,
          periode.total_du,
          periode.date_echeance.toISOString().split('T')[0],
          'EN_ATTENTE'
        ]
      );
    }
    
    return periodes;
  }
  
  /**
   * Enregistre une avance de loyer
   */
  async enregistrerAvance(
    contrat_id: number,
    paiement_id: number,
    nombre_mois: number,
    montant_total: number
  ): Promise<void> {
    // Récupérer la date de début du contrat
    const contrat = await queryRows(
      'SELECT date_debut FROM contrats WHERE id = ?',
      [contrat_id]
    ) as any[];
    
    if (contrat.length === 0) return;
    
    const dateDebut = new Date(contrat[0].date_debut);
    const moisDebut = new Date(dateDebut);
    moisDebut.setDate(1);
    
    const moisFin = new Date(dateDebut);
    moisFin.setMonth(moisFin.getMonth() + nombre_mois - 1);
    moisFin.setDate(1);
    
    // Enregistrer l'avance
    await queryInsert(
      `INSERT INTO avances_location (
        contrat_id, paiement_id, nombre_mois, mois_debut, mois_fin, montant_total
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        contrat_id,
        paiement_id,
        nombre_mois,
        moisDebut.toISOString().split('T')[0],
        moisFin.toISOString().split('T')[0],
        montant_total
      ]
    );
    
    // Marquer les périodes concernées comme "AVANCE"
    for (let i = 0; i < nombre_mois; i++) {
      const moisConcerne = new Date(dateDebut);
      moisConcerne.setMonth(moisConcerne.getMonth() + i);
      moisConcerne.setDate(1);
      
      await queryInsert(
        `UPDATE periodes_location 
         SET statut = 'AVANCE', paiement_id = ?
         WHERE contrat_id = ? AND mois_concerne = ?`,
        [paiement_id, contrat_id, moisConcerne.toISOString().split('T')[0]]
      );
    }
  }
  
  /**
   * Enregistre un paiement de loyer
   */
  async enregistrerPaiementLoyer(
    contrat_id: number,
    paiement_id: number,
    mois_concerne: Date,
    montant: number,
    date_paiement: Date
  ): Promise<{ estEnRetard: boolean; penalite: number }> {
    // Récupérer la période concernée
    const periodes = await queryRows(
      'SELECT * FROM periodes_location WHERE contrat_id = ? AND mois_concerne = ?',
      [contrat_id, mois_concerne.toISOString().split('T')[0]]
    ) as any[];
    
    if (periodes.length === 0) {
      throw new Error('Période non trouvée');
    }
    
    const periode = periodes[0];
    const dateEcheance = new Date(periode.date_echeance);
    const estEnRetard = date_paiement > dateEcheance;
    
    // Calculer la pénalité (5% par mois de retard)
    let penalite = 0;
    if (estEnRetard) {
      const diffMois = this.calculerMoisRetard(dateEcheance, date_paiement);
      penalite = (periode.total_du * 5 * diffMois) / 100;
    }
    
    // Mettre à jour la période
    await queryInsert(
      `UPDATE periodes_location SET
        statut = 'PAYE',
        paiement_id = ?,
        date_paiement = ?,
        penalite = ?
       WHERE id = ?`,
      [paiement_id, date_paiement.toISOString().split('T')[0], penalite, periode.id]
    );
    
    // Mettre à jour le paiement avec la pénalité
    if (penalite > 0) {
      await queryInsert(
        'UPDATE paiements SET penalite = ? WHERE id = ?',
        [penalite, paiement_id]
      );
    }
    
    return { estEnRetard, penalite };
  }
  
  /**
   * Récupère la prochaine période à payer
   */
  async getProchainePeriode(contrat_id: number): Promise<any> {
    const periodes = await queryRows(
      `SELECT * FROM periodes_location 
       WHERE contrat_id = ? 
       AND statut IN ('EN_ATTENTE', 'EN_RETARD')
       ORDER BY mois_concerne ASC 
       LIMIT 1`,
      [contrat_id]
    ) as any[];
    
    return periodes[0] || null;
  }
  
  /**
   * Récupère le solde des avances restantes
   */
  async getSoldeAvances(contrat_id: number): Promise<number> {
    const periodes = await queryRows(
      `SELECT COUNT(*) as count FROM periodes_location 
       WHERE contrat_id = ? AND statut = 'AVANCE'`,
      [contrat_id]
    ) as any[];
    
    const loyerMensuel = await this.getLoyerMensuel(contrat_id);
    return (periodes[0]?.count || 0) * loyerMensuel;
  }
  
  private async getLoyerMensuel(contrat_id: number): Promise<number> {
    const contrats = await queryRows(
      'SELECT loyer_mensuel FROM contrats WHERE id = ?',
      [contrat_id]
    ) as any[];
    return parseFloat(contrats[0]?.loyer_mensuel || 0);
  }
  
  private async getChargesMensuelles(contrat_id: number): Promise<number> {
    const contrats = await queryRows(
      'SELECT charges_mensuelles FROM contrats WHERE id = ?',
      [contrat_id]
    ) as any[];
    return parseFloat(contrats[0]?.charges_mensuelles || 0);
  }
  
  private calculerMoisRetard(dateEcheance: Date, datePaiement: Date): number {
    const diffTime = datePaiement.getTime() - dateEcheance.getTime();
    const joursRetard = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(joursRetard / 30);
  }
}

export const locationPeriodeService = new LocationPeriodeService();