import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des contrats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locataire_id = searchParams.get('locataire_id');
    const bien_id = searchParams.get('bien_id');
    const statut = searchParams.get('statut');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (locataire_id) {
      whereClause += ' AND c.locataire_id = ?';
      params.push(locataire_id);
    }

    if (bien_id) {
      whereClause += ' AND c.bien_id = ?';
      params.push(bien_id);
    }

    if (statut) {
      whereClause += ' AND c.statut = ?';
      params.push(statut);
    }

    const contrats = await queryRows(
      `SELECT c.*,
        (SELECT JSON_OBJECT('id', b.id, 'nom', b.nom, 'adresse', b.adresse) 
         FROM biens b WHERE b.id = c.bien_id) as bien,
        (SELECT JSON_OBJECT('id', l.id, 'nom', l.nom, 'prenom', l.prenom, 'email', l.email, 'telephone', l.telephone) 
         FROM locataires l WHERE l.id = c.locataire_id) as locataire,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', p.id, 'montant', p.montant, 'date_paiement', p.date_paiement,
                      'mois_concerne', p.mois_concerne, 'statut', p.statut)
        ) FROM paiements p WHERE p.contrat_id = c.id ORDER BY p.date_paiement DESC) as paiements
       FROM contrats c
       ${whereClause}
       ORDER BY c.date_debut DESC`,
      params
    ) as any[];

    const contratsFormatted = contrats.map(c => ({
      ...c,
      bien: c.bien ? (typeof c.bien === 'string' ? JSON.parse(c.bien) : c.bien) : null,
      locataire: c.locataire ? (typeof c.locataire === 'string' ? JSON.parse(c.locataire) : c.locataire) : null,
      paiements: c.paiements ? (typeof c.paiements === 'string' ? JSON.parse(c.paiements) : c.paiements) : []
    }));

    return NextResponse.json({
      success: true,
      contrats: contratsFormatted
    });
  } catch (error) {
    console.error('❌ Erreur GET contrats:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un contrat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      bien_id, locataire_id, type_contrat,
      date_debut, date_fin, date_signature,
      loyer_mensuel, charges_mensuelles, depot_garantie,
      indexation, indice_reference, clause_particuliere,
      statut
    } = body;

    // Validation
    const errors = [];
    if (!bien_id) errors.push('bien_id manquant');
    if (!locataire_id) errors.push('locataire_id manquant');
    if (!type_contrat) errors.push('type_contrat manquant');
    if (!date_debut) errors.push('date_debut manquante');
    if (!loyer_mensuel) errors.push('loyer_mensuel manquant');

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants', details: errors },
        { status: 400 }
      );
    }

    // Générer un numéro de contrat unique
    const annee = new Date().getFullYear();
    const count = await queryRows(
      'SELECT COUNT(*) as total FROM contrats WHERE YEAR(created_at) = ?',
      [annee]
    ) as any[];
    const numero = `CT-${annee}-${(count[0]?.total + 1).toString().padStart(4, '0')}`;

    // Insérer le contrat
    const result = await queryInsert(
  `INSERT INTO contrats (
    numero_contrat, bien_id, locataire_id, type_contrat,
    date_debut, date_fin, date_signature,
    loyer_mensuel, charges_mensuelles, depot_garantie,
    indexation, indice_reference, clause_particuliere,
    statut, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [
    numero, 
    parseInt(bien_id), 
    parseInt(locataire_id), 
    type_contrat,
    date_debut, 
    date_fin || null, 
    date_signature || null,
    parseFloat(loyer_mensuel), 
    parseFloat(charges_mensuelles || 0), 
    parseFloat(depot_garantie || 0),
    indexation ? 1 : 0,  // 1 si coché, 0 sinon
    indice_reference || null,  // null si pas d'indice
    clause_particuliere || null,
    statut || 'ACTIF'
  ]
);

    if (!result.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    // ✅ CORRECTION: Mettre à jour le bien avec le locataire actuel
    await queryInsert(
      'UPDATE biens SET statut = ? WHERE id = ?',
      ['LOUE', parseInt(bien_id)]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      numero,
      message: 'Contrat créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur POST contrat:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}