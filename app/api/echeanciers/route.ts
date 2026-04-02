import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// POST - Créer un échéancier pour une vente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contrat_id, nombre_versements, montant_total } = body;
    
    // Vérifier que le contrat existe et est une vente
    const contrats = await queryRows(
      'SELECT id, type_contrat, prix_vente FROM contrats WHERE id = ?',
      [contrat_id]
    ) as any[];
    
    if (contrats.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Contrat non trouvé' },
        { status: 404 }
      );
    }
    
    if (contrats[0].type_contrat !== 'VENTE') {
      return NextResponse.json(
        { success: false, erreur: 'Seuls les contrats de vente peuvent avoir un échéancier' },
        { status: 400 }
      );
    }
    
    const prixVente = parseFloat(contrats[0].prix_vente);
    
    if (montant_total !== prixVente) {
      return NextResponse.json(
        { success: false, erreur: 'Le montant total doit correspondre au prix de vente' },
        { status: 400 }
      );
    }
    
    // Générer un numéro d'échéancier unique
    const annee = new Date().getFullYear();
    const count = await queryRows(
      'SELECT COUNT(*) as total FROM echeanciers WHERE YEAR(created_at) = ?',
      [annee]
    ) as any[];
    const numeroEcheancier = `ECH-${annee}-${String(count[0]?.total + 1).padStart(4, '0')}`;
    
    // Créer l'échéancier
    const echeancierResult = await queryInsert(
      `INSERT INTO echeanciers (
        contrat_id, numero_echeancier, nombre_versements, montant_total, statut, created_at
      ) VALUES (?, ?, ?, ?, 'ACTIF', NOW())`,
      [contrat_id, numeroEcheancier, nombre_versements, montant_total]
    );
    
    if (!echeancierResult.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création de l\'échéancier' },
        { status: 500 }
      );
    }
    
    const echeancierId = echeancierResult.insertId;
    const montantParVersement = montant_total / nombre_versements;
    
    // Créer les versements
    const dateDebut = new Date();
    const versements = [];
    
    for (let i = 1; i <= nombre_versements; i++) {
      const dateEcheance = new Date(dateDebut);
      dateEcheance.setMonth(dateDebut.getMonth() + i);
      
      const versementResult = await queryInsert(
        `INSERT INTO versements_echeancier (
          echeancier_id, numero_versement, montant_prevu, date_echeance, statut
        ) VALUES (?, ?, ?, ?, 'EN_ATTENTE')`,
        [echeancierId, i, montantParVersement, dateEcheance.toISOString().split('T')[0]]
      );
      
      versements.push({
        id: versementResult.insertId,
        numero_versement: i,
        montant_prevu: montantParVersement,
        date_echeance: dateEcheance.toISOString().split('T')[0]
      });
    }
    
    return NextResponse.json({
      success: true,
      echeancier: {
        id: echeancierId,
        numero: numeroEcheancier,
        nombre_versements,
        montant_total,
        versements
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création échéancier:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET - Récupérer les échéanciers d'un contrat
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contrat_id = searchParams.get('contrat_id');
    
    if (!contrat_id) {
      return NextResponse.json(
        { success: false, erreur: 'contrat_id requis' },
        { status: 400 }
      );
    }
    
    const echeanciers = await queryRows(
      `SELECT e.*,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', v.id,
            'numero_versement', v.numero_versement,
            'montant_prevu', v.montant_prevu,
            'date_echeance', v.date_echeance,
            'montant_paye', v.montant_paye,
            'date_paiement', v.date_paiement,
            'statut', v.statut,
            'penalite', v.penalite
          )
          ORDER BY v.numero_versement
        ) FROM versements_echeancier v WHERE v.echeancier_id = e.id) as versements
       FROM echeanciers e
       WHERE e.contrat_id = ? AND e.statut = 'ACTIF'
       ORDER BY e.created_at DESC`,
      [contrat_id]
    ) as any[];
    
    const echeanciersFormatted = echeanciers.map(e => ({
      ...e,
      versements: e.versements ? JSON.parse(e.versements) : []
    }));
    
    return NextResponse.json({
      success: true,
      echeanciers: echeanciersFormatted
    });
    
  } catch (error) {
    console.error('❌ Erreur GET échéanciers:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}