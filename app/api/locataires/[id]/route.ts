import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un locataire
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const locataires = await queryRows(
      `SELECT l.* FROM locataires l WHERE l.id = ?`,
      [id]
    ) as any[];

    if (locataires.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Locataire non trouvé' },
        { status: 404 }
      );
    }

    const locataire = locataires[0];
    
    // Récupérer le bien actuel
    if (locataire.bien_id) {
      const biens = await queryRows(
        `SELECT id, nom, adresse, type_bien, loyer_mensuel, charges, statut, 
                prix_vente, surface, pieces, commune, quartier, ville, district
         FROM biens WHERE id = ?`,
        [locataire.bien_id]
      ) as any[];
      
      if (biens.length > 0) {
        locataire.bien_actuel = biens[0];
      } else {
        locataire.bien_actuel = null;
      }
    } else {
      locataire.bien_actuel = null;
    }

    // Récupérer le lot actuel
    if (locataire.lot_id) {
      const lots = await queryRows(
        `SELECT 
          lt.id, lt.numero_lot, lt.etage, lt.type_lot, lt.nom, 
          lt.surface, lt.pieces, lt.loyer_mensuel, lt.charges, lt.statut,
          b.id as immeuble_id, b.nom as immeuble_nom, b.type_bien as immeuble_type,
          b.adresse as immeuble_adresse, b.commune as immeuble_commune, b.ville as immeuble_ville
         FROM lots lt
         LEFT JOIN biens b ON lt.bien_principal_id = b.id
         WHERE lt.id = ?`,
        [locataire.lot_id]
      ) as any[];
      
      if (lots.length > 0) {
        const lot = lots[0];
        locataire.lot_actuel = {
          id: lot.id,
          numero_lot: lot.numero_lot,
          etage: lot.etage,
          type_lot: lot.type_lot,
          nom: lot.nom,
          surface: lot.surface,
          pieces: lot.pieces,
          loyer_mensuel: lot.loyer_mensuel,
          charges: lot.charges,
          statut: lot.statut,
          immeuble: lot.immeuble_id ? {
            id: lot.immeuble_id,
            nom: lot.immeuble_nom,
            type_bien: lot.immeuble_type,
            adresse: lot.immeuble_adresse,
            commune: lot.immeuble_commune,
            ville: lot.immeuble_ville
          } : null
        };
      } else {
        locataire.lot_actuel = null;
      }
    } else {
      locataire.lot_actuel = null;
    }

    // ✅ CORRECTION: Récupérer TOUS les contrats (BAIL_VIDE, VENTE, etc.)
    const contrats = await queryRows(
      `SELECT 
        c.id,
        c.numero_contrat,
        c.type_contrat,
        c.prix_vente,
        c.date_debut,
        c.date_fin,
        c.statut,
        c.statut_validation,
        c.loyer_mensuel,
        c.charges_mensuelles,
        c.depot_garantie,
        c.clause_particuliere,
        c.bien_id,
        c.lot_id,
        c.mode_vente,
        c.nombre_versements,
        c.acompte,
        c.montant_versement
       FROM contrats c
       WHERE c.locataire_id = ?
       ORDER BY c.created_at DESC`,
      [id]
    ) as any[];

    // Récupérer les informations des biens pour chaque contrat
    const contratsAvecDetails = await Promise.all(contrats.map(async (contrat) => {
      let bien = null;
      let lot = null;
      
      // Récupérer le bien
      if (contrat.bien_id) {
        const biens = await queryRows(
          `SELECT id, nom, adresse, commune, ville, loyer_mensuel, charges, surface, pieces, prix_vente, statut
           FROM biens WHERE id = ?`,
          [contrat.bien_id]
        ) as any[];
        if (biens.length > 0) bien = biens[0];
      }
      
      // Récupérer le lot si présent
      if (contrat.lot_id) {
        const lots = await queryRows(
          `SELECT id, numero_lot, type_lot, surface, loyer_mensuel, charges
           FROM lots WHERE id = ?`,
          [contrat.lot_id]
        ) as any[];
        if (lots.length > 0) lot = lots[0];
      }
      
      return {
        ...contrat,
        bien,
        lot
      };
    }));

    locataire.contrats = contratsAvecDetails;
    
    // Récupérer les paiements
    const paiements = await queryRows(
      `SELECT p.*,
        c.numero_contrat as contrat_numero
       FROM paiements p
       LEFT JOIN contrats c ON p.contrat_id = c.id
       WHERE p.locataire_id = ?
       ORDER BY p.date_paiement DESC`,
      [id]
    ) as any[];
    
    locataire.paiements = paiements;
    
    // Déterminer le statut
    locataire.statut = locataire.actif ? 'ACTIF' : (locataire.bien_id || locataire.lot_id ? 'INACTIF' : 'PROSPECT');
    
    console.log(`📦 Locataire ${id} chargé avec ${contratsAvecDetails.length} contrat(s)`);
    
    return NextResponse.json({
      success: true,
      locataire
    });
  } catch (error) {
    console.error('❌ Erreur GET locataire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
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
      statut, notes, bien_id, lot_id
    } = body;

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

    const actif = statut === 'ACTIF' ? 1 : 0;

    await queryInsert(
      `UPDATE locataires SET
        nom = ?, prenom = ?, email = ?, telephone = ?, telephone_secondaire = ?,
        date_naissance = ?, lieu_naissance = ?, nationalite = ?,
        profession = ?, employeur = ?, revenus_mensuels = ?,
        actif = ?, notes = ?, bien_id = ?, lot_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        nom, prenom, email, telephone, telephone_secondaire || null,
        date_naissance || null, lieu_naissance || null, nationalite || null,
        profession || null, employeur || null, revenus_mensuels || null,
        actif, notes || null, bien_id || null, lot_id || null, id
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

    const locataire = await queryRows(
      'SELECT lot_id, bien_id FROM locataires WHERE id = ?',
      [id]
    ) as any[];

    const contratsActifs = await queryRows(
      `SELECT id FROM contrats WHERE locataire_id = ? AND statut_validation = 'VALIDE'`,
      [id]
    ) as any[];

    if (contratsActifs.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Impossible de supprimer un locataire avec des contrats validés' },
        { status: 400 }
      );
    }

    if (locataire[0]?.lot_id) {
      await queryInsert(
        'UPDATE lots SET statut = ? WHERE id = ?',
        ['DISPONIBLE', locataire[0].lot_id]
      );
    }

    if (locataire[0]?.bien_id && !locataire[0]?.lot_id) {
      await queryInsert(
        'UPDATE biens SET statut = ? WHERE id = ?',
        ['DISPONIBLE', locataire[0].bien_id]
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