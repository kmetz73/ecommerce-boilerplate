import prisma from '@/lib/prisma';

export type ModerationStatus = 'PUBLISHED' | 'HIDDEN';

// Admins need to see published AND hidden reviews.
export async function getReviewsForModeration() {
  return prisma.review.findMany({
    take: 100,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      uuid: true,
      rating: true,
      body: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
      product: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });
}

// Update only the moderation status.
export async function updateReviewModerationStatus(input: {
  reviewUuid: string;
  status: ModerationStatus;
}) {
  return prisma.review.updateMany({
    where: {
      uuid: input.reviewUuid,
    },
    data: {
      status: input.status,
    },
  });
}
