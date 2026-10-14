import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  findMany: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    review: db,
  },
}));

import {
  createProductReview,
  getPublishedProductReviews,
  getReviewForProductAndUser,
  updateReviewForOwner,
  deleteReviewForOwner,
} from './reviews';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Review Data Access', () => {
  const productUuid = '550e8400-e29b-41d4-a716-446655440000';
  const reviewUuid = 'c6408628-8858-4a4b-a315-60dbd61a0e3c';

  it('retrieves only published product reviews', async () => {
    db.findMany.mockResolvedValue([]);

    const result = await getPublishedProductReviews(productUuid);

    expect(db.findMany).toHaveBeenCalledWith({
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

    expect(result).toEqual([]);
  });

  it('creates a review with the correct product and user', async () => {
    const input = {
      productUuid,
      userId: 1,
      rating: 5,
      body: 'Excellent coffee cup!',
    };

    const savedReview = {
      uuid: reviewUuid,
      ...input,
      status: 'PUBLISHED',
    };

    db.create.mockResolvedValue(savedReview);

    const result = await createProductReview(input);

    expect(db.create).toHaveBeenCalledWith({
      data: {
        productUuid,
        userId: 1,
        rating: 5,
        body: 'Excellent coffee cup!',
      },
    });

    expect(result).toEqual(savedReview);
  });

  it('retrieves a review belonging to a specific user', async () => {
    db.findUnique.mockResolvedValue(null);

    await getReviewForProductAndUser(productUuid, 7);

    expect(db.findUnique).toHaveBeenCalledWith({
      where: {
        productUuid_userId: {
          productUuid,
          userId: 7,
        },
      },
      select: {
        uuid: true,
        rating: true,
        body: true,
        status: true,
      },
    });
  });

  it('updates a review belonging to the authenticated owner', async () => {
    db.updateMany.mockResolvedValue({ count: 1 });

    await updateReviewForOwner({
      reviewUuid,
      productUuid,
      userId: 7,
      rating: 4.25,
      body: 'Updated review',
    });

    expect(db.updateMany).toHaveBeenCalledWith({
      where: {
        uuid: reviewUuid,
        productUuid,
        userId: 7,
      },
      data: {
        rating: 4.25,
        body: 'Updated review',
      },
    });
  });

  it('deletes a review belonging to the authenticated owner', async () => {
    db.deleteMany.mockResolvedValue({ count: 1 });

    await deleteReviewForOwner({
      reviewUuid,
      productUuid,
      userId: 7,
    });

    expect(db.deleteMany).toHaveBeenCalledWith({
      where: {
        uuid: reviewUuid,
        productUuid,
        userId: 7,
      },
    });
  });
});
