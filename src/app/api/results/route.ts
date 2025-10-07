import { NextResponse } from 'next/server';
import { getAllFiles } from '@/lib/vectorstore';
import { getPresignedUrl } from '@/lib/r2-storage';

export async function GET() {
  try {
    // Get all stored files (limit to recent 50)
    const files = await getAllFiles(50);

    // Generate presigned URLs for R2 files
    const itemsWithUrls = await Promise.all(
      files.map(async (file) => {
        let displayUrl = file.mediaUrl;

        // If mediaUrl is an R2 key (not a full URL), generate presigned URL
        if (file.mediaUrl && !file.mediaUrl.startsWith('http')) {
          try {
            displayUrl = await getPresignedUrl(file.mediaUrl);
          } catch (error) {
            console.error(`Failed to generate presigned URL for ${file.mediaUrl}:`, error);
            // Keep the original key if presigned URL generation fails
          }
        }

        return {
          id: file.id,
          document: file.textContent?.substring(0, 200) || `${file.type} file: ${file.filename}`,
          metadata: {
            type: file.type,
            filename: file.filename,
            timestamp: file.timestamp,
            mediaUrl: displayUrl,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      items: itemsWithUrls,
    });
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results', details: String(error) },
      { status: 500 }
    );
  }
}