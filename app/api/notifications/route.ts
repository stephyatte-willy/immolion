import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { validateSession } from '@/app/lib/auth';
import { cookies } from 'next/headers';

// GET - Récupérer les notifications de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, erreur: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const user = await validateSession(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, erreur: 'Session invalide' },
        { status: 401 }
      );
    }

    const notifications = await queryRows(
      `SELECT * FROM notifications 
       WHERE utilisateur_id = ? 
       ORDER BY date_envoi DESC 
       LIMIT 20`,
      [user.id]
    ) as any[];

    return NextResponse.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('❌ Erreur GET notifications:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une notification (pour les événements système)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { utilisateur_id, titre, message, type, lien } = body;

    if (!utilisateur_id || !titre || !message) {
      return NextResponse.json(
        { success: false, erreur: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const result = await queryInsert(
      `INSERT INTO notifications (utilisateur_id, titre, message, type, lien, date_envoi)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [utilisateur_id, titre, message, type || 'INFO', lien || null]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Erreur POST notification:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}