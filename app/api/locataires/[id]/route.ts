import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un locataire
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Version simplifiée et corrigée
    const locataires = await queryRows(
      `SELECT l.*,
        (SELECT JSON_OBJECT(
          'id', b.id,
          'nom', b.nom,
          'adresse', b.adresse,
          'loyer_mensuel', b.loyer_mensuel,
          'charges', b.charges,
          'statut', b.statut,
          'prix_vente', b.prix_vente,
          'commune', b.commune,
          'quartier', b.quartier,
          'ville', b.ville,
          'district', b.district
        ) FROM biens b WHERE b.id = l.bien_id) as bien_actuel
       FROM locataires l
       WHERE l.id = ?`,
      [id]
    ) as any[];

    if (locataires.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Locataire non trouvé' },
        { status: 404 }
      );
    }

    const locataire = locataires[0];

    // Récupérer les contrats séparément (plus simple)
    const contrats = await queryRows(
      `SELECT 
        c.id,
        c.numero_contrat,
        c.type_contrat,
        c.prix_vente,
        c.date_debut,
        c.date_fin,
        c.statut,
        c.loyer_mensuel,
        c.charges_mensuelles,
        c.depot_garantie,
        c.clause_particuliere,
        JSON_OBJECT(
          'id', b.id,
          'nom', b.nom,
          'adresse', b.adresse,
          'prix_vente', b.prix_vente,
          'loyer_mensuel', b.loyer_mensuel,
          'commune', b.commune,
          'ville', b.ville
        ) as bien
       FROM contrats c
       LEFT JOIN biens b ON c.bien_id = b.id
       WHERE c.locataire_id = ?
       ORDER BY c.date_debut DESC`,
      [id]
    ) as any[];

    // Parser les JSON
    try {
      locataire.bien_actuel = locataire.bien_actuel ? 
        (typeof locataire.bien_actuel === 'string' ? JSON.parse(locataire.bien_actuel) : locataire.bien_actuel) 
        : null;
      
      // Parser chaque contrat
      locataire.contrats = contrats.map((c: any) => ({
        ...c,
        bien: c.bien ? (typeof c.bien === 'string' ? JSON.parse(c.bien) : c.bien) : null
      }));
      
      // Convertir actif en statut
      locataire.statut = locataire.actif ? 'ACTIF' : (locataire.bien_id ? 'INACTIF' : 'PROSPECT');
    } catch (e) {
      console.error('❌ Erreur parsing JSON:', e);
      locataire.contrats = [];
    }

    return NextResponse.json({
      success: true,
      locataire
    });
  } catch (error) {
    console.error('❌ Erreur GET locataire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un locataire
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

    // Vérifier si l'email existe déjà pour un autre locataire
    if (email) {
      const existing = await queryRows(
        'SELECT id FROM locataires WHERE email = ? AND id != ?',
        [email, id]
      ) as any[];

      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, erreur: 'Un locataire avec cet email existe déjà' },
          { status: 400 }
        );
      }
    }

    // Déterminer actif en fonction du statut
    const actif = statut === 'ACTIF' ? 1 : 0;

    // Mettre à jour le locataire
    await queryInsert(
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

    return NextResponse.json({
      success: true,
      message: 'Locataire modifié avec succès'
    });
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