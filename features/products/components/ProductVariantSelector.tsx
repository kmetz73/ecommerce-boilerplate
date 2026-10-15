'use client';

import { useState } from 'react';

import ProductPrice from '@/features/products/components/ProductPrice';

import AddToCartButton from '@/features/cart/components/AddToCartButton';


import { resolveVariantPricing } from '@/features/products/lib/resolve-price';

type Variant = {
  uuid: string;
  optionValues: Record<string, string>;
  priceCents: number | null;
  salePriceCents: number | null;
  stockQuantity: number;
};

type ProductVariantSelectorProps = {
  productUuid: string;
  variants: Variant[];
  basePriceCents: number;
  baseSalePriceCents: number | null;
  productActive: boolean;
};

const ProductVariantSelector = ({
  productUuid,
  variants,
  basePriceCents,
  baseSalePriceCents,
  productActive,
}: ProductVariantSelectorProps) => {
  // Select the first in-stock variant by default.
  const firstAvailable = variants.find((variant) => variant.stockQuantity > 0);

  const [selectedUuid, setSelectedUuid] = useState(
    firstAvailable?.uuid ?? variants[0]?.uuid ?? ''
  );

  // Retrieve the selected variant.
  const selectedVariant =
    variants.find((variant) => variant.uuid === selectedUuid) ??
    firstAvailable ??
    variants[0];

  // Handle products without valid active variants.
  if (!selectedVariant) {
    return (
      <div className="space-y-2">
        <ProductPrice priceCents={basePriceCents} salePriceCents={baseSalePriceCents} size="detail" />
        <p className="text-sm text-muted-foreground">No purchasing options are currently available.</p>
      </div>
    );
  }

  // Every option uses the parent product prices.
  const { priceCents, salePriceCents } = resolveVariantPricing(
    {
      priceCents: basePriceCents,
      salePriceCents: baseSalePriceCents,
    },
    {
      priceCents: selectedVariant.priceCents,
      salePriceCents: selectedVariant.salePriceCents,
    }
  );

  // Determine the selected variant's availability.
  const inStock = productActive && selectedVariant.stockQuantity > 0;

  return (
    <section className="space-y-4 rounded-xl border p-4 sm:p-5">
      {/* Variant selection */}
      <div className="space-y-2">
        <label
          htmlFor="product-variant"
          className="block text-sm font-semibold"
        >
          Choose Product Options
        </label>

        <select
          id="product-variant"
          value={selectedVariant.uuid}
          onChange={(event) => setSelectedUuid(event.target.value)}
          disabled={!productActive}
          className="w-full rounded-md border bg-background px-3 py-3 text-sm"
        >
          {variants.map((variant) => {
            const label = Object.entries(variant.optionValues)
              .map(([name, value]) => `${name}: ${value}`)
              .join(' / ');

            return (
              <option key={variant.uuid} value={variant.uuid}>
                {label}
                {variant.stockQuantity === 0 ? ' — Sold out' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Selected variant pricing */}
      <div aria-live="polite" className="space-y-2">
        <ProductPrice
          priceCents={priceCents}
          salePriceCents={salePriceCents}
          size="detail"
        />

        {/* Stock availability */}
        <p
          className={
            inStock
              ? 'text-sm font-medium text-green-600 dark:text-green-400'
              : 'text-sm font-medium text-destructive'
          }
        >
          {inStock ? `${selectedVariant.stockQuantity} in stock` : 'Sold out'}
        </p>
      </div>

      <AddToCartButton
        productUuid={productUuid}
        variantUuid={selectedVariant.uuid}
        disabled={!inStock}
      />
    </section>
  );
};

export default ProductVariantSelector;
