import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des locataires avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const statut = searchParams.get('statut') || '';
    const bien_id = searchParams.get('bien_id') || '';

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR telephone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (statut) {
      // Convertir le statut du frontend (ACTIF/INACTIF) en actif boolean
      if (statut === 'ACTIF') {
        whereClause += ' AND actif = 1';
      } else if (statut === 'INACTIF') {
        whereClause += ' AND actif = 0';
      } else if (statut === 'PROSPECT') {
        whereClause += ' AND actif = 0 AND bien_id IS NULL'; // Prospect = inactif et sans bien
      }
    }

    if (bien_id) {
      whereClause += ' AND bien_id = ?';
      params.push(bien_id);
    }

    // Compter le total
    const countResult = await queryRows(
      `SELECT COUNT(*) as total FROM locataires ${whereClause}`,
      params
    ) as any[];
    const total = countResult[0]?.total || 0;

    // ✅ CORRECTION: Utiliser bien_id au lieu de bien_actuel_id
    const locataires = await queryRows(
      `SELECT l.*,
        (SELECT JSON_OBJECT('id', b.id, 'nom', b.nom, 'adresse', b.adresse, 'loyer_mensuel', b.loyer_mensuel) 
         FROM biens b WHERE b.id = l.bien_id) as bien_actuel,
        (SELECT COUNT(*) FROM paiements p WHERE p.locataire_id = l.id AND p.statut = 'EN_RETARD') as impayes
       FROM locataires l
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any[];

    // ✅ CORRECTION: Ne pas parser si c'est déjà un objet
    const locatairesFormatted = locataires.map(l => {
      // Vérifier le type de bien_actuel
      let bienActuel = l.bien_actuel;
      
      // Si c'est une chaîne, essayer de la parser
      if (typeof bienActuel === 'string') {
        try {
          bienActuel = JSON.parse(bienActuel);
        } catch (e) {
          bienActuel = null;
        }
      }
      
      return {
        ...l,
        bien_actuel: bienActuel,
        // Convertir actif boolean en statut pour le frontend
        statut: l.actif ? 'ACTIF' : (l.bien_id ? 'INACTIF' : 'PROSPECT')
      };
    });

    return NextResponse.json({
      success: true,
      locataires: locatairesFormatted,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET locataires:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau locataire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nom, prenom, email, telephone, telephone_secondaire,
      date_naissance, lieu_naissance, nationalite,
      profession, employeur, revenus_mensuels,
      statut, notes, bien_id  // ✅ Utiliser bien_id au lieu de bien_actuel_id
    } = body;

    // Validation
    const errors = [];
    if (!nom) errors.push('nom manquant');
    if (!prenom) errors.push('prenom manquant');
    if (!email) errors.push('email manquant');
    if (!telephone) errors.push('telephone manquant');

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants', details: errors },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existing = await queryRows(
      'SELECT id FROM locataires WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Un locataire avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Déterminer actif en fonction du statut
    const actif = statut === 'ACTIF' ? 1 : 0;

    // Insérer le locataire
    const result = await queryInsert(
      `INSERT INTO locataires (
        nom, prenom, email, telephone, telephone_secondaire,
        date_naissance, lieu_naissance, nationalite,
        profession, employeur, revenus_mensuels,
        actif, notes, bien_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nom, prenom, email, telephone, telephone_secondaire || null,
        date_naissance || null, lieu_naissance || null, nationalite || null,
        profession || null, employeur || null, revenus_mensuels || null,
        actif, notes || null, bien_id || null
      ]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Locataire créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur POST locataire:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}