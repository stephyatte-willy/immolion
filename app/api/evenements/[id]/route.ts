import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un événement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
       WHERE e.id = ?`,
      [id]
    ) as any[];

    if (evenements.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      evenement: evenements[0]
    });
  } catch (error) {
    console.error('❌ Erreur GET evenement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un événement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('📦 Données reçues pour modification:', body);

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
      recurrence_fin
    } = body;

    // ✅ Formater les dates pour MySQL
    const formaterDatePourMySQL = (dateStr: string | null | undefined): string | null => {
      if (!dateStr || dateStr === 'undefined' || dateStr === 'null') return null;
      try {
        // Si la date est au format datetime-local (YYYY-MM-DDTHH:mm)
        if (dateStr.includes('T')) {
          return dateStr.replace('T', ' ') + ':00';
        }
        return dateStr;
      } catch {
        return null;
      }
    };

    const dateDebutMySQL = formaterDatePourMySQL(date_debut);
    const dateFinMySQL = formaterDatePourMySQL(date_fin);
    const dateRappelMySQL = formaterDatePourMySQL(date_rappel);

    console.log('📅 Dates formatées pour MySQL:', {
      date_debut: dateDebutMySQL,
      date_fin: dateFinMySQL,
      date_rappel: dateRappelMySQL
    });

    if (!titre || !type_evenement || !dateDebutMySQL) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    await queryInsert(
      `UPDATE evenements SET
        titre = ?,
        description = ?,
        type_evenement = ?,
        date_debut = ?,
        date_fin = ?,
        date_rappel = ?,
        statut = ?,
        bien_id = ?,
        locataire_id = ?,
        contrat_id = ?,
        lieu = ?,
        couleur = ?,
        recurrence = ?,
        recurrence_fin = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        titre,
        description || null,
        type_evenement,
        dateDebutMySQL,
        dateFinMySQL,
        dateRappelMySQL,
        statut,
        bien_id || null,
        locataire_id || null,
        contrat_id || null,
        lieu || null,
        couleur || null,
        recurrence || 'UNIQUE',
        recurrence_fin || null,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Événement modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur PUT evenement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un événement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await queryInsert('DELETE FROM evenements WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE evenement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}