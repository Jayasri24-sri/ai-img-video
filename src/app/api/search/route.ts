import { NextRequest, NextResponse } from 'next/server';
import { getAllFiles } from '@/lib/vectorstore';
import { analyzeImageWithCloudflare } from '@/lib/cloudflare-ai';
import { getPresignedUrl } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'No query provided' },
        { status: 400 }
      );
    }

    // Get all uploaded files
    const files = await getAllFiles();

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        answer: 'No files have been uploaded yet. Please upload some files first.',
        filesAnalyzed: 0,
      });
    }

    // Analyze files based on the query
    const fileAnalyses: string[] = [];

    for (const file of files) {
      if (file.type === 'text' && file.textContent) {
        // For text files, include the content
        fileAnalyses.push(
          `File: ${file.filename} (Text)\nContent: ${file.textContent.substring(0, 2000)}`
        );
      } else if (file.type === 'image' && file.mediaUrl) {
        // For images, fetch and analyze them
        try {
          // Determine if mediaUrl is an R2 key or full URL
          const isR2Key = !file.mediaUrl.startsWith('http');
          const imageUrl = isR2Key
            ? await getPresignedUrl(file.mediaUrl)
            : file.mediaUrl;

          console.log(`Fetching image from: ${imageUrl} (R2 key: ${isR2Key ? file.mediaUrl : 'N/A'})`);
          const imageResponse = await fetch(imageUrl);

          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
          }

          const arrayBuffer = await imageResponse.arrayBuffer();
          console.log(`Image fetched, size: ${arrayBuffer.byteLength} bytes`);

          const description = await analyzeImageWithCloudflare(arrayBuffer);
          console.log(`Image analysis successful: ${description.substring(0, 100)}...`);

          fileAnalyses.push(
            `File: ${file.filename} (Image)\nDescription: ${description}`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Failed to analyze image ${file.filename}:`, errorMessage);

          // Include the error in the context so the LLM knows what went wrong
          fileAnalyses.push(
            `File: ${file.filename} (Image)\nNote: Image analysis encountered an error (${errorMessage}). The image could not be analyzed automatically.`
          );
        }
      } else if (file.type === 'video' && file.mediaUrl) {
        // For videos, provide basic info (video analysis would require frame extraction)
        fileAnalyses.push(
          `File: ${file.filename} (Video)\nURL: ${file.mediaUrl}\nNote: Video uploaded at ${new Date(file.timestamp).toLocaleString()}`
        );
      }
    }

    // Combine all analyses with the query to generate a comprehensive answer
    const context = fileAnalyses.join('\n\n');
    const answer = await generateAnswerWithCloudflare(query, context);

    return NextResponse.json({
      success: true,
      answer,
      filesAnalyzed: files.length,
      query,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search', details: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to generate answer using Cloudflare AI
async function generateAnswerWithCloudflare(
  query: string,
  context: string
): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare credentials not configured');
  }

  const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI assistant that answers questions based on uploaded files. Answer the user\'s question using the provided file contents and descriptions. Be concise, accurate, and direct. If a file analysis failed or is incomplete, acknowledge this but still provide the best answer you can based on available information. Do not give generic "I cannot determine" responses - always try to be helpful.',
        },
        {
          role: 'user',
          content: `Here are the files that have been uploaded:\n\n${context}\n\nQuestion: ${query}\n\nPlease answer the question based on the information from the files above. If you cannot fully answer due to missing information, explain what you can determine and what is missing.`,
        },
      ],
    }),
  });

  const responseText = await response.text();
  console.log('Cloudflare AI response:', { status: response.status, body: responseText.substring(0, 500) });

  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);

  if (!data.success) {
    throw new Error(`Cloudflare AI failed: ${JSON.stringify(data.errors)}`);
  }

  return data.result?.response || 'Unable to generate answer';
}