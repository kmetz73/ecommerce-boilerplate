'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

import CartItemRow from '@/features/cart/components/CartItemRow';
import CartSummary from '@/features/cart/components/CartSummary';
import { useCart } from '@/features/cart/components/CartProvider';

const CartPage = () => {
  const { cart, loading, error } = useCart();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>

        <p className="mt-6 text-muted-foreground">Loading your cart...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>

        <p className="mt-2 text-muted-foreground">
          Review your selections before checkout.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-xl border px-6 py-20 text-center">
          <ShoppingBag size={48} className="text-muted-foreground" />

          <h2 className="text-xl font-semibold">Your shopping cart is empty</h2>

          <Link
            href="/products"
            className="rounded-md bg-foreground px-6 py-3 font-medium text-background"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-xl border px-4 sm:px-6">
            {cart.items.map((item) => (
              <CartItemRow key={item.uuid} item={item} />
            ))}
          </section>

          <aside className="rounded-xl border lg:sticky lg:top-6">
            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">Order Summary</h2>

              <p className="text-sm text-muted-foreground">
                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>

            <CartSummary />
          </aside>
        </div>
      )}
    </main>
  );
};

export default CartPage;
