'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

import { useCart } from './CartProvider';

type AddToCartButtonProps = {
  productUuid: string;
  variantUuid?: string | null;
  disabled?: boolean;
};

const AddToCartButton = ({
  productUuid,
  variantUuid = null,
  disabled = false,
}: AddToCartButtonProps) => {
  const { addItem, loading, pending } = useCart();
  const [message, setMessage] = useState<string | null>(null);

  const handleAdd = async () => {
    setMessage(null);

    const result = await addItem(productUuid, variantUuid);

    if (!result.success) {
      setMessage(result.message);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleAdd()}
        disabled={disabled || pending || loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingBag size={19} />

        {disabled ? 'Sold Out' : pending ? 'Adding...' : 'Add to Cart'}
      </button>

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
};

export default AddToCartButton;
