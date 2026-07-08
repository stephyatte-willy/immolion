import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des contrats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locataire_id = searchParams.get('locataire_id');
    const acquereur_id = searchParams.get('acquereur_id');
    const bien_id = searchParams.get('bien_id');
    const lot_id = searchParams.get('lot_id');
    const type_contrat = searchParams.get('type_contrat');
    const statut = searchParams.get('statut');
    const statut_validation = searchParams.get('statut_validation');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (locataire_id) {
      whereClause += ' AND c.locataire_id = ?';
      params.push(locataire_id);
    }

    if (acquereur_id) {
      whereClause += ' AND c.acquereur_id = ?';
      params.push(acquereur_id);
    }

    if (bien_id) {
      whereClause += ' AND c.bien_id = ?';
      params.push(bien_id);
    }

    if (lot_id) {
      whereClause += ' AND c.lot_id = ?';
      params.push(lot_id);
    }

    if (type_contrat) {
      whereClause += ' AND c.type_contrat = ?';
      params.push(type_contrat);
    }

    if (statut) {
      whereClause += ' AND c.statut = ?';
      params.push(statut);
    }

    if (statut_validation) {
      whereClause += ' AND c.statut_validation = ?';
      params.push(statut_validation);
    }

    const contrats = await queryRows(
      `SELECT 
        c.id,
        c.bien_id,
        c.lot_id,
        c.locataire_id,
        c.acquereur_id,
        c.numero_contrat,
        c.type_contrat,
        c.date_debut,
        c.date_fin,
        c.date_signature,
        c.date_etat_lieux_entree,
        c.date_etat_lieux_sortie,
        c.loyer_mensuel,
        c.charges_mensuelles,
        c.depot_garantie,
        c.prix_vente,
        c.acompte,
        c.nombre_versements,
        c.montant_versement,
        c.frais_notaire,
        c.frais_agence,
        c.mode_vente,
        c.clause_particuliere,
        c.statut,
        c.statut_validation,
        c.created_at,
        c.updated_at,
        b.id as bien_id_ref,
        b.nom as bien_nom,
        b.adresse as bien_adresse,
        b.type_bien as bien_type,
        b.prix_vente as bien_prix_vente,
        b.surface as bien_surface,
        b.pieces as bien_pieces,
        b.commune as bien_commune,
        b.ville as bien_ville,
        b.statut as bien_statut,
        a.id as acquereur_id_ref,
        a.nom as acquereur_nom,
        a.prenom as acquereur_prenom,
        a.email as acquereur_email,
        a.type_acquereur as acquereur_type,
        a.raison_sociale as acquereur_raison_sociale,
        l.id as locataire_id_ref,
        l.nom as locataire_nom,
        l.prenom as locataire_prenom,
        l.email as locataire_email
       FROM contrats c
       LEFT JOIN biens b ON c.bien_id = b.id
       LEFT JOIN acquereurs a ON c.acquereur_id = a.id
       LEFT JOIN locataires l ON c.locataire_id = l.id
       ${whereClause}
       ORDER BY c.created_at DESC`,
      params
    ) as any[];

    const contratsFormatted = contrats.map(contrat => {
      let bienObj = null;
      if (contrat.bien_id_ref) {
        bienObj = {
          id: contrat.bien_id_ref,
          nom: contrat.bien_nom,
          adresse: contrat.bien_adresse,
          type_bien: contrat.bien_type,
          prix_vente: contrat.bien_prix_vente,
          surface: contrat.bien_surface,
          pieces: contrat.bien_pieces,
          commune: contrat.bien_commune,
          ville: contrat.bien_ville,
          statut: contrat.bien_statut
        };
      }
      
      let acquereurObj = null;
      if (contrat.acquereur_id_ref) {
        acquereurObj = {
          id: contrat.acquereur_id_ref,
          nom: contrat.acquereur_nom,
          prenom: contrat.acquereur_prenom,
          email: contrat.acquereur_email,
          type_acquereur: contrat.acquereur_type,
          raison_sociale: contrat.acquereur_raison_sociale
        };
      }
      
      let locataireObj = null;
      if (contrat.locataire_id_ref) {
        locataireObj = {
          id: contrat.locataire_id_ref,
          nom: contrat.locataire_nom,
          prenom: contrat.locataire_prenom,
          email: contrat.locataire_email
        };
      }

      return {
        id: contrat.id,
        bien_id: contrat.bien_id,
        lot_id: contrat.lot_id,
        locataire_id: contrat.locataire_id,
        acquereur_id: contrat.acquereur_id,
        numero_contrat: contrat.numero_contrat,
        type_contrat: contrat.type_contrat,
        date_debut: contrat.date_debut,
        date_fin: contrat.date_fin,
        date_signature: contrat.date_signature,
        date_etat_lieux_entree: contrat.date_etat_lieux_entree,
        date_etat_lieux_sortie: contrat.date_etat_lieux_sortie,
        loyer_mensuel: contrat.loyer_mensuel,
        charges_mensuelles: contrat.charges_mensuelles,
        depot_garantie: contrat.depot_garantie,
        prix_vente: contrat.prix_vente,
        acompte: contrat.acompte,
        nombre_versements: contrat.nombre_versements,
        montant_versement: contrat.montant_versement,
        frais_notaire: contrat.frais_notaire,
        frais_agence: contrat.frais_agence,
        mode_vente: contrat.mode_vente,
        clause_particuliere: contrat.clause_particuliere,
        statut: contrat.statut,
        statut_validation: contrat.statut_validation,
        created_at: contrat.created_at,
        updated_at: contrat.updated_at,
        bien: bienObj,
        acquereur: acquereurObj,
        locataire: locataireObj
      };
    });

    return NextResponse.json({
      success: true,
      contrats: contratsFormatted
    });
  } catch (error) {
    console.error('❌ Erreur GET contrats:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un contrat (location ou vente)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      bien_id,
      lot_id,
      locataire_id,
      acquereur_id,
      type_contrat,
      date_debut,
      date_fin,
      date_signature,
      date_etat_lieux_entree,
      date_etat_lieux_sortie,
      loyer_mensuel,
      charges_mensuelles,
      depot_garantie,
      prix_vente,
      acompte,
      nombre_versements,
      montant_versement,
      frais_notaire,
      frais_agence,
      mode_vente,
      clause_particuliere,
      reservation_id,
      nombre_mois_avance,
      nombre_mois_caution
    } = body;

    console.log('📦 Création contrat:', {
      type_contrat,
      bien_id,
      lot_id,
      locataire_id,
      acquereur_id,
      prix_vente,
      mode_vente,
      loyer_mensuel,
      nombre_mois_avance,
      nombre_mois_caution
    });

    // Validation des champs obligatoires
    const errors = [];
    if (!bien_id && !lot_id) errors.push('bien_id ou lot_id manquant');
    if (!type_contrat) errors.push('type_contrat manquant');
    if (!date_debut) errors.push('date_debut manquante');

    const isVente = type_contrat === 'VENTE';
    const isLocation = type_contrat === 'BAIL_VIDE' || type_contrat === 'BAIL_COMMERCIAL' || type_contrat === 'BAIL_PROFESSIONNEL';

    if (isVente) {
      if (!acquereur_id) errors.push('acquereur_id manquant');
      if (!prix_vente) errors.push('prix_vente manquant');
    } else if (isLocation) {
      if (!locataire_id) errors.push('locataire_id manquant');
      if (!loyer_mensuel) errors.push('loyer_mensuel manquant');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants', details: errors },
        { status: 400 }
      );
    }

    // Vérifier la réservation si fournie
    if (reservation_id) {
      const reservation = await queryRows(
        'SELECT * FROM reservations WHERE id = ? AND statut = ?',
        [reservation_id, 'ACTIVE']
      ) as any[];
      
      if (reservation.length === 0) {
        return NextResponse.json(
          { success: false, erreur: 'Réservation invalide ou expirée' },
          { status: 400 }
        );
      }
    }

    // Générer un numéro de contrat unique
    const annee = new Date().getFullYear();
    const prefix = isVente ? 'VT' : 'CT';
    
    const dernierContrat = await queryRows(
      `SELECT numero_contrat FROM contrats 
       WHERE numero_contrat LIKE ? 
       ORDER BY id DESC LIMIT 1`,
      [`${prefix}-${annee}-%`]
    ) as any[];
    
    let nouveauNumero = 1;
    
    if (dernierContrat.length > 0) {
      const dernierNumero = dernierContrat[0].numero_contrat;
      const match = dernierNumero.match(new RegExp(`${prefix}-${annee}-(\\d+)$`));
      if (match && match[1]) {
        nouveauNumero = parseInt(match[1]) + 1;
      }
    }
    
    const numeroContrat = `${prefix}-${annee}-${nouveauNumero.toString().padStart(4, '0')}`;
    console.log('📝 Nouveau numéro de contrat généré:', numeroContrat);

    let result;
    let contratId;

    if (isVente) {
      // Insertion pour contrat de vente
      const prixVenteValue = parseFloat(prix_vente) || 0;
      const acompteValue = parseFloat(acompte) || 0;
      const nombreVersementsValue = parseInt(nombre_versements) || 1;
      const montantVersementValue = parseFloat(montant_versement) || (Math.max(0, prixVenteValue - acompteValue) / nombreVersementsValue);
      const fraisNotaireValue = parseFloat(frais_notaire) || (prixVenteValue * 0.075);
      const fraisAgenceValue = parseFloat(frais_agence) || (prixVenteValue * 0.05);
      const modeVenteValue = mode_vente || 'COMPTANT';

      result = await queryInsert(
        `INSERT INTO contrats (
          numero_contrat, bien_id, acquereur_id, type_contrat,
          date_debut, date_fin, date_signature,
          prix_vente, acompte, nombre_versements, montant_versement,
          frais_notaire, frais_agence, mode_vente,
          clause_particuliere,
          statut, statut_validation, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          numeroContrat,
          bien_id ? parseInt(bien_id) : null,
          parseInt(acquereur_id),
          type_contrat,
          date_debut,
          date_fin || null,
          date_signature || null,
          prixVenteValue,
          acompteValue,
          nombreVersementsValue,
          montantVersementValue,
          fraisNotaireValue,
          fraisAgenceValue,
          modeVenteValue,
          clause_particuliere || null,
          'BROUILLON',
          'BROUILLON'
        ]
      );
    } else {
      // Insertion pour contrat de location
      const loyerValue = parseFloat(loyer_mensuel) || 0;
      const chargesValue = parseFloat(charges_mensuelles) || 0;
      const depotValue = depot_garantie ? parseFloat(depot_garantie) : null;

      result = await queryInsert(
        `INSERT INTO contrats (
          numero_contrat, bien_id, lot_id, locataire_id, type_contrat,
          date_debut, date_fin, date_signature, date_etat_lieux_entree, date_etat_lieux_sortie,
          loyer_mensuel, charges_mensuelles, depot_garantie,
          clause_particuliere,
          statut, statut_validation, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          numeroContrat,
          bien_id ? parseInt(bien_id) : null,
          lot_id ? parseInt(lot_id) : null,
          parseInt(locataire_id),
          type_contrat,
          date_debut,
          date_fin || null,
          date_signature || null,
          date_etat_lieux_entree || null,
          date_etat_lieux_sortie || null,
          loyerValue,
          chargesValue,
          depotValue,
          clause_particuliere || null,
          'BROUILLON',
          'BROUILLON'
        ]
      );
    }

    if (!result || !result.success) {
      console.error('❌ Erreur insertion contrat:', result);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création du contrat' },
        { status: 500 }
      );
    }

    contratId = result.insertId;
    console.log('✅ Contrat créé avec ID:', contratId);

    // Pour les contrats de location, créer les conditions et les périodes
    if (isLocation) {
      const loyerMensuelValue = parseFloat(loyer_mensuel) || 0;
      
      // Valeurs par défaut: 2 mois d'avance et 2 mois de caution
      const nbMoisAvance = parseInt(nombre_mois_avance) || 2;
      const nbMoisCaution = parseInt(nombre_mois_caution) || 2;
      
      const montantCaution = loyerMensuelValue * nbMoisCaution;
      const montantAvance = loyerMensuelValue * nbMoisAvance;
      
      console.log(`📦 Création conditions: Caution ${montantCaution} FCFA (${nbMoisCaution} mois), Avance ${montantAvance} FCFA (${nbMoisAvance} mois)`);
      
      // 1. Créer les conditions de location
      const conditionsResult = await queryInsert(
        `INSERT INTO conditions_location (
          contrat_id, caution, nombre_mois_avance, montant_avance,
          date_paiement_caution, date_paiement_avance, date_effet_location, statut, created_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW(), ?, NOW())`,
        [contratId, montantCaution, nbMoisAvance, montantAvance, 'EN_ATTENTE']
      );
      
      if (conditionsResult.success) {
        console.log('✅ Conditions de location créées');
      } else {
        console.error('❌ Erreur création conditions:', conditionsResult);
      }
      
      // 2. Créer les périodes de location pour les 12 prochains mois
      const dateDebutObj = new Date(date_debut);
      const periodesCreees = [];
      
      for (let i = 0; i < 12; i++) {
        const moisConcerne = new Date(dateDebutObj);
        moisConcerne.setMonth(dateDebutObj.getMonth() + i);
        
        const dateEcheance = new Date(moisConcerne);
        dateEcheance.setDate(10); // Échéance le 10 du mois
        
        const moisConcerneStr = moisConcerne.toISOString().slice(0, 7);
        const dateEcheanceStr = dateEcheance.toISOString().slice(0, 10);
        
        // Utiliser 'montant' au lieu de 'montant_du' selon votre structure de table
        const periodeResult = await queryInsert(
          `INSERT INTO periodes_location (
            contrat_id, mois_concerne, montant, date_echeance, statut, created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())`,
          [contratId, moisConcerneStr, loyerMensuelValue, dateEcheanceStr, 'EN_ATTENTE']
        );
        
        if (periodeResult.success) {
          periodesCreees.push(moisConcerneStr);
          console.log(`✅ Période ${moisConcerneStr} créée`);
        } else {
          console.error(`❌ Erreur création période ${moisConcerneStr}:`, periodeResult);
        }
      }
      
      console.log(`✅ ${periodesCreees.length} périodes de location créées`);
      
      // 3. Mettre à jour le statut du bien/lot si nécessaire
      if (bien_id && !lot_id) {
        await queryInsert(
          'UPDATE biens SET statut = ? WHERE id = ?',
          ['RESERVE', parseInt(bien_id)]
        );
      }
      if (lot_id && lot_id !== '') {
        await queryInsert(
          'UPDATE lots SET statut = ? WHERE id = ?',
          ['RESERVE', parseInt(lot_id)]
        );
      }
    }

    // Mettre à jour la réservation si elle existe
    if (reservation_id) {
      await queryInsert(
        'UPDATE reservations SET contrat_id = ? WHERE id = ?',
        [contratId, reservation_id]
      );
    }

    return NextResponse.json({
      success: true,
      id: contratId,
      numero: numeroContrat,
      message: isVente 
        ? 'Contrat de vente créé avec succès (en attente de validation)'
        : 'Contrat de location créé avec succès (en attente de validation)'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur POST contrat:', error);
    
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes('numero_contrat')) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Erreur de génération du numéro de contrat. Veuillez réessayer.' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}