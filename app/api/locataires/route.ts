import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des locataires
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const statut = searchParams.get('statut') || '';
    const bien_id = searchParams.get('bien_id') || '';
    const lot_id = searchParams.get('lot_id') || '';

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR telephone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (statut) {
      if (statut === 'ACTIF') {
        whereClause += ' AND actif = 1';
      } else if (statut === 'INACTIF') {
        whereClause += ' AND actif = 0';
      } else if (statut === 'PROSPECT') {
        whereClause += ' AND actif = 0 AND bien_id IS NULL AND lot_id IS NULL';
      }
    }

    if (bien_id) {
      whereClause += ' AND bien_id = ?';
      params.push(bien_id);
    }

    if (lot_id) {
      whereClause += ' AND lot_id = ?';
      params.push(lot_id);
    }

    const countResult = await queryRows(
      `SELECT COUNT(*) as total FROM locataires ${whereClause}`,
      params
    ) as any[];
    const total = countResult[0]?.total || 0;

    const locataires = await queryRows(
      `SELECT l.*,
        (SELECT JSON_OBJECT(
          'id', b.id,
          'nom', b.nom,
          'adresse', b.adresse,
          'type_bien', b.type_bien,
          'statut', b.statut
        ) FROM biens b WHERE b.id = l.bien_id) as bien_actuel,
        (SELECT JSON_OBJECT(
          'id', lt.id,
          'numero_lot', lt.numero_lot,
          'etage', lt.etage,
          'type_lot', lt.type_lot,
          'nom', lt.nom,
          'surface', lt.surface,
          'pieces', lt.pieces,
          'loyer_mensuel', lt.loyer_mensuel,
          'charges', lt.charges,
          'statut', lt.statut
        ) FROM lots lt WHERE lt.id = l.lot_id) as lot_actuel,
        (SELECT COUNT(*) FROM paiements p WHERE p.locataire_id = l.id AND p.statut = 'EN_RETARD') as impayes
       FROM locataires l
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any[];

    const locatairesFormatted = locataires.map(l => {
      let bienActuel = l.bien_actuel;
      let lotActuel = l.lot_actuel;
      
      if (typeof bienActuel === 'string') {
        try {
          bienActuel = JSON.parse(bienActuel);
        } catch (e) {
          bienActuel = null;
        }
      }
      
      if (typeof lotActuel === 'string') {
        try {
          lotActuel = JSON.parse(lotActuel);
        } catch (e) {
          lotActuel = null;
        }
      }
      
      return {
        ...l,
        bien_actuel: bienActuel,
        lot_actuel: lotActuel,
        statut: l.actif ? 'ACTIF' : (l.bien_id || l.lot_id ? 'INACTIF' : 'PROSPECT')
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

// POST - Créer un locataire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nom, prenom, email, telephone, telephone_secondaire,
      date_naissance, lieu_naissance, nationalite,
      profession, employeur, revenus_mensuels,
      statut, notes, bien_id, lot_id
    } = body;

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

    // ✅ NE PAS CHANGER LE STATUT DU BIEN/LOT ICI
    // Le bien/lot reste DISPONIBLE ou RESERVE
    // Le statut ne changera qu'après validation du contrat avec paiements

    const actif = statut === 'ACTIF' ? 1 : 0;

    const result = await queryInsert(
      `INSERT INTO locataires (
        nom, prenom, email, telephone, telephone_secondaire,
        date_naissance, lieu_naissance, nationalite,
        profession, employeur, revenus_mensuels,
        actif, notes, bien_id, lot_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nom, prenom, email, telephone, telephone_secondaire || null,
        date_naissance || null, lieu_naissance || null, nationalite || null,
        profession || null, employeur || null, revenus_mensuels || null,
        actif, notes || null, bien_id || null, lot_id || null
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