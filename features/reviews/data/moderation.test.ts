import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    review: db,
  },
}));

import {
  getReviewsForModeration,
  updateReviewModerationStatus,
} from './moderation';

const reviewUuid = 'c6408628-8858-4a4b-a315-60dbd61a0e3c';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Review Moderation Data Access', () => {
  it('retrieves reviews including hidden reviews', async () => {
    db.findMany.mockResolvedValue([]);

    await getReviewsForModeration();

    expect(db.findMany).toHaveBeenCalledWith({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        uuid: true,
        rating: true,
        body: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });
  });

  it('updates only a review moderation status', async () => {
    db.updateMany.mockResolvedValue({ count: 1 });

    await updateReviewModerationStatus({
      reviewUuid,
      status: 'HIDDEN',
    });

    expect(db.updateMany).toHaveBeenCalledWith({
      where: { uuid: reviewUuid },
      data: { status: 'HIDDEN' },
    });
  });
});
