import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer les réservations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locataire_id = searchParams.get('locataire_id');
    const bien_id = searchParams.get('bien_id');
    const lot_id = searchParams.get('lot_id');
    const statut = searchParams.get('statut');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (locataire_id) {
      whereClause += ' AND r.locataire_id = ?';
      params.push(locataire_id);
    }

    if (bien_id) {
      whereClause += ' AND r.bien_id = ?';
      params.push(bien_id);
    }

    if (lot_id) {
      whereClause += ' AND r.lot_id = ?';
      params.push(lot_id);
    }

    if (statut) {
      whereClause += ' AND r.statut = ?';
      params.push(statut);
    }

    console.log('🔍 Requête réservations:', { whereClause, params });

    const reservations = await queryRows(
      `SELECT r.*,
        (SELECT JSON_OBJECT('id', b.id, 'nom', b.nom, 'adresse', b.adresse, 'type_bien', b.type_bien) 
         FROM biens b WHERE b.id = r.bien_id) as bien,
        (SELECT JSON_OBJECT('id', l.id, 'numero_lot', l.numero_lot, 'type_lot', l.type_lot, 'surface', l.surface) 
         FROM lots l WHERE l.id = r.lot_id) as lot,
        (SELECT JSON_OBJECT('id', loc.id, 'nom', loc.nom, 'prenom', loc.prenom, 'email', loc.email) 
         FROM locataires loc WHERE loc.id = r.locataire_id) as locataire,
        (SELECT JSON_OBJECT('id', c.id, 'numero_contrat', c.numero_contrat, 'statut', c.statut) 
         FROM contrats c WHERE c.id = r.contrat_id) as contrat
       FROM reservations r
       ${whereClause}
       ORDER BY r.date_reservation DESC`,
      params
    ) as any[];

    const reservationsFormatted = reservations.map(r => ({
      ...r,
      bien: r.bien ? (typeof r.bien === 'string' ? JSON.parse(r.bien) : r.bien) : null,
      lot: r.lot ? (typeof r.lot === 'string' ? JSON.parse(r.lot) : r.lot) : null,
      locataire: r.locataire ? (typeof r.locataire === 'string' ? JSON.parse(r.locataire) : r.locataire) : null,
      contrat: r.contrat ? (typeof r.contrat === 'string' ? JSON.parse(r.contrat) : r.contrat) : null
    }));

    return NextResponse.json({
      success: true,
      reservations: reservationsFormatted
    });
  } catch (error) {
    console.error('❌ Erreur GET réservations:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur', reservations: [] },
      { status: 500 }
    );
  }
}

// POST - Créer une réservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bien_id, lot_id, locataire_id, duree_reservation_jours = 7 } = body;

    console.log('📦 Création réservation:', { bien_id, lot_id, locataire_id });

    // Validation
    if (!locataire_id) {
      return NextResponse.json(
        { success: false, erreur: 'Le locataire est requis' },
        { status: 400 }
      );
    }

    if (!bien_id && !lot_id) {
      return NextResponse.json(
        { success: false, erreur: 'Un bien ou un lot est requis' },
        { status: 400 }
      );
    }

    // Vérifier si le bien/lot est déjà réservé ou loué
    if (lot_id) {
      const lot = await queryRows(
        'SELECT statut FROM lots WHERE id = ?',
        [lot_id]
      ) as any[];
      
      if (lot.length > 0) {
        if (lot[0].statut === 'LOUE') {
          return NextResponse.json(
            { success: false, erreur: 'Ce lot est déjà loué' },
            { status: 400 }
          );
        }
        if (lot[0].statut === 'RESERVE') {
          return NextResponse.json(
            { success: false, erreur: 'Ce lot est déjà réservé' },
            { status: 400 }
          );
        }
      }
    } else if (bien_id) {
      const bien = await queryRows(
        'SELECT statut FROM biens WHERE id = ?',
        [bien_id]
      ) as any[];
      
      if (bien.length > 0) {
        if (bien[0].statut === 'LOUE') {
          return NextResponse.json(
            { success: false, erreur: 'Ce bien est déjà loué' },
            { status: 400 }
          );
        }
        if (bien[0].statut === 'RESERVE') {
          return NextResponse.json(
            { success: false, erreur: 'Ce bien est déjà réservé' },
            { status: 400 }
          );
        }
      }
    }

    // Vérifier si le lot n'est pas déjà attribué à un autre locataire
    if (lot_id) {
      const existingLocataire = await queryRows(
        'SELECT id, nom, prenom FROM locataires WHERE lot_id = ? AND id != ?',
        [lot_id, locataire_id]
      ) as any[];
      
      if (existingLocataire.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            erreur: `Ce lot est déjà attribué à ${existingLocataire[0].prenom} ${existingLocataire[0].nom}` 
          },
          { status: 400 }
        );
      }
    }

    // Vérifier les réservations actives existantes pour ce locataire
    const existingReservations = await queryRows(
      `SELECT id FROM reservations 
       WHERE locataire_id = ? AND statut = 'ACTIVE'`,
      [locataire_id]
    ) as any[];

    if (existingReservations.length >= 3) {
      return NextResponse.json(
        { success: false, erreur: 'Ce locataire a déjà 3 réservations actives' },
        { status: 400 }
      );
    }

    // Calculer la date d'expiration
    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + duree_reservation_jours);

    // Créer la réservation
    const result = await queryInsert(
      `INSERT INTO reservations (
        bien_id, lot_id, locataire_id, date_expiration, statut, created_at
      ) VALUES (?, ?, ?, ?, 'ACTIVE', NOW())`,
      [
        bien_id || null,
        lot_id || null,
        parseInt(locataire_id),
        dateExpiration.toISOString().split('T')[0]
      ]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      );
    }

    // Mettre à jour le statut du bien/lot en "RESERVE"
    if (lot_id) {
      await queryInsert(
        'UPDATE lots SET statut = ? WHERE id = ?',
        ['RESERVE', lot_id]
      );
      console.log(`✅ Lot ${lot_id} passé en statut "RESERVE"`);
    } else if (bien_id) {
      await queryInsert(
        'UPDATE biens SET statut = ? WHERE id = ?',
        ['RESERVE', bien_id]
      );
      console.log(`✅ Bien ${bien_id} passé en statut "RESERVE"`);
    }

    // Mettre à jour le locataire avec le lot attribué
    if (lot_id) {
      await queryInsert(
        'UPDATE locataires SET lot_id = ?, bien_id = ? WHERE id = ?',
        [lot_id, bien_id || null, locataire_id]
      );
    } else if (bien_id) {
      await queryInsert(
        'UPDATE locataires SET bien_id = ?, lot_id = NULL WHERE id = ?',
        [bien_id, locataire_id]
      );
    }

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Réservation créée avec succès',
      date_expiration: dateExpiration
    });
  } catch (error: any) {
    console.error('❌ Erreur POST réservation:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une réservation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, erreur: 'ID de réservation requis' },
        { status: 400 }
      );
    }

    // Récupérer la réservation
    const reservation = await queryRows(
      'SELECT bien_id, lot_id FROM reservations WHERE id = ?',
      [id]
    ) as any[];

    if (reservation.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // Annuler la réservation
    await queryInsert(
      'UPDATE reservations SET statut = ? WHERE id = ?',
      ['ANNULEE', id]
    );

    // Remettre le bien/lot en disponible
    if (reservation[0].lot_id) {
      await queryInsert('UPDATE lots SET statut = ? WHERE id = ?', ['DISPONIBLE', reservation[0].lot_id]);
    } else if (reservation[0].bien_id) {
      await queryInsert('UPDATE biens SET statut = ? WHERE id = ?', ['DISPONIBLE', reservation[0].bien_id]);
    }

    return NextResponse.json({
      success: true,
      message: 'Réservation annulée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE réservation:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// OPTIONS - Gérer les requêtes CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Allow': 'GET, POST, DELETE, OPTIONS',
      },
    }
  );
}