import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
        ) FROM locataires l WHERE l.bien_id = b.id) as locataires
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
    } catch (e) {
      console.error('❌ Erreur parsing JSON:', e);
      bien.photos = [];
      bien.locataires = [];
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
    const charges = formData.get('charges') as string;
    const depot_garantie = formData.get('depot_garantie') as string;
    const date_acquisition = formData.get('date_acquisition') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;

    const photosToDelete = formData.getAll('photosToDelete') as string[];
    const newPhotos = formData.getAll('photos') as File[];

    console.log('📦 Mise à jour bien ID:', id);
    console.log('🗑️ Photos à supprimer:', photosToDelete);
    console.log('📸 Nouvelles photos:', newPhotos.length);

    // Validation
    if (!nom || !type_bien || !adresse || !commune || !district || !surface || !pieces || !loyer_mensuel) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    const surfaceNum = parseFloat(surface);
    const piecesNum = parseInt(pieces);
    const loyerNum = parseFloat(loyer_mensuel);
    const chargesNum = charges ? parseFloat(charges) : 0;
    const depotNum = depot_garantie ? parseFloat(depot_garantie) : null;
    const etageNum = etage ? parseInt(etage) : null;
    const latitudeNum = latitude ? parseFloat(latitude) : null;
    const longitudeNum = longitude ? parseFloat(longitude) : null;

    // ✅ CORRECTION: Formater la date pour MySQL
    let dateAcquisitionFormatted = null;
    if (date_acquisition && date_acquisition.trim() !== '') {
      // Si c'est une date ISO, la convertir en format MySQL (YYYY-MM-DD)
      if (date_acquisition.includes('T')) {
        dateAcquisitionFormatted = date_acquisition.split('T')[0];
      } else {
        dateAcquisitionFormatted = date_acquisition;
      }
      console.log('📅 Date formatée:', dateAcquisitionFormatted);
    }

    if (isNaN(surfaceNum) || surfaceNum <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'Surface invalide' },
        { status: 400 }
      );
    }

    if (isNaN(piecesNum) || piecesNum <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'Nombre de pièces invalide' },
        { status: 400 }
      );
    }

    if (isNaN(loyerNum) || loyerNum <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'Loyer mensuel invalide' },
        { status: 400 }
      );
    }

    // ✅ 1. SUPPRIMER LES PHOTOS MARQUÉES
    if (photosToDelete.length > 0) {
      for (const photoId of photosToDelete) {
        const photos = await queryRows(
          'SELECT url FROM photos WHERE id = ?',
          [photoId]
        ) as any[];
        
        if (photos.length > 0) {
          const filePath = path.join(process.cwd(), 'public', photos[0].url);
          try {
            await unlink(filePath);
            console.log('✅ Fichier supprimé:', filePath);
          } catch (error) {
            console.log('⚠️ Fichier non trouvé:', filePath);
          }
        }
        
        await queryInsert('DELETE FROM photos WHERE id = ?', [photoId]);
      }
    }

    // ✅ 2. METTRE À JOUR LE BIEN (avec la date formatée)
    await queryInsert(
      `UPDATE biens SET
        nom = ?, type_bien = ?, statut = ?, adresse = ?, quartier = ?, commune = ?,
        ville = ?, district = ?, pays = ?, surface = ?, pieces = ?, etage = ?,
        description = ?, loyer_mensuel = ?, charges = ?, depot_garantie = ?,
        date_acquisition = ?, latitude = ?, longitude = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        nom, type_bien, statut, adresse, quartier || null, commune,
        ville || 'Abidjan', district, pays || 'Côte d\'Ivoire',
        surfaceNum, piecesNum, etageNum,
        description || null, loyerNum, chargesNum, depotNum,
        dateAcquisitionFormatted, // ✅ Date déjà formatée
        latitudeNum, longitudeNum, id
      ]
    );

    // ✅ 3. AJOUTER LES NOUVELLES PHOTOS
    if (newPhotos.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public/uploads/biens');
      await mkdir(uploadDir, { recursive: true });

      const existingPhotos = await queryRows(
        'SELECT MAX(ordre) as maxOrdre FROM photos WHERE bien_id = ?',
        [id]
      ) as any[];
      let ordre = (existingPhotos[0]?.maxOrdre || -1) + 1;

      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i];
        
        if (photo.size === 0) continue;
        
        const fileExtension = photo.name.split('.').pop() || 'jpg';
        const fileName = `bien-${id}-${uuidv4()}.${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        
        try {
          const bytes = await photo.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filePath, buffer);
          
          const url = `/uploads/biens/${fileName}`;
          const isPrincipale = ordre === 0;
          
          await queryInsert(
            'INSERT INTO photos (bien_id, url, est_principale, ordre) VALUES (?, ?, ?, ?)',
            [id, url, isPrincipale ? 1 : 0, ordre++]
          );
          
          console.log('✅ Nouvelle photo ajoutée:', url);
        } catch (photoError) {
          console.error('❌ Erreur upload photo:', photoError);
        }
      }
    }

    // ✅ 4. RÉCUPÉRER LE BIEN MIS À JOUR
    const updatedBien = await queryRows(
      `SELECT * FROM biens WHERE id = ?`,
      [id]
    ) as any[];

    return NextResponse.json({
      success: true,
      message: 'Bien modifié avec succès',
      bien: updatedBien[0]
    });
    
  } catch (error) {
    console.error('❌ Erreur PUT bien:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
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

    const photos = await queryRows(
      'SELECT url FROM photos WHERE bien_id = ?',
      [id]
    ) as any[];

    console.log(`🗑️ Suppression du bien ${id} avec ${photos.length} photos`);

    for (const photo of photos) {
      const filePath = path.join(process.cwd(), 'public', photo.url);
      try {
        await unlink(filePath);
        console.log('✅ Fichier supprimé:', filePath);
      } catch (error) {
        console.log('⚠️ Fichier non trouvé:', filePath);
      }
    }

    await queryInsert('DELETE FROM biens WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Bien supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur DELETE bien:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}