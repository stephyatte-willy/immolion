import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryInsert } from '@/app/lib/database';
import { unlink } from 'fs/promises';
import path from 'path';

// GET - Récupérer un document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const documents = await queryRows(
      'SELECT * FROM documents WHERE id = ?',
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

// PUT - Mettre à jour un document (changer le type ou la date d'expiration)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { type_document, date_expiration } = body;

    await queryInsert(
      `UPDATE documents SET
        type_document = ?,
        date_expiration = ?,
        created_at = created_at
       WHERE id = ?`,
      [
        type_document,
        date_expiration || null,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Document mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur PUT document:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
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

    // Récupérer l'URL du document avant suppression
    const documents = await queryRows(
      'SELECT url FROM documents WHERE id = ?',
      [id]
    ) as any[];

    if (documents.length > 0) {
      const filePath = path.join(process.cwd(), 'public', documents[0].url);
      try {
        await unlink(filePath);
        console.log('✅ Fichier supprimé:', filePath);
      } catch (error) {
        console.log('⚠️ Fichier non trouvé:', filePath);
      }
    }

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