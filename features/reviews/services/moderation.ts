import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/require-admin';

import {
  getReviewsForModeration as getReviewsData,
  updateReviewModerationStatus,
} from '@/features/reviews/data/moderation';

const moderationSchema = z.object({
  reviewUuid: z.string().uuid(),
  status: z.enum(['PUBLISHED', 'HIDDEN']),
});

type ModerationInput = {
  reviewUuid: string;
  status: string;
};

export type ModerationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

// Only administrators may retrieve the moderation list.
export async function getAdminReviews() {
  await requireAdmin();

  return getReviewsData();
}

// Only administrators may change review visibility.
export async function moderateProductReview(
  input: ModerationInput
): Promise<ModerationResult> {
  await requireAdmin();

  const parsed = moderationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Invalid review or moderation status.',
    };
  }

  const result = await updateReviewModerationStatus(parsed.data);

  if (result.count === 0) {
    return {
      success: false,
      message: 'Review not found.',
    };
  }

  return {
    success: true,
    message:
      parsed.data.status === 'HIDDEN'
        ? 'Review hidden successfully.'
        : 'Review published successfully.',
  };
}
