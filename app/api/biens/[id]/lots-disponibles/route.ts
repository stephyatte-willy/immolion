import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';

// GET - Récupérer les lots disponibles d'un bien
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const lots = await queryRows(
      `SELECT 
        id, 
        numero_lot, 
        type_lot, 
        surface, 
        pieces, 
        loyer_mensuel, 
        charges, 
        statut
      FROM lots 
      WHERE bien_principal_id = ? AND statut = 'DISPONIBLE'
      ORDER BY CAST(numero_lot AS UNSIGNED), numero_lot`,
      [id]
    ) as any[];

    return NextResponse.json({
      success: true,
      lots: lots || []
    });
  } catch (error) {
    console.error('❌ Erreur GET lots disponibles:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}