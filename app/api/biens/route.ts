import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des biens
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const proprietaire_id = searchParams.get('proprietaire_id');
    const avec_proprietaire = searchParams.get('avec_proprietaire');
    const statut = searchParams.get('statut');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (proprietaire_id) {
      whereClause += ' AND b.proprietaire_id = ?';
      params.push(proprietaire_id);
    }

    if (statut) {
      whereClause += ' AND b.statut = ?';
      params.push(statut);
    }

    let selectProprietaire = '';
    let joinProprietaire = '';
    
    if (avec_proprietaire === 'true') {
      selectProprietaire = `,
        p.id as proprietaire_id,
        p.nom as proprietaire_nom,
        p.prenom as proprietaire_prenom,
        p.email as proprietaire_email,
        p.telephone as proprietaire_telephone,
        p.type as proprietaire_type`;
      joinProprietaire = 'LEFT JOIN proprietaires p ON b.proprietaire_id = p.id';
    }

    const biens = await queryRows(
      `SELECT b.* ${selectProprietaire},
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', p.id, 'url', p.url, 'legende', p.legende, 'est_principale', p.est_principale)
        ) FROM photos p WHERE p.bien_id = b.id) as photos,
        (SELECT JSON_OBJECT('id', l.id, 'nom', l.nom, 'prenom', l.prenom) 
         FROM locataires l 
         WHERE l.bien_id = b.id AND l.actif = 1 LIMIT 1) as locataire_actuel,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', l.id, 'numero_lot', l.numero_lot, 'etage', l.etage,
                      'type_lot', l.type_lot, 'nom', l.nom, 'surface', l.surface,
                      'pieces', l.pieces, 'loyer_mensuel', l.loyer_mensuel,
                      'prix_vente', l.prix_vente, 'description', l.description,
                      'statut', l.statut)
        ) FROM lots l WHERE l.bien_principal_id = b.id) as lots
       FROM biens b
       ${joinProprietaire}
       ${whereClause}
       ORDER BY b.created_at DESC`,
      params
    ) as any[];

    const biensFormatted = biens.map(b => {
      let photos = b.photos;
      if (typeof photos === 'string') {
        try {
          photos = JSON.parse(photos);
        } catch (e) {
          photos = [];
        }
      }
      
      let locataire_actuel = b.locataire_actuel;
      if (typeof locataire_actuel === 'string') {
        try {
          locataire_actuel = JSON.parse(locataire_actuel);
        } catch (e) {
          locataire_actuel = null;
        }
      }
      
      let lots = b.lots;
      if (typeof lots === 'string') {
        try {
          lots = JSON.parse(lots);
        } catch (e) {
          lots = [];
        }
      }

      return {
        ...b,
        photos: photos || [],
        locataire_actuel: locataire_actuel || null,
        lots: lots || [],
        proprietaire: b.proprietaire_id ? {
          id: b.proprietaire_id,
          nom: b.proprietaire_nom,
          prenom: b.proprietaire_prenom,
          email: b.proprietaire_email,
          telephone: b.proprietaire_telephone,
          type: b.proprietaire_type
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      biens: biensFormatted
    });
  } catch (error) {
    console.error('❌ Erreur GET biens:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un bien
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Récupération des champs de base
    const proprietaire_id = formData.get('proprietaire_id') as string;
    const nom = formData.get('nom') as string;
    const type_bien = formData.get('type_bien') as string;
    const statut = formData.get('statut') as string;
    const adresse = formData.get('adresse') as string;
    const quartier = formData.get('quartier') as string;
    const commune = formData.get('commune') as string;
    const ville = formData.get('ville') as string;
    const district = formData.get('district') as string;
    const pays = formData.get('pays') as string;
    const surface = formData.get('surface') as string;
    const pieces = formData.get('pieces') as string;
    const etage = formData.get('etage') as string;
    const description = formData.get('description') as string;
    const loyer_mensuel = formData.get('loyer_mensuel') as string;
    const prix_vente = formData.get('prix_vente') as string;
    const date_acquisition = formData.get('date_acquisition') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const lots = formData.get('lots') as string;
    const nombre_lots = formData.get('nombre_lots') as string;
    const reference_unique = formData.get('reference_unique') as string;
    
    // ✅ Récupérer le mode de vente de l'immeuble (si présent)
    const mode_vente_immeuble = formData.get('mode_vente_immeuble') as string;

    console.log('📦 Données reçues:', {
      proprietaire_id, 
      nom, 
      type_bien, 
      statut, 
      adresse, 
      commune, 
      district,
      surface, 
      pieces, 
      loyer_mensuel, 
      prix_vente,
      lots_reçu: lots ? 'oui' : 'non',
      reference_unique,
      mode_vente_immeuble
    });

    // ========== VALIDATION DES CHAMPS OBLIGATOIRES ==========
    const errors: string[] = [];
    
    if (!nom) errors.push('nom manquant');
    if (!type_bien) errors.push('type_bien manquant');
    if (!statut) errors.push('statut manquant');
    if (!commune) errors.push('commune manquante');
    if (!district) errors.push('district manquant');
    if (!surface) errors.push('surface manquante');

    if (type_bien !== 'TERRAIN' && type_bien !== 'IMMEUBLE' && !pieces) {
      errors.push('pieces manquant');
    }

    if (statut === 'EN_VENTE') {
      if (!prix_vente) errors.push('prix_vente manquant');
    } else {
      if (!loyer_mensuel && type_bien !== 'IMMEUBLE') {
        errors.push('loyer_mensuel manquant');
      }
    }

    // ✅ VALIDATION DES LOTS POUR IMMEUBLE - AVEC GESTION DU MODE GLOBAL
    if (type_bien === 'IMMEUBLE') {
      // Si c'est une vente globale, les lots ne sont pas obligatoires
      const estVenteGlobale = statut === 'EN_VENTE' && mode_vente_immeuble === 'global';
      
      if (!estVenteGlobale) {
        // Mode vente par lots ou location - les lots sont obligatoires
        if (!lots || lots === '[]' || lots === 'null') {
          errors.push('lots manquants pour l\'immeuble');
        } else {
          try {
            const lotsData = JSON.parse(lots);
            if (!Array.isArray(lotsData) || lotsData.length === 0) {
              errors.push('Au moins un lot est requis pour un immeuble');
            }
          } catch (e) {
            errors.push('Format de lots invalide');
          }
        }
      } else {
        console.log('🏢 Vente globale d\'immeuble - lots non requis');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants', details: errors },
        { status: 400 }
      );
    }

    // ========== VALIDATION DES VALEURS NUMÉRIQUES ==========
    const surfaceNum = parseFloat(surface);
    if (isNaN(surfaceNum) || surfaceNum <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'Surface invalide' },
        { status: 400 }
      );
    }

    const piecesNum = (type_bien !== 'TERRAIN' && type_bien !== 'IMMEUBLE') ? parseInt(pieces) : 1;
    const etageNum = etage ? parseInt(etage) : null;
    const latitudeNum = latitude ? parseFloat(latitude) : null;
    const longitudeNum = longitude ? parseFloat(longitude) : null;

    // ========== GESTION FINANCIÈRE ==========
    let loyerNum = 0;
    let prixVenteNum = null;

    if (statut === 'EN_VENTE') {
      if (prix_vente) {
        prixVenteNum = parseFloat(prix_vente);
        if (isNaN(prixVenteNum) || prixVenteNum <= 0) {
          return NextResponse.json(
            { success: false, erreur: 'Prix de vente invalide' },
            { status: 400 }
          );
        }
      }
      loyerNum = 0;
    } else {
      if (loyer_mensuel && type_bien !== 'IMMEUBLE') {
        loyerNum = parseFloat(loyer_mensuel);
        if (isNaN(loyerNum) || loyerNum < 0) {
          return NextResponse.json(
            { success: false, erreur: 'Loyer mensuel invalide' },
            { status: 400 }
          );
        }
      }
    }

    // ========== FORMATAGE DE LA DATE ==========
    let dateAcquisitionFormatted = null;
    if (date_acquisition && date_acquisition.trim() !== '') {
      dateAcquisitionFormatted = date_acquisition.includes('T') 
        ? date_acquisition.split('T')[0] 
        : date_acquisition;
    }

    // ========== GÉNÉRATION DE LA RÉFÉRENCE UNIQUE SI NÉCESSAIRE ==========
    let referenceFinale = reference_unique;
    if (!referenceFinale || referenceFinale.trim() === '') {
      const lastBien = await queryRows(
        'SELECT id FROM biens ORDER BY id DESC LIMIT 1',
        []
      ) as any[];
      const dernierId = lastBien.length > 0 ? lastBien[0].id : 0;
      const nouveauNumero = dernierId + 1;
      referenceFinale = `BIEN-${nouveauNumero.toString().padStart(5, '0')}`;
    }

    // ========== INSERTION DU BIEN PRINCIPAL ==========
    const proprietaireIdValue = proprietaire_id && proprietaire_id.trim() !== '' 
      ? parseInt(proprietaire_id) 
      : null;
    
    const bienInsertResult = await queryInsert(
      `INSERT INTO biens (
        proprietaire_id, nom, type_bien, statut, adresse, quartier, commune,
        ville, district, pays, surface, pieces, etage, description,
        loyer_mensuel, prix_vente, date_acquisition,
        latitude, longitude, nombre_lots, reference_unique, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        proprietaireIdValue, 
        nom, 
        type_bien, 
        statut, 
        adresse || null, 
        quartier || null, 
        commune,
        ville || 'Abidjan', 
        district, 
        pays || 'Côte d\'Ivoire',
        surfaceNum, 
        piecesNum, 
        etageNum,
        description || null, 
        loyerNum, 
        prixVenteNum,
        dateAcquisitionFormatted, 
        latitudeNum,
        longitudeNum,
        0,
        referenceFinale
      ]
    );

    if (!bienInsertResult.success) {
      console.error('❌ Erreur insertion bien:', bienInsertResult);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création du bien' },
        { status: 500 }
      );
    }

    const bienId = bienInsertResult.insertId;
    console.log('✅ Bien créé avec ID:', bienId, 'Référence:', referenceFinale);

    // ========== GESTION DES LOTS ==========
    let totalLotsInsérés = 0;
    
    // ✅ Vérifier si on doit insérer des lots
    const estVenteGlobale = type_bien === 'IMMEUBLE' && statut === 'EN_VENTE' && mode_vente_immeuble === 'global';
    
    if (type_bien === 'IMMEUBLE' && !estVenteGlobale && lots && lots !== '[]' && lots !== 'null') {
      try {
        const lotsData = JSON.parse(lots);
        console.log(`📦 ${lotsData.length} lots à insérer`);
        
        if (!Array.isArray(lotsData)) {
          console.error('❌ lotsData n\'est pas un tableau');
        } else if (lotsData.length === 0) {
          console.log('⚠️ Aucun lot à insérer');
        } else {
          for (let idx = 0; idx < lotsData.length; idx++) {
            const lot = lotsData[idx];
            
            console.log(`📝 Lot ${idx + 1}: ${lot.numero_lot}, type: ${lot.type_lot}`);
            
            const lotResult = await queryInsert(
              `INSERT INTO lots (
                bien_principal_id, numero_lot, etage, type_lot, nom,
                surface, pieces, loyer_mensuel,
                prix_vente, description, statut, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                bienId,
                lot.numero_lot || `Lot_${Date.now()}_${idx}`,
                lot.etage ? parseInt(lot.etage) : null,
                lot.type_lot || 'APPARTEMENT',
                lot.nom || null,
                parseFloat(lot.surface) || 0,
                lot.pieces ? parseInt(lot.pieces) : null,
                parseFloat(lot.loyer_mensuel) || 0,
                lot.prix_vente ? parseFloat(lot.prix_vente) : null,  // ✅ Prix de vente pour les lots
                lot.description || null,
                lot.statut || 'DISPONIBLE'
              ]
            );
            
            if (lotResult && lotResult.success) {
              totalLotsInsérés++;
              console.log(`✅ Lot ${lot.numero_lot} inséré`);
            } else {
              console.error(`❌ Échec insertion lot ${lot.numero_lot}:`, lotResult);
            }
          }
          
          if (totalLotsInsérés > 0) {
            await queryInsert(
              'UPDATE biens SET nombre_lots = ? WHERE id = ?',
              [totalLotsInsérés, bienId]
            );
            console.log(`✅ Total: ${totalLotsInsérés} lots insérés`);
          }
        }
      } catch (lotError) {
        console.error('❌ Erreur insertion lots:', lotError);
      }
    } else if (estVenteGlobale) {
      console.log('🏢 Vente globale - aucun lot inséré');
    }

    // ========== GESTION DES PHOTOS ==========
    const photos = formData.getAll('photos') as File[];
    console.log(`📸 ${photos.length} photos reçues`);
    
    if (photos.length > 0) {
      let photosAjoutées = 0;
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        try {
          if (photo.size > 5 * 1024 * 1024) {
            console.log(`⚠️ Photo ${i+1} trop grande, ignorée`);
            continue;
          }

          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(photo.type)) {
            console.log(`⚠️ Type de fichier non supporté: ${photo.type}`);
            continue;
          }

          const bytes = await photo.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          const mimeType = photo.type;
          
          const url = `data:${mimeType};base64,${base64}`;
          
          const photoResult = await queryInsert(
            'INSERT INTO photos (bien_id, url, est_principale, ordre, created_at) VALUES (?, ?, ?, ?, NOW())',
            [bienId, url, i === 0 ? 1 : 0, i]
          );
          
          if (photoResult && photoResult.success) {
            photosAjoutées++;
            console.log(`✅ Photo ${i+1} ajoutée en base64`);
          } else {
            console.error(`❌ Erreur insertion photo ${i+1}:`, photoResult);
          }
        } catch (photoError) {
          console.error(`❌ Erreur traitement photo ${i+1}:`, photoError);
        }
      }
      
      console.log(`✅ ${photosAjoutées}/${photos.length} photos ajoutées avec succès`);
    }

    return NextResponse.json({
      success: true,
      id: bienId,
      reference: referenceFinale,
      message: 'Bien créé avec succès',
      details: {
        lots_insérés: totalLotsInsérés,
        photos_ajoutées: photos.filter(p => p.size <= 5 * 1024 * 1024).length,
        type_bien: type_bien
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur POST bien:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur serveur',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}