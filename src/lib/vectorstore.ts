// Simple in-memory vector store as replacement for ChromaDB
// For production, you would use Cloudflare Vectorize with Workers or another vector DB

interface VectorItem {
  id: string;
  embedding: number[];
  document: string;
  metadata: {
    type: string;
    filename: string;
    content: string;
    timestamp: string;
  };
}

class VectorStore {
  private items: VectorItem[] = [];

  async add(item: VectorItem): Promise<void> {
    this.items.push(item);
  }

  async query(queryEmbedding: number[], limit: number = 5): Promise<{
    ids: string[];
    documents: string[];
    metadatas: any[];
    distances: number[];
  }> {
    // Calculate cosine similarity for each item
    const results = this.items.map(item => ({
      ...item,
      distance: this.cosineSimilarity(queryEmbedding, item.embedding)
    }));

    // Sort by similarity (higher is better)
    results.sort((a, b) => b.distance - a.distance);

    // Take top N results
    const topResults = results.slice(0, limit);

    return {
      ids: topResults.map(r => r.id),
      documents: topResults.map(r => r.document),
      metadatas: topResults.map(r => r.metadata),
      distances: topResults.map(r => 1 - r.distance), // Convert to distance (lower is better)
    };
  }

  async getAll(limit: number = 50): Promise<{
    ids: string[];
    documents: string[];
    metadatas: any[];
  }> {
    const recentItems = this.items.slice(-limit).reverse();

    return {
      ids: recentItems.map(item => item.id),
      documents: recentItems.map(item => item.document),
      metadatas: recentItems.map(item => item.metadata),
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Singleton instance
let vectorStore: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!vectorStore) {
    vectorStore = new VectorStore();
  }
  return vectorStore;
}

export async function addToVectorStore(
  id: string,
  embedding: number[],
  document: string,
  metadata: {
    type: string;
    filename: string;
    content: string;
    timestamp: string;
  }
): Promise<void> {
  const store = getVectorStore();
  await store.add({ id, embedding, document, metadata });
}

export async function queryVectorStore(
  queryEmbedding: number[],
  limit: number = 5
) {
  const store = getVectorStore();
  return store.query(queryEmbedding, limit);
}

export async function getAllFromVectorStore(limit: number = 50) {
  const store = getVectorStore();
  return store.getAll(limit);
}