import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer les informations de l'entreprise
export async function GET() {
  try {
    const entreprises = await queryRows('SELECT * FROM entreprise LIMIT 1') as any[];
    
    return NextResponse.json({
      success: true,
      entreprise: entreprises[0] || null
    });
  } catch (error) {
    console.error('❌ Erreur GET entreprise:', error);
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

    // ✅ Solution simple : Convertir le logo en Base64
    if (logo && logo.size > 0) {
      try {
        // Limiter la taille à 2MB pour éviter les problèmes
        if (logo.size > 2 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, erreur: 'Le logo ne doit pas dépasser 2MB' },
            { status: 400 }
          );
        }

        // Convertir le fichier en base64
        const bytes = await logo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const mimeType = logo.type;
        
        // Stocker directement en base64 dans la base de données
        logo_url = `data:${mimeType};base64,${base64}`;
        console.log('✅ Logo converti en base64');
      } catch (uploadError) {
        console.error('❌ Erreur conversion logo:', uploadError);
        return NextResponse.json(
          { success: false, erreur: 'Erreur lors du traitement du logo' },
          { status: 500 }
        );
      }
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
  } catch (error: any) {
    console.error('❌ Erreur POST entreprise:', error);
    return NextResponse.json(
      { success: false, erreur: `Erreur serveur: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT - Modifier l'entreprise
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

    // ✅ Solution simple : Mettre à jour le logo en base64 si un nouveau fichier est fourni
    if (logo && logo.size > 0) {
      try {
        // Limiter la taille à 2MB
        if (logo.size > 2 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, erreur: 'Le logo ne doit pas dépasser 2MB' },
            { status: 400 }
          );
        }

        // Convertir le nouveau logo en base64
        const bytes = await logo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const mimeType = logo.type;
        
        logo_url = `data:${mimeType};base64,${base64}`;
        console.log('✅ Nouveau logo converti en base64');
      } catch (uploadError) {
        console.error('❌ Erreur conversion logo:', uploadError);
        return NextResponse.json(
          { success: false, erreur: 'Erreur lors du traitement du logo' },
          { status: 500 }
        );
      }
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
  } catch (error: any) {
    console.error('❌ Erreur PUT entreprise:', error);
    return NextResponse.json(
      { success: false, erreur: `Erreur serveur: ${error.message}` },
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

    // Supprimer de la base de données (le logo est stocké en base64, pas besoin de supprimer de fichier)
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
    console.error('❌ Erreur DELETE entreprise:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}