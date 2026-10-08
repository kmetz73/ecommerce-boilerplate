'use client';

import { deleteProduct } from '@/features/products/actions/products';
import SubmitButton from '@/components/SubmitButton';

type DeleteProductFormProps = {
  productUuid: string;
};

const DeleteProductForm = ({ productUuid }: DeleteProductFormProps) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    );

    if (!confirmed) {
      event.preventDefault();
    }
  };

  return (
    <form action={deleteProduct} onSubmit={handleSubmit}>
      <input type="hidden" name="productUuid" value={productUuid} />

      <SubmitButton className="bg-red-600 text-white hover:bg-red-700">
        Delete
      </SubmitButton>
    </form>
  );
};

export default DeleteProductForm;
