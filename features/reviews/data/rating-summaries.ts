import prisma from '@/lib/prisma';

export type ProductRatingSummary = {
  averageRating: number;
  reviewCount: number;
};

export async function getPublishedRatingSummaries(
  productUuids: string[]
): Promise<Map<string, ProductRatingSummary>> {
  const summaries = new Map<string, ProductRatingSummary>();

  // Avoid an unnecessary database query.
  if (productUuids.length === 0) {
    return summaries;
  }

  const results = await prisma.review.groupBy({
    by: ['productUuid'],
    where: {
      productUuid: {
        in: productUuids,
      },
      status: 'PUBLISHED',
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });

  for (const result of results) {
    if (result._avg.rating === null || result._count._all === 0) {
      continue;
    }

    summaries.set(result.productUuid, {
      averageRating: Number(result._avg.rating),
      reviewCount: result._count._all,
    });
  }

  return summaries;
}
