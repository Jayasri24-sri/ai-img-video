import { NextRequest, NextResponse } from 'next/server';
import { queryVectorStore } from '@/lib/vectorstore';
import { generateEmbeddingWithCloudflare } from '@/lib/cloudflare-ai';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'No query provided' },
        { status: 400 }
      );
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbeddingWithCloudflare(query);

    // Search in vector store
    const results = await queryVectorStore(queryEmbedding, limit);

    return NextResponse.json({
      success: true,
      results: {
        ids: results.ids,
        documents: results.documents,
        metadatas: results.metadatas,
        distances: results.distances,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search', details: String(error) },
      { status: 500 }
    );
  }
}