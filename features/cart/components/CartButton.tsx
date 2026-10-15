'use client';

import { ShoppingBag } from 'lucide-react';

import { useCart } from './CartProvider';

const CartButton = () => {
  const { cart, setOpen, loading } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Open shopping bag, ${cart.itemCount} items`}
      className="relative flex items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-muted"
    >
      <ShoppingBag size={20} />

      <span className="hidden text-sm font-medium sm:inline">Bag</span>

      {!loading && cart.itemCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-xs font-semibold text-background">
          {cart.itemCount > 99 ? '99+' : cart.itemCount}
        </span>
      )}
    </button>
  );
};

export default CartButton;
