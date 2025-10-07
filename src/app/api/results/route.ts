import { NextRequest, NextResponse } from 'next/server';
import { getAllFromVectorStore } from '@/lib/vectorstore';

export async function GET(request: NextRequest) {
  try {
    // Get all stored items (limit to recent 50)
    const results = await getAllFromVectorStore(50);

    return NextResponse.json({
      success: true,
      items: results.ids.map((id, index) => ({
        id,
        document: results.documents?.[index],
        metadata: results.metadatas?.[index],
      })),
    });
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results', details: String(error) },
      { status: 500 }
    );
  }
}