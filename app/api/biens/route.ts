import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// GET - Liste des biens
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const proprietaire_id = searchParams.get('proprietaire_id');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (proprietaire_id) {
      whereClause += ' AND proprietaire_id = ?';
      params.push(proprietaire_id);
    }

    const biens = await queryRows(
      `SELECT b.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', p.id, 'url', p.url, 'legende', p.legende, 'est_principale', p.est_principale)
        ) FROM photos p WHERE p.bien_id = b.id) as photos,
        (SELECT JSON_OBJECT('id', l.id, 'nom', l.nom, 'prenom', l.prenom) 
         FROM locataires l 
         WHERE l.bien_id = b.id AND l.actif = 1 LIMIT 1) as locataire_actuel
       FROM biens b
       ${whereClause}
       ORDER BY b.created_at DESC`,
      params
    ) as any[];

    // Traitement des JSON
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

      return {
        ...b,
        photos: photos || [],
        locataire_actuel: locataire_actuel || null
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
    const charges = formData.get('charges') as string;
    const depot_garantie = formData.get('depot_garantie') as string;
    const date_acquisition = formData.get('date_acquisition') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;

    console.log('📦 Données reçues:', {
      proprietaire_id, nom, type_bien, statut, adresse, commune, district,
      surface, pieces, loyer_mensuel
    });

    // Validation
    const errors = [];
    if (!proprietaire_id) errors.push('proprietaire_id manquant');
    if (!nom) errors.push('nom manquant');
    if (!type_bien) errors.push('type_bien manquant');
    if (!statut) errors.push('statut manquant');
    if (!adresse) errors.push('adresse manquante');
    if (!commune) errors.push('commune manquante');
    if (!district) errors.push('district manquant');
    if (!surface) errors.push('surface manquante');
    if (!pieces) errors.push('pieces manquant');
    if (!loyer_mensuel) errors.push('loyer_mensuel manquant');

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Champs obligatoires manquants', details: errors },
        { status: 400 }
      );
    }

    // Vérifier les valeurs numériques
    const surfaceNum = parseFloat(surface);
    const piecesNum = parseInt(pieces);
    const loyerNum = parseFloat(loyer_mensuel);
    const chargesNum = charges ? parseFloat(charges) : 0;
    const depotNum = depot_garantie ? parseFloat(depot_garantie) : null;
    const etageNum = etage ? parseInt(etage) : null;

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

    // Insérer le bien
    const result = await queryInsert(
      `INSERT INTO biens (
        proprietaire_id, nom, type_bien, statut, adresse, quartier, commune,
        ville, district, pays, surface, pieces, etage, description,
        loyer_mensuel, charges, depot_garantie, date_acquisition,
        latitude, longitude, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parseInt(proprietaire_id), 
        nom, 
        type_bien, 
        statut, 
        adresse, 
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
        chargesNum, 
        depotNum,
        date_acquisition || null, 
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null
      ]
    );

    if (!result.success) {
      console.error('❌ Erreur insertion:', result);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création dans la base de données' },
        { status: 500 }
      );
    }

    const bienId = result.insertId;
    console.log('✅ Bien créé avec ID:', bienId);

    // ✅ Gérer les photos en base64
    const photos = formData.getAll('photos') as File[];
    console.log(`📸 ${photos.length} photos reçues`);
    
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        try {
          // Limiter la taille à 5MB par photo
          if (photo.size > 5 * 1024 * 1024) {
            console.log(`⚠️ Photo ${i+1} trop grande, ignorée`);
            continue;
          }

          // Vérifier le type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(photo.type)) {
            console.log(`⚠️ Type de fichier non supporté: ${photo.type}`);
            continue;
          }

          // Convertir en base64
          const bytes = await photo.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          const mimeType = photo.type;
          
          const url = `data:${mimeType};base64,${base64}`;
          
          await queryInsert(
            'INSERT INTO photos (bien_id, url, est_principale, ordre) VALUES (?, ?, ?, ?)',
            [bienId, url, i === 0 ? 1 : 0, i]
          );
          
          console.log(`✅ Photo ${i+1} ajoutée en base64`);
        } catch (photoError) {
          console.error(`❌ Erreur traitement photo ${i+1}:`, photoError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      id: bienId,
      message: 'Bien créé avec succès'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur POST bien:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}