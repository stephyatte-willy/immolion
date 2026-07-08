import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';

// GET - Récupérer toutes les attributions de biens à des acquéreurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bien_id = searchParams.get('bien_id');
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (bien_id) {
      whereClause += ' AND ab.bien_id = ?';
      params.push(bien_id);
    }
    
    const attributions = await queryRows(
      `SELECT 
        ab.id,
        ab.acquereur_id,
        ab.bien_id,
        ab.date_attribution,
        a.nom as acquereur_nom,
        a.prenom as acquereur_prenom,
        a.raison_sociale as acquereur_raison_sociale,
        a.type_acquereur as acquereur_type
       FROM acquereur_biens ab
       LEFT JOIN acquereurs a ON ab.acquereur_id = a.id
       ${whereClause}
       ORDER BY ab.date_attribution DESC`,
      params
    ) as any[];
    
    return NextResponse.json({
      success: true,
      attributions
    });
  } catch (error) {
    console.error('❌ Erreur GET attributions:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}