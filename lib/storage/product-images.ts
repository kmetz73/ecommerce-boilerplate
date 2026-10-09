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

  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new Error('Image must be between 1 byte and 5 MB.');
  }

  if (!isImageType(file.type)) {
    throw new Error('Only JPG, PNG, and WebP images are supported.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!hasValidImageSignature(bytes, file.type)) {
    throw new Error('Image file signature does not match its type.');
  }

  const extension = allowedTypes[file.type];

  const key = `products/${validUuid}/${randomUUID()}.${extension}`;

  const config = getStorageConfig();

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: bytes,
      ContentType: file.type,
    })
  );

  return {
    key,
    contentType: file.type,
    sizeBytes: file.size,
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

