'use client';

import { useActionState, useState } from 'react';

import {
  updateProductVariantAction,
  type UpdateProductVariantState,
} from '@/features/products/actions/product-variants';

type EditProductVariantFormProps = {
  productUuid: string;
  variantUuid: string;
  stockQuantity: number;
  active: boolean;
};

const initialState: UpdateProductVariantState = {
  status: 'idle',
  message: '',
};

const EditProductVariantForm = ({
  productUuid,
  variantUuid,
  stockQuantity,
  active,
}: EditProductVariantFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const [state, formAction, isPending] = useActionState(
    updateProductVariantAction,
    initialState
  );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsEditing((current) => !current)}
        disabled={isPending}
        aria-expanded={isEditing}
        className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        {isEditing ? 'Cancel Editing' : 'Edit Variant'}
      </button>

      {isEditing && (
        <form action={formAction} className="space-y-4 rounded-lg border p-4">
          <input type="hidden" name="productUuid" value={productUuid} />

          <input type="hidden" name="variantUuid" value={variantUuid} />

          <div className="space-y-2">
            <label
              htmlFor={`stock-${variantUuid}`}
              className="block text-sm font-medium"
            >
              Stock Quantity
            </label>

            <input
              id={`stock-${variantUuid}`}
              name="stockQuantity"
              type="number"
              min={0}
              step={1}
              defaultValue={stockQuantity}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={active}
              className="size-4"
            />
            Variant is active
          </label>

          {state.message && (
            <p
              role={state.status === 'error' ? 'alert' : 'status'}
              className={
                state.status === 'error'
                  ? 'text-sm text-destructive'
                  : 'text-sm text-green-600 dark:text-green-400'
              }
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Variant Changes'}
          </button>
        </form>
      )}
    </div>
  );
};

export default EditProductVariantForm;
