import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const annee = parseInt(searchParams.get('annee') || new Date().getFullYear().toString());
    const mois = parseInt(searchParams.get('mois') || (new Date().getMonth() + 1).toString());

    // Récupérer ou créer le compteur pour le mois spécifié
    let compteur = await queryRows(
      'SELECT valeur FROM compteurs WHERE type = ? AND annee = ? AND mois = ?',
      ['QUITTANCE', annee, mois]
    ) as any[];

    let nouvelleValeur = 1;

    if (compteur.length === 0) {
      // Créer un nouveau compteur pour ce mois
      await queryInsert(
        'INSERT INTO compteurs (type, valeur, annee, mois) VALUES (?, ?, ?, ?)',
        ['QUITTANCE', 1, annee, mois]
      );
    } else {
      // Incrémenter le compteur existant
      nouvelleValeur = compteur[0].valeur + 1;
      await queryInsert(
        'UPDATE compteurs SET valeur = ? WHERE type = ? AND annee = ? AND mois = ?',
        [nouvelleValeur, 'QUITTANCE', annee, mois]
      );
    }

    // Formater le numéro de quittance: QUIT-2026-03-000001
    const moisFormate = String(mois).padStart(2, '0');
    const numeroQuittance = `QUIT-${annee}-${moisFormate}-${String(nouvelleValeur).padStart(6, '0')}`;

    return NextResponse.json({
      success: true,
      numero: numeroQuittance
    });
  } catch (error) {
    console.error('❌ Erreur génération numéro quittance:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}