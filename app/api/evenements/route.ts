import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des événements avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debut = searchParams.get('debut');
    const fin = searchParams.get('fin');
    const type = searchParams.get('type');
    const statut = searchParams.get('statut');
    const bien_id = searchParams.get('bien_id');
    const locataire_id = searchParams.get('locataire_id');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (debut && fin) {
      whereClause += ' AND e.date_debut BETWEEN ? AND ?';
      params.push(debut, fin);
    }

    if (type && type !== 'TOUS') {
      whereClause += ' AND e.type_evenement = ?';
      params.push(type);
    }

    // ✅ CORRECTION: Préciser la table pour la colonne statut
    if (statut && statut !== 'TOUS') {
      whereClause += ' AND e.statut = ?';
      params.push(statut);
    }

    if (bien_id) {
      whereClause += ' AND e.bien_id = ?';
      params.push(bien_id);
    }

    if (locataire_id) {
      whereClause += ' AND e.locataire_id = ?';
      params.push(locataire_id);
    }

    const evenements = await queryRows(
      `SELECT e.*,
        b.nom as bien_nom,
        l.nom as locataire_nom,
        l.prenom as locataire_prenom,
        c.numero_contrat as contrat_numero
       FROM evenements e
       LEFT JOIN biens b ON e.bien_id = b.id
       LEFT JOIN locataires l ON e.locataire_id = l.id
       LEFT JOIN contrats c ON e.contrat_id = c.id
       ${whereClause}
       ORDER BY e.date_debut ASC`,
      params
    ) as any[];

    return NextResponse.json({
      success: true,
      evenements
    });
  } catch (error) {
    console.error('❌ Erreur GET evenements:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un événement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      titre,
      description,
      type_evenement,
      date_debut,
      date_fin,
      date_rappel,
      statut,
      bien_id,
      locataire_id,
      contrat_id,
      lieu,
      couleur,
      recurrence,
      recurrence_fin,
      created_by
    } = body;

    if (!titre || !type_evenement || !date_debut) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    const result = await queryInsert(
      `INSERT INTO evenements (
        titre, description, type_evenement, date_debut, date_fin,
        date_rappel, statut, bien_id, locataire_id, contrat_id,
        lieu, couleur, recurrence, recurrence_fin, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        titre, description || null, type_evenement, date_debut, date_fin || null,
        date_rappel || null, statut || 'PREVU', bien_id || null, locataire_id || null,
        contrat_id || null, lieu || null, couleur || null, recurrence || 'UNIQUE',
        recurrence_fin || null, created_by || null
      ]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    // Si une date de rappel est définie, créer un rappel
    if (date_rappel) {
      await queryInsert(
        `INSERT INTO rappels (evenement_id, titre, date_rappel, type_rappel)
         VALUES (?, ?, ?, ?)`,
        [result.insertId, `Rappel: ${titre}`, date_rappel, 'EMAIL']
      );
    }

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Événement créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur POST evenement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}