import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des acquéreurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const actif = searchParams.get('actif');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (type && type !== 'TOUS') {
      whereClause += ' AND a.type_acquereur = ?';
      params.push(type);
    }

    if (actif && actif !== 'TOUS') {
      whereClause += ' AND a.actif = ?';
      params.push(actif === 'ACTIF' ? 1 : 0);
    }

    const acquereurs = await queryRows(
      `SELECT a.*,
        (SELECT JSON_OBJECT(
          'id', b.id,
          'nom', b.nom,
          'adresse', b.adresse,
          'type_bien', b.type_bien,
          'prix_vente', b.prix_vente,
          'surface', b.surface,
          'pieces', b.pieces,
          'commune', b.commune,
          'ville', b.ville
        ) FROM biens b WHERE b.id = a.bien_id) as bien,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', c.id, 'numero_contrat', c.numero_contrat, 
                      'prix_vente', c.prix_vente, 'date_debut', c.date_debut,
                      'statut', c.statut, 'bien_nom', b.nom)
        ) FROM contrats c 
        LEFT JOIN biens b ON c.bien_id = b.id
        WHERE c.acquereur_id = a.id) as contrats
       FROM acquereurs a
       ${whereClause}
       ORDER BY a.created_at DESC`,
      params
    ) as any[];

    const acquereursFormatted = acquereurs.map(a => {
      let bien = null;
      if (a.bien) {
        try {
          bien = typeof a.bien === 'string' ? JSON.parse(a.bien) : a.bien;
        } catch (e) {
          bien = null;
        }
      }
      
      let contrats = [];
      if (a.contrats) {
        try {
          contrats = typeof a.contrats === 'string' ? JSON.parse(a.contrats) : a.contrats;
        } catch (e) {
          contrats = [];
        }
      }
      
      return {
        ...a,
        bien,
        contrats
      };
    });

    return NextResponse.json({
      success: true,
      acquereurs: acquereursFormatted
    });
  } catch (error) {
    console.error('❌ Erreur GET acquereurs:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un acquéreur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📦 Données reçues pour création acquéreur:', body);
    
    const {
      nom, prenom, email, telephone, telephone_secondaire,
      date_naissance, lieu_naissance, nationalite,
      profession, employeur, revenus_mensuels,
      type_acquereur, bien_id, raison_sociale, num_identite,
      adresse, ville, pays, notes, actif
    } = body;

    // Validation selon le type d'acquéreur
    const errors = [];
    
    // Email toujours requis
    if (!email) {
      errors.push('email manquant');
    }
    
    // Validation selon le type
    const isEntite = type_acquereur === 'SOCIETE' || type_acquereur === 'AGENCE';
    
    if (isEntite) {
      // Pour les sociétés et agences
      if (!raison_sociale) {
        errors.push('raison_sociale manquant');
      }
    } else {
      // Pour les particuliers
      if (!nom) errors.push('nom manquant');
      if (!prenom) errors.push('prenom manquant');
    }

    if (errors.length > 0) {
      console.error('❌ Champs manquants:', errors);
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants', details: errors },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existing = await queryRows(
      'SELECT id FROM acquereurs WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Si un bien_id est fourni, vérifier qu'il existe
    if (bien_id) {
      const bien = await queryRows(
        'SELECT id, type_bien, statut FROM biens WHERE id = ?',
        [bien_id]
      ) as any[];
      
      if (bien.length === 0) {
        return NextResponse.json(
          { success: false, erreur: 'Le bien sélectionné n\'existe pas' },
          { status: 400 }
        );
      }
    }

    // Préparer les données pour l'insertion
    let nomFinal = '';
    let prenomFinal = '';
    
    if (isEntite) {
      nomFinal = raison_sociale;
      prenomFinal = '';
    } else {
      nomFinal = nom;
      prenomFinal = prenom;
    }

    
const result = await queryInsert(
  `INSERT INTO acquereurs (
    nom, prenom, email, telephone, telephone_secondaire,
    date_naissance, lieu_naissance, nationalite,
    profession, employeur, revenus_mensuels,
    type_acquereur, bien_id, raison_sociale, num_identite,
    adresse, ville, pays, notes, actif, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [
    nomFinal,
    prenomFinal,
    email,
    telephone || null,
    telephone_secondaire || null,
    date_naissance || null,
    lieu_naissance || null,
    nationalite || 'Ivoirienne',
    profession || null,
    employeur || null,
    revenus_mensuels || null,
    type_acquereur || 'PARTICULIER',
    bien_id || null, // ✅ Important: insérer bien_id
    raison_sociale || null,
    num_identite || null,
    adresse || null,
    ville || null,
    pays || 'Côte d\'Ivoire',
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

    console.log('✅ Acquéreur créé avec succès, ID:', result.insertId);

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Acquéreur créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur POST acquereur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}