import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentDbUser: vi.fn(),
  getCatalogProductByUuid: vi.fn(),
  createProductReview: vi.fn(),
  getPublishedProductReviews: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({
  getCurrentDbUser: mocks.getCurrentDbUser,
}));

vi.mock('@/features/products/data/products', () => ({
  getCatalogProductByUuid: mocks.getCatalogProductByUuid,
}));

vi.mock('@/features/reviews/data/reviews', () => ({
  createProductReview: mocks.createProductReview,
  getPublishedProductReviews: mocks.getPublishedProductReviews,
}));

import { getReviewsForProduct, submitProductReview } from './reviews';

const productUuid = '550e8400-e29b-41d4-a716-446655440000';

const validReview = {
  productUuid,
  rating: 5,
  body: 'Great product!',
};

beforeEach(() => {
  vi.resetAllMocks();

  mocks.getCurrentDbUser.mockResolvedValue({
    id: 7,
    role: 'USER',
  });

  mocks.getCatalogProductByUuid.mockResolvedValue({
    uuid: productUuid,
    active: true,
  });

  mocks.getPublishedProductReviews.mockResolvedValue([]);

  mocks.createProductReview.mockResolvedValue({
    uuid: 'review-1',
  });
});

describe('Review Services', () => {
  it('retrieves published reviews', async () => {
    await getReviewsForProduct(productUuid);

    expect(mocks.getPublishedProductReviews).toHaveBeenCalledWith(productUuid);
  });

  it('allows a signed-in customer to submit a review', async () => {
    const result = await submitProductReview(validReview);

    expect(result).toEqual({ success: true });

    expect(mocks.createProductReview).toHaveBeenCalledWith({
      productUuid,
      userId: 7,
      rating: 5,
      body: 'Great product!',
    });
  });

  it('rejects unauthenticated customers', async () => {
    mocks.getCurrentDbUser.mockResolvedValue(null);

    const result = await submitProductReview(validReview);

    expect(result).toEqual({
      success: false,
      message: 'Please sign in to submit a review.',
    });

    expect(mocks.createProductReview).not.toHaveBeenCalled();
  });

  it('rejects invalid product UUIDs', async () => {
    const result = await submitProductReview({
      ...validReview,
      productUuid: 'not-a-uuid',
    });

    expect(result.success).toBe(false);

    expect(mocks.createProductReview).not.toHaveBeenCalled();
  });

  it('rejects an invalid rating', async () => {
    const result = await submitProductReview({
      ...validReview,
      rating: 6,
    });

    expect(result.success).toBe(false);

    expect(mocks.createProductReview).not.toHaveBeenCalled();
  });

  it('rejects a product that does not exist', async () => {
    mocks.getCatalogProductByUuid.mockResolvedValue(null);

    const result = await submitProductReview(validReview);

    expect(result.success).toBe(false);

    expect(mocks.createProductReview).not.toHaveBeenCalled();
  });

  it('rejects reviews for inactive products', async () => {
    mocks.getCatalogProductByUuid.mockResolvedValue({
      uuid: productUuid,
      active: false,
    });

    const result = await submitProductReview(validReview);

    expect(result.success).toBe(false);

    expect(mocks.createProductReview).not.toHaveBeenCalled();
  });

  it('returns a friendly error for duplicate reviews', async () => {
    mocks.createProductReview.mockRejectedValue({
      code: 'P2002',
    });

    const result = await submitProductReview(validReview);

    expect(result).toEqual({
      success: false,
      message: 'You have already reviewed this product.',
    });
  });

  it('rethrows unexpected database errors', async () => {
    mocks.createProductReview.mockRejectedValue(
      new Error('Database unavailable')
    );

    await expect(submitProductReview(validReview)).rejects.toThrow(
      'Database unavailable'
    );
  });

  it('stores blank written reviews as null', async () => {
    const result = await submitProductReview({
      productUuid,
      rating: 4,
      body: null,
    });

    expect(result).toEqual({ success: true });

    expect(mocks.createProductReview).toHaveBeenCalledWith({
      productUuid,
      userId: 7,
      rating: 4,
      body: null,
    });
  });
});
