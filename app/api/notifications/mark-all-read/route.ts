import { NextRequest, NextResponse } from 'next/server';
import { queryInsert } from '@/app/lib/database';
import { validateSession } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
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

    await queryInsert(
      `UPDATE notifications SET lu = 1 WHERE utilisateur_id = ?`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Toutes les notifications marquées comme lues'
    });
  } catch (error) {
    console.error('❌ Erreur mark-all-read:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}