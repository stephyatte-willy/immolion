import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/app/lib/database';

// GET - Récupérer tous les lots disponibles (DISPONIBLE ou RESERVE)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bien_id = searchParams.get('bien_id');

    let sql = `
      SELECT 
        l.id,
        l.numero_lot,
        l.etage,
        l.type_lot,
        l.nom,
        l.surface,
        l.pieces,
        l.loyer_mensuel,
        l.charges,
        l.statut,
        b.id as immeuble_id,
        b.nom as immeuble_nom,
        b.type_bien as immeuble_type,
        b.adresse as immeuble_adresse,
        b.commune as immeuble_commune,
        b.ville as immeuble_ville
      FROM lots l
      LEFT JOIN biens b ON l.bien_principal_id = b.id
      WHERE l.statut = 'DISPONIBLE' OR l.statut = 'RESERVE'
    `;
    
    const params: any[] = [];
    
    if (bien_id && bien_id !== '') {
      sql += ' AND l.bien_principal_id = ?';
      params.push(parseInt(bien_id));
    }
    
    sql += ' ORDER BY l.bien_principal_id, l.numero_lot';
    
    const lots = await queryRows(sql, params) as any[];
    
    const lotsFormatted = lots.map(l => ({
      id: l.id,
      numero_lot: l.numero_lot,
      etage: l.etage,
      type_lot: l.type_lot,
      nom: l.nom,
      surface: l.surface,
      pieces: l.pieces,
      loyer_mensuel: parseFloat(l.loyer_mensuel) || 0,
      charges: parseFloat(l.charges) || 0,
      statut: l.statut,
      immeuble: l.immeuble_id ? {
        id: l.immeuble_id,
        nom: l.immeuble_nom,
        type_bien: l.immeuble_type,
        adresse: l.immeuble_adresse,
        commune: l.immeuble_commune,
        ville: l.immeuble_ville
      } : null
    }));

    return NextResponse.json({
      success: true,
      lots: lotsFormatted
    });
  } catch (error) {
    console.error('❌ Erreur GET lots disponibles:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}