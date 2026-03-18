import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des paiements avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locataire_id = searchParams.get('locataire_id');
    const contrat_id = searchParams.get('contrat_id');
    const bien_id = searchParams.get('bien_id');
    const statut = searchParams.get('statut');
    const mois = searchParams.get('mois');
    const annee = searchParams.get('annee');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (locataire_id) {
      whereClause += ' AND p.locataire_id = ?';
      params.push(locataire_id);
    }

    if (contrat_id) {
      whereClause += ' AND p.contrat_id = ?';
      params.push(contrat_id);
    }

    if (bien_id) {
      whereClause += ' AND p.bien_id = ?';
      params.push(bien_id);
    }

    if (statut) {
      whereClause += ' AND p.statut = ?';
      params.push(statut);
    }

    if (mois) {
      whereClause += ' AND p.mois_concerne = ?';
      params.push(mois);
    }

    if (annee) {
      whereClause += ' AND YEAR(p.date_paiement) = ?';
      params.push(parseInt(annee));
    }

    const paiements = await queryRows(
      `SELECT p.*,
        c.numero_contrat as contrat_numero,
        b.nom as bien_nom,
        CONCAT(l.prenom, ' ', l.nom) as locataire_nom_complet
       FROM paiements p
       LEFT JOIN contrats c ON p.contrat_id = c.id
       LEFT JOIN biens b ON p.bien_id = b.id
       LEFT JOIN locataires l ON p.locataire_id = l.id
       ${whereClause}
       ORDER BY p.date_paiement DESC`,
      params
    ) as any[];

    return NextResponse.json({
      success: true,
      paiements
    });
  } catch (error) {
    console.error('❌ Erreur GET paiements:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      contrat_id,
      bien_id,
      locataire_id,
      type_paiement,
      montant,
      date_paiement,
      date_echeance,
      mode_paiement,
      reference,
      statut,
      mois_concerne,
      penalite,
      commentaire,
      gestionnaire_id
    } = body;

    // Validation
    const errors = [];
    if (!contrat_id) errors.push('contrat_id manquant');
    if (!bien_id) errors.push('bien_id manquant');
    if (!locataire_id) errors.push('locataire_id manquant');
    if (!montant) errors.push('montant manquant');
    if (!date_paiement) errors.push('date_paiement manquante');
    if (!mode_paiement) errors.push('mode_paiement manquant');

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants', details: errors },
        { status: 400 }
      );
    }

    // Générer une référence unique si non fournie
    let referenceFinale = reference;
    if (!referenceFinale) {
      const now = new Date();
      const annee = now.getFullYear();
      const mois = String(now.getMonth() + 1).padStart(2, '0');
      const count = await queryRows(
        'SELECT COUNT(*) as total FROM paiements WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?',
        [annee, parseInt(mois)]
      ) as any[];
      referenceFinale = `PAY-${annee}${mois}-${(count[0]?.total + 1).toString().padStart(4, '0')}`;
    }

    // ✅ GÉNÉRATION DU NUMÉRO DE QUITTANCE CORRIGÉE
    const datePaiementObj = new Date(date_paiement);
    const annee = datePaiementObj.getFullYear();
    const mois = String(datePaiementObj.getMonth() + 1).padStart(2, '0');
    const moisNum = parseInt(mois);

    // ✅ Vérifier si un compteur existe déjà pour ce mois
    let compteur = await queryRows(
      'SELECT valeur FROM compteurs WHERE type = ? AND annee = ? AND mois = ?',
      ['QUITTANCE', annee, moisNum]
    ) as any[];

    let compteurValeur;

    if (compteur.length === 0) {
      // ✅ Créer un nouveau compteur
      compteurValeur = 1;
      await queryInsert(
        'INSERT INTO compteurs (type, valeur, annee, mois) VALUES (?, ?, ?, ?)',
        ['QUITTANCE', 1, annee, moisNum]
      );
    } else {
      // ✅ Mettre à jour le compteur existant
      compteurValeur = compteur[0].valeur + 1;
      await queryInsert(
        'UPDATE compteurs SET valeur = ? WHERE type = ? AND annee = ? AND mois = ?',
        [compteurValeur, 'QUITTANCE', annee, moisNum]
      );
    }

    // Format: QUIT-2026-03-000001
    const numeroQuittance = `QUIT-${annee}-${mois}-${String(compteurValeur).padStart(6, '0')}`;

    // Insérer le paiement
    const result = await queryInsert(
      `INSERT INTO paiements (
        contrat_id, bien_id, locataire_id, gestionnaire_id,
        type_paiement, montant, date_paiement, date_echeance,
        mode_paiement, reference, statut, mois_concerne,
        penalite, commentaire, numero_quittance, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parseInt(contrat_id),
        parseInt(bien_id),
        parseInt(locataire_id),
        gestionnaire_id ? parseInt(gestionnaire_id) : null,
        type_paiement || 'LOYER',
        parseFloat(montant),
        date_paiement,
        date_echeance || null,
        mode_paiement,
        referenceFinale,
        statut || 'EFFECTUE',
        mois_concerne || null,
        penalite ? parseFloat(penalite) : 0,
        commentaire || null,
        numeroQuittance
      ]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.insertId,
      reference: referenceFinale,
      numero_quittance: numeroQuittance,
      message: 'Paiement enregistré avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur POST paiement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}