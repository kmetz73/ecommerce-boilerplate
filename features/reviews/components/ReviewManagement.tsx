'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  updateReviewAction,
  deleteReviewAction,
  type ReviewActionState,
} from '@/features/reviews/actions/reviews';

import StarRatingInput from './StarRatingInput';
import StarRatingDisplay from './StarRatingDisplay';

type ReviewManagementProps = {
  productUuid: string;
  review: {
    uuid: string;
    rating: number;
    body: string | null;
    status: 'PUBLISHED' | 'HIDDEN';
  };
};

const initialState: ReviewActionState = {
  success: null,
  message: '',
};

const SaveReviewButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
};

const DeleteReviewButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive disabled:opacity-50"
    >
      {pending ? 'Deleting...' : 'Delete Review'}
    </button>
  );
};

const ReviewManagement = ({ productUuid, review }: ReviewManagementProps) => {
  const [editing, setEditing] = useState(false);

  const [updateState, updateAction] = useActionState(
    updateReviewAction,
    initialState
  );

  const [deleteState, deleteAction] = useActionState(
    deleteReviewAction,
    initialState
  );

  return (
    <section className="space-y-4 rounded-xl border p-4 sm:p-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Your Review</h3>

        {review.status === 'HIDDEN' && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            This review is currently hidden from other customers.
          </p>
        )}
      </div>

      {!editing ? (
        <div className="space-y-3">
          <StarRatingDisplay rating={review.rating} />

          {review.body && (
            <p className="whitespace-pre-wrap text-sm">{review.body}</p>
          )}

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Edit Review
          </button>
        </div>
      ) : (
        <form action={updateAction} className="space-y-4">
          <input type="hidden" name="productUuid" value={productUuid} />

          <input type="hidden" name="reviewUuid" value={review.uuid} />

          <div className="space-y-2">
            <p className="text-sm font-medium">Your Rating</p>

            <StarRatingInput initialRating={review.rating} />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="edit-review-body"
              className="block text-sm font-medium"
            >
              Written Review (Optional)
            </label>

            <textarea
              id="edit-review-body"
              name="body"
              rows={4}
              maxLength={1000}
              defaultValue={review.body ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <SaveReviewButton />

            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>

          {updateState.message && (
            <p
              role="status"
              className={
                updateState.success
                  ? 'text-sm text-green-600 dark:text-green-400'
                  : 'text-sm text-destructive'
              }
            >
              {updateState.message}
            </p>
          )}
        </form>
      )}

      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm('Delete your review? This cannot be undone.')) {
            event.preventDefault();
          }
        }}
        className="border-t pt-4"
      >
        <input type="hidden" name="productUuid" value={productUuid} />

        <input type="hidden" name="reviewUuid" value={review.uuid} />

        <DeleteReviewButton />

        {deleteState.message && (
          <p role="status" className="mt-2 text-sm text-destructive">
            {deleteState.message}
          </p>
        )}
      </form>
    </section>
  );
};

export default ReviewManagement;
