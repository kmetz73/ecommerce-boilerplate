import { GetObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';

import { getProductImageById } from '@/features/products/data/product-images';
import { getS3Client, getStorageConfig } from '@/lib/storage/s3';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    imageId: string;
  }>;
};

const allowedContentTypes = ['image/jpeg', 'image/png', 'image/webp'];

export async function GET(_request: Request, { params }: RouteContext) {
  const { imageId } = await params;

  const parsed = z.string().uuid().safeParse(imageId);

  if (!parsed.success) {
    return new Response('Image not found', { status: 404 });
  }

  const image = await getProductImageById(parsed.data);

  // Do not expose images from inactive products.
  if (!image || !image.product.active) {
    return new Response('Image not found', { status: 404 });
  }

  try {
    const { bucket } = getStorageConfig();

    const object = await getS3Client().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: image.objectKey,
      })
    );

    if (!object.Body) {
      return new Response('Image not found', { status: 404 });
    }

    const contentType = object.ContentType ?? '';

    if (!allowedContentTypes.includes(contentType)) {
      return new Response('Unsupported image type', {
        status: 415,
      });
    }

    // Protect against unexpectedly oversized stored objects.
    if (
      object.ContentLength === undefined ||
      object.ContentLength === 0 ||
      object.ContentLength > 5 * 1024 * 1024
    ) {
      return new Response('Invalid image size', {
        status: 413,
      });
    }

    return new Response(object.Body.transformToWebStream(), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=60',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ['NoSuchKey', 'NotFound'].includes(error.name)
    ) {
      return new Response('Image not found', { status: 404 });
    }

    console.error('Product image retrieval failed:', error);

    return new Response('Unable to retrieve image', {
      status: 502,
    });
  }
}
