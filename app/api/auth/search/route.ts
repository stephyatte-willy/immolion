// app/api/auth/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';  // ✅ Chemin absolu

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, erreur: 'Email requis' },
        { status: 400 }
      );
    }
    
    const users = await queryRows(
      'SELECT nom, prenom, role FROM utilisateurs WHERE email = ? AND actif = 1',
      [email]
    ) as any[];
    
    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        utilisateur: null,
      });
    }
    
    const user = users[0];
    return NextResponse.json({
      success: true,
      utilisateur: {
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('❌ Erreur recherche:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}