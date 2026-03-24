import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';

// GET - Récupérer un document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const documents = await queryRows(
      `SELECT d.*, l.nom as locataire_nom, l.prenom as locataire_prenom
       FROM documents d
       LEFT JOIN locataires l ON d.locataire_id = l.id
       WHERE d.id = ?`,
      [id]
    ) as any[];

    if (documents.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Document non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: documents[0]
    });
  } catch (error) {
    console.error('❌ Erreur GET document:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    
    const type_document = formData.get('type_document') as string;
    const date_expiration = formData.get('date_expiration') as string;
    const fichiers = formData.getAll('documents') as File[];

    // ✅ Formater la date pour MySQL
    let dateExpirationFormatted = null;
    if (date_expiration && date_expiration.trim() !== '') {
      if (date_expiration.includes('T')) {
        dateExpirationFormatted = date_expiration.split('T')[0];
      } else {
        dateExpirationFormatted = date_expiration;
      }
    }

    // ✅ Mise à jour du type et de la date
    await queryInsert(
      `UPDATE documents SET
        type_document = ?,
        date_expiration = ?,
        created_at = created_at
       WHERE id = ?`,
      [
        type_document,
        dateExpirationFormatted,
        id
      ]
    );

    // ✅ Si un nouveau fichier est fourni, le remplacer
    if (fichiers.length > 0) {
      const fichier = fichiers[0];
      
      if (fichier.size <= 10 * 1024 * 1024) {
        const bytes = await fichier.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const mimeType = fichier.type;
        const url = `data:${mimeType};base64,${base64}`;

        await queryInsert(
          `UPDATE documents SET url = ?, taille = ?, nom = ? WHERE id = ?`,
          [url, fichier.size, fichier.name, id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Document modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur PUT document:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await queryInsert('DELETE FROM documents WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE document:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}