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
        c.type_contrat,
        c.prix_vente,
        c.loyer_mensuel,
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
      type_paiement,
      type_vente,
      montant,
      montant_total_vente,
      versement_numero,
      echeancier_id,
      date_paiement,
      date_echeance,
      mode_paiement,
      reference,
      statut,
      mois_concerne,
      penalite,
      commentaire
    } = body;

    console.log('📦 Mise à jour paiement ID:', id);

    // ✅ Récupérer le paiement existant pour connaître le contrat
    const paiementExistants = await queryRows(
      'SELECT contrat_id FROM paiements WHERE id = ?',
      [id]
    ) as any[];

    if (paiementExistants.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Paiement non trouvé' },
        { status: 404 }
      );
    }

    const contrat_id = paiementExistants[0].contrat_id;

    // ✅ Récupérer les informations du contrat
    const contrats = await queryRows(
      'SELECT type_contrat, prix_vente FROM contrats WHERE id = ?',
      [contrat_id]
    ) as any[];

    const isVente = contrats.length > 0 && contrats[0].type_contrat === 'VENTE';
    const montantSaisi = parseFloat(montant);

    // ✅ Validation spécifique pour les ventes (si le type change)
    if (isVente && type_vente) {
      // Calculer le total déjà versé (en excluant ce paiement)
      const totalVerse = await queryRows(
        `SELECT SUM(montant) as total FROM paiements 
         WHERE contrat_id = ? AND id != ? AND type_paiement IN ('ACOMPTE', 'VERSEMENT', 'SOLDE')`,
        [contrat_id, id]
      ) as any[];

      const totalDejaVerse = totalVerse[0]?.total || 0;
      const nouveauTotal = totalDejaVerse + montantSaisi;
      const prixVente = parseFloat(contrats[0].prix_vente || '0');

      if (type_vente === 'ACOMPTE') {
        if (montantSaisi > prixVente) {
          return NextResponse.json(
            { success: false, erreur: "L'acompte ne peut pas dépasser le prix total" },
            { status: 400 }
          );
        }
      } else if (type_vente === 'VERSEMENT') {
        if (nouveauTotal > prixVente) {
          return NextResponse.json(
            { success: false, erreur: 'Le total des versements dépasse le prix de vente' },
            { status: 400 }
          );
        }
      } else if (type_vente === 'SOLDE') {
        if (nouveauTotal !== prixVente) {
          return NextResponse.json(
            { success: false, erreur: 'Le solde doit correspondre au prix total' },
            { status: 400 }
          );
        }
      }
    }

    // ✅ Mettre à jour le paiement
    await queryInsert(
      `UPDATE paiements SET
        type_paiement = ?,
        type_vente = ?,
        montant = ?,
        montant_total_vente = ?,
        versement_numero = ?,
        echeancier_id = ?,
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
        isVente ? type_vente : type_paiement,
        isVente ? type_vente : null,
        montantSaisi,
        isVente && montant_total_vente ? parseFloat(montant_total_vente) : null,
        isVente && versement_numero ? parseInt(versement_numero) : null,
        isVente ? echeancier_id : null,
        date_paiement,
        date_echeance || null,
        mode_paiement,
        reference || null,
        statut,
        !isVente ? (mois_concerne || null) : null,
        !isVente && penalite ? parseFloat(penalite) : 0,
        commentaire || null,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: isVente ? 'Versement modifié avec succès' : 'Paiement modifié avec succès'
    });

  } catch (error: any) {
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