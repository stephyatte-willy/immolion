// app/lib/sms.ts
import { sendEmail } from './email';

// Mapping des opérateurs ivoiriens
const getOperatorEmail = (telephone: string): string | null => {
  // Nettoyer le numéro
  const cleanNumber = telephone.replace(/\s+/g, '').replace(/^\+225/, '');
  
  // Détecter l'opérateur par le préfixe
  if (cleanNumber.startsWith('01') || cleanNumber.startsWith('07')) {
    return `${cleanNumber}@sms.orange.ci`;
  } else if (cleanNumber.startsWith('05') || cleanNumber.startsWith('06')) {
    return `${cleanNumber}@mtn.ci`;
  }
  return null;
};

export async function sendSms(telephone: string, message: string): Promise<boolean> {
  try {
    const smsEmail = getOperatorEmail(telephone);
    
    if (!smsEmail) {
      console.error('❌ Opérateur non supporté pour ce numéro');
      return false;
    }

    // Envoyer par email vers la passerelle SMS
    const result = await sendEmail({
      to: smsEmail,
      subject: '', // Laissez vide
      text: message,
      html: message
    });

    if (result) {
      console.log(`✅ SMS envoyé à ${telephone} via ${smsEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error);
    return false;
  }
}