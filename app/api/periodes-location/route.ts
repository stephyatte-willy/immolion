import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contrat_id = searchParams.get('contrat_id');
    const statut = searchParams.get('statut');
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (contrat_id) {
      whereClause += ' AND contrat_id = ?';
      params.push(contrat_id);
    }
    
    if (statut) {
      whereClause += ' AND statut = ?';
      params.push(statut);
    }
    
    const periodes = await queryRows(
      `SELECT * FROM periodes_location
       ${whereClause}
       ORDER BY mois_concerne ASC`,
      params
    ) as any[];
    
    // Formater les dates
    const periodesFormatted = periodes.map(p => ({
      ...p,
      mois_concerne: new Date(p.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      date_echeance: p.date_echeance ? new Date(p.date_echeance).toLocaleDateString('fr-FR') : null,
      date_paiement: p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : null
    }));
    
    return NextResponse.json({
      success: true,
      periodes: periodesFormatted
    });
    
  } catch (error) {
    console.error('❌ Erreur GET périodes:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}