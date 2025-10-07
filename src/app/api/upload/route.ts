import { NextRequest, NextResponse } from 'next/server';
import { addToVectorStore } from '@/lib/vectorstore';
import {
  analyzeWithCloudflare,
  analyzeImageWithCloudflare,
  generateEmbeddingWithCloudflare,
} from '@/lib/cloudflare-ai';
import { uploadToR2 } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let textDescription: string;
    let mediaUrl: string | null = null;
    let embedding: number[];

    // Handle different file types
    if (type === 'text') {
      // Text: Just read content, no R2 upload needed
      const content = await file.text();
      textDescription = await analyzeWithCloudflare(content, 'text');
      embedding = await generateEmbeddingWithCloudflare(textDescription);
    } else if (type === 'image') {
      // Image: Upload to R2, generate text description, embed the description
      console.log('Uploading image to R2...');
      mediaUrl = await uploadToR2(file, 'images');
      console.log('Image uploaded to:', mediaUrl);

     // Generate text description from image - pass ArrayBuffer directly
      const arrayBuffer = await file.arrayBuffer();
      textDescription = await analyzeImageWithCloudflare(arrayBuffer);

      // Create embedding from the TEXT DESCRIPTION only
      embedding = await generateEmbeddingWithCloudflare(textDescription);
    } else if (type === 'video') {
      // Video: Upload to R2, generate text description, embed the description
      console.log('Uploading video to R2...');
      mediaUrl = await uploadToR2(file, 'videos');
      console.log('Video uploaded to:', mediaUrl);

      // Generate text description for video
      textDescription = `Video uploaded: ${file.name}. Size: ${Math.round(file.size / 1024 / 1024)}MB. URL: ${mediaUrl}`;

      // For now, use basic description. In production, you might want to:
      // 1. Extract frames from video
      // 2. Analyze frames with vision model
      // 3. Generate comprehensive description

      // Create embedding from the TEXT DESCRIPTION only
      embedding = await generateEmbeddingWithCloudflare(textDescription);
    } else {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Store in vector store with metadata
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await addToVectorStore(
      id,
      embedding, // Embedding is ALWAYS from text
      textDescription, // Store the text description as document
      {
        type,
        filename: file.name,
        content: textDescription.substring(0, 1000), // Text description
        timestamp: new Date().toISOString(),
        // Store media URLs in metadata (for images/videos)
        ...(mediaUrl && {
          media_url: mediaUrl,
          video_url: type === 'video' ? mediaUrl : undefined,
          image_url: type === 'image' ? mediaUrl : undefined,
        }),
      }
    );

    return NextResponse.json({
      success: true,
      id,
      analysis: textDescription,
      type,
      filename: file.name,
      media_url: mediaUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload', details: String(error) },
      { status: 500 }
    );
  }
}
