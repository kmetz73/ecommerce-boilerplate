'use client';

import { useState } from 'react';

import { deleteProductImageAction } from '@/features/products/actions/product-images';

type DeleteProductImageFormProps = {
  productUuid: string;
  imageId: string;
  imageAlt: string;
};

const DeleteProductImageForm = ({
  productUuid,
  imageId,
  imageAlt,
}: DeleteProductImageFormProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="rounded-md border border-destructive px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
      >
        Delete Image
      </button>
    );
  }

  return (
    <form action={deleteProductImageAction} className="space-y-2">
      <input type="hidden" name="productUuid" value={productUuid} />

      <input type="hidden" name="imageId" value={imageId} />

      <p className="text-sm text-destructive">
        Delete "{imageAlt}"? This cannot be undone.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md bg-destructive px-3 py-2 text-xs font-medium text-white"
        >
          Yes, Delete
        </button>

        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          className="rounded-md border px-3 py-2 text-xs font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DeleteProductImageForm;
