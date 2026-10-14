import { z } from 'zod';

// Accept ratings in quarter-star increments.
const ratingSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,2})?$/, 'Enter a valid star rating.')
  .transform(Number)
  .pipe(
    z
      .number()
      .min(0.25, 'Rating must be at least 0.25 stars.')
      .max(5, 'Rating cannot exceed 5 stars.')
      .refine(
        (rating) => Number.isInteger(rating * 4),
        'Ratings must use quarter-star increments.'
      )
  );

export const reviewFormSchema = z
  .object({
    rating: ratingSchema,

    body: z
      .string()
      .trim()
      .max(1000, 'Review must be 1000 characters or less.'),
  })
  .strict();

export type ReviewInput = {
  rating: number;
  body: string | null;
};

export class ReviewFormValidationError extends Error {}

export const parseReviewFormData = (formData: FormData): ReviewInput => {
  const result = reviewFormSchema.safeParse({
    rating: formData.get('rating'),
    body: formData.get('body') ?? '',
  });

  if (!result.success) {
    throw new ReviewFormValidationError(
      result.error.issues.map((issue) => issue.message).join(' ')
    );
  }

  return {
    rating: result.data.rating,
    body: result.data.body || null,
  };
};
