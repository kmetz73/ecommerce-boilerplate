import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getReviewsForModeration: vi.fn(),
  updateReviewModerationStatus: vi.fn(),
}));

vi.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock('@/features/reviews/data/moderation', () => ({
  getReviewsForModeration: mocks.getReviewsForModeration,
  updateReviewModerationStatus: mocks.updateReviewModerationStatus,
}));

import { getAdminReviews, moderateProductReview } from './moderation';

const reviewUuid = 'c6408628-8858-4a4b-a315-60dbd61a0e3c';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: 1, role: 'ADMIN' });
  mocks.getReviewsForModeration.mockResolvedValue([]);
  mocks.updateReviewModerationStatus.mockResolvedValue({
    count: 1,
  });
});

describe('Review Moderation Service', () => {
  it('checks admin permission before listing reviews', async () => {
    await getAdminReviews();

    expect(mocks.requireAdmin).toHaveBeenCalled();
    expect(mocks.getReviewsForModeration).toHaveBeenCalled();
  });

  it('prevents unauthorized review access', async () => {
    mocks.requireAdmin.mockRejectedValue(new Error('Forbidden'));

    await expect(getAdminReviews()).rejects.toThrow('Forbidden');

    expect(mocks.getReviewsForModeration).not.toHaveBeenCalled();
  });

  it('allows an admin to hide a review', async () => {
    const result = await moderateProductReview({
      reviewUuid,
      status: 'HIDDEN',
    });

    expect(result.success).toBe(true);

    expect(mocks.updateReviewModerationStatus).toHaveBeenCalledWith({
      reviewUuid,
      status: 'HIDDEN',
    });
  });

  it('allows an admin to publish a review', async () => {
    const result = await moderateProductReview({
      reviewUuid,
      status: 'PUBLISHED',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid moderation statuses', async () => {
    const result = await moderateProductReview({
      reviewUuid,
      status: 'DELETED',
    });

    expect(result.success).toBe(false);

    expect(mocks.updateReviewModerationStatus).not.toHaveBeenCalled();
  });

  it('handles reviews that do not exist', async () => {
    mocks.updateReviewModerationStatus.mockResolvedValue({
      count: 0,
    });

    const result = await moderateProductReview({
      reviewUuid,
      status: 'HIDDEN',
    });

    expect(result).toEqual({
      success: false,
      message: 'Review not found.',
    });
  });

  it('prevents unauthorized moderation changes', async () => {
    mocks.requireAdmin.mockRejectedValue(new Error('Forbidden'));

    await expect(
      moderateProductReview({
        reviewUuid,
        status: 'HIDDEN',
      })
    ).rejects.toThrow('Forbidden');

    expect(mocks.updateReviewModerationStatus).not.toHaveBeenCalled();
  });
});
