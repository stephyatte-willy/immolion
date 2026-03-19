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
          (SELECT JSON_OBJECT(
    'id', b.id, 
    'nom', b.nom, 
    'adresse', b.adresse, 
    'statut', b.statut, 
    'prix_vente', b.prix_vente,
    'surface', b.surface,
    'pieces', b.pieces,
    'commune', b.commune,
    'ville', b.ville,
    'quartier', b.quartier,
    'district', b.district,
    'description', b.description
  ) FROM biens b WHERE b.id = c.bien_id) as bien,
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

// POST - Créer un contrat (location ou vente)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      bien_id, locataire_id, type_contrat,
      date_debut, date_fin, date_signature,
      loyer_mensuel, charges_mensuelles, depot_garantie,
      prix_vente, clause_particuliere,
      statut
    } = body;

    console.log('📦 Données reçues pour création de contrat:', {
      type_contrat, bien_id, locataire_id, date_debut,
      loyer_mensuel, prix_vente
    });

    // Validation
    const errors = [];
    if (!bien_id) errors.push('bien_id manquant');
    if (!locataire_id) errors.push('locataire_id manquant');
    if (!type_contrat) errors.push('type_contrat manquant');
    if (!date_debut) errors.push('date_debut manquante');

    // Validation selon le type de contrat
    if (type_contrat === 'VENTE') {
      if (!prix_vente) errors.push('prix_vente manquant');
    } else {
      if (!loyer_mensuel) errors.push('loyer_mensuel manquant');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants', details: errors },
        { status: 400 }
      );
    }

    // Générer un numéro de contrat unique
    const annee = new Date().getFullYear();
    const prefix = type_contrat === 'VENTE' ? 'VT' : 'CT';
    const count = await queryRows(
      'SELECT COUNT(*) as total FROM contrats WHERE YEAR(created_at) = ?',
      [annee]
    ) as any[];
    const numero = `${prefix}-${annee}-${(count[0]?.total + 1).toString().padStart(4, '0')}`;

    // Préparer les valeurs selon le type de contrat
    let loyerValue = 0;
    let chargesValue = 0;
    let depotValue = null;
    let prixVenteValue = null;

    if (type_contrat === 'VENTE') {
      prixVenteValue = parseFloat(prix_vente);
      if (isNaN(prixVenteValue) || prixVenteValue <= 0) {
        return NextResponse.json(
          { success: false, erreur: 'Prix de vente invalide' },
          { status: 400 }
        );
      }
    } else {
      loyerValue = parseFloat(loyer_mensuel);
      if (isNaN(loyerValue) || loyerValue <= 0) {
        return NextResponse.json(
          { success: false, erreur: 'Loyer mensuel invalide' },
          { status: 400 }
        );
      }
      chargesValue = charges_mensuelles ? parseFloat(charges_mensuelles) : 0;
      depotValue = depot_garantie ? parseFloat(depot_garantie) : null;
    }

    // Insérer le contrat
    const result = await queryInsert(
      `INSERT INTO contrats (
        numero_contrat, bien_id, locataire_id, type_contrat,
        date_debut, date_fin, date_signature,
        loyer_mensuel, charges_mensuelles, depot_garantie,
        prix_vente, clause_particuliere,
        statut, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        numero,
        parseInt(bien_id),
        parseInt(locataire_id),
        type_contrat,
        date_debut,
        date_fin || null,
        date_signature || null,
        loyerValue,
        chargesValue,
        depotValue,
        prixVenteValue,
        clause_particuliere || null,
        statut || 'ACTIF'
      ]
    );

    if (!result.success) {
      console.error('❌ Erreur insertion:', result);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création dans la base de données' },
        { status: 500 }
      );
    }

    // ✅ Mettre à jour le statut du bien
    if (type_contrat === 'VENTE') {
      // Pour une vente, le bien n'est plus disponible
      await queryInsert(
        'UPDATE biens SET statut = ? WHERE id = ?',
        ['VENDU', parseInt(bien_id)]
      );
    } else {
      // Pour une location, le bien est loué
      await queryInsert(
        'UPDATE biens SET statut = ? WHERE id = ?',
        ['LOUE', parseInt(bien_id)]
      );
    }

    return NextResponse.json({
      success: true,
      id: result.insertId,
      numero,
      message: type_contrat === 'VENTE' ? 'Contrat de vente créé avec succès' : 'Contrat de location créé avec succès'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur POST contrat:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}