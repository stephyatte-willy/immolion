import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';

// GET - Récupérer tous les lots d'un bien
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
        etage, 
        type_lot, 
        nom, 
        surface, 
        pieces, 
        loyer_mensuel, 
        charges, 
        depot_garantie, 
        prix_vente, 
        description, 
        statut,
        quantite
      FROM lots 
      WHERE bien_principal_id = ? 
      ORDER BY CAST(numero_lot AS UNSIGNED), numero_lot`,
      [id]
    ) as any[];

    return NextResponse.json({
      success: true,
      lots: lots || []
    });
  } catch (error) {
    console.error('❌ Erreur GET lots:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}