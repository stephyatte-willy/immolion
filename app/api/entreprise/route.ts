import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// GET - Récupérer les informations de l'entreprise
export async function GET() {
  try {
    const entreprises = await queryRows('SELECT * FROM entreprise LIMIT 1') as any[];
    
    return NextResponse.json({
      success: true,
      entreprise: entreprises[0] || null
    });
  } catch (error) {
    console.error('Erreur GET entreprise:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle entreprise
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nom = formData.get('nom') as string;
    const ville = formData.get('ville') as string;
    const telephone = formData.get('telephone') as string;
    const email = formData.get('email') as string;
    const site_web = formData.get('site_web') as string;
    const logo = formData.get('logo') as File | null;

    // Validation
    if (!nom || !ville || !telephone || !email) {
      return NextResponse.json(
        { success: false, erreur: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    let logo_url = null;

    // Gérer l'upload du logo
    if (logo) {
      // Créer le dossier uploads s'il n'existe pas
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Le dossier existe déjà
      }

      // Générer un nom unique pour le fichier
      const fileExtension = logo.name.split('.').pop();
      const fileName = `logo-${uuidv4()}.${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Convertir le fichier en buffer et le sauvegarder
      const bytes = await logo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      logo_url = `/uploads/${fileName}`;
    }

    // Insérer dans la base de données
    const result = await queryInsert(
      `INSERT INTO entreprise (nom, ville, telephone, email, site_web, logo_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom, ville, telephone, email, site_web || null, logo_url]
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        id: result.insertId,
        message: 'Entreprise créée avec succès'
      });
    } else {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la création' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur POST entreprise:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const id = formData.get('id') as string;
    const nom = formData.get('nom') as string;
    const ville = formData.get('ville') as string;
    const telephone = formData.get('telephone') as string;
    const email = formData.get('email') as string;
    const site_web = formData.get('site_web') as string;
    const logo = formData.get('logo') as File | null;

    // 🔴 Vérification plus explicite
    if (!id) {
      console.error('❌ ID manquant dans la requête PUT');
      return NextResponse.json(
        { success: false, erreur: 'ID manquant' },
        { status: 400 }
      );
    }

    if (!nom || !ville || !telephone || !email) {
      return NextResponse.json(
        { success: false, erreur: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Vérifier que l'entreprise existe
    const entreprises = await queryRows(
      'SELECT * FROM entreprise WHERE id = ?',
      [id]
    ) as any[];
    
    if (entreprises.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    const entrepriseExistante = entreprises[0];
    let logo_url = entrepriseExistante.logo_url;

    // Gérer le nouveau logo
    if (logo && logo.size > 0) {
      // Supprimer l'ancien logo si existe
      if (logo_url) {
        const oldFilePath = path.join(process.cwd(), 'public', logo_url);
        try {
          await unlink(oldFilePath);
          console.log('✅ Ancien logo supprimé:', oldFilePath);
        } catch (error) {
          console.log('ℹ️ Ancien logo non trouvé ou erreur suppression');
        }
      }

      // Sauvegarder le nouveau logo
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      await mkdir(uploadDir, { recursive: true });
      
      const fileExtension = logo.name.split('.').pop();
      const fileName = `logo-${uuidv4()}.${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      
      const bytes = await logo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      logo_url = `/uploads/${fileName}`;
      console.log('✅ Nouveau logo sauvegardé:', logo_url);
    }

    // Mettre à jour la base de données
    const result = await queryInsert(
      `UPDATE entreprise 
       SET nom = ?, ville = ?, telephone = ?, email = ?, site_web = ?, logo_url = ?
       WHERE id = ?`,
      [nom, ville, telephone, email, site_web || null, logo_url, id]
    );

    if (result.success) {
      console.log('✅ Entreprise mise à jour avec succès, ID:', id);
      return NextResponse.json({
        success: true,
        message: 'Entreprise modifiée avec succès'
      });
    } else {
      console.error('❌ Erreur update:', result);
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la modification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erreur PUT entreprise:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer l'entreprise
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, erreur: 'ID manquant' },
        { status: 400 }
      );
    }

    // Récupérer le logo pour le supprimer
    const entreprises = await queryRows(
      'SELECT logo_url FROM entreprise WHERE id = ?',
      [id]
    ) as any[];

    if (entreprises.length > 0 && entreprises[0].logo_url) {
      const filePath = path.join(process.cwd(), 'public', entreprises[0].logo_url);
      try {
        await unlink(filePath);
      } catch (error) {
        // Le fichier n'existe pas, on continue
      }
    }

    // Supprimer de la base de données
    const result = await queryInsert('DELETE FROM entreprise WHERE id = ?', [id]);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Entreprise supprimée avec succès'
      });
    } else {
      return NextResponse.json(
        { success: false, erreur: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur DELETE entreprise:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}