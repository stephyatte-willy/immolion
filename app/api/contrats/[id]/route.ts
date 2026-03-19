import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un contrat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ✅ Récupérer TOUS les champs du contrat

const contrats = await queryRows(
  `SELECT 
    c.id,
    c.bien_id,
    c.locataire_id,
    c.numero_contrat,
    c.type_contrat,
    c.date_debut,
    c.date_fin,
    c.date_signature,
    c.date_etat_lieux_entree,
    c.date_etat_lieux_sortie,
    c.loyer_mensuel,
    c.charges_mensuelles,
    c.depot_garantie,
    c.prix_vente,  -- ✅ Vérifiez que cette ligne existe
    c.clause_particuliere,
    c.statut,
    c.created_at,
    c.updated_at,
    (SELECT JSON_OBJECT('id', b.id, 'nom', b.nom, 'adresse', b.adresse, 
                        'loyer_mensuel', b.loyer_mensuel, 'prix_vente', b.prix_vente,
                        'commune', b.commune, 'ville', b.ville) 
     FROM biens b WHERE b.id = c.bien_id) as bien,
    (SELECT JSON_OBJECT('id', l.id, 'nom', l.nom, 'prenom', l.prenom, 
                        'email', l.email, 'telephone', l.telephone) 
     FROM locataires l WHERE l.id = c.locataire_id) as locataire
   FROM contrats c
   WHERE c.id = ?`,
  [id]
) as any[];

    if (contrats.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Contrat non trouvé' },
        { status: 404 }
      );
    }

    const contrat = contrats[0];
    
    console.log('✅ Contrat récupéré avec tous les champs:', {
      id: contrat.id,
      date_signature: contrat.date_signature,
      date_etat_lieux_entree: contrat.date_etat_lieux_entree,
      date_etat_lieux_sortie: contrat.date_etat_lieux_sortie,
      charges_mensuelles: contrat.charges_mensuelles,
      clause_particuliere: contrat.clause_particuliere
    });

    // Parser les JSON
    try {
      contrat.bien = contrat.bien ? (typeof contrat.bien === 'string' ? JSON.parse(contrat.bien) : contrat.bien) : null;
      contrat.locataire = contrat.locataire ? (typeof contrat.locataire === 'string' ? JSON.parse(contrat.locataire) : contrat.locataire) : null;
    } catch (e) {
      console.error('❌ Erreur parsing JSON:', e);
    }

    return NextResponse.json({
      success: true,
      contrat
    });
  } catch (error) {
    console.error('❌ Erreur GET contrat:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Modifier un contrat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('📦 Données reçues pour modification:', body);

    const {
      type_contrat,
      date_debut,
      date_fin,
      date_signature,
      date_etat_lieux_entree,
      date_etat_lieux_sortie,
      loyer_mensuel,
      charges_mensuelles,
      depot_garantie,
      prix_vente,
      clause_particuliere,
      statut
    } = body;

    // Récupérer l'ancien contrat
    const ancienContrat = await queryRows(
      'SELECT statut, bien_id, type_contrat FROM contrats WHERE id = ?',
      [id]
    ) as any[];

    if (ancienContrat.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Contrat non trouvé' },
        { status: 404 }
      );
    }

    const ancienStatut = ancienContrat[0].statut;
    const bien_id = ancienContrat[0].bien_id;
    const isVente = type_contrat === 'VENTE' || ancienContrat[0].type_contrat === 'VENTE';

    // Validation des données
    if (!type_contrat || !date_debut || !statut) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    // Préparer les valeurs selon le type
    let loyerValue = 0;
    let chargesValue = 0;
    let depotValue = null;
    let prixVenteValue = null;

    if (isVente) {
      prixVenteValue = prix_vente ? parseFloat(prix_vente) : null;
      if (!prixVenteValue || prixVenteValue <= 0) {
        return NextResponse.json(
          { success: false, erreur: 'Prix de vente invalide' },
          { status: 400 }
        );
      }
    } else {
      loyerValue = loyer_mensuel ? parseFloat(loyer_mensuel) : 0;
      if (loyerValue <= 0) {
        return NextResponse.json(
          { success: false, erreur: 'Loyer mensuel invalide' },
          { status: 400 }
        );
      }
      chargesValue = charges_mensuelles ? parseFloat(charges_mensuelles) : 0;
      depotValue = depot_garantie ? parseFloat(depot_garantie) : null;
    }

    // Mettre à jour le contrat
    const result = await queryInsert(
      `UPDATE contrats SET
        type_contrat = ?,
        date_debut = ?,
        date_fin = ?,
        date_signature = ?,
        date_etat_lieux_entree = ?,
        date_etat_lieux_sortie = ?,
        loyer_mensuel = ?,
        charges_mensuelles = ?,
        depot_garantie = ?,
        prix_vente = ?,
        clause_particuliere = ?,
        statut = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        type_contrat,
        date_debut,
        date_fin || null,
        date_signature || null,
        date_etat_lieux_entree || null,
        date_etat_lieux_sortie || null,
        loyerValue,
        chargesValue,
        depotValue,
        prixVenteValue,
        clause_particuliere || null,
        statut,
        id
      ]
    );

    if (!result.success) {
      console.error('❌ Échec de la mise à jour:', result);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    console.log('✅ Contrat mis à jour avec succès');

    // Gérer le statut du bien si nécessaire
    if (statut !== ancienStatut) {
      if (statut === 'TERMINE' || statut === 'RESILIE') {
        // Vérifier s'il y a d'autres contrats actifs pour ce bien
        const autresContrats = await queryRows(
          'SELECT id FROM contrats WHERE bien_id = ? AND id != ? AND statut = ?',
          [bien_id, id, 'ACTIF']
        ) as any[];

        if (autresContrats.length === 0) {
          await queryInsert(
            'UPDATE biens SET statut = ? WHERE id = ?',
            [isVente ? 'DISPONIBLE' : 'DISPONIBLE', bien_id]
          );
        }
      } else if (statut === 'ACTIF' && ancienStatut !== 'ACTIF') {
        await queryInsert(
          'UPDATE biens SET statut = ? WHERE id = ?',
          [isVente ? 'VENDU' : 'LOUE', bien_id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contrat modifié avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur PUT contrat:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un contrat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('🗑️ Suppression du contrat ID:', id);

    const contrats = await queryRows(
      'SELECT bien_id, statut FROM contrats WHERE id = ?',
      [id]
    ) as any[];

    if (contrats.length > 0) {
      const bien_id = contrats[0].bien_id;
      
      const autresContrats = await queryRows(
        'SELECT id FROM contrats WHERE bien_id = ? AND id != ? AND statut = ?',
        [bien_id, id, 'ACTIF']
      ) as any[];

      if (autresContrats.length === 0) {
        await queryInsert(
          'UPDATE biens SET statut = ? WHERE id = ?',
          ['DISPONIBLE', bien_id]
        );
        console.log('✅ Bien remis en disponible');
      }
    }

    await queryInsert('DELETE FROM contrats WHERE id = ?', [id]);
    console.log('✅ Contrat supprimé de la base de données');

    return NextResponse.json({
      success: true,
      message: 'Contrat supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur DELETE contrat:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}