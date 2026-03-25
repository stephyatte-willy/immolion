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
    const type_paiement = searchParams.get('type_paiement');
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

    if (type_paiement) {
      const types = type_paiement.split(',');
      if (types.length > 1) {
        whereClause += ' AND p.type_paiement IN (' + types.map(() => '?').join(',') + ')';
        params.push(...types);
      } else {
        whereClause += ' AND p.type_paiement = ?';
        params.push(type_paiement);
      }
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
    c.type_contrat,
    c.prix_vente,
    c.loyer_mensuel,
    b.nom as bien_nom,
    l.nom as locataire_nom,
    l.prenom as locataire_prenom,
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
      type_vente,
      montant,
      montant_total_vente,
      versement_numero,
      echeancier_id,
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

    console.log('📦 Données reçues pour paiement:', {
      contrat_id, type_paiement, type_vente, montant, date_paiement
    });

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

    // ✅ Récupérer les informations du contrat pour validation
    const contrats = await queryRows(
      'SELECT type_contrat, prix_vente, loyer_mensuel FROM contrats WHERE id = ?',
      [parseInt(contrat_id)]
    ) as any[];

    if (contrats.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Contrat non trouvé' },
        { status: 404 }
      );
    }

    const contrat = contrats[0];
    const isVente = contrat.type_contrat === 'VENTE';
    const montantSaisi = parseFloat(montant);

    // ✅ Validation spécifique pour les ventes
    if (isVente) {
      if (!type_vente) {
        return NextResponse.json(
          { success: false, erreur: 'Le type de versement est requis pour une vente' },
          { status: 400 }
        );
      }

      // Calculer le total déjà versé
      const totalVerse = await queryRows(
        `SELECT SUM(montant) as total FROM paiements 
         WHERE contrat_id = ? AND type_paiement IN ('ACOMPTE', 'VERSEMENT', 'SOLDE')`,
        [parseInt(contrat_id)]
      ) as any[];

      const totalDejaVerse = totalVerse[0]?.total || 0;
      const nouveauTotal = totalDejaVerse + montantSaisi;
      const prixVente = parseFloat(contrat.prix_vente || '0');

      if (prixVente <= 0) {
        return NextResponse.json(
          { success: false, erreur: 'Prix de vente invalide' },
          { status: 400 }
        );
      }

      if (type_vente === 'ACOMPTE') {
        if (montantSaisi > prixVente) {
          return NextResponse.json(
            { success: false, erreur: "L'acompte ne peut pas dépasser le prix total" },
            { status: 400 }
          );
        }
      } else if (type_vente === 'VERSEMENT') {
        if (nouveauTotal > prixVente) {
          return NextResponse.json(
            { success: false, erreur: 'Le total des versements dépasse le prix de vente' },
            { status: 400 }
          );
        }
      } else if (type_vente === 'SOLDE') {
        if (nouveauTotal !== prixVente) {
          return NextResponse.json(
            { success: false, erreur: 'Le solde doit correspondre au prix total' },
            { status: 400 }
          );
        }
      }
    }

    // ✅ Générer une référence unique si non fournie
let referenceFinale = reference;
if (!referenceFinale) {
  const now = new Date();
  const annee = now.getFullYear();
  const mois = String(now.getMonth() + 1).padStart(2, '0');
  
  // Incrémenter le compteur global
  const compteurResult = await queryRows(
    `INSERT INTO compteurs (type, valeur, annee, mois) 
     VALUES ('REFERENCE', 1, ?, ?) 
     ON DUPLICATE KEY UPDATE valeur = valeur + 1`,
    [annee, parseInt(mois)]
  ) as any[];
  
  // Récupérer la nouvelle valeur
  const compteur = await queryRows(
    'SELECT valeur FROM compteurs WHERE type = ? AND annee = ? AND mois = ?',
    ['REFERENCE', annee, parseInt(mois)]
  ) as any[];
  
  const compteurValeur = compteur[0]?.valeur || 1;
  referenceFinale = `PAY-${annee}${mois}-${String(compteurValeur).padStart(4, '0')}`;
}

    // ✅ Générer le numéro de quittance
    const datePaiementObj = new Date(date_paiement);
    const annee = datePaiementObj.getFullYear();
    const mois = String(datePaiementObj.getMonth() + 1).padStart(2, '0');
    const moisNum = parseInt(mois);

    // Vérifier si un compteur existe déjà pour ce mois
    let compteur = await queryRows(
      'SELECT valeur FROM compteurs WHERE type = ? AND annee = ? AND mois = ?',
      ['QUITTANCE', annee, moisNum]
    ) as any[];

    let compteurValeur;

    if (compteur.length === 0) {
      compteurValeur = 1;
      await queryInsert(
        'INSERT INTO compteurs (type, valeur, annee, mois) VALUES (?, ?, ?, ?)',
        ['QUITTANCE', 1, annee, moisNum]
      );
    } else {
      compteurValeur = compteur[0].valeur + 1;
      await queryInsert(
        'UPDATE compteurs SET valeur = ? WHERE type = ? AND annee = ? AND mois = ?',
        [compteurValeur, 'QUITTANCE', annee, moisNum]
      );
    }

    // Format: QUIT-2026-03-000001
    const numeroQuittance = `QUIT-${annee}-${mois}-${String(compteurValeur).padStart(6, '0')}`;

    // ✅ Déterminer le type_paiement final
    const typePaiementFinal = isVente ? type_vente : (type_paiement || 'LOYER');

    // ✅ Insérer le paiement
    const result = await queryInsert(
      `INSERT INTO paiements (
        contrat_id, bien_id, locataire_id, gestionnaire_id,
        type_paiement, type_vente, montant, montant_total_vente,
        versement_numero, echeancier_id, date_paiement, date_echeance,
        mode_paiement, reference, numero_quittance, statut, mois_concerne,
        penalite, commentaire, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parseInt(contrat_id),
        parseInt(bien_id),
        parseInt(locataire_id),
        gestionnaire_id ? parseInt(gestionnaire_id) : null,
        typePaiementFinal,
        isVente ? type_vente : null,
        montantSaisi,
        isVente && montant_total_vente ? parseFloat(montant_total_vente) : null,
        isVente && versement_numero ? parseInt(versement_numero) : null,
        isVente ? (echeancier_id || `VENTE-${contrat_id}-${annee}`) : null,
        date_paiement,
        date_echeance || null,
        mode_paiement,
        referenceFinale,
        numeroQuittance,
        statut || 'EFFECTUE',
        !isVente ? (mois_concerne || null) : null,
        !isVente && penalite ? parseFloat(penalite) : 0,
        commentaire || null
      ]
    );

    if (!result.success) {
      console.error('❌ Erreur insertion:', result);
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
      message: isVente ? 'Versement enregistré avec succès' : 'Paiement enregistré avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur POST paiement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}