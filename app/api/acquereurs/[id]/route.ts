import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un acquéreur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const acquereurs = await queryRows(
      `SELECT a.* FROM acquereurs a WHERE a.id = ?`,
      [id]
    ) as any[];

    if (acquereurs.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Acquéreur non trouvé' },
        { status: 404 }
      );
    }

    const acquereur = acquereurs[0];

    // Récupérer les contrats de vente
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
        JSON_OBJECT(
          'id', b.id,
          'nom', b.nom,
          'adresse', b.adresse,
          'prix_vente', b.prix_vente,
          'commune', b.commune,
          'ville', b.ville
        ) as bien
       FROM contrats c
       LEFT JOIN biens b ON c.bien_id = b.id
       WHERE c.acquereur_id = ?
       ORDER BY c.date_debut DESC`,
      [id]
    ) as any[];

    // Récupérer les paiements
    const paiements = await queryRows(
      `SELECT p.*,
        c.numero_contrat,
        b.nom as bien_nom
       FROM paiements p
       LEFT JOIN contrats c ON p.contrat_id = c.id
       LEFT JOIN biens b ON p.bien_id = b.id
       WHERE p.acquereur_id = ?
       ORDER BY p.date_paiement DESC`,
      [id]
    ) as any[];

    try {
      acquereur.contrats = contrats.map((c: any) => ({
        ...c,
        bien: c.bien ? (typeof c.bien === 'string' ? JSON.parse(c.bien) : c.bien) : null
      }));
      acquereur.paiements = paiements;
    } catch (e) {
      console.error('❌ Erreur parsing JSON:', e);
      acquereur.contrats = [];
      acquereur.paiements = [];
    }

    return NextResponse.json({
      success: true,
      acquereur
    });
  } catch (error) {
    console.error('❌ Erreur GET acquereur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Modifier un acquéreur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('📦 Mise à jour acquéreur ID:', id);
    console.log('📦 Données reçues:', body);

    const {
      nom, prenom, email, telephone, telephone_secondaire,
      date_naissance, lieu_naissance, nationalite,
      profession, employeur, revenus_mensuels,
      type_acquereur, bien_id, raison_sociale, num_identite,
      adresse, ville, pays, notes, actif
    } = body;

    // Vérifier si l'email existe déjà
    if (email) {
      const existing = await queryRows(
        'SELECT id FROM acquereurs WHERE email = ? AND id != ?',
        [email, id]
      ) as any[];

      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, erreur: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    const isEntite = type_acquereur === 'SOCIETE' || type_acquereur === 'AGENCE';
    let nomFinal = '';
    let prenomFinal = '';
    
    if (isEntite) {
      nomFinal = raison_sociale;
      prenomFinal = '';
    } else {
      nomFinal = nom;
      prenomFinal = prenom;
    }

    // ✅ Mettre à jour l'acquéreur avec bien_id
    const result = await queryInsert(
      `UPDATE acquereurs SET
        nom = ?, prenom = ?, email = ?, telephone = ?, telephone_secondaire = ?,
        date_naissance = ?, lieu_naissance = ?, nationalite = ?,
        profession = ?, employeur = ?, revenus_mensuels = ?,
        type_acquereur = ?, bien_id = ?, raison_sociale = ?, num_identite = ?,
        adresse = ?, ville = ?, pays = ?, notes = ?, actif = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        nomFinal,
        prenomFinal,
        email,
        telephone || null,
        telephone_secondaire || null,
        date_naissance || null,
        lieu_naissance || null,
        nationalite || 'Ivoirienne',
        profession || null,
        employeur || null,
        revenus_mensuels || null,
        type_acquereur || 'PARTICULIER',
        bien_id || null, // ✅ Important: mettre à jour bien_id
        raison_sociale || null,
        num_identite || null,
        adresse || null,
        ville || null,
        pays || 'Côte d\'Ivoire',
        notes || null,
        actif !== undefined ? (actif ? 1 : 0) : 1,
        id
      ]
    );

    if (!result.success) {
      console.error('❌ Erreur mise à jour:', result);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    console.log('✅ Acquéreur mis à jour avec succès, bien_id:', bien_id);

    return NextResponse.json({
      success: true,
      message: 'Acquéreur modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur PUT acquereur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un acquéreur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si l'acquéreur a des contrats actifs
    const contrats = await queryRows(
      'SELECT id FROM contrats WHERE acquereur_id = ? AND statut = "ACTIF"',
      [id]
    ) as any[];

    if (contrats.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Impossible de supprimer un acquéreur avec des contrats actifs' },
        { status: 400 }
      );
    }

    await queryInsert('DELETE FROM acquereurs WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Acquéreur supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE acquereur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}