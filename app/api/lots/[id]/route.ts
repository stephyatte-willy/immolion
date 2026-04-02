import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// PUT - Modifier un lot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { statut } = body;
    
    const result = await queryInsert(
      'UPDATE lots SET statut = ?, updated_at = NOW() WHERE id = ?',
      [statut, id]
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la mise à jour du lot' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Lot mis à jour avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur PUT lot:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}