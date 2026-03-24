import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { hashPassword } from '@/app/lib/bcrypt';
import { sendEmail } from '@/app/lib/email';

// Fonction pour envoyer un SMS via passerelle email (Orange/MTN)
async function sendSmsViaEmail(telephone: string, message: string): Promise<boolean> {
  try {
    // Nettoyer le numéro de téléphone
    const cleanNumber = telephone.replace(/\s+/g, '').replace(/^\+225/, '');
    
    // Déterminer l'opérateur par le préfixe
    let smsEmail = '';
    
    // Orange CI : 01, 07
    if (cleanNumber.startsWith('01') || cleanNumber.startsWith('07')) {
      smsEmail = `${cleanNumber}@sms.orange.ci`;
    }
    // MTN CI : 05, 06
    else if (cleanNumber.startsWith('05') || cleanNumber.startsWith('06')) {
      smsEmail = `${cleanNumber}@mtn.ci`;
    }
    // Moov CI : 04, 08
    else if (cleanNumber.startsWith('04') || cleanNumber.startsWith('08')) {
      smsEmail = `${cleanNumber}@sms.moov.ci`;
    }
    else {
      console.error('❌ Opérateur non supporté pour ce numéro:', cleanNumber);
      return false;
    }

    console.log(`📱 Envoi SMS à ${telephone} via ${smsEmail}`);
    
    // Envoyer par email vers la passerelle SMS
    const result = await sendEmail({
      to: smsEmail,
      subject: '',
      text: message,
      html: message
    });

    if (result) {
      console.log(`✅ SMS envoyé avec succès à ${telephone}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error);
    return false;
  }
}

// POST - Réinitialiser le mot de passe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, telephone, method } = body;

    console.log('📦 Données reçues:', { email, telephone, method });

    // Validation des entrées
    if (method === 'email' && !email) {
      return NextResponse.json(
        { success: false, erreur: 'Email requis' },
        { status: 400 }
      );
    }

    if (method === 'telephone' && !telephone) {
      return NextResponse.json(
        { success: false, erreur: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    let utilisateur = null;

    // Rechercher l'utilisateur
    if (method === 'email' && email) {
      const users = await queryRows(
        'SELECT id, email, nom, prenom, telephone FROM utilisateurs WHERE email = ?',
        [email]
      ) as any[];
      if (users.length > 0) utilisateur = users[0];
    } else if (method === 'telephone' && telephone) {
      // Nettoyer le numéro pour la recherche
      const cleanTelephone = telephone.replace(/\s+/g, '').replace(/^\+225/, '');
      const telephoneWithCode = `+225${cleanTelephone}`;
      
      const users = await queryRows(
        'SELECT id, email, nom, prenom, telephone FROM utilisateurs WHERE telephone = ? OR telephone = ?',
        [cleanTelephone, telephoneWithCode]
      ) as any[];
      if (users.length > 0) utilisateur = users[0];
    }

    if (!utilisateur) {
      return NextResponse.json(
        { success: false, erreur: 'Aucun compte trouvé avec ces informations' },
        { status: 404 }
      );
    }

    console.log('👤 Utilisateur trouvé:', utilisateur.email);

    // Générer un nouveau mot de passe temporaire
    const nouveauMotDePasse = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(nouveauMotDePasse);

    // Mettre à jour le mot de passe
    const updateResult = await queryInsert(
      'UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?',
      [hashedPassword, utilisateur.id]
    );

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      );
    }

    console.log('✅ Mot de passe mis à jour');

    // Récupérer les informations de l'entreprise
    const entreprise = await queryRows('SELECT nom, email, telephone, logo_url FROM entreprise LIMIT 1') as any[];
    const entrepriseNom = entreprise[0]?.nom || 'ImmoLion Gestion';
    const entrepriseEmail = entreprise[0]?.email || 'contact@immolion.ci';
    const entrepriseTelephone = entreprise[0]?.telephone || '+225 00 00 00 00';

    // Envoyer selon la méthode choisie
    let envoiReussi = false;

    if (method === 'email') {
      // ✅ Envoi par email
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #D4AF37, #996515); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .password-box { background: #f8f9fa; border: 2px dashed #D4AF37; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
            .password { font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px; font-family: monospace; }
            .button { display: inline-block; background: linear-gradient(135deg, #D4AF37, #996515); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
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
              <p>📞 ${entrepriseTelephone} ✉️ ${entrepriseEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      envoiReussi = await sendEmail({
        to: utilisateur.email,
        subject: 'Réinitialisation de votre mot de passe - ImmoLion',
        html: emailHtml,
        text: `Bonjour ${utilisateur.prenom} ${utilisateur.nom},\n\nVotre nouveau mot de passe temporaire est : ${nouveauMotDePasse}\n\nChangez-le dès votre prochaine connexion.\n\nCordialement,\n${entrepriseNom}`
      });
      
      console.log(`📧 Email envoyé à ${utilisateur.email}: ${envoiReussi ? 'OK' : 'ÉCHEC'}`);

    } else if (method === 'telephone' && utilisateur.telephone) {
      // ✅ Envoi par SMS via passerelle email
      const messageSms = `ImmoLion - Votre nouveau mot de passe : ${nouveauMotDePasse}. Changez-le lors de votre prochaine connexion.`;
      envoiReussi = await sendSmsViaEmail(utilisateur.telephone, messageSms);
      console.log(`📱 SMS envoyé à ${utilisateur.telephone}: ${envoiReussi ? 'OK' : 'ÉCHEC'}`);
    }

    if (!envoiReussi) {
      return NextResponse.json(
        { success: false, erreur: `Erreur lors de l'envoi du ${method === 'email' ? 'email' : 'SMS'}. Vérifiez que l'adresse est correcte.` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: method === 'email' 
        ? `Un nouveau mot de passe a été envoyé à l'adresse ${utilisateur.email}. Vérifiez vos spams.`
        : `Un nouveau mot de passe a été envoyé par SMS au ${utilisateur.telephone}. Vérifiez vos messages.`
    });

  } catch (error) {
    console.error('❌ Erreur reset password:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur. Veuillez réessayer plus tard.' },
      { status: 500 }
    );
  }
}