import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';

import { getS3Client, getStorageConfig } from '@/lib/storage/s3';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const allowedTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type ImageType = keyof typeof allowedTypes;

function isImageType(type: string): type is ImageType {
  return type in allowedTypes;
}

function hasValidImageSignature(bytes: Uint8Array, type: ImageType) {
  if (type === 'image/jpeg') {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (type === 'image/png') {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    return signature.every((value, index) => bytes[index] === value);
  }

  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  );
}

export async function uploadProductImage(productUuid: string, file: File) {
  const validUuid = z.string().uuid().parse(productUuid);

  // 1. Validate original file size.
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new Error('Image must be between 1 byte and 5 MB.');
  }

  // 2. Validate declared image type.
  if (!isImageType(file.type)) {
    throw new Error('Only JPG, PNG, and WebP images are supported.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // console.log('IMAGE UPLOAD DEBUG:', {
  //   declaredType: file.type,
  //   fileSize: file.size,
  //   firstBytes: bytes.subarray(0, 16).toString('hex'),
  // });

  // 3. Validate image signature.
  if (!hasValidImageSignature(bytes, file.type)) {
    const detectedType = (Object.keys(allowedTypes) as ImageType[]).find(
      (type) => hasValidImageSignature(bytes, type)
    );

    const actualFormat = detectedType
      ? detectedType.split('/')[1].toUpperCase()
      : 'UNKNOWN';

    const declaredFormat = file.type.split('/')[1].toUpperCase();

    throw new Error(
      `Invalid image format. Your file is actually ${actualFormat}, ` +
        `but was identified as ${declaredFormat}. ` +
        `Please convert the image to a supported format and try again.`
    );
  }0

  // 4. Process image with Sharp.
  let optimizedBytes: Buffer;

  try {
    optimizedBytes = await sharp(bytes, {
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({
        width: 1800,
        height: 1800,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        effort: 4,
      })
      .toBuffer();
  } catch {
    throw new Error(
      'Unable to process image. Please upload a valid JPG, PNG, or WebP file.'
    );
  }

  // 5. Keep stored images within our existing size limit.
  if (optimizedBytes.length === 0 || optimizedBytes.length > MAX_FILE_SIZE) {
    throw new Error('Processed image exceeds the 5 MB storage limit.');
  }

  // 6. Generate a new WebP object key.
  const key = `products/${validUuid}/${randomUUID()}.webp`;

  const config = getStorageConfig();

  // 7. Upload optimized image to MinIO.
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: optimizedBytes,
      ContentType: 'image/webp',
    })
  );

  return {
    key,
    contentType: 'image/webp',
    sizeBytes: optimizedBytes.length,
  };
}

export async function deleteStoredProductImage(objectKey: string) {
  const config = getStorageConfig();

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
    })
  );
}
