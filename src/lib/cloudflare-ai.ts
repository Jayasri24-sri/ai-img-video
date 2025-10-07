// Cloudflare Workers AI integration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const TEXT_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
const VISION_MODEL = '@cf/llava-hf/llava-1.5-7b-hf'; // Vision-capable model

interface CloudflareAIResponse {
  result: {
    response?: string;
    description?: string;
    data?: number[][];
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

async function callCloudflareAI(
  endpoint: string,
  payload: any
): Promise<CloudflareAIResponse> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${endpoint}`;

  console.log('Calling Cloudflare AI:', { url, endpoint, payloadKeys: Object.keys(payload) });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log('Cloudflare AI response:', { status: response.status, body: responseText.substring(0, 500) });

  if (!response.ok) {
    throw new Error(`Cloudflare AI API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

export async function analyzeWithCloudflare(
  content: string,
  contentType: 'text' | 'image' | 'video'
): Promise<string> {
  try {
    const prompt = `Analyze this ${contentType} content and provide a detailed description and key insights:\n\n${content}`;

    const result = await callCloudflareAI(TEXT_MODEL, {
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    if (!result.success || !result.result.response) {
      throw new Error('Invalid response from Cloudflare AI');
    }

    return result.result.response;
  } catch (error) {
    console.error('Error analyzing with Cloudflare AI:', error);
    throw new Error('Failed to analyze content with Cloudflare AI');
  }
}

export async function analyzeImageWithCloudflare(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  try {
    // Convert ArrayBuffer to Uint8Array then to regular array
    const uint8Array = new Uint8Array(arrayBuffer);
    const imageArray = Array.from(uint8Array);

    const result = await callCloudflareAI(VISION_MODEL, {
      prompt: 'Describe this image in detail. What do you see? What are the key elements and insights? Provide a comprehensive analysis.',
      image: imageArray,
    });

    console.log('Vision result:', JSON.stringify(result).substring(0, 300));

    if (!result.success) {
      throw new Error(`Vision analysis failed: ${JSON.stringify(result.errors)}`);
    }

    // LLaVA returns response in result.description
    if (result.result.description) {
      return result.result.description;
    }

    if (result.result.response) {
      return result.result.response;
    }

    throw new Error('Invalid response format from Cloudflare AI vision model');
  } catch (error) {
    console.error('Error analyzing image with Cloudflare AI:', error);
    throw new Error(`Failed to analyze image with Cloudflare AI: ${error}`);
  }
}

export async function generateEmbeddingWithCloudflare(
  text: string
): Promise<number[]> {
  try {
    // Use Cloudflare's text embedding model
    const result = await callCloudflareAI('@cf/baai/bge-base-en-v1.5', {
      text: text,
    });

    console.log('Embedding result:', JSON.stringify(result).substring(0, 200));

    if (!result.success) {
      throw new Error(`Embedding failed: ${JSON.stringify(result.errors)}`);
    }

    // Cloudflare returns embeddings in result.data as array of arrays
    if (result.result.data && Array.isArray(result.result.data)) {
      const embedding = result.result.data[0];
      if (Array.isArray(embedding)) {
        return embedding;
      }
    }

    throw new Error('Invalid embedding format from Cloudflare AI');
  } catch (error) {
    console.error('Error generating embedding with Cloudflare AI:', error);
    throw new Error(`Failed to generate embedding with Cloudflare AI: ${error}`);
  }
}