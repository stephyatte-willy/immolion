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

    // 3. Récupérer les contrats du locataire - VERSION SIMPLIFIÉE
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