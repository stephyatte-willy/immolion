// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from './lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Routes publiques
  if (path === '/connexion' || path === '/api/auth/login' || path === '/api/auth/register') {
    return NextResponse.next();
  }
  
  // Vérifier l'authentification pour les routes protégées
  const token = request.cookies.get('session_token')?.value;
  
  if (!token) {
    // API routes
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, erreur: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Pages
    return NextResponse.redirect(new URL('/connexion', request.url));
  }
  
  // Valider la session
  const user = await validateSession(token);
  
  if (!user) {
    // Session invalide
    const response = NextResponse.redirect(new URL('/connexion', request.url));
    response.cookies.delete('session_token');
    return response;
  }
  
  // Ajouter l'utilisateur aux headers pour les API
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id.toString());
  requestHeaders.set('x-user-role', user.role);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/biens/:path*',
    '/locataires/:path*',
    '/paiements/:path*',
    '/parametres/:path*',
    '/api/:path*',
  ],
};