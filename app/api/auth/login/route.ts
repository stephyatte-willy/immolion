// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession } from './../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, motDePasse } = body;
    
    if (!email || !motDePasse) {
      return NextResponse.json(
        { success: false, erreur: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }
    
    const result = await authenticateUser(email, motDePasse);
    
    if (!result.success || !result.utilisateur) {
      return NextResponse.json(
        { success: false, erreur: result.erreur || 'Authentification échouée' },
        { status: 401 }
      );
    }
    
    // ✅ CORRECTION : Récupérer l'adresse IP correctement
    const userAgent = request.headers.get('user-agent') || undefined;
    
    // Méthode 1 : Via les en-têtes standard
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    // Méthode 2 : Via l'API Next.js (recommandée)
    let ipAddress = undefined;
    
    if (process.env.NODE_ENV === 'development') {
      // En développement, on peut utiliser une IP fictive
      ipAddress = '127.0.0.1';
    } else {
      // En production, on utilise les en-têtes
      ipAddress = forwardedFor?.split(',')[0] || realIp || request.headers.get('x-forwarded-for') || undefined;
    }
    
    const token = await createSession(
      result.utilisateur.id,
      userAgent,
      ipAddress
    );
    
    // Définir le cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 jours
      path: '/',
    });
    
    return NextResponse.json({
      success: true,
      utilisateur: result.utilisateur,
    });
  } catch (error) {
    console.error('Erreur login:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}