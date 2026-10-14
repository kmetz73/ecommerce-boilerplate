import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  submitProductReview: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/features/reviews/services/reviews', () => ({
  submitProductReview: mocks.submitProductReview,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { submitReviewAction, type ReviewActionState } from './reviews';

const previousState: ReviewActionState = {
  success: null,
  message: '',
};

const productUuid = '550e8400-e29b-41d4-a716-446655440000';

const makeForm = (rating: string) => {
  const formData = new FormData();

  formData.set('productUuid', productUuid);
  formData.set('rating', rating);
  formData.set('body', 'Great cup!');

  return formData;
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('submitReviewAction', () => {
  it('submits quarter-star ratings successfully', async () => {
    mocks.submitProductReview.mockResolvedValue({
      success: true,
    });

    const result = await submitReviewAction(previousState, makeForm('4.25'));

    expect(result.success).toBe(true);

    expect(mocks.submitProductReview).toHaveBeenCalledWith({
      productUuid,
      rating: 4.25,
      body: 'Great cup!',
    });

    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      '/products/[slug]',
      'page'
    );
  });

  it('rejects ratings that are not quarter-star values', async () => {
    const result = await submitReviewAction(previousState, makeForm('4.1'));

    expect(result.success).toBe(false);
    expect(mocks.submitProductReview).not.toHaveBeenCalled();
  });

  it('shows duplicate-review errors', async () => {
    mocks.submitProductReview.mockResolvedValue({
      success: false,
      message: 'You have already reviewed this product.',
    });

    const result = await submitReviewAction(previousState, makeForm('4.5'));

    expect(result).toEqual({
      success: false,
      message: 'You have already reviewed this product.',
    });

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
