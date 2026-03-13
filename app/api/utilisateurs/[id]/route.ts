import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { hashPassword } from '@/app/lib/bcrypt';

// GET - Récupérer un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔴 IMPORTANT: Attendre params car c'est une Promise dans Next.js 15+
    const { id } = await params;

    const utilisateurs = await queryRows(
      `SELECT id, email, nom, prenom, telephone, role, avatar, actif,
              date_creation, derniere_connexion
       FROM utilisateurs WHERE id = ?`,
      [id]
    ) as any[];

    if (utilisateurs.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const utilisateur = utilisateurs[0];

    // Récupérer les rôles secondaires
    const rolesSecondaires = await queryRows(
      'SELECT role FROM roles_utilisateurs WHERE utilisateur_id = ?',
      [id]
    ) as any[];
    utilisateur.roles_secondaires = rolesSecondaires.map(r => r.role);

    // Récupérer les permissions spécifiques
    const permissionsSpecifiques = await queryRows(
      'SELECT permission, accordee FROM permissions_specifiques WHERE utilisateur_id = ?',
      [id]
    ) as any[];
    utilisateur.permissions_specifiques = permissionsSpecifiques;

    return NextResponse.json({
      success: true,
      utilisateur
    });
  } catch (error) {
    console.error('❌ Erreur GET utilisateur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔴 IMPORTANT: Attendre params car c'est une Promise dans Next.js 15+
    const { id } = await params;
    
    console.log('🔍 Modification utilisateur ID:', id);

    const body = await request.json();
    const { 
      email, 
      nom, 
      prenom, 
      telephone, 
      role, 
      actif, 
      motDePasse, 
      roles_secondaires, 
      permissions_specifiques 
    } = body;

    // Vérifier si l'utilisateur existe
    const existing = await queryRows(
      'SELECT id FROM utilisateurs WHERE id = ?',
      [id]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà pris par un autre utilisateur
    if (email) {
      const emailCheck = await queryRows(
        'SELECT id FROM utilisateurs WHERE email = ? AND id != ?',
        [email, id]
      ) as any[];
      
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { success: false, erreur: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    // Construire la requête UPDATE dynamiquement
    let updateFields = [];
    let queryParams: any[] = [];

    if (email) {
      updateFields.push('email = ?');
      queryParams.push(email);
    }
    if (nom) {
      updateFields.push('nom = ?');
      queryParams.push(nom);
    }
    if (prenom) {
      updateFields.push('prenom = ?');
      queryParams.push(prenom);
    }
    if (telephone !== undefined) {
      updateFields.push('telephone = ?');
      queryParams.push(telephone);
    }
    if (role) {
      updateFields.push('role = ?');
      queryParams.push(role);
    }
    if (actif !== undefined) {
      updateFields.push('actif = ?');
      queryParams.push(actif ? 1 : 0);
    }
    if (motDePasse) {
      const hashedPassword = await hashPassword(motDePasse);
      updateFields.push('mot_de_passe = ?');
      queryParams.push(hashedPassword);
    }

    if (updateFields.length > 0) {
      queryParams.push(id);
      await queryInsert(
        `UPDATE utilisateurs SET ${updateFields.join(', ')} WHERE id = ?`,
        queryParams
      );
      console.log('✅ Utilisateur mis à jour');
    }

    // Mettre à jour les rôles secondaires
    if (roles_secondaires !== undefined) {
      // Supprimer les anciens
      await queryInsert('DELETE FROM roles_utilisateurs WHERE utilisateur_id = ?', [id]);
      
      // Ajouter les nouveaux
      for (const roleSec of roles_secondaires) {
        await queryInsert(
          'INSERT INTO roles_utilisateurs (utilisateur_id, role) VALUES (?, ?)',
          [id, roleSec]
        );
      }
      console.log('✅ Rôles secondaires mis à jour');
    }

    // Mettre à jour les permissions spécifiques
    if (permissions_specifiques !== undefined) {
      // Supprimer les anciennes
      await queryInsert('DELETE FROM permissions_specifiques WHERE utilisateur_id = ?', [id]);
      
      // Ajouter les nouvelles
      for (const perm of permissions_specifiques) {
        await queryInsert(
          'INSERT INTO permissions_specifiques (utilisateur_id, permission, accordee) VALUES (?, ?, ?)',
          [id, perm.permission, perm.accordee !== false ? 1 : 0]
        );
      }
      console.log('✅ Permissions spécifiques mises à jour');
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur PUT utilisateur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔴 IMPORTANT: Attendre params car c'est une Promise dans Next.js 15+
    const { id } = await params;

    // Vérifier si l'utilisateur existe
    const existing = await queryRows(
      'SELECT id, role FROM utilisateurs WHERE id = ?',
      [id]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Empêcher la suppression du dernier SUPER_ADMIN
    if (existing[0].role === 'SUPER_ADMIN') {
      const superAdmins = await queryRows(
        'SELECT COUNT(*) as count FROM utilisateurs WHERE role = "SUPER_ADMIN"',
        []
      ) as any[];
      
      if (superAdmins[0].count <= 1) {
        return NextResponse.json(
          { success: false, erreur: 'Impossible de supprimer le dernier Super Admin' },
          { status: 400 }
        );
      }
    }

    // Les suppressions en cascade gèrent les tables liées
    await queryInsert('DELETE FROM utilisateurs WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE utilisateur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}