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
    
    // Récupérer le bien actuel séparément
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

    // Récupérer le lot actuel avec son immeuble
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

    // Récupérer les contrats
    const contrats = await queryRows(
      `SELECT 
        c.id,
        c.numero_contrat,
        c.type_contrat,
        c.prix_vente,
        c.date_debut,
        c.date_fin,
        c.statut_validation,
        c.loyer_mensuel,
        c.charges_mensuelles,
        c.depot_garantie,
        c.clause_particuliere,
        c.bien_id,
        c.lot_id
       FROM contrats c
       WHERE c.locataire_id = ?
       ORDER BY c.date_debut DESC`,
      [id]
    ) as any[];

    // Récupérer les informations des biens pour chaque contrat
    const contratsAvecBien = await Promise.all(contrats.map(async (contrat) => {
      let bien = null;
      let lot = null;
      
      if (contrat.lot_id) {
        const lots = await queryRows(
          `SELECT id, numero_lot, type_lot, surface, loyer_mensuel, charges
           FROM lots WHERE id = ?`,
          [contrat.lot_id]
        ) as any[];
        if (lots.length > 0) lot = lots[0];
        
        if (contrat.bien_id) {
          const biens = await queryRows(
            `SELECT id, nom, adresse, commune, ville FROM biens WHERE id = ?`,
            [contrat.bien_id]
          ) as any[];
          if (biens.length > 0) bien = biens[0];
        }
      } else if (contrat.bien_id) {
        const biens = await queryRows(
          `SELECT id, nom, adresse, commune, ville, loyer_mensuel, charges, surface, pieces
           FROM biens WHERE id = ?`,
          [contrat.bien_id]
        ) as any[];
        if (biens.length > 0) bien = biens[0];
      }
      
      return {
        ...contrat,
        bien,
        lot
      };
    }));

    locataire.contrats = contratsAvecBien;
    
    // Déterminer le statut
    locataire.statut = locataire.actif ? 'ACTIF' : (locataire.bien_id || locataire.lot_id ? 'INACTIF' : 'PROSPECT');
    
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

    // Vérifier si l'email existe déjà
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
// DELETE - Supprimer un locataire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer le lot associé
    const locataire = await queryRows(
      'SELECT lot_id FROM locataires WHERE id = ?',
      [id]
    ) as any[];

    // ✅ CORRECTION: Utiliser des guillemets simples pour les chaînes en SQL
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

    // Remettre le lot en disponible
    if (locataire[0]?.lot_id) {
      await queryInsert(
        'UPDATE lots SET statut = "DISPONIBLE" WHERE id = ?',
        [locataire[0].lot_id]
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