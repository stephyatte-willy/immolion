import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// POST - Valider un contrat après paiements
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { caution, nombre_mois_avance, paiements, valide_par } = body;

    console.log('📦 Validation contrat ID:', id);
    console.log('📦 Paiements reçus:', paiements);

    // Vérifier que le contrat existe et est en brouillon
    const contrat = await queryRows(
      `SELECT c.*, l.nom as locataire_nom, l.prenom as locataire_prenom 
       FROM contrats c
       LEFT JOIN locataires l ON c.locataire_id = l.id
       WHERE c.id = ? AND c.statut_validation = 'BROUILLON'`,
      [id]
    ) as any[];

    if (contrat.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Contrat non trouvé ou déjà validé' },
        { status: 404 }
      );
    }

    const contratData = contrat[0];
    const loyerMensuel = parseFloat(contratData.loyer_mensuel) || 0;
    const cautionValue = parseFloat(caution) || 0;
    const nombreMoisAvance = parseInt(nombre_mois_avance) || 1;
    const montantAvance = loyerMensuel * nombreMoisAvance;
    const totalAPayer = cautionValue + montantAvance;

    // Vérifier les paiements
    if (!paiements || paiements.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Aucun paiement enregistré' },
        { status: 400 }
      );
    }

    // Calculer le total des paiements
    let totalPaiements = 0;
    for (const paiement of paiements) {
      totalPaiements += parseFloat(paiement.montant) || 0;
    }

    if (totalPaiements < totalAPayer) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: `Les paiements (${totalPaiements.toLocaleString()} FCFA) ne couvrent pas le total requis (${totalAPayer.toLocaleString()} FCFA)`
        },
        { status: 400 }
      );
    }

    // Créer les conditions de location
    const conditionsResult = await queryInsert(
      `INSERT INTO conditions_location (
        contrat_id, caution, nombre_mois_avance, montant_avance,
        date_paiement_caution, date_paiement_avance, date_effet_location, statut
      ) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW(), ?)`,
      [id, cautionValue, nombreMoisAvance, montantAvance, 'COMPLETEMENT_PAYE']
    );

    if (!conditionsResult.success) {
      console.error('❌ Erreur insertion conditions_location:', conditionsResult);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de l\'enregistrement des conditions' },
        { status: 500 }
      );
    }

    const conditionsId = conditionsResult.insertId;
    console.log('✅ Conditions location créées avec ID:', conditionsId);

    // Enregistrer les paiements
    for (const paiement of paiements) {
      const montant = parseFloat(paiement.montant) || 0;
      const typePaiement = paiement.type;
      const modePaiement = paiement.mode || 'ESPECES';
      
      console.log(`💾 Enregistrement paiement: type=${typePaiement}, montant=${montant}, mode=${modePaiement}`);
      
      const paiementResult = await queryInsert(
        `INSERT INTO paiements (
          contrat_id, conditions_location_id, locataire_id, bien_id, montant, 
          type_paiement, date_paiement, mode_paiement, statut, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 'VALIDE', NOW())`,
        [
          parseInt(id),
          conditionsId,
          contratData.locataire_id,
          contratData.bien_id,
          montant,
          typePaiement,
          modePaiement
        ]
      );
      
      if (!paiementResult.success) {
        console.error('❌ Erreur enregistrement paiement:', paiement, paiementResult);
      } else {
        console.log(`✅ Paiement ${typePaiement} enregistré avec succès`);
      }
    }

    // Valider le contrat
    await queryInsert(
      `UPDATE contrats SET 
        statut_validation = ?,
        date_validation = NOW(),
        statut = ?,
        valide_par = ?
       WHERE id = ?`,
      ['VALIDE', 'ACTIF', valide_par || 1, id]
    );

    // ✅ CORRECTION: Utiliser des paramètres pour les valeurs ENUM
    if (contratData.lot_id) {
      const updateResult = await queryInsert(
        'UPDATE lots SET statut = ? WHERE id = ?',
        ['LOUE', contratData.lot_id]
      );
      console.log(`✅ Lot ${contratData.lot_id} passé en statut "LOUE":`, updateResult);
    } else if (contratData.bien_id) {
      const updateResult = await queryInsert(
        'UPDATE biens SET statut = ? WHERE id = ?',
        ['LOUE', contratData.bien_id]
      );
      console.log(`✅ Bien ${contratData.bien_id} passé en statut "LOUE":`, updateResult);
    }

    // Mettre à jour le locataire avec le bien/lot
    if (contratData.lot_id) {
      await queryInsert(
        'UPDATE locataires SET bien_id = ?, lot_id = ?, actif = 1 WHERE id = ?',
        [contratData.bien_id, contratData.lot_id, contratData.locataire_id]
      );
    } else if (contratData.bien_id) {
      await queryInsert(
        'UPDATE locataires SET bien_id = ?, lot_id = NULL, actif = 1 WHERE id = ?',
        [contratData.bien_id, contratData.locataire_id]
      );
    }

    // Mettre à jour la réservation associée
    await queryInsert(
      'UPDATE reservations SET statut = ? WHERE contrat_id = ?',
      ['CONFIRMEE', id]
    );

    return NextResponse.json({
      success: true,
      message: 'Contrat validé avec succès',
      details: {
        caution: cautionValue,
        avance: montantAvance,
        total_paye: totalPaiements,
        date_validation: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur validation contrat:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}