'use client';

import { useActionState, useState } from 'react';

import {
  deleteProductVariantAction,
  type DeleteProductVariantState,
} from '@/features/products/actions/product-variants';

type DeleteProductVariantFormProps = {
  productUuid: string;
  variantUuid: string;
  sku: string;
};

const initialState: DeleteProductVariantState = {
  status: 'idle',
  message: '',
};

const DeleteProductVariantForm = ({
  productUuid,
  variantUuid,
  sku,
}: DeleteProductVariantFormProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const [state, formAction, isPending] = useActionState(
    deleteProductVariantAction,
    initialState
  );

  return (
    <div className="space-y-3">
      {!isConfirming ? (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="rounded-xl border border-destructive/40 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          Delete Variant
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium">
            Delete variant <strong>{sku}</strong>?
          </p>

          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>

          <form
            action={formAction}
            className="flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="productUuid" value={productUuid} />

            <input type="hidden" name="variantUuid" value={variantUuid} />

            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
            >
              {isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>

            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {state.status === 'error' && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </div>
  );
};

export default DeleteProductVariantForm;
