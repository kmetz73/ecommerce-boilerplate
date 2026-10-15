'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';

import { useCart } from './CartProvider';
import CartItemRow from './CartItemRow';
import CartSummary from './CartSummary';

const CartDrawer = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { cart, isOpen, setOpen, loading, error } = useCart();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={() => setOpen(false)}
      aria-labelledby="cart-drawer-heading"
      className="cart-drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-md overflow-hidden border-l bg-background p-0 text-foreground shadow-2xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b px-5 py-5">
          <div className="flex items-center gap-3">
            <ShoppingBag size={21} />

            <h2 id="cart-drawer-heading" className="text-lg font-semibold">
              Your Bag
            </h2>

            <span className="text-sm text-muted-foreground">
              ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close shopping bag"
            className="rounded-md p-2 hover:bg-muted"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading your bag...
            </p>
          ) : cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag size={48} className="text-muted-foreground" />

              <h3 className="text-xl font-semibold">Your bag is empty</h3>

              <p className="text-sm text-muted-foreground">
                Find something you love and add it to your bag.
              </p>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border px-5 py-2 font-medium hover:bg-muted"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div>
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.uuid}
                  item={item}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="py-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {cart.items.length > 0 && (
          <>
            <div className="border-t px-5 pt-4">
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="block text-center text-sm font-medium underline underline-offset-4"
              >
                View Full Cart
              </Link>
            </div>

            <CartSummary onContinue={() => setOpen(false)} />
          </>
        )}
      </div>
    </dialog>
  );
};

export default CartDrawer;
