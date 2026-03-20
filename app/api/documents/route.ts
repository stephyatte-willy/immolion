import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Liste des documents avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locataire_id = searchParams.get('locataire_id');
    const contrat_id = searchParams.get('contrat_id');
    const bien_id = searchParams.get('bien_id');
    const type = searchParams.get('type');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (locataire_id) {
      whereClause += ' AND locataire_id = ?';
      params.push(locataire_id);
    }

    if (contrat_id) {
      whereClause += ' AND contrat_id = ?';
      params.push(contrat_id);
    }

    if (bien_id) {
      whereClause += ' AND bien_id = ?';
      params.push(bien_id);
    }

    if (type) {
      whereClause += ' AND type_document = ?';
      params.push(type);
    }

    const documents = await queryRows(
      `SELECT * FROM documents 
       ${whereClause}
       ORDER BY date_upload DESC`,
      params
    ) as any[];

    return NextResponse.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('❌ Erreur GET documents:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Upload de documents en base64
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const locataire_id = formData.get('locataire_id') as string;
    const contrat_id = formData.get('contrat_id') as string;
    const bien_id = formData.get('bien_id') as string;
    const type_document = formData.get('type_document') as string;
    const date_expiration = formData.get('date_expiration') as string;
    
    const fichiers = formData.getAll('documents') as File[];

    // Validation
    if (!locataire_id) {
      return NextResponse.json(
        { success: false, erreur: 'ID du locataire requis' },
        { status: 400 }
      );
    }

    if (fichiers.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Aucun fichier sélectionné' },
        { status: 400 }
      );
    }

    // Limite de taille : 10 MB par fichier
    const MAX_SIZE = 10 * 1024 * 1024;
    const documentsAjoutes = [];

    for (const fichier of fichiers) {
      // Vérifier la taille
      if (fichier.size > MAX_SIZE) {
        return NextResponse.json(
          { success: false, erreur: `Le fichier ${fichier.name} dépasse 10 MB` },
          { status: 400 }
        );
      }

      // Vérifier le type
      const typesAutorises = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/rtf'
      ];

      // Pour les types d'images qui commencent par 'image/'
      const typeEstAutorise = typesAutorises.includes(fichier.type) || fichier.type.startsWith('image/');
      
      if (!typeEstAutorise) {
        return NextResponse.json(
          { success: false, erreur: `Type de fichier non autorisé: ${fichier.name} (${fichier.type})` },
          { status: 400 }
        );
      }

      try {
        // Convertir le fichier en base64
        const bytes = await fichier.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const mimeType = fichier.type;
        
        // Stocker directement le contenu base64 dans l'URL
        const url = `data:${mimeType};base64,${base64}`;

        // Insérer dans la base de données
        const result = await queryInsert(
          `INSERT INTO documents (
            locataire_id, contrat_id, bien_id, type_document, 
            nom, url, taille, date_expiration, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            parseInt(locataire_id),
            contrat_id ? parseInt(contrat_id) : null,
            bien_id ? parseInt(bien_id) : null,
            type_document || 'AUTRE',
            fichier.name,
            url,
            fichier.size,
            date_expiration || null
          ]
        );

        if (result.success) {
          documentsAjoutes.push({
            id: result.insertId,
            nom: fichier.name,
            url,
            taille: fichier.size,
            type_document: type_document || 'AUTRE'
          });
          console.log(`✅ Document ${fichier.name} ajouté en base64 (${(fichier.size / 1024).toFixed(2)} KB)`);
        }
      } catch (docError) {
        console.error(`❌ Erreur traitement document ${fichier.name}:`, docError);
        return NextResponse.json(
          { success: false, erreur: `Erreur lors du traitement de ${fichier.name}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${documentsAjoutes.length} document(s) ajouté(s) avec succès`,
      documents: documentsAjoutes
    });

  } catch (error: any) {
    console.error('❌ Erreur POST documents:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}