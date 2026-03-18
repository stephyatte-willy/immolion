import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { hashPassword } from '@/app/lib/bcrypt';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// GET - Récupérer un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

// PUT - Modifier un utilisateur (pour le profil)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier si c'est un FormData (avec avatar) ou du JSON
    const contentType = request.headers.get('content-type') || '';
    
    let email, nom, prenom, telephone, motDePasse, avatar;
    
    if (contentType.includes('multipart/form-data')) {
      // Traitement FormData (avec avatar)
      const formData = await request.formData();
      email = formData.get('email') as string;
      nom = formData.get('nom') as string;
      prenom = formData.get('prenom') as string;
      telephone = formData.get('telephone') as string;
      motDePasse = formData.get('motDePasse') as string;
      avatar = formData.get('avatar') as File | null;
    } else {
      // Traitement JSON (sans avatar)
      const body = await request.json();
      email = body.email;
      nom = body.nom;
      prenom = body.prenom;
      telephone = body.telephone;
      motDePasse = body.motDePasse;
    }

    // Récupérer l'utilisateur existant pour préserver ses données
    const existingUsers = await queryRows(
      'SELECT * FROM utilisateurs WHERE id = ?',
      [id]
    ) as any[];

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const existingUser = existingUsers[0];

    // Vérifier si l'email est déjà pris par un autre utilisateur
    if (email && email !== existingUser.email) {
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

    // Gérer l'avatar si présent
    let avatar_url = existingUser.avatar;
    
    if (avatar && avatar.size > 0) {
      // Créer le dossier uploads s'il n'existe pas
      const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Le dossier existe déjà
      }

      // Générer un nom unique
      const fileExtension = avatar.name.split('.').pop();
      const fileName = `avatar-${uuidv4()}.${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Sauvegarder le fichier
      const bytes = await avatar.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      avatar_url = `/uploads/avatars/${fileName}`;
    }

    // Construire la requête UPDATE en préservant les valeurs existantes
    const updateFields = [];
    const queryParams: any[] = [];

    // N'utiliser les nouvelles valeurs que si elles sont fournies
    // Sinon, garder les valeurs existantes
    updateFields.push('email = ?');
    queryParams.push(email || existingUser.email);

    updateFields.push('nom = ?');
    queryParams.push(nom || existingUser.nom);

    updateFields.push('prenom = ?');
    queryParams.push(prenom || existingUser.prenom);

    updateFields.push('telephone = ?');
    queryParams.push(telephone !== undefined ? telephone : existingUser.telephone);

    updateFields.push('avatar = ?');
    queryParams.push(avatar_url);

    // Ne mettre à jour le mot de passe que s'il est fourni
    if (motDePasse && motDePasse.trim() !== '') {
      const hashedPassword = await hashPassword(motDePasse);
      updateFields.push('mot_de_passe = ?');
      queryParams.push(hashedPassword);
    }

    // ✅ IMPORTANT: Préserver le rôle et le statut
    // On ne les modifie pas du tout dans cette requête
    // Donc pas de champ role ou actif dans updateFields

    // Ajouter l'ID à la fin
    queryParams.push(id);

    // Exécuter la mise à jour
    await queryInsert(
      `UPDATE utilisateurs SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );

    console.log('✅ Profil utilisateur mis à jour avec succès, ID:', id);

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès'
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

    // Supprimer l'utilisateur
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