import { NextRequest, NextResponse } from 'next/server';
import { addFile } from '@/lib/vectorstore';
import { uploadToR2 } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let mediaUrl: string | undefined; // Note: For R2 files, this stores the R2 key, not a URL
    let textContent: string | undefined;

    // Handle different file types - just store, don't analyze yet
    if (type === 'text') {
      // Text: Read content and store it
      textContent = await file.text();
    } else if (type === 'image') {
      // Image: Upload to R2 and store the key
      console.log('Uploading image to R2...');
      mediaUrl = await uploadToR2(file, 'images');
      console.log('Image uploaded with key:', mediaUrl);
    } else if (type === 'video') {
      // Video: Upload to R2 and store the key
      console.log('Uploading video to R2...');
      mediaUrl = await uploadToR2(file, 'videos');
      console.log('Video uploaded with key:', mediaUrl);
    } else {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Store file metadata (mediaUrl contains R2 key for images/videos)
    await addFile({
      id,
      type: type as 'text' | 'image' | 'video' | 'pdf',
      filename: file.name,
      mediaUrl,
      textContent,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      id,
      type,
      filename: file.name,
      analysis: 'File uploaded successfully. You can now search!',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload', details: String(error) },
      { status: 500 }
    );
  }
}
