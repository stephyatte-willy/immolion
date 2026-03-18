import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un paiement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const paiements = await queryRows(
      `SELECT p.*,
        c.numero_contrat,
        b.nom as bien_nom,
        l.nom as locataire_nom,
        l.prenom as locataire_prenom
       FROM paiements p
       LEFT JOIN contrats c ON p.contrat_id = c.id
       LEFT JOIN biens b ON p.bien_id = b.id
       LEFT JOIN locataires l ON p.locataire_id = l.id
       WHERE p.id = ?`,
      [id]
    ) as any[];

    if (paiements.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Paiement non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paiement: paiements[0]
    });
  } catch (error) {
    console.error('❌ Erreur GET paiement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un paiement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      montant,
      date_paiement,
      date_echeance,
      mode_paiement,
      reference,
      statut,
      mois_concerne,
      penalite,
      commentaire
    } = body;

    await queryInsert(
      `UPDATE paiements SET
        montant = ?,
        date_paiement = ?,
        date_echeance = ?,
        mode_paiement = ?,
        reference = ?,
        statut = ?,
        mois_concerne = ?,
        penalite = ?,
        commentaire = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        parseFloat(montant),
        date_paiement,
        date_echeance || null,
        mode_paiement,
        reference || null,
        statut,
        mois_concerne || null,
        penalite ? parseFloat(penalite) : 0,
        commentaire || null,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Paiement modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur PUT paiement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un paiement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await queryInsert('DELETE FROM paiements WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Paiement supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE paiement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}