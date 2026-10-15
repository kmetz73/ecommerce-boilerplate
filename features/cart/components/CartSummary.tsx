'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { useCart } from './CartProvider';
import { formatCartMoney } from '../lib/format-cart-money';

type CartSummaryProps = {
  onContinue?: () => void;
};

const CartSummary = ({ onContinue }: CartSummaryProps) => {
  const { cart } = useCart();

  return (
    <section className="shrink-0 space-y-3 border-t px-5 py-3">
      {/* Subtotal */}
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold">Subtotal</span>

        <span className="text-lg font-bold tabular-nums">
          {formatCartMoney(cart.subtotalCents)}
        </span>
      </div>

      {/* Shipping */}
      <p className="text-xs text-muted-foreground">
        Shipping calculated at checkout.
      </p>

      {/* Inventory warnings */}
      {!cart.canCheckout && cart.items.length > 0 && (
        <p className="text-sm text-destructive">
          Please resolve unavailable items before checkout.
        </p>
      )}

      {/* Checkout */}
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 font-semibold text-background opacity-60"
      >
        Checkout
        <ArrowRight size={18} />
      </button>

      {/* Continue shopping */}
      <Link
        href="/products"
        onClick={onContinue}
        className="block rounded-md border px-4 py-3 text-center font-medium transition-colors hover:bg-muted"
      >
        Continue Shopping
      </Link>
    </section>
  );
};

export default CartSummary;
