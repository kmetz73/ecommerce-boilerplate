'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  submitReviewAction,
  type ReviewActionState,
} from '@/features/reviews/actions/reviews';

import StarRatingInput from './StarRatingInput';

type ReviewFormProps = {
  productUuid: string;
};

const initialState: ReviewActionState = {
  success: null,
  message: '',
};

const ReviewSubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
    >
      {pending ? 'Submitting...' : 'Submit Review'}
    </button>
  );
};

const ReviewForm = ({ productUuid }: ReviewFormProps) => {
  const [state, formAction] = useActionState(submitReviewAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border p-4">
      <input type="hidden" name="productUuid" value={productUuid} />

      <h3 className="text-lg font-semibold">Write a Review</h3>

      <div className="space-y-2">
        <p className="text-sm font-medium">Your Rating</p>

        <StarRatingInput />
      </div>

      <div className="space-y-2">
        <label htmlFor="review-body" className="block text-sm font-medium">
          Written Review (Optional)
        </label>

        <textarea
          id="review-body"
          name="body"
          rows={4}
          maxLength={1000}
          placeholder="Tell others about this product..."
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </div>

      <ReviewSubmitButton />

      {state.message && (
        <p
          role="status"
          aria-live="polite"
          className={
            state.success
              ? 'text-sm text-green-600 dark:text-green-400'
              : 'text-sm text-destructive'
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
};

export default ReviewForm;
