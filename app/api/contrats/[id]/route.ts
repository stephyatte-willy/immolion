import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un contrat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer le contrat avec toutes ses informations
    const contrats = await queryRows(
      `SELECT 
        c.id,
        c.bien_id,
        c.lot_id,
        c.locataire_id,
        c.numero_contrat,
        c.type_contrat,
        c.date_debut,
        c.date_fin,
        c.date_signature,
        c.date_etat_lieux_entree,
        c.date_etat_lieux_sortie,
        c.loyer_mensuel,
        c.charges_mensuelles,
        c.depot_garantie,
        c.prix_vente,
        c.clause_particuliere,
        c.statut,
        c.statut_validation,
        c.created_at,
        c.updated_at
       FROM contrats c
       WHERE c.id = ?`,
      [id]
    ) as any[];

    if (contrats.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Contrat non trouvé' },
        { status: 404 }
      );
    }

    const contrat = contrats[0];
    
    // Récupérer le bien associé
    let bien = null;
    if (contrat.bien_id) {
      const biens = await queryRows(
        `SELECT id, nom, adresse, type_bien, loyer_mensuel, charges, surface, pieces, 
                commune, ville, quartier, district, description
         FROM biens WHERE id = ?`,
        [contrat.bien_id]
      ) as any[];
      if (biens.length > 0) bien = biens[0];
    }

    // Récupérer le lot associé
    let lot = null;
    if (contrat.lot_id) {
      const lots = await queryRows(
        `SELECT lt.id, lt.numero_lot, lt.etage, lt.type_lot, lt.nom, lt.surface, 
                lt.pieces, lt.loyer_mensuel, lt.charges, lt.statut,
                b.id as immeuble_id, b.nom as immeuble_nom
         FROM lots lt
         LEFT JOIN biens b ON lt.bien_principal_id = b.id
         WHERE lt.id = ?`,
        [contrat.lot_id]
      ) as any[];
      if (lots.length > 0) {
        lot = {
          id: lots[0].id,
          numero_lot: lots[0].numero_lot,
          etage: lots[0].etage,
          type_lot: lots[0].type_lot,
          nom: lots[0].nom,
          surface: lots[0].surface,
          pieces: lots[0].pieces,
          loyer_mensuel: lots[0].loyer_mensuel,
          charges: lots[0].charges,
          statut: lots[0].statut,
          immeuble: lots[0].immeuble_id ? {
            id: lots[0].immeuble_id,
            nom: lots[0].immeuble_nom
          } : null
        };
      }
    }

    // Récupérer le locataire
    let locataire = null;
    if (contrat.locataire_id) {
      const locataires = await queryRows(
        `SELECT id, nom, prenom, email, telephone, date_naissance, lieu_naissance,
                nationalite, profession, employeur, revenus_mensuels
         FROM locataires WHERE id = ?`,
        [contrat.locataire_id]
      ) as any[];
      if (locataires.length > 0) locataire = locataires[0];
    }

    // Récupérer les conditions de location
    let conditions = null;
    const conditionsList = await queryRows(
      `SELECT id, caution, nombre_mois_avance, montant_avance, statut,
              date_paiement_caution, date_paiement_avance, date_effet_location
       FROM conditions_location WHERE contrat_id = ? ORDER BY id DESC LIMIT 1`,
      [id]
    ) as any[];
    if (conditionsList.length > 0) conditions = conditionsList[0];

    return NextResponse.json({
      success: true,
      contrat: {
        ...contrat,
        bien,
        lot,
        locataire,
        conditions
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET contrat:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Modifier un contrat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('📦 Mise à jour contrat ID:', id);
    console.log('📦 Données reçues:', body);

    const {
      type_contrat,
      date_debut,
      date_fin,
      date_signature,
      date_etat_lieux_entree,
      date_etat_lieux_sortie,
      loyer_mensuel,
      charges_mensuelles,
      depot_garantie,
      prix_vente,
      clause_particuliere,
      statut,
      statut_validation
    } = body;

    // Validation des données
    if (!type_contrat || !date_debut) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    // Préparer les valeurs financières
    let loyerValue = 0;
    let chargesValue = 0;
    let depotValue = null;
    let prixVenteValue = null;

    if (type_contrat === 'VENTE') {
      prixVenteValue = prix_vente ? parseFloat(prix_vente) : null;
      if (!prixVenteValue || prixVenteValue <= 0) {
        return NextResponse.json(
          { success: false, erreur: 'Prix de vente invalide' },
          { status: 400 }
        );
      }
    } else {
      loyerValue = loyer_mensuel ? parseFloat(loyer_mensuel) : 0;
      if (loyerValue <= 0) {
        return NextResponse.json(
          { success: false, erreur: 'Loyer mensuel invalide' },
          { status: 400 }
        );
      }
      chargesValue = charges_mensuelles ? parseFloat(charges_mensuelles) : 0;
      depotValue = depot_garantie ? parseFloat(depot_garantie) : null;
    }

    // Mettre à jour le contrat
    const result = await queryInsert(
      `UPDATE contrats SET
        type_contrat = ?,
        date_debut = ?,
        date_fin = ?,
        date_signature = ?,
        date_etat_lieux_entree = ?,
        date_etat_lieux_sortie = ?,
        loyer_mensuel = ?,
        charges_mensuelles = ?,
        depot_garantie = ?,
        prix_vente = ?,
        clause_particuliere = ?,
        statut = ?,
        statut_validation = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        type_contrat,
        date_debut,
        date_fin || null,
        date_signature || null,
        date_etat_lieux_entree || null,
        date_etat_lieux_sortie || null,
        loyerValue,
        chargesValue,
        depotValue,
        prixVenteValue,
        clause_particuliere || null,
        statut || 'ACTIF',
        statut_validation || 'VALIDE',
        id
      ]
    );

    if (!result.success) {
      console.error('❌ Échec de la mise à jour:', result);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    console.log('✅ Contrat mis à jour avec succès');

    return NextResponse.json({
      success: true,
      message: 'Contrat modifié avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur PUT contrat:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un contrat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('🗑️ Suppression du contrat ID:', id);

    // Récupérer les informations du contrat
    const contrat = await queryRows(
      'SELECT bien_id, lot_id, statut, statut_validation FROM contrats WHERE id = ?',
      [id]
    ) as any[];

    if (contrat.length > 0) {
      const bien_id = contrat[0].bien_id;
      const lot_id = contrat[0].lot_id;
      const estValide = contrat[0].statut_validation === 'VALIDE';
      
      // Si le contrat était validé, remettre le bien/lot en disponible
      if (estValide) {
        if (lot_id) {
          await queryInsert(
            'UPDATE lots SET statut = ? WHERE id = ?',
            ['DISPONIBLE', lot_id]
          );
          console.log(`✅ Lot ${lot_id} remis en disponible`);
        } else if (bien_id) {
          await queryInsert(
            'UPDATE biens SET statut = ? WHERE id = ?',
            ['DISPONIBLE', bien_id]
          );
          console.log(`✅ Bien ${bien_id} remis en disponible`);
        }
      }
    }

    // Supprimer les conditions de location associées
    await queryInsert('DELETE FROM conditions_location WHERE contrat_id = ?', [id]);
    
    // Supprimer les paiements associés
    await queryInsert('DELETE FROM paiements WHERE contrat_id = ?', [id]);
    
    // Supprimer les périodes de location associées
    await queryInsert('DELETE FROM periodes_location WHERE contrat_id = ?', [id]);
    
    // Supprimer les avances associées
    await queryInsert('DELETE FROM avances_location WHERE contrat_id = ?', [id]);
    
    // Supprimer le contrat
    await queryInsert('DELETE FROM contrats WHERE id = ?', [id]);
    
    console.log('✅ Contrat supprimé de la base de données');

    return NextResponse.json({
      success: true,
      message: 'Contrat supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur DELETE contrat:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

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
    console.log('📦 Caution:', caution);
    console.log('📦 Nombre mois avance:', nombre_mois_avance);
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
          erreur: `Les paiements (${totalPaiements.toLocaleString()} FCFA) ne couvrent pas le total requis (${totalAPayer.toLocaleString()} FCFA)`,
          details: { total_requis: totalAPayer, total_paye: totalPaiements }
        },
        { status: 400 }
      );
    }

    // 1. Créer les conditions de location
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

    // 2. Enregistrer les paiements initiaux
    for (const paiement of paiements) {
      const montant = parseFloat(paiement.montant) || 0;
      const typePaiement = paiement.type;
      const modePaiement = paiement.mode || 'ESPECES';
      
      console.log(`💾 Enregistrement paiement: type=${typePaiement}, montant=${montant}, mode=${modePaiement}`);
      
      const datePaiement = new Date();
      const annee = datePaiement.getFullYear();
      const mois = String(datePaiement.getMonth() + 1).padStart(2, '0');
      
      let compteur = await queryRows(
        'SELECT valeur FROM compteurs WHERE type = ? AND annee = ? AND mois = ?',
        ['QUITTANCE', annee, parseInt(mois)]
      ) as any[];

      let compteurValeur;
      if (compteur.length === 0) {
        compteurValeur = 1;
        await queryInsert(
          'INSERT INTO compteurs (type, valeur, annee, mois) VALUES (?, ?, ?, ?)',
          ['QUITTANCE', 1, annee, parseInt(mois)]
        );
      } else {
        compteurValeur = compteur[0].valeur + 1;
        await queryInsert(
          'UPDATE compteurs SET valeur = ? WHERE type = ? AND annee = ? AND mois = ?',
          [compteurValeur, 'QUITTANCE', annee, parseInt(mois)]
        );
      }
      
      const numeroQuittance = `QUIT-${annee}-${mois}-${String(compteurValeur).padStart(6, '0')}`;
      
      await queryInsert(
        `INSERT INTO paiements (
          contrat_id, conditions_location_id, locataire_id, bien_id, montant, 
          type_paiement, est_paiement_initial, date_paiement, mode_paiement, 
          numero_quittance, statut, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), ?, ?, 'VALIDE', NOW())`,
        [
          parseInt(id),
          conditionsId,
          contratData.locataire_id,
          contratData.bien_id,
          montant,
          typePaiement,
          modePaiement,
          numeroQuittance
        ]
      );
    }

    // 3. Valider le contrat
    await queryInsert(
      `UPDATE contrats SET 
        statut_validation = ?,
        date_validation = NOW(),
        statut = ?,
        valide_par = ?
       WHERE id = ?`,
      ['VALIDE', 'ACTIF', valide_par || 1, id]
    );
    console.log('✅ Contrat validé');

    // 4. Mettre à jour le statut du bien/lot en "LOUE"
    if (contratData.lot_id) {
      await queryInsert('UPDATE lots SET statut = ? WHERE id = ?', ['LOUE', contratData.lot_id]);
      console.log(`✅ Lot ${contratData.lot_id} passé en statut "LOUE"`);
    } else if (contratData.bien_id) {
      await queryInsert('UPDATE biens SET statut = ? WHERE id = ?', ['LOUE', contratData.bien_id]);
      console.log(`✅ Bien ${contratData.bien_id} passé en statut "LOUE"`);
    }

    // 5. Mettre à jour le locataire avec le bien/lot
    if (contratData.lot_id) {
      await queryInsert(
        'UPDATE locataires SET bien_id = ?, lot_id = ?, actif = 1 WHERE id = ?',
        [contratData.bien_id, contratData.lot_id, contratData.locataire_id]
      );
      console.log(`✅ Locataire ${contratData.locataire_id} mis à jour avec lot ${contratData.lot_id}`);
    } else if (contratData.bien_id) {
      await queryInsert(
        'UPDATE locataires SET bien_id = ?, lot_id = NULL, actif = 1 WHERE id = ?',
        [contratData.bien_id, contratData.locataire_id]
      );
      console.log(`✅ Locataire ${contratData.locataire_id} mis à jour avec bien ${contratData.bien_id}`);
    }

    // 6. Mettre à jour la réservation associée
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
        nombre_mois_avance: nombreMoisAvance,
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