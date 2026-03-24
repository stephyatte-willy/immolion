import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { hashPassword } from '@/app/lib/bcrypt';
import { sendEmail } from '@/app/lib/email';

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

    // ✅ Envoyer l'email avec le nouveau mot de passe
    const entreprise = await queryRows('SELECT nom, email, telephone, logo_url FROM entreprise LIMIT 1') as any[];
    const entrepriseNom = entreprise[0]?.nom || 'ImmoLion Gestion';
    
    const emailEnvoye = await sendEmail({
      to: utilisateur.email,
      subject: 'Réinitialisation de votre mot de passe - ImmoLion',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #D4AF37, #996515);
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .password-box {
              background: #f8f9fa;
              border: 2px dashed #D4AF37;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              margin: 20px 0;
            }
            .password {
              font-size: 24px;
              font-weight: bold;
              color: #D4AF37;
              letter-spacing: 2px;
              font-family: monospace;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #D4AF37, #996515);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              background: #f5f5f5;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 ${entrepriseNom}</h1>
              <p style="color: white; margin: 5px 0 0;">Gestion Immobilière</p>
            </div>
            <div class="content">
              <h2>Bonjour ${utilisateur.prenom} ${utilisateur.nom},</h2>
              <p>Nous avons reçu une demande de réinitialisation de votre mot de passe.</p>
              <p>Votre nouveau mot de passe temporaire est :</p>
              <div class="password-box">
                <span class="password">${nouveauMotDePasse}</span>
              </div>
              <p><strong>⚠️ Important :</strong> Nous vous recommandons de changer ce mot de passe dès votre prochaine connexion.</p>
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/connexion" class="button">Se connecter</a>
              </p>
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${entrepriseNom} - Tous droits réservés</p>
              <p>${entreprise[0]?.telephone ? `📞 ${entreprise[0].telephone}` : ''} ${entreprise[0]?.email ? `✉️ ${entreprise[0].email}` : ''}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bonjour ${utilisateur.prenom} ${utilisateur.nom},\n\nVotre nouveau mot de passe temporaire est : ${nouveauMotDePasse}\n\nNous vous recommandons de le changer dès votre prochaine connexion.\n\nCordialement,\n${entrepriseNom}`
    });

    if (!emailEnvoye) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    console.log(`✅ Email envoyé à ${utilisateur.email} avec le nouveau mot de passe`);

    return NextResponse.json({
      success: true,
      message: `Un nouveau mot de passe a été envoyé à l'adresse ${utilisateur.email}. Vérifiez vos spams si vous ne le recevez pas.`
    });

  } catch (error) {
    console.error('❌ Erreur reset password:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}