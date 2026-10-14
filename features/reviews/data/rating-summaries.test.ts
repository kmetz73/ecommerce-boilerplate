import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  groupBy: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    review: db,
  },
}));

import { getPublishedRatingSummaries } from './rating-summaries';

const greenCupUuid = '550e8400-e29b-41d4-a716-446655440000';

const blueCupUuid = '550e8400-e29b-41d4-a716-446655440001';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('getPublishedRatingSummaries', () => {
  it('queries published ratings for multiple products', async () => {
    db.groupBy.mockResolvedValue([]);

    await getPublishedRatingSummaries([greenCupUuid, blueCupUuid]);

    expect(db.groupBy).toHaveBeenCalledWith({
      by: ['productUuid'],
      where: {
        productUuid: {
          in: [greenCupUuid, blueCupUuid],
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
  });

  it('returns average ratings and review counts', async () => {
    db.groupBy.mockResolvedValue([
      {
        productUuid: greenCupUuid,
        _avg: {
          rating: '4.375',
        },
        _count: {
          _all: 4,
        },
      },
      {
        productUuid: blueCupUuid,
        _avg: {
          rating: '5.00',
        },
        _count: {
          _all: 2,
        },
      },
    ]);

    const result = await getPublishedRatingSummaries([
      greenCupUuid,
      blueCupUuid,
    ]);

    expect(result.get(greenCupUuid)).toEqual({
      averageRating: 4.375,
      reviewCount: 4,
    });

    expect(result.get(blueCupUuid)).toEqual({
      averageRating: 5,
      reviewCount: 2,
    });
  });

  it('skips the query when there are no products', async () => {
    const result = await getPublishedRatingSummaries([]);

    expect(result.size).toBe(0);
    expect(db.groupBy).not.toHaveBeenCalled();
  });

  it('returns no rating for a product without reviews', async () => {
    db.groupBy.mockResolvedValue([]);

    const result = await getPublishedRatingSummaries([greenCupUuid]);

    expect(result.has(greenCupUuid)).toBe(false);
  });
});
