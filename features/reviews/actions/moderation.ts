'use server';

import { revalidatePath } from 'next/cache';

import { moderateProductReview } from '@/features/reviews/services/moderation';

export type ModerationActionState = {
  success: boolean | null;
  message: string;
};

export async function moderateReviewAction(
  _previousState: ModerationActionState,
  formData: FormData
): Promise<ModerationActionState> {
  const reviewUuid = formData.get('reviewUuid');
  const status = formData.get('status');

  if (typeof reviewUuid !== 'string' || typeof status !== 'string') {
    return {
      success: false,
      message: 'Invalid moderation request.',
    };
  }

  const result = await moderateProductReview({
    reviewUuid,
    status,
  });

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  // Refresh admin reviews and public rating displays.
  revalidatePath('/admin/reviews');
  revalidatePath('/products/[slug]', 'page');
  revalidatePath('/products');
  revalidatePath('/shop');

  return {
    success: true,
    message: result.message,
  };
}
