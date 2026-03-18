// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/app/lib/auth';
import { cookies } from 'next/headers';

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
      cookieStore.delete('session_token');
      return NextResponse.json(
        { success: false, erreur: 'Session invalide' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      utilisateur: user,
    });
  } catch (error) {
    console.error('Erreur me:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}