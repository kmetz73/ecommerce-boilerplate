import { S3Client } from '@aws-sdk/client-s3';
import { z } from 'zod';

const storageConfigSchema = z.object({
  endpoint: z.url(),
  region: z.string().min(1),
  bucket: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
});

export const getStorageConfig = () => {
  return storageConfigSchema.parse({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });
};

let s3Client: S3Client | undefined;

export const getS3Client = () => {
  if (!s3Client) {
    const config = getStorageConfig();

    s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  return s3Client;
};
