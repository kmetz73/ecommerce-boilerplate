import prisma from '@/lib/prisma';


type CreateProductImageInput = {
  productUuid: string;
  objectKey: string;
  altText: string;
  sortOrder: number;
};

// Save an uploaded image reference in PostgreSQL.
export async function createProductImage(input: CreateProductImageInput) {
  return prisma.productImage.create({
    data: {
      productUuid: input.productUuid,
      objectKey: input.objectKey,
      altText: input.altText,
      sortOrder: input.sortOrder,
    },
  });
}

// Retrieve all images belonging to a product.
export async function getProductImages(productUuid: string) {
  return prisma.productImage.findMany({
    where: { productUuid },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      altText: true,
      sortOrder: true, // NEW: Needed to calculate the next image position
    },
  });
}

export async function getProductImageById(imageId: string) {
  return prisma.productImage.findUnique({
    where: {
      id: imageId,
    },
    select: {
      id: true,
      objectKey: true,
      product: {
        select: {
          active: true,
        },
      },
    },
  });
}

// Reorder a product's images so the selected image comes first.
export async function setPrimaryProductImageOrder(
  productUuid: string,
  imageId: string
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    // Retrieve the current image order.
    const images = await tx.productImage.findMany({
      where: { productUuid },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
      },
    });

    // Make sure the selected image belongs to this product.
    if (!images.some((image) => image.id === imageId)) {
      return false;
    }

    // Put the selected image first, preserving the others' order.
    const orderedIds = [
      imageId,
      ...images
        .map((image) => image.id)
        .filter((id) => id !== imageId),
    ];

    // Assign sequential positions: 0, 1, 2, and so on.
    for (const [sortOrder, id] of orderedIds.entries()) {
      await tx.productImage.update({
        where: { id },
        data: { sortOrder },
      });
    }

    return true;
  });
}
// Delete an image record belonging to a specific product.
// Return its storage key for MinIO cleanup.
export async function deleteProductImageRecord(
  productUuid: string,
  imageId: string
) {
  return prisma.$transaction(async (tx) => {
    const image = await tx.productImage.findFirst({
      where: {
        id: imageId,
        productUuid,
      },
      select: {
        id: true,
        objectKey: true,
      },
    });

    if (!image) {
      return null;
    }

    await tx.productImage.delete({
      where: {
        id: image.id,
      },
    });

    return image;
  });
}