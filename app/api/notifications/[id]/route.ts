import { NextRequest, NextResponse } from 'next/server';
import { queryInsert } from '@/app/lib/database';

// PUT - Marquer une notification comme lue
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { lu } = body;

    await queryInsert(
      `UPDATE notifications SET lu = ? WHERE id = ?`,
      [lu ? 1 : 0, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Notification mise à jour'
    });
  } catch (error) {
    console.error('❌ Erreur PUT notification:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}