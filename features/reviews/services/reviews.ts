import { z } from 'zod';

import { getCurrentDbUser } from '@/lib/auth/current-user';

import { getCatalogProductByUuid } from '@/features/products/data/products';

import {
  createProductReview,
  getPublishedProductReviews,
  getReviewForProductAndUser,
  updateReviewForOwner,
  deleteReviewForOwner,
} from '@/features/reviews/data/reviews';

import {
  reviewFormSchema,
  type ReviewInput,
} from '@/features/reviews/validation/review';

type SubmitReviewInput = ReviewInput & {
  productUuid: string;
};

export type ReviewServiceResult =
  | { success: true }
  | { success: false; message: string };

// Anyone can read published customer reviews.
export async function getReviewsForProduct(productUuid: string) {
  return getPublishedProductReviews(productUuid);
}

// A signed-in customer can submit a review.
export async function submitProductReview(
  input: SubmitReviewInput
): Promise<ReviewServiceResult> {
  // 1. Identify the current user.
  const user = await getCurrentDbUser();

  if (!user) {
    return {
      success: false,
      message: 'Please sign in to submit a review.',
    };
  }

  // 2. Validate the product UUID.
  const uuidResult = z.string().uuid().safeParse(input.productUuid);

  if (!uuidResult.success) {
    return {
      success: false,
      message: 'Invalid product.',
    };
  }

  // 3. Validate review content on the server.
  const reviewResult = reviewFormSchema.safeParse({
    rating: String(input.rating),
    body: input.body ?? '',
  });

  if (!reviewResult.success) {
    return {
      success: false,
      message: reviewResult.error.issues
        .map((issue) => issue.message)
        .join(' '),
    };
  }

  // 4. Confirm that the product exists and is active.
  const product = await getCatalogProductByUuid(input.productUuid);

  if (!product || !product.active) {
    return {
      success: false,
      message: 'This product is not available for reviews.',
    };
  }

  // 5. Save the review.
  try {
    await createProductReview({
      productUuid: product.uuid,
      userId: user.id,
      rating: reviewResult.data.rating,
      body: reviewResult.data.body || null,
    });

    return { success: true };
  } catch (error) {
    // Prisma unique constraint violation.
    // One review per user per product.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return {
        success: false,
        message: 'You have already reviewed this product.',
      };
    }

    // Unexpected errors should not be silently hidden.
    throw error;
  }
}


type ReviewOwnershipInput = {
  productUuid: string;
  reviewUuid: string;
};

type UpdateOwnedReviewInput = ReviewOwnershipInput & ReviewInput;

const validUuid = z.string().uuid();

export async function getMyReviewForProduct(productUuid: string) {
  const user = await getCurrentDbUser();

  if (!user) {
    return {
      signedIn: false as const,
      review: null,
    };
  }

  const review = await getReviewForProductAndUser(productUuid, user.id);

  return {
    signedIn: true as const,
    review,
  };
}

export async function updateMyProductReview(
  input: UpdateOwnedReviewInput
): Promise<ReviewServiceResult> {
  const user = await getCurrentDbUser();

  if (!user) {
    return {
      success: false,
      message: 'Please sign in to edit your review.',
    };
  }

  if (
    !validUuid.safeParse(input.productUuid).success ||
    !validUuid.safeParse(input.reviewUuid).success
  ) {
    return {
      success: false,
      message: 'Invalid review.',
    };
  }

  const parsed = reviewFormSchema.safeParse({
    rating: String(input.rating),
    body: input.body ?? '',
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues.map((issue) => issue.message).join(' '),
    };
  }

  const result = await updateReviewForOwner({
    reviewUuid: input.reviewUuid,
    productUuid: input.productUuid,
    userId: user.id,
    rating: parsed.data.rating,
    body: parsed.data.body || null,
  });

  if (result.count === 0) {
    return {
      success: false,
      message: 'Review not found or you do not own it.',
    };
  }

  return { success: true };
}

export async function deleteMyProductReview(
  input: ReviewOwnershipInput
): Promise<ReviewServiceResult> {
  const user = await getCurrentDbUser();

  if (!user) {
    return {
      success: false,
      message: 'Please sign in to delete your review.',
    };
  }

  if (
    !validUuid.safeParse(input.productUuid).success ||
    !validUuid.safeParse(input.reviewUuid).success
  ) {
    return {
      success: false,
      message: 'Invalid review.',
    };
  }

  const result = await deleteReviewForOwner({
    reviewUuid: input.reviewUuid,
    productUuid: input.productUuid,
    userId: user.id,
  });

  if (result.count === 0) {
    return {
      success: false,
      message: 'Review not found or you do not own it.',
    };
  }

  return { success: true };
}

