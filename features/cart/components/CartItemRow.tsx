'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Minus, Package, Plus, Trash2 } from 'lucide-react';

import { useCart, type CartView } from './CartProvider';

import { formatCartMoney } from '../lib/format-cart-money';

type CartItem = CartView['items'][number];

type CartItemRowProps = {
  item: CartItem;
  onNavigate?: () => void;
};

const CartItemRow = ({ item, onNavigate }: CartItemRowProps) => {
  const { pending, updateQuantity, removeItem } = useCart();

  const decrease = () => {
    if (item.quantity > 1) {
      void updateQuantity(item.uuid, item.quantity - 1);
    }
  };

  const increase = () => {
    void updateQuantity(item.uuid, item.quantity + 1);
  };

  const remove = () => {
    void removeItem(item.uuid);
  };

  return (
    <article className="grid grid-cols-[76px_minmax(0,1fr)] gap-4 border-b py-5">
      <Link
        href={`/products/${item.productSlug}`}
        onClick={onNavigate}
        className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-muted"
      >
        {item.image ? (
          <Image
            src={`/api/product-images/${item.image.id}`}
            alt={item.image.altText}
            width={120}
            height={120}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <Package className="text-muted-foreground" size={24} />
        )}
      </Link>

      <div className="min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/products/${item.productSlug}`}
              onClick={onNavigate}
              className="font-medium hover:underline"
            >
              {item.productName}
            </Link>

            {item.variantLabel && (
              <p className="mt-1 text-xs text-muted-foreground">
                {item.variantLabel}
              </p>
            )}

            <p className="mt-1 text-sm font-semibold">
              {formatCartMoney(item.unitPriceCents)} each
            </p>
          </div>

          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`Remove ${item.productName}`}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
          >
            <Trash2 size={17} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center rounded-md border">
            <button
              type="button"
              onClick={decrease}
              disabled={pending || item.quantity <= 1}
              aria-label={`Decrease ${item.productName} quantity`}
              className="p-2 disabled:opacity-30"
            >
              <Minus size={15} />
            </button>

            <span
              className="min-w-8 text-center text-sm font-medium tabular-nums"
              aria-label={`Quantity ${item.quantity}`}
            >
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={increase}
              disabled={pending || item.quantity >= 99}
              aria-label={`Increase ${item.productName} quantity`}
              className="p-2 disabled:opacity-30"
            >
              <Plus size={15} />
            </button>
          </div>

          <p className="font-semibold tabular-nums">
            {formatCartMoney(item.subtotalCents)}
          </p>
        </div>

        {!item.available && (
          <p role="alert" className="text-sm text-destructive">
            {item.unavailableReason}
          </p>
        )}
      </div>
    </article>
  );
};

export default CartItemRow;
