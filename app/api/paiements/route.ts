import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des paiements avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locataire_id = searchParams.get('locataire_id');
    const acquereur_id = searchParams.get('acquereur_id');
    const contrat_id = searchParams.get('contrat_id');
    const bien_id = searchParams.get('bien_id');
    const proprietaire_id = searchParams.get('proprietaire_id');
    const statut = searchParams.get('statut');
    const type_paiement = searchParams.get('type_paiement');
    const type_transaction = searchParams.get('type_transaction');
    const mois = searchParams.get('mois');
    const annee = searchParams.get('annee');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (locataire_id) {
      whereClause += ' AND p.locataire_id = ?';
      params.push(locataire_id);
    }

    if (acquereur_id) {
      whereClause += ' AND p.acquereur_id = ?';
      params.push(acquereur_id);
    }

    if (contrat_id) {
      whereClause += ' AND p.contrat_id = ?';
      params.push(contrat_id);
    }

    if (bien_id) {
      whereClause += ' AND p.bien_id = ?';
      params.push(bien_id);
    }

    if (proprietaire_id) {
      whereClause += ' AND p.proprietaire_id = ?';
      params.push(proprietaire_id);
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

    if (type_transaction) {
      whereClause += ' AND p.type_transaction = ?';
      params.push(type_transaction);
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
        b.proprietaire_id,
        l.id as locataire_id_ref,
        l.nom as locataire_nom,
        l.prenom as locataire_prenom,
        a.id as acquereur_id_ref,
        a.nom as acquereur_nom,
        a.prenom as acquereur_prenom,
        a.type_acquereur as acquereur_type,
        a.raison_sociale as acquereur_raison_sociale,
        prop.nom as proprietaire_nom,
        prop.prenom as proprietaire_prenom,
        CONCAT(l.prenom, ' ', l.nom) as locataire_nom_complet,
        CONCAT(a.prenom, ' ', a.nom) as acquereur_nom_complet,
        (SELECT SUM(montant) FROM paiements 
         WHERE contrat_id = p.contrat_id 
         AND type_transaction = 'VENTE') as total_deja_verse
       FROM paiements p
       LEFT JOIN contrats c ON p.contrat_id = c.id
       LEFT JOIN biens b ON p.bien_id = b.id
       LEFT JOIN locataires l ON p.locataire_id = l.id
       LEFT JOIN acquereurs a ON p.acquereur_id = a.id
       LEFT JOIN proprietaires prop ON b.proprietaire_id = prop.id
       ${whereClause}
       ORDER BY p.date_paiement DESC`,
      params
    ) as any[];

    const paiementsAvecReste = paiements.map(p => ({
      id: p.id,
      contrat_id: p.contrat_id,
      bien_id: p.bien_id,
      locataire_id: p.locataire_id,
      acquereur_id: p.acquereur_id,
      type_paiement: p.type_paiement,
      type_vente: p.type_vente,
      type_transaction: p.type_transaction,
      montant: p.montant,
      montant_total_vente: p.montant_total_vente,
      versement_numero: p.versement_numero,
      echeancier_id: p.echeancier_id,
      date_paiement: p.date_paiement,
      date_echeance: p.date_echeance,
      mode_paiement: p.mode_paiement,
      banque: p.banque,
      numero_compte: p.numero_compte,
      reference: p.reference,
      numero_quittance: p.numero_quittance,
      statut: p.statut,
      mois_concerne: p.mois_concerne,
      penalite: p.penalite,
      commentaire: p.commentaire,
      justificatif: p.justificatif,
      created_at: p.created_at,
      updated_at: p.updated_at,
      contrat_numero: p.contrat_numero,
      type_contrat: p.type_contrat,
      prix_vente: p.prix_vente,
      loyer_mensuel: p.loyer_mensuel,
      bien_nom: p.bien_nom,
      locataire_nom: p.locataire_nom,
      locataire_prenom: p.locataire_prenom,
      acquereur_nom: p.acquereur_nom,
      acquereur_prenom: p.acquereur_prenom,
      acquereur_type: p.acquereur_type,
      acquereur_raison_sociale: p.acquereur_raison_sociale,
      reste_a_payer: p.type_transaction === 'VENTE' && p.prix_vente 
        ? (parseFloat(p.prix_vente) - (p.total_deja_verse || 0))
        : 0
    }));

    return NextResponse.json({
      success: true,
      paiements: paiementsAvecReste
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
    
    console.log('📦 Données reçues pour paiement:', JSON.stringify(body, null, 2));
    
    const {
      contrat_id,
      bien_id,
      locataire_id,
      acquereur_id,
      proprietaire_id,
      type_paiement,
      type_transaction,
      type_vente,
      montant,
      montant_total_vente,
      versement_numero,
      echeancier_id,
      date_paiement,
      date_echeance,
      mode_paiement,
      banque,
      numero_compte,
      reference,
      statut,
      mois_concerne,
      penalite,
      frais_agence,
      commission_proprietaire,
      commentaire,
      gestionnaire_id
    } = body;

    // Validation des champs obligatoires
    if (!contrat_id) {
      return NextResponse.json(
        { success: false, erreur: 'Le contrat est requis' },
        { status: 400 }
      );
    }
    
    if (!bien_id) {
      return NextResponse.json(
        { success: false, erreur: 'Le bien est requis' },
        { status: 400 }
      );
    }
    
    if (!locataire_id && !acquereur_id) {
      return NextResponse.json(
        { success: false, erreur: 'Le client (acquéreur ou locataire) est requis' },
        { status: 400 }
      );
    }
    
    if (!montant) {
      return NextResponse.json(
        { success: false, erreur: 'Le montant est requis' },
        { status: 400 }
      );
    }
    
    if (!date_paiement) {
      return NextResponse.json(
        { success: false, erreur: 'La date de paiement est requise' },
        { status: 400 }
      );
    }
    
    if (!mode_paiement) {
      return NextResponse.json(
        { success: false, erreur: 'Le mode de paiement est requis' },
        { status: 400 }
      );
    }

    // Récupérer les informations du contrat
    const contrats = await queryRows(
      'SELECT type_contrat, prix_vente, loyer_mensuel, statut FROM contrats WHERE id = ?',
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

    // Vérifier que le contrat est actif pour les paiements
    if (contrat.statut !== 'ACTIF' && contrat.statut !== 'BROUILLON') {
      return NextResponse.json(
        { success: false, erreur: 'Ce contrat n\'est pas actif' },
        { status: 400 }
      );
    }

    // Déterminer le type_transaction
    const transactionType = isVente ? 'VENTE' : 'LOCATION';

    // Validation spécifique pour les ventes
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
         WHERE contrat_id = ? AND type_transaction = 'VENTE'`,
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
        if (Math.abs(nouveauTotal - prixVente) > 1) {
          return NextResponse.json(
            { success: false, erreur: 'Le solde doit correspondre au prix total' },
            { status: 400 }
          );
        }
      }
    }

    // Générer une référence unique
    let referenceFinale = reference;
    if (!referenceFinale) {
      const now = new Date();
      const annee = now.getFullYear();
      const mois = String(now.getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-6);
      referenceFinale = `PAY-${annee}${mois}-${timestamp}`;
    }

    // Générer le numéro de quittance
    const datePaiementObj = new Date(date_paiement);
    const annee = datePaiementObj.getFullYear();
    const mois = String(datePaiementObj.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const numeroQuittance = `QUIT-${annee}-${mois}-${timestamp}`;

    // Déterminer le type_paiement final
    const typePaiementFinal = isVente ? type_vente : (type_paiement || 'LOYER');

    // Récupérer le proprietaire_id si non fourni
    let proprietaireId = proprietaire_id;
    if (!proprietaireId && bien_id) {
      const bienResult = await queryRows(
        'SELECT proprietaire_id FROM biens WHERE id = ?',
        [parseInt(bien_id)]
      ) as any[];
      if (bienResult.length > 0) {
        proprietaireId = bienResult[0].proprietaire_id;
      }
    }

    // Formater la date pour MySQL
    const datePaiementFormatted = date_paiement + ' 00:00:00';

    console.log('📦 Insertion paiement avec:', {
      contrat_id: parseInt(contrat_id),
      bien_id: parseInt(bien_id),
      acquereur_id: acquereur_id ? parseInt(acquereur_id) : null,
      type_paiement: typePaiementFinal,
      type_transaction: transactionType,
      montant: montantSaisi,
      date_paiement: datePaiementFormatted,
      mode_paiement: mode_paiement,
      reference: referenceFinale,
      numero_quittance: numeroQuittance
    });

    // Insérer le paiement
    const result = await queryInsert(
      `INSERT INTO paiements (
        contrat_id, bien_id, locataire_id, acquereur_id, proprietaire_id, gestionnaire_id,
        type_paiement, type_transaction, type_vente, montant, montant_total_vente,
        versement_numero, echeancier_id, date_paiement, date_echeance,
        mode_paiement, banque, numero_compte, reference, numero_quittance, 
        statut, mois_concerne, penalite, frais_agence, commission_proprietaire,
        commentaire, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parseInt(contrat_id),
        parseInt(bien_id),
        locataire_id ? parseInt(locataire_id) : null,
        acquereur_id ? parseInt(acquereur_id) : null,
        proprietaireId ? parseInt(proprietaireId) : null,
        gestionnaire_id ? parseInt(gestionnaire_id) : null,
        typePaiementFinal,
        transactionType,
        isVente ? type_vente : null,
        montantSaisi,
        isVente && montant_total_vente ? parseFloat(montant_total_vente) : null,
        isVente && versement_numero ? parseInt(versement_numero) : null,
        isVente ? (echeancier_id || `VENTE-${contrat_id}-${annee}`) : null,
        datePaiementFormatted,
        date_echeance || null,
        mode_paiement,
        banque || null,
        numero_compte || null,
        referenceFinale,
        numeroQuittance,
        statut || 'EFFECTUE',
        !isVente ? (mois_concerne || null) : null,
        !isVente && penalite ? parseFloat(penalite) : 0,
        frais_agence ? parseFloat(frais_agence) : 0,
        commission_proprietaire ? parseFloat(commission_proprietaire) : 0,
        commentaire || null
      ]
    );

    if (!result || !result.success) {
      console.error('❌ Erreur insertion SQL:', result);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création du paiement dans la base de données' },
        { status: 500 }
      );
    }

    console.log('✅ Paiement créé avec succès, ID:', result.insertId);

    // Mettre à jour le statut du contrat si c'est le dernier paiement d'une vente
    if (isVente && type_vente === 'SOLDE') {
      const totalPaye = await queryRows(
        `SELECT SUM(montant) as total FROM paiements 
         WHERE contrat_id = ? AND type_transaction = 'VENTE'`,
        [parseInt(contrat_id)]
      ) as any[];

      const prixVente = parseFloat(contrat.prix_vente || '0');
      const total = totalPaye[0]?.total || 0;

      console.log(`💰 Vérification solde: prixVente=${prixVente}, totalPaye=${total}`);

      if (total >= prixVente) {
        await queryInsert(
          'UPDATE contrats SET statut = ?, statut_validation = ? WHERE id = ?',
          ['TERMINE', 'VALIDE', parseInt(contrat_id)]
        );
        console.log(`✅ Contrat ${contrat_id} passé en statut TERMINE`);
        
        await queryInsert(
          'UPDATE biens SET statut = ? WHERE id = ?',
          ['VENDU', parseInt(bien_id)]
        );
        console.log(`✅ Bien ${bien_id} passé en statut VENDU`);
      }
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
      { success: false, erreur: 'Erreur serveur: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}
