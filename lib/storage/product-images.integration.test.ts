import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { describe, expect, it } from 'vitest';

import { uploadProductImage } from './product-images';
import { getS3Client, getStorageConfig } from './s3';

describe.runIf(process.env.RUN_MINIO_INTEGRATION === '1')(
  'MinIO product image integration',
  () => {
    it('uploads, verifies, and removes an image', async () => {
      const productUuid = '550e8400-e29b-41d4-a716-446655440000';

      // Tiny PNG used only for this integration test
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZcAAAAASUVORK5CYII=';

      const bytes = Buffer.from(pngBase64, 'base64');

      const file = new File([bytes], 'test.png', {
        type: 'image/png',
      });

      const { bucket } = getStorageConfig();

      let uploadedKey: string | undefined;

      try {
        const result = await uploadProductImage(productUuid, file);

        uploadedKey = result.key;

        expect(uploadedKey).toContain(`products/${productUuid}/`);

        const object = await getS3Client().send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: uploadedKey,
          })
        );

        expect(object.ContentType).toBe('image/png');
        expect(object.ContentLength).toBe(bytes.length);

        console.log('MinIO image upload verified!');
      } finally {
        if (uploadedKey) {
          await getS3Client().send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: uploadedKey,
            })
          );

          console.log('Test image removed.');
        }
      }
    }, 20000);
  }
);
