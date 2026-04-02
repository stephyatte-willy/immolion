import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier si le lot existe
    const lot = await queryRows(
      'SELECT id, statut FROM lots WHERE id = ?',
      [id]
    ) as any[];
    
    if (lot.length === 0) {
      return NextResponse.json({
        success: false,
        disponible: false,
        message: 'Lot non trouvé'
      });
    }
    
    // Vérifier si le lot est déjà attribué à un locataire
    const locataire = await queryRows(
      'SELECT id, nom, prenom FROM locataires WHERE lot_id = ?',
      [id]
    ) as any[];
    
    if (locataire.length > 0) {
      return NextResponse.json({
        success: true,
        disponible: false,
        message: `Ce lot est déjà attribué à ${locataire[0].prenom} ${locataire[0].nom}`,
        attribue_a: locataire[0]
      });
    }
    
    // Vérifier le statut du lot
    if (lot[0].statut === 'LOUE') {
      return NextResponse.json({
        success: true,
        disponible: false,
        message: 'Ce lot est déjà loué'
      });
    }
    
    if (lot[0].statut === 'RESERVE') {
      return NextResponse.json({
        success: true,
        disponible: false,
        message: 'Ce lot est déjà réservé'
      });
    }
    
    return NextResponse.json({
      success: true,
      disponible: true,
      message: 'Lot disponible'
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification lot:', error);
    return NextResponse.json(
      { success: false, disponible: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}