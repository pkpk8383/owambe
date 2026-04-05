import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { logger } from '../utils/logger';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'af-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Custom S3 storage engine for multer
const s3Storage = {
  _handleFile: async (req: any, file: any, cb: any) => {
    try {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      const key = `uploads/${uuidv4()}.${ext}`;
      const bucket = process.env.AWS_S3_BUCKET || 'owambe-media';

      const chunks: Buffer[] = [];
      file.stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      file.stream.on('end', async () => {
        const buffer = Buffer.concat(chunks);

        // Resize and optimise images
        const optimised = await sharp(buffer)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();

        const webpKey = key.replace(`.${ext}`, '.webp');

        await s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: webpKey,
          Body: optimised,
          ContentType: 'image/webp',
          CacheControl: 'max-age=31536000',
        }));

        const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${webpKey}`;
        cb(null, { key: webpKey, location: url, mimetype: 'image/webp', size: optimised.length });
      });

      file.stream.on('error', cb);
    } catch (err) {
      logger.error('S3 upload error:', err);
      cb(err);
    }
  },
  _removeFile: (_req: any, _file: any, cb: any) => cb(null),
};

export const upload = multer({
  storage: s3Storage as any,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ─── DIRECT BUFFER UPLOAD (for PDFs, generated files) ────
export async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType: string = 'application/pdf'
): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET || 'owambe-media';

  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // PDFs don't need public ACL — serve via signed URL or direct link
    Metadata: {
      'uploaded-by': 'owambe-api',
      'upload-timestamp': new Date().toISOString(),
    },
  }));

  const region = process.env.AWS_REGION || 'af-south-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
