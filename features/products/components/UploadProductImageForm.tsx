'use client';

import { useActionState } from 'react';

import {
  uploadProductImageAction,
  type ProductImageUploadState,
} from '@/features/products/actions/product-images';

type UploadProductImageFormProps = {
  productUuid: string;
};

const initialState: ProductImageUploadState = {
  status: 'idle',
  message: '',
};

const UploadProductImageForm = ({
  productUuid,
}: UploadProductImageFormProps) => {
  const [state, formAction, isPending] = useActionState(
    uploadProductImageAction,
    initialState
  );

  return (
    <section className="space-y-4 rounded-lg border p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Product Images</h2>

        <p className="text-sm text-muted-foreground">
          Upload JPG, PNG, or WebP images (maximum 5 MB).
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="productUuid" value={productUuid} />

        <div className="space-y-2">
          <label htmlFor="product-image" className="block text-sm font-medium">
            Product Image
          </label>

          <input
            id="product-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full rounded-md border p-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="image-alt" className="block text-sm font-medium">
            Image Description
          </label>

          <input
            id="image-alt"
            name="altText"
            type="text"
            minLength={3}
            maxLength={200}
            placeholder="Front view of product"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

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
          {isPending ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>
    </section>
  );
};

export default UploadProductImageForm;
