'use client';

import { useActionState } from 'react';

import { updateProduct } from '@/features/products/actions/products';
import SubmitButton from '@/components/SubmitButton';

type EditProductFormProps = {
  product: {
    uuid: string;
    name: string;
    description: string | null;
    priceCents: number;
  };
};

const EditProductForm = ({ product }: EditProductFormProps) => {
  const [state, formAction] = useActionState(updateProduct, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productUuid" value={product.uuid} />

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Product name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          defaultValue={product.name}
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product.description ?? ''}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="priceCents" className="text-sm font-medium">
          Price in cents
        </label>

        <input
          id="priceCents"
          name="priceCents"
          type="number"
          min="0"
          defaultValue={product.priceCents}
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      {state?.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <SubmitButton pendingText="saving...">Save Changes</SubmitButton>
    </form>
  );
};

export default EditProductForm;
