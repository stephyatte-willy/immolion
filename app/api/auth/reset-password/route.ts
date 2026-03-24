import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { hashPassword } from '@/app/lib/bcrypt';

// POST - Réinitialiser le mot de passe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, telephone, method } = body;

    if (!email && !telephone) {
      return NextResponse.json(
        { success: false, erreur: 'Email ou téléphone requis' },
        { status: 400 }
      );
    }

    let utilisateur = null;

    // Rechercher l'utilisateur par email ou téléphone
    if (method === 'email' && email) {
      const users = await queryRows(
        'SELECT id, email, nom, prenom, telephone FROM utilisateurs WHERE email = ?',
        [email]
      ) as any[];
      if (users.length > 0) utilisateur = users[0];
    } else if (method === 'telephone' && telephone) {
      const users = await queryRows(
        'SELECT id, email, nom, prenom, telephone FROM utilisateurs WHERE telephone = ?',
        [telephone]
      ) as any[];
      if (users.length > 0) utilisateur = users[0];
    }

    if (!utilisateur) {
      return NextResponse.json(
        { success: false, erreur: 'Aucun compte trouvé avec ces informations' },
        { status: 404 }
      );
    }

    // Générer un nouveau mot de passe temporaire
    const nouveauMotDePasse = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(nouveauMotDePasse);

    // Mettre à jour le mot de passe
    await queryInsert(
      'UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?',
      [hashedPassword, utilisateur.id]
    );

    console.log(`✅ Nouveau mot de passe pour ${utilisateur.email}: ${nouveauMotDePasse}`);

    return NextResponse.json({
      success: true,
      message: `Un nouveau mot de passe a été généré. Vérifiez votre ${method === 'email' ? 'email' : 'téléphone'}.`,

      motDePasse: process.env.NODE_ENV === 'development' ? nouveauMotDePasse : undefined
    });

  } catch (error) {
    console.error('❌ Erreur reset password:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}