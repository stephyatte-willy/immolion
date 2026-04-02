import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';

// GET - Récupérer les conditions de location d'un contrat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const conditions = await queryRows(
      `SELECT * FROM conditions_location WHERE contrat_id = ? ORDER BY id DESC LIMIT 1`,
      [id]
    ) as any[];
    
    if (conditions.length === 0) {
      return NextResponse.json({
        success: true,
        conditions: null
      });
    }
    
    return NextResponse.json({
      success: true,
      conditions: conditions[0]
    });
  } catch (error) {
    console.error('❌ Erreur GET conditions:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}