import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un locataire
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Récupérer les infos du locataire
    const locataires = await queryRows(
      `SELECT * FROM locataires WHERE id = ?`,
      [id]
    ) as any[];

    if (locataires.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Locataire non trouvé' },
        { status: 404 }
      );
    }

    const locataire = locataires[0];

    // 2. Récupérer le bien actuel séparément
    if (locataire.bien_id) {
      const biens = await queryRows(
        `SELECT id, nom, adresse, loyer_mensuel FROM biens WHERE id = ?`,
        [locataire.bien_id]
      ) as any[];
      locataire.bien_actuel = biens.length > 0 ? biens[0] : null;
    } else {
      locataire.bien_actuel = null;
    }

    // 3. Récupérer les contrats du locataire
    const contrats = await queryRows(
      `SELECT 
        c.id, c.numero_contrat, c.type_contrat, c.date_debut, c.date_fin,
        c.loyer_mensuel, c.charges_mensuelles, c.depot_garantie, c.statut,
        c.bien_id,
        b.nom as bien_nom
       FROM contrats c
       LEFT JOIN biens b ON c.bien_id = b.id
       WHERE c.locataire_id = ?
       ORDER BY c.date_debut DESC`,
      [id]
    ) as any[];

    console.log(`✅ ${contrats.length} contrats trouvés pour le locataire ${id}`);
    
    // 4. Récupérer les paiements
    const paiements = await queryRows(
      `SELECT * FROM paiements WHERE locataire_id = ? ORDER BY date_paiement DESC LIMIT 12`,
      [id]
    ) as any[];

    // 5. Convertir actif en statut
    locataire.statut = locataire.actif ? 'ACTIF' : (locataire.bien_id ? 'INACTIF' : 'PROSPECT');

    return NextResponse.json({
      success: true,
      locataire: {
        ...locataire,
        contrats: contrats || [],
        paiements: paiements || [],
        documents: [] // Pour l'instant
      }
    });

  } catch (error) {
    console.error('❌ Erreur GET locataire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// ✅ PUT - Modifier un locataire (AJOUTÉ)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      nom, prenom, email, telephone, telephone_secondaire,
      date_naissance, lieu_naissance, nationalite,
      profession, employeur, revenus_mensuels,
      statut, notes, bien_id
    } = body;

    // Vérifier si le locataire existe
    const existing = await queryRows(
      'SELECT id FROM locataires WHERE id = ?',
      [id]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Locataire non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'email existe déjà pour un autre locataire
    if (email) {
      const emailCheck = await queryRows(
        'SELECT id FROM locataires WHERE email = ? AND id != ?',
        [email, id]
      ) as any[];
      
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { success: false, erreur: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    // Déterminer actif en fonction du statut
    const actif = statut === 'ACTIF' ? 1 : 0;

    // Mettre à jour le locataire
    const result = await queryInsert(
      `UPDATE locataires SET
        nom = ?, prenom = ?, email = ?, telephone = ?, telephone_secondaire = ?,
        date_naissance = ?, lieu_naissance = ?, nationalite = ?,
        profession = ?, employeur = ?, revenus_mensuels = ?,
        actif = ?, notes = ?, bien_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        nom, prenom, email, telephone, telephone_secondaire || null,
        date_naissance || null, lieu_naissance || null, nationalite || null,
        profession || null, employeur || null, revenus_mensuels || null,
        actif, notes || null, bien_id || null, id
      ]
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Locataire modifié avec succès'
      });
    } else {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la modification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erreur PUT locataire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un locataire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si le locataire a des contrats actifs
    const contrats = await queryRows(
      'SELECT id FROM contrats WHERE locataire_id = ? AND statut = "ACTIF"',
      [id]
    ) as any[];

    if (contrats.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Impossible de supprimer un locataire avec des contrats actifs' },
        { status: 400 }
      );
    }

    await queryInsert('DELETE FROM locataires WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Locataire supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE locataire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}