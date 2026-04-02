// app/api/commissions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryInsert } from '@/app/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statut, date_versement, reference_versement, commentaire } = body;

    await queryInsert(
      `UPDATE commissions_proprietaires 
       SET statut = ?, 
           date_versement = ?, 
           reference_versement = ?,
           commentaire = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [statut, date_versement, reference_versement, commentaire, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Commission mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur PUT commission:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}