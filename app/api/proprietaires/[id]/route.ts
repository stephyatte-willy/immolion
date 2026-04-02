import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un propriétaire
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const proprietaires = await queryRows(
      `SELECT p.*,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', b.id, 'nom', b.nom, 'type_bien', b.type_bien, 
                      'statut', b.statut, 'adresse', b.adresse, 'ville', b.ville,
                      'loyer_mensuel', b.loyer_mensuel, 'prix_vente', b.prix_vente,
                      'locataire_actuel', (
                        SELECT JSON_OBJECT('id', l.id, 'nom', l.nom, 'prenom', l.prenom)
                        FROM locataires l WHERE l.bien_id = b.id AND l.actif = 1 LIMIT 1
                      ))
        ) FROM biens b WHERE b.proprietaire_id = p.id) as biens
       FROM proprietaires p
       WHERE p.id = ?`,
      [id]
    ) as any[];

    if (proprietaires.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Propriétaire non trouvé' },
        { status: 404 }
      );
    }

    const proprietaire = proprietaires[0];
    
    // ✅ CORRECTION: Vérifier le type de bien avant de parser
    let biens = proprietaire.biens;
    if (typeof biens === 'string') {
      try {
        biens = JSON.parse(biens);
      } catch (e) {
        biens = [];
      }
    }
    if (!Array.isArray(biens)) {
      biens = [];
    }
    proprietaire.biens = biens;

    return NextResponse.json({
      success: true,
      proprietaire
    });
  } catch (error) {
    console.error('❌ Erreur GET proprietaire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un propriétaire
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      nom, prenom, email, telephone, telephone_secondaire,
      adresse, ville, pays, type, num_identite,
      date_naissance, profession, notes, actif,
      biens_ids
    } = body;

    // Vérifier si l'email existe déjà pour un autre propriétaire
    if (email) {
      const existing = await queryRows(
        'SELECT id FROM proprietaires WHERE email = ? AND id != ?',
        [email, id]
      ) as any[];

      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, erreur: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le propriétaire
    await queryInsert(
      `UPDATE proprietaires SET
        nom = ?, prenom = ?, email = ?, telephone = ?, telephone_secondaire = ?,
        adresse = ?, ville = ?, pays = ?, type = ?, num_identite = ?,
        date_naissance = ?, profession = ?, notes = ?, actif = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        nom, prenom, email, telephone || null, telephone_secondaire || null,
        adresse || null, ville || null, pays || 'Côte d\'Ivoire',
        type || 'PARTICULIER', num_identite || null,
        date_naissance || null, profession || null, notes || null,
        actif !== undefined ? (actif ? 1 : 0) : 1,
        id
      ]
    );

    // Mettre à jour les biens associés
    // D'abord, retirer les liens existants
    await queryInsert(
      'UPDATE biens SET proprietaire_id = NULL WHERE proprietaire_id = ?',
      [id]
    );

    // Puis ajouter les nouveaux liens
    if (biens_ids && biens_ids.length > 0) {
      for (const bienId of biens_ids) {
        await queryInsert(
          'UPDATE biens SET proprietaire_id = ? WHERE id = ?',
          [id, bienId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Propriétaire modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur PUT proprietaire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un propriétaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si le propriétaire a des biens
    const biens = await queryRows(
      'SELECT id FROM biens WHERE proprietaire_id = ?',
      [id]
    ) as any[];

    if (biens.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Impossible de supprimer un propriétaire qui possède des biens' },
        { status: 400 }
      );
    }

    await queryInsert('DELETE FROM proprietaires WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Propriétaire supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE proprietaire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}