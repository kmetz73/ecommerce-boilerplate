import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  moderateProductReview: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/features/reviews/services/moderation', () => ({
  moderateProductReview: mocks.moderateProductReview,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { moderateReviewAction, type ModerationActionState } from './moderation';

const reviewUuid = 'c6408628-8858-4a4b-a315-60dbd61a0e3c';

const initialState: ModerationActionState = {
  success: null,
  message: '',
};

const makeForm = (status: string) => {
  const form = new FormData();
  form.set('reviewUuid', reviewUuid);
  form.set('status', status);
  return form;
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Review Moderation Action', () => {
  it('hides reviews and refreshes public ratings', async () => {
    mocks.moderateProductReview.mockResolvedValue({
      success: true,
      message: 'Review hidden successfully.',
    });

    const result = await moderateReviewAction(initialState, makeForm('HIDDEN'));

    expect(result.success).toBe(true);

    expect(mocks.moderateProductReview).toHaveBeenCalledWith({
      reviewUuid,
      status: 'HIDDEN',
    });

    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/reviews');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/products');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/shop');
  });

  it('returns service errors without revalidating', async () => {
    mocks.moderateProductReview.mockResolvedValue({
      success: false,
      message: 'Review not found.',
    });

    const result = await moderateReviewAction(initialState, makeForm('HIDDEN'));

    expect(result.success).toBe(false);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects missing moderation fields', async () => {
    const result = await moderateReviewAction(initialState, new FormData());

    expect(result.success).toBe(false);

    expect(mocks.moderateProductReview).not.toHaveBeenCalled();
  });
});
