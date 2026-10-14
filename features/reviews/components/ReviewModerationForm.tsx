'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  moderateReviewAction,
  type ModerationActionState,
} from '@/features/reviews/actions/moderation';

type ReviewModerationFormProps = {
  reviewUuid: string;
  status: 'PUBLISHED' | 'HIDDEN';
};

const initialState: ModerationActionState = {
  success: null,
  message: '',
};

const ModerationSubmitButton = ({
  status,
}: {
  status: 'PUBLISHED' | 'HIDDEN';
}) => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
    >
      {pending
        ? 'Saving...'
        : status === 'PUBLISHED'
          ? 'Hide Review'
          : 'Publish Review'}
    </button>
  );
};

const ReviewModerationForm = ({
  reviewUuid,
  status,
}: ReviewModerationFormProps) => {
  const [state, formAction] = useActionState(
    moderateReviewAction,
    initialState
  );

  const nextStatus = status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="reviewUuid" value={reviewUuid} />

      <input type="hidden" name="status" value={nextStatus} />

      <ModerationSubmitButton status={status} />

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

export default ReviewModerationForm;
