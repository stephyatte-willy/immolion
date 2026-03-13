import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { hashPassword } from '@/app/lib/bcrypt';

// GET - Liste des utilisateurs avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const actif = searchParams.get('actif');

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (actif !== null) {
      whereClause += ' AND actif = ?';
      params.push(actif === 'true' ? 1 : 0);
    }

    // Compter le total
    const countResult = await queryRows(
      `SELECT COUNT(*) as total FROM utilisateurs ${whereClause}`,
      params
    ) as any[];
    const total = countResult[0]?.total || 0;

    // Récupérer les utilisateurs
    const utilisateurs = await queryRows(
      `SELECT id, email, nom, prenom, telephone, role, avatar, actif, 
              date_creation, derniere_connexion
       FROM utilisateurs 
       ${whereClause}
       ORDER BY date_creation DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any[];

    // Récupérer les rôles secondaires pour chaque utilisateur
    for (const user of utilisateurs) {
      const rolesSecondaires = await queryRows(
        'SELECT role FROM roles_utilisateurs WHERE utilisateur_id = ?',
        [user.id]
      ) as any[];
      user.roles_secondaires = rolesSecondaires.map(r => r.role);

      const permissionsSpecifiques = await queryRows(
        'SELECT permission, accordee FROM permissions_specifiques WHERE utilisateur_id = ?',
        [user.id]
      ) as any[];
      user.permissions_specifiques = permissionsSpecifiques;
    }

    return NextResponse.json({
      success: true,
      utilisateurs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur GET utilisateurs:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, motDePasse, nom, prenom, telephone, role, roles_secondaires, permissions_specifiques } = body;

    // Validation
    if (!email || !motDePasse || !nom || !prenom) {
      return NextResponse.json(
        { success: false, erreur: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existing = await queryRows(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(motDePasse);

    // Insérer l'utilisateur
    const result = await queryInsert(
      `INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, telephone, role, date_creation)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [email, hashedPassword, nom, prenom, telephone || null, role || 'PROPRIETAIRE']
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    const utilisateurId = result.insertId;

    // Ajouter les rôles secondaires
    if (roles_secondaires && roles_secondaires.length > 0) {
      for (const roleSec of roles_secondaires) {
        await queryInsert(
          'INSERT INTO roles_utilisateurs (utilisateur_id, role) VALUES (?, ?)',
          [utilisateurId, roleSec]
        );
      }
    }

    // Ajouter les permissions spécifiques
    if (permissions_specifiques && permissions_specifiques.length > 0) {
      for (const perm of permissions_specifiques) {
        await queryInsert(
          'INSERT INTO permissions_specifiques (utilisateur_id, permission, accordee) VALUES (?, ?, ?)',
          [utilisateurId, perm.permission, perm.accordee]
        );
      }
    }

    return NextResponse.json({
      success: true,
      id: utilisateurId,
      message: 'Utilisateur créé avec succès'
    });
  } catch (error) {
    console.error('Erreur POST utilisateurs:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}