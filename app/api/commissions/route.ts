// app/api/commissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des commissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const proprietaire_id = searchParams.get('proprietaire_id');
    const statut = searchParams.get('statut');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (proprietaire_id) {
      whereClause += ' AND cp.proprietaire_id = ?';
      params.push(proprietaire_id);
    }

    if (statut) {
      whereClause += ' AND cp.statut = ?';
      params.push(statut);
    }

    const commissions = await queryRows(
      `SELECT cp.*,
        prop.nom as proprietaire_nom,
        prop.prenom as proprietaire_prenom,
        b.nom as bien_nom,
        c.numero_contrat
       FROM commissions_proprietaires cp
       LEFT JOIN proprietaires prop ON cp.proprietaire_id = prop.id
       LEFT JOIN biens b ON cp.bien_id = b.id
       LEFT JOIN contrats c ON cp.contrat_id = c.id
       ${whereClause}
       ORDER BY cp.date_commission DESC`,
      params
    ) as any[];

    return NextResponse.json({
      success: true,
      commissions
    });
  } catch (error) {
    console.error('Erreur GET commissions:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
