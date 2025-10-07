import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/lib/vectorstore';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'No file ID provided' },
        { status: 400 }
      );
    }

    const deleted = await deleteFile(id);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: String(error) },
      { status: 500 }
    );
  }
}