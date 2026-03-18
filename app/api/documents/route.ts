import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

// POST - Upload de documents
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
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!typesAutorises.includes(fichier.type) && !fichier.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, erreur: `Type de fichier non autorisé: ${fichier.name}` },
          { status: 400 }
        );
      }

      // Créer le dossier uploads s'il n'existe pas
      const uploadDir = path.join(process.cwd(), 'public/uploads/documents');
      await mkdir(uploadDir, { recursive: true });

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const fileExtension = fichier.name.split('.').pop() || 'pdf';
      const fileName = `doc-${locataire_id}-${timestamp}-${uuidv4().slice(0, 8)}.${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Sauvegarder le fichier
      const bytes = await fichier.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      const url = `/uploads/documents/${fileName}`;

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
      }
    }

    return NextResponse.json({
      success: true,
      message: `${documentsAjoutes.length} document(s) ajouté(s) avec succès`,
      documents: documentsAjoutes
    });

  } catch (error) {
    console.error('❌ Erreur POST documents:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}