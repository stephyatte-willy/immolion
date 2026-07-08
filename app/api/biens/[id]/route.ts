import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un bien spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const biens = await queryRows(
      `SELECT b.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', p.id, 'url', p.url, 'legende', p.legende, 'est_principale', p.est_principale)
        ) FROM photos p WHERE p.bien_id = b.id) as photos,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', l.id, 'nom', l.nom, 'prenom', l.prenom, 'email', l.email, 'telephone', l.telephone, 'actif', l.actif)
        ) FROM locataires l WHERE l.bien_id = b.id) as locataires,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', l.id, 'numero_lot', l.numero_lot, 'etage', l.etage,
                      'type_lot', l.type_lot, 'nom', l.nom, 'surface', l.surface,
                      'pieces', l.pieces, 'loyer_mensuel', l.loyer_mensuel,
                      'prix_vente', l.prix_vente, 'description', l.description,
                      'statut', l.statut)
        ) FROM lots l WHERE l.bien_principal_id = b.id) as lots
       FROM biens b
       WHERE b.id = ?`,
      [id]
    ) as any[];

    if (biens.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Bien non trouvé' },
        { status: 404 }
      );
    }

    const bien = biens[0];
    
    try {
      bien.photos = bien.photos ? JSON.parse(bien.photos) : [];
      bien.locataires = bien.locataires ? JSON.parse(bien.locataires) : [];
      bien.lots = bien.lots ? JSON.parse(bien.lots) : [];
    } catch (e) {
      console.error('❌ Erreur parsing JSON:', e);
      bien.photos = [];
      bien.locataires = [];
      bien.lots = [];
    }

    return NextResponse.json({
      success: true,
      bien
    });
  } catch (error) {
    console.error('❌ Erreur GET bien:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un bien
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    
    // Récupération des champs
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
    const lotsToDelete = formData.get('lotsToDelete') as string;
    const photosToDelete = formData.getAll('photosToDelete') as string[];
    const newPhotos = formData.getAll('photos') as File[];

    console.log('📦 Mise à jour bien ID:', id);
    console.log('📸 Nouvelles photos reçues:', newPhotos.length);
    console.log('🗑️ Photos à supprimer:', photosToDelete);
    console.log('📦 Lots reçus:', lots ? JSON.parse(lots)?.length : 0);
    console.log('🗑️ Lots à supprimer:', lotsToDelete);

    // Validation des champs obligatoires
    if (!nom || !type_bien || !commune || !district || !surface) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    const surfaceNum = parseFloat(surface);
    const piecesNum = parseInt(pieces) || 1;
    const etageNum = etage ? parseInt(etage) : null;
    const latitudeNum = latitude ? parseFloat(latitude) : null;
    const longitudeNum = longitude ? parseFloat(longitude) : null;
    const proprietaireIdValue = proprietaire_id && proprietaire_id.trim() !== '' ? parseInt(proprietaire_id) : null;

    // Formater la date
    let dateAcquisitionFormatted = null;
    if (date_acquisition && date_acquisition.trim() !== '') {
      dateAcquisitionFormatted = date_acquisition.includes('T') 
        ? date_acquisition.split('T')[0] 
        : date_acquisition;
    }

    // Gestion financière (sans charges et depot_garantie)
    let loyerNum = 0;
    let prixVenteNum = null;
    
    if (statut === 'EN_VENTE') {
      if (prix_vente) {
        prixVenteNum = parseFloat(prix_vente);
        if (isNaN(prixVenteNum) || prixVenteNum <= 0) {
          return NextResponse.json({ success: false, erreur: 'Prix de vente invalide' }, { status: 400 });
        }
      }
      loyerNum = 0;
    } else {
      if (loyer_mensuel) {
        loyerNum = parseFloat(loyer_mensuel);
        if (isNaN(loyerNum) || loyerNum < 0) {
          return NextResponse.json({ success: false, erreur: 'Loyer mensuel invalide' }, { status: 400 });
        }
      }
    }

    // 1. SUPPRIMER LES PHOTOS MARQUÉES
    for (const photoId of photosToDelete) {
      await queryInsert('DELETE FROM photos WHERE id = ?', [photoId]);
      console.log(`✅ Photo ${photoId} supprimée`);
    }

    // 2. METTRE À JOUR LE BIEN (sans charges et depot_garantie)
    await queryInsert(
      `UPDATE biens SET
        proprietaire_id = ?,
        nom = ?, type_bien = ?, statut = ?, adresse = ?, quartier = ?, commune = ?,
        ville = ?, district = ?, pays = ?, surface = ?, pieces = ?, etage = ?,
        description = ?, loyer_mensuel = ?,
        prix_vente = ?, date_acquisition = ?, latitude = ?, longitude = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        proprietaireIdValue,
        nom, type_bien, statut, adresse || null, quartier || null, commune,
        ville || 'Abidjan', district, pays || 'Côte d\'Ivoire',
        surfaceNum, piecesNum, etageNum, description || null,
        loyerNum,
        prixVenteNum,
        dateAcquisitionFormatted, latitudeNum, longitudeNum, id
      ]
    );
    console.log('✅ Bien mis à jour');

    // 3. GÉRER LES LOTS (si immeuble) - sans charges et depot_garantie
    if (type_bien === 'IMMEUBLE') {
      // Supprimer les lots marqués
      if (lotsToDelete && lotsToDelete !== '[]') {
        const lotsToDeleteArray = JSON.parse(lotsToDelete);
        for (const lotId of lotsToDeleteArray) {
          await queryInsert('DELETE FROM lots WHERE id = ?', [lotId]);
          console.log(`✅ Lot ${lotId} supprimé`);
        }
      }

      // Mettre à jour ou ajouter les lots
      if (lots && lots !== '[]' && lots !== 'null') {
        const lotsData = JSON.parse(lots);
        console.log(`📦 ${lotsData.length} lots à traiter`);
        
        for (const lot of lotsData) {
          if (lot.id) {
            // Mise à jour d'un lot existant
            await queryInsert(
              `UPDATE lots SET
                numero_lot = ?, etage = ?, type_lot = ?, nom = ?,
                surface = ?, pieces = ?, loyer_mensuel = ?,
                prix_vente = ?, description = ?, statut = ?,
                updated_at = NOW()
               WHERE id = ?`,
              [
                lot.numero_lot,
                lot.etage ? parseInt(lot.etage) : null,
                lot.type_lot || 'APPARTEMENT',
                lot.nom || null,
                parseFloat(lot.surface) || 0,
                lot.pieces ? parseInt(lot.pieces) : null,
                parseFloat(lot.loyer_mensuel) || 0,
                lot.prix_vente ? parseFloat(lot.prix_vente) : null,
                lot.description || null,
                lot.statut || 'DISPONIBLE',
                lot.id
              ]
            );
            console.log(`✅ Lot ${lot.numero_lot} mis à jour`);
          } else {
            // Ajout d'un nouveau lot
            const lotResult = await queryInsert(
              `INSERT INTO lots (
                bien_principal_id, numero_lot, etage, type_lot, nom,
                surface, pieces, loyer_mensuel,
                prix_vente, description, statut, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                parseInt(id),
                lot.numero_lot || `Lot_${Date.now()}`,
                lot.etage ? parseInt(lot.etage) : null,
                lot.type_lot || 'APPARTEMENT',
                lot.nom || null,
                parseFloat(lot.surface) || 0,
                lot.pieces ? parseInt(lot.pieces) : null,
                parseFloat(lot.loyer_mensuel) || 0,
                lot.prix_vente ? parseFloat(lot.prix_vente) : null,
                lot.description || null,
                lot.statut || 'DISPONIBLE'
              ]
            );
            console.log(`✅ Nouveau lot ${lot.numero_lot} ajouté, ID: ${lotResult.insertId}`);
          }
        }
      }

      // Mettre à jour le nombre total de lots
      const lotsCount = await queryRows(
        'SELECT COUNT(*) as count FROM lots WHERE bien_principal_id = ?',
        [id]
      ) as any[];
      await queryInsert(
        'UPDATE biens SET nombre_lots = ? WHERE id = ?',
        [lotsCount[0]?.count || 0, id]
      );
      console.log(`✅ Nombre de lots mis à jour: ${lotsCount[0]?.count || 0}`);
    }

    // 4. AJOUTER LES NOUVELLES PHOTOS
    const existingPhotos = await queryRows(
      'SELECT MAX(ordre) as maxOrdre FROM photos WHERE bien_id = ?',
      [id]
    ) as any[];
    let ordre = (existingPhotos[0]?.maxOrdre || -1) + 1;
    
    for (let i = 0; i < newPhotos.length; i++) {
      const photo = newPhotos[i];
      if (photo.size === 0 || photo.size > 5 * 1024 * 1024) continue;
      
      try {
        const bytes = await photo.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const url = `data:${photo.type};base64,${base64}`;
        
        const photoResult = await queryInsert(
          'INSERT INTO photos (bien_id, url, est_principale, ordre, created_at) VALUES (?, ?, ?, ?, NOW())',
          [id, url, i === 0 ? 1 : 0, ordre++]
        );
        console.log(`✅ Nouvelle photo ${i+1} ajoutée, ID: ${photoResult.insertId}`);
      } catch (photoError) {
        console.error('❌ Erreur photo:', photoError);
      }
    }

    // 5. RÉCUPÉRER LE BIEN MIS À JOUR
    const updatedBien = await queryRows(
      `SELECT b.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', p.id, 'url', p.url, 'legende', p.legende, 'est_principale', p.est_principale)
        ) FROM photos p WHERE p.bien_id = b.id) as photos,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', l.id, 'numero_lot', l.numero_lot, 'etage', l.etage,
                      'type_lot', l.type_lot, 'nom', l.nom, 'surface', l.surface,
                      'pieces', l.pieces, 'loyer_mensuel', l.loyer_mensuel,
                      'prix_vente', l.prix_vente, 'description', l.description,
                      'statut', l.statut)
        ) FROM lots l WHERE l.bien_principal_id = b.id) as lots
       FROM biens b
       WHERE b.id = ?`,
      [id]
    ) as any[];
    
    const bien = updatedBien[0];
    try {
      bien.photos = bien.photos ? JSON.parse(bien.photos) : [];
      bien.lots = bien.lots ? JSON.parse(bien.lots) : [];
    } catch (e) {
      bien.photos = [];
      bien.lots = [];
    }
    
    return NextResponse.json({
      success: true,
      message: 'Bien modifié avec succès',
      bien
    });
    
  } catch (error: any) {
    console.error('❌ Erreur PUT bien:', error);
    return NextResponse.json(
      { success: false, erreur: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un bien
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bien = await queryRows(
      'SELECT id, type_bien, nombre_lots FROM biens WHERE id = ?',
      [id]
    ) as any[];
    
    if (bien.length === 0) {
      return NextResponse.json({ success: false, erreur: 'Bien non trouvé' }, { status: 404 });
    }

    if (bien[0].type_bien === 'IMMEUBLE') {
      await queryInsert('DELETE FROM lots WHERE bien_principal_id = ?', [id]);
    }
    
    await queryInsert('DELETE FROM photos WHERE bien_id = ?', [id]);
    await queryInsert('DELETE FROM biens WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Bien supprimé avec succès' });
    
  } catch (error) {
    console.error('❌ Erreur DELETE bien:', error);
    return NextResponse.json({ success: false, erreur: 'Erreur serveur' }, { status: 500 });
  }
}