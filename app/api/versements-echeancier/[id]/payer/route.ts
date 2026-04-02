import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { penaliteService } from '@/app/services/penaliteService';

// POST - Payer un versement d'échéancier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { montant, mode_paiement, reference, date_paiement, commentaire } = body;
    
    // Récupérer le versement
    const versements = await queryRows(
      `SELECT v.*, e.contrat_id, e.numero_echeancier, c.bien_id, c.locataire_id
       FROM versements_echeancier v
       JOIN echeanciers e ON v.echeancier_id = e.id
       JOIN contrats c ON e.contrat_id = c.id
       WHERE v.id = ?`,
      [id]
    ) as any[];
    
    if (versements.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Versement non trouvé' },
        { status: 404 }
      );
    }
    
    const versement = versements[0];
    const montantSaisi = parseFloat(montant);
    const montantPrevu = parseFloat(versement.montant_prevu);
    const datePaiementObj = new Date(date_paiement);
    const dateEcheanceObj = new Date(versement.date_echeance);
    
    // Calculer la pénalité si nécessaire
    let penalite = 0;
    let estEnRetard = false;
    
    if (datePaiementObj > dateEcheanceObj) {
      estEnRetard = true;
      const penaliteCalc = penaliteService.calculerPenaliteRetard(
        montantPrevu,
        dateEcheanceObj,
        datePaiementObj,
        5 // Taux mensuel de pénalité
      );
      penalite = penaliteCalc.montant;
    }
    
    const montantTotal = montantSaisi + penalite;
    
    // Générer le numéro de quittance
    const annee = datePaiementObj.getFullYear();
    const mois = String(datePaiementObj.getMonth() + 1).padStart(2, '0');
    
    let compteur = await queryRows(
      'SELECT valeur FROM compteurs WHERE type = ? AND annee = ? AND mois = ?',
      ['QUITTANCE_VENTE', annee, parseInt(mois)]
    ) as any[];
    
    let compteurValeur;
    if (compteur.length === 0) {
      compteurValeur = 1;
      await queryInsert(
        'INSERT INTO compteurs (type, valeur, annee, mois) VALUES (?, ?, ?, ?)',
        ['QUITTANCE_VENTE', 1, annee, parseInt(mois)]
      );
    } else {
      compteurValeur = compteur[0].valeur + 1;
      await queryInsert(
        'UPDATE compteurs SET valeur = ? WHERE type = ? AND annee = ? AND mois = ?',
        [compteurValeur, 'QUITTANCE_VENTE', annee, parseInt(mois)]
      );
    }
    
    const numeroQuittance = `RECU-VTE-${annee}-${mois}-${String(compteurValeur).padStart(6, '0')}`;
    
    // Créer le paiement
    const paiementResult = await queryInsert(
      `INSERT INTO paiements (
        contrat_id, bien_id, locataire_id, type_paiement, type_transaction,
        type_vente, montant, penalite, date_paiement, mode_paiement, reference,
        numero_quittance, statut, versement_numero, versement_echeancier_id,
        echeancier_numero, commentaire, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        versement.contrat_id,
        versement.bien_id,
        versement.locataire_id,
        'VERSEMENT',
        'VENTE',
        'VERSEMENT',
        montantSaisi,
        penalite,
        date_paiement,
        mode_paiement,
        reference || null,
        numeroQuittance,
        'EFFECTUE',
        versement.numero_versement,
        parseInt(id),
        versement.numero_echeancier,
        commentaire || null
      ]
    );
    
    if (!paiementResult.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de l\'enregistrement du paiement' },
        { status: 500 }
      );
    }
    
    // Mettre à jour le versement
    await queryInsert(
      `UPDATE versements_echeancier SET
        montant_paye = ?,
        date_paiement = ?,
        statut = ?,
        penalite = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [montantSaisi, date_paiement, 'PAYE', penalite, id]
    );
    
    // Vérifier si tous les versements sont payés
    const versementsRestants = await queryRows(
      'SELECT COUNT(*) as restant FROM versements_echeancier WHERE echeancier_id = ? AND statut != "PAYE"',
      [versement.echeancier_id]
    ) as any[];
    
    if (versementsRestants[0]?.restant === 0) {
      await queryInsert(
        'UPDATE echeanciers SET statut = "TERMINE", updated_at = NOW() WHERE id = ?',
        [versement.echeancier_id]
      );
      
      // Mettre à jour le statut du contrat
      await queryInsert(
        'UPDATE contrats SET statut = "TERMINE", statut_validation = "VALIDE" WHERE id = ?',
        [versement.contrat_id]
      );
    }
    
    return NextResponse.json({
      success: true,
      id: paiementResult.insertId,
      numero_quittance: numeroQuittance,
      penalite_appliquee: penalite,
      message: estEnRetard 
        ? `Versement enregistré avec une pénalité de ${penalite.toLocaleString()} FCFA`
        : 'Versement enregistré avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur paiement versement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}