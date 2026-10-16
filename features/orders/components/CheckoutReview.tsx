'use client';


import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useCart } from '@/features/cart/components/CartProvider';
import { formatCartMoney } from '@/features/cart/lib/format-cart-money';

import { getCheckoutQuoteAction } from '@/features/orders/actions/checkout';

import type { CheckoutEstimate } from '@/features/orders/lib/checkout-pricing';


export type CheckoutAddress = {
  uuid: string;
  label: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
};


type CheckoutReviewProps = {
  addresses: CheckoutAddress[];
  initialAddressUuid?: string;
};


const CheckoutReview = ({ addresses }: CheckoutReviewProps) => {
 
const { cart, loading, refreshCart } = useCart();

useEffect(() => {
  void refreshCart();
}, [refreshCart]);


  const [selectedAddressUuid, setSelectedAddressUuid] = useState(
    addresses.find((address) => address.isDefault)?.uuid ??
      addresses[0]?.uuid ??
      ''
  );

  const selectedAddress = addresses.find(
    (address) => address.uuid === selectedAddressUuid
  );


const [quote, setQuote] = useState<CheckoutEstimate | null>(null);

const [quoteLoading, setQuoteLoading] = useState(false);

const [quoteError, setQuoteError] = useState('');

// Recalculate when cart contents or pricing changes.
const cartRevision = cart.items
  .map(
    (item) =>
      `${item.uuid}:${item.quantity}:${item.unitPriceCents}:${item.available}`
  )
  .join('|');

useEffect(() => {
  let canceled = false;

  setQuote(null);
  setQuoteError('');

  if (
    loading ||
    !selectedAddressUuid ||
    !cart.canCheckout ||
    cart.items.length === 0
  ) {
    setQuoteLoading(false);
    return;
  }

  setQuoteLoading(true);

  void getCheckoutQuoteAction(selectedAddressUuid)
    .then((result) => {
      if (canceled) return;

      if (result.success) {
        setQuote(result.quote);
      } else {
        setQuoteError(result.message);
      }
    })
    .catch(() => {
      if (!canceled) {
        setQuoteError('Unable to calculate shipping.');
      }
    })
    .finally(() => {
      if (!canceled) {
        setQuoteLoading(false);
      }
    });

  return () => {
    canceled = true;
  };
}, [
  selectedAddressUuid,
  cartRevision,
  cart.subtotalCents,
  cart.items.length,
  cart.canCheckout,
  loading,
]);


  if (loading) {
    return <p className="text-muted-foreground">Loading your checkout...</p>;
  }

  if (cart.items.length === 0) {
    return (
      <section className="space-y-4 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Your bag is empty</h2>

        <p className="text-muted-foreground">
          Add some products before checking out.
        </p>

        <Link
          href="/products"
          className="inline-block rounded-md border px-4 py-2"
        >
          Browse Products
        </Link>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      {/* Shipping address */}
      <section className="space-y-5 rounded-xl border bg-card p-5 lg:col-span-2">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Shipping Address</h2>

          <p className="text-sm text-muted-foreground">
            Select where your order should be delivered.
          </p>
        </div>

        {addresses.length === 0 ? (
          <div className="space-y-4 rounded-lg border p-4">
            <p>You haven't saved a shipping address yet.</p>

            <Link
              href="/account/addresses?returnTo=checkout"
              className="inline-block rounded-md border px-4 py-2 font-medium"
            >
              Add Shipping Address
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <label
                key={address.uuid}
                className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                  selectedAddressUuid === address.uuid
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="shippingAddress"
                  value={address.uuid}
                  checked={selectedAddressUuid === address.uuid}
                  onChange={() => setSelectedAddressUuid(address.uuid)}
                  className="mt-1 size-4"
                />

                <span className="space-y-1 text-sm">
                  <span className="block font-semibold">
                    {address.label || 'Shipping Address'}

                    {address.isDefault && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        Default
                      </span>
                    )}
                  </span>

                  <span className="block">{address.fullName}</span>

                  <span className="block">{address.line1}</span>

                  {address.line2 && (
                    <span className="block">{address.line2}</span>
                  )}

                  <span className="block">
                    {address.city}, {address.region} {address.postalCode}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        <Link
          href="/account/addresses?returnTo=checkout"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Add or Manage Shipping Addresses
        </Link>

        {selectedAddress && (
          <p className="text-sm text-muted-foreground">
            Selected destination: {selectedAddress.city},{' '}
            {selectedAddress.region}
          </p>
        )}
      </section>

      {/* Order summary */}
      <aside className="space-y-5 rounded-xl border bg-card p-5">
        <h2 className="text-xl font-semibold">Order Summary</h2>

        <div className="space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.uuid}
              className="flex justify-between gap-4 border-b pb-4 text-sm"
            >
              <div className="space-y-1">
                <p className="font-medium">{item.productName}</p>

                {item.variantLabel && (
                  <p className="text-muted-foreground">{item.variantLabel}</p>
                )}

                <p className="text-muted-foreground">Qty: {item.quantity}</p>

                {!item.available && (
                  <p className="text-destructive">Unavailable</p>
                )}
              </div>

              <p className="shrink-0 font-semibold tabular-nums">
                {formatCartMoney(item.subtotalCents)}
              </p>
            </div>
          ))}
        </div>

        {/* Checkout totals */}
        <div className="space-y-4 border-t pt-4">
          {/* Subtotal */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-sm">
            <span className="text-muted-foreground">Subtotal</span>

            <span className="whitespace-nowrap text-right font-medium tabular-nums">
              {formatCartMoney(cart.subtotalCents)}
            </span>
          </div>

          {/* Shipping */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-sm">
            <span className="text-muted-foreground">Shipping</span>

            <span className="whitespace-nowrap text-right font-medium tabular-nums">
              {quoteLoading
                ? 'Calculating...'
                : quote
                  ? formatCartMoney(quote.shippingCents)
                  : '—'}
            </span>
          </div>

          {/* Total before tax */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t pt-4">
            <span className="font-semibold">Total before tax</span>

            <span className="whitespace-nowrap text-right text-lg font-bold tabular-nums">
              {quote ? formatCartMoney(quote.totalBeforeTaxCents) : '—'}
            </span>
          </div>

          {/* Tax notice */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Sales tax has not been calculated yet. Your final total will be
            confirmed before payment.
          </p>

          {/* Error feedback */}
          {quoteError && (
            <p role="alert" className="text-sm text-destructive">
              {quoteError}
            </p>
          )}
        </div>

        {!cart.canCheckout && (
          <p className="text-sm text-destructive">
            Your cart contains unavailable items.
          </p>
        )}

        <button
          type="button"
          disabled
          className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground opacity-60"
        >
          Continue to Payment
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Payment will be enabled after checkout verification is complete.
        </p>

        <Link
          href="/cart"
          className="block text-center text-sm underline underline-offset-4"
        >
          Return to Cart
        </Link>
      </aside>
    </div>
  );
};

export default CheckoutReview;
