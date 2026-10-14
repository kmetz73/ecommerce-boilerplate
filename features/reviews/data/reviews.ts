import prisma from '@/lib/prisma';

// Retrieve published customer reviews for a product.
export async function getPublishedProductReviews(productUuid: string) {
  return prisma.review.findMany({
    where: {
      productUuid,
      status: 'PUBLISHED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      uuid: true,
      rating: true,
      body: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

// Save a customer's review to PostgreSQL.
export async function createProductReview(input: {
  productUuid: string;
  userId: number;
  rating: number;
  body: string | null;
}) {
  return prisma.review.create({
    data: {
      productUuid: input.productUuid,
      userId: input.userId,
      rating: input.rating,
      body: input.body,
    },
  });
}


export async function getReviewForProductAndUser(
  productUuid: string,
  userId: number
) {
  return prisma.review.findUnique({
    where: {
      productUuid_userId: {
        productUuid,
        userId,
      },
    },
    select: {
      uuid: true,
      rating: true,
      body: true,
      status: true,
    },
  });
}

export async function updateReviewForOwner(input: {
  reviewUuid: string;
  productUuid: string;
  userId: number;
  rating: number;
  body: string | null;
}) {
  return prisma.review.updateMany({
    where: {
      uuid: input.reviewUuid,
      productUuid: input.productUuid,
      userId: input.userId,
    },
    data: {
      rating: input.rating,
      body: input.body,
    },
  });
}

export async function deleteReviewForOwner(input: {
  reviewUuid: string;
  productUuid: string;
  userId: number;
}) {
  return prisma.review.deleteMany({
    where: {
      uuid: input.reviewUuid,
      productUuid: input.productUuid,
      userId: input.userId,
    },
  });
}
