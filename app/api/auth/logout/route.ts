// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from './../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    
    if (token) {
      await destroySession(token);
      cookieStore.delete('session_token');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur logout:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}