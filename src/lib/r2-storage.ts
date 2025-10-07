import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'img-vid';

// Create S3 client configured for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  file: File,
  folder: 'images' | 'videos' | 'text'
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop();
    const key = `${folder}/${timestamp}-${randomString}.${extension}`;

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    console.log('Uploaded to R2:', { key });

    // Return the R2 key (not a URL) - we'll generate presigned URLs on demand
    return key;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error(`Failed to upload to R2: ${error}`);
  }
}

// Generate a presigned URL that's valid for 1 hour
export async function getPresignedUrl(key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    // Generate presigned URL valid for 1 hour
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error}`);
  }
}

export function getR2PublicUrl(key: string): string {
  return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;
}