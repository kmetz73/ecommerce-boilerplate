'use server';

import { revalidatePath } from 'next/cache';

import {
  parseReviewFormData,
  ReviewFormValidationError,
} from '@/features/reviews/validation/review';

import {
  submitProductReview,
  updateMyProductReview,
  deleteMyProductReview,
} from '@/features/reviews/services/reviews';

export type ReviewActionState = {
  success: boolean | null;
  message: string;
};

export async function submitReviewAction(
  _previousState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const productUuid = formData.get('productUuid');

  if (typeof productUuid !== 'string') {
    return {
      success: false,
      message: 'Invalid product.',
    };
  }

  let input;

  try {
    input = parseReviewFormData(formData);
  } catch (error) {
    if (error instanceof ReviewFormValidationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    throw error;
  }

  const result = await submitProductReview({
    productUuid,
    ...input,
  });

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  // Refresh product detail pages after a successful review.
  revalidatePath('/products/[slug]', 'page');

  return {
    success: true,
    message: 'Your review was submitted successfully.',
  };
}


function refreshReviewPages() {
  revalidatePath('/products/[slug]', 'page');
  revalidatePath('/products');
  revalidatePath('/shop');
}

export async function updateReviewAction(
  _previousState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const productUuid = formData.get('productUuid');
  const reviewUuid = formData.get('reviewUuid');

  if (typeof productUuid !== 'string' || typeof reviewUuid !== 'string') {
    return {
      success: false,
      message: 'Invalid review.',
    };
  }

  let input;

  try {
    input = parseReviewFormData(formData);
  } catch (error) {
    if (error instanceof ReviewFormValidationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    throw error;
  }

  const result = await updateMyProductReview({
    productUuid,
    reviewUuid,
    ...input,
  });

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  refreshReviewPages();

  return {
    success: true,
    message: 'Your review was updated.',
  };
}

export async function deleteReviewAction(
  _previousState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const productUuid = formData.get('productUuid');
  const reviewUuid = formData.get('reviewUuid');

  if (typeof productUuid !== 'string' || typeof reviewUuid !== 'string') {
    return {
      success: false,
      message: 'Invalid review.',
    };
  }

  const result = await deleteMyProductReview({
    productUuid,
    reviewUuid,
  });

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  refreshReviewPages();

  return {
    success: true,
    message: 'Your review was deleted.',
  };
}

