import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des propriétaires
// GET - Liste des propriétaires
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actif = searchParams.get('actif');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (actif === 'ACTIF') {
      whereClause += ' AND actif = 1';
      params.push(1);
    } else if (actif === 'INACTIF') {
      whereClause += ' AND actif = 0';
      params.push(0);
    }

    const proprietaires = await queryRows(
      `SELECT p.*,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', b.id, 'nom', b.nom, 'adresse', b.adresse, 
                      'type_bien', b.type_bien, 'statut', b.statut,
                      'surface', b.surface, 'pieces', b.pieces,
                      'commune', b.commune, 'ville', b.ville,
                      'prix_vente', b.prix_vente, 'loyer_mensuel', b.loyer_mensuel)
        ) FROM biens b WHERE b.proprietaire_id = p.id) as biens
       FROM proprietaires p
       ${whereClause}
       ORDER BY p.created_at DESC`,
      params
    ) as any[];

    const proprietairesFormatted = proprietaires.map(p => {
      let biens = p.biens;
      if (typeof biens === 'string') {
        try {
          biens = JSON.parse(biens);
        } catch (e) {
          biens = [];
        }
      }
      
      return {
        ...p,
        biens: biens || []
      };
    });

    return NextResponse.json({
      success: true,
      proprietaires: proprietairesFormatted
    });
  } catch (error) {
    console.error('❌ Erreur GET proprietaires:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un propriétaire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nom, prenom, email, telephone, telephone_secondaire,
      adresse, ville, pays, type, num_identite,
      date_naissance, profession, notes, actif,
      biens_ids
    } = body;

    // ✅ CORRECTION: Validation adaptée selon le type
    const isEntite = type === 'SOCIETE' || type === 'AGENCE';
    
    if (isEntite) {
      // Pour les entités, on vérifie que le nom (raison sociale) est présent
      if (!nom || !email) {
        return NextResponse.json(
          { success: false, erreur: 'Champs obligatoires manquants' },
          { status: 400 }
        );
      }
    } else {
      // Pour les particuliers, on vérifie nom et prénom
      if (!nom || !prenom || !email) {
        return NextResponse.json(
          { success: false, erreur: 'Champs obligatoires manquants' },
          { status: 400 }
        );
      }
    }

    // Vérifier si l'email existe déjà
    const existing = await queryRows(
      'SELECT id FROM proprietaires WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // ✅ CORRECTION: Pour les entités, prenom est null
    const prenomFinal = isEntite ? null : (prenom || null);
    const nomFinal = nom; // Pour les entités, c'est la raison sociale

    // Insérer le propriétaire
    const result = await queryInsert(
      `INSERT INTO proprietaires (
        nom, prenom, email, telephone, telephone_secondaire,
        adresse, ville, pays, type, num_identite,
        date_naissance, profession, notes, actif, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nomFinal,
        prenomFinal,
        email, 
        telephone || null, 
        telephone_secondaire || null,
        adresse || null, 
        ville || null, 
        pays || 'Côte d\'Ivoire',
        type || 'PARTICULIER', 
        num_identite || null,
        date_naissance || null, 
        profession || null, 
        notes || null,
        actif !== undefined ? (actif ? 1 : 0) : 1
      ]
    );

    if (!result.success) {
      console.error('❌ Erreur insertion:', result);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    const proprietaireId = result.insertId;

    // Associer les biens
    if (biens_ids && biens_ids.length > 0) {
      for (const bienId of biens_ids) {
        await queryInsert(
          'UPDATE biens SET proprietaire_id = ? WHERE id = ?',
          [proprietaireId, bienId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      id: proprietaireId,
      message: 'Propriétaire créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur POST proprietaire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}