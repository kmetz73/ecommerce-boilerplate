'use client';

import { useActionState, useState } from 'react';
import PriceInput from './PriceInput';

import { updateProduct } from '@/features/products/actions/products';
import SubmitButton from '@/components/SubmitButton';

type EditProductFormProps = {
  product: {
    uuid: string;
    name: string;
    description: string | null;
    priceCents: number;
    salePriceCents: number | null;
    stockQuantity: number | null;
  };
  hasVariants: boolean;
};

const EditProductForm = ({ product, hasVariants }: EditProductFormProps) => {
  const [state, formAction] = useActionState(updateProduct, null);

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? '');

const [trackInventory, setTrackInventory] = useState(
  product.stockQuantity !== null
);

const [stockQuantity, setStockQuantity] = useState(
  String(product.stockQuantity ?? 0)
);


  return (
    <form action={formAction} className="space-y-5">
      {/* Product UUID */}
      <input type="hidden" name="productUuid" value={product.uuid} />

      {/* Product name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Product Name
        </label>

        <input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          type="text"
          maxLength={100}
          required
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </div>

      {/* Product description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>

        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </div>

      {/* Product pricing */}
      <div className="space-y-4 rounded-xl border p-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Product Pricing</h3>

          <p className="text-sm text-muted-foreground">
            Enter prices in dollars, not cents.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Regular price */}
          <div className="space-y-2">
            <label htmlFor="priceDollars" className="block text-sm font-medium">
              Regular Price ($)
            </label>

            <PriceInput
              id="priceDollars"
              name="priceDollars"
              type="text"
              inputMode="decimal"
              defaultValue={(product.priceCents / 100).toFixed(2)}
              placeholder="49.99"
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />

            <p className="text-xs text-muted-foreground">
              Example: enter 49.99 for $49.99.
            </p>
          </div>

          {/* Optional sale price */}
          <div className="space-y-2">
            <label
              htmlFor="salePriceDollars"
              className="block text-sm font-medium"
            >
              Sale Price ($) — Optional
            </label>

            <PriceInput
              id="salePriceDollars"
              name="salePriceDollars"
              type="text"
              inputMode="decimal"
              defaultValue={
                product.salePriceCents === null
                  ? ''
                  : (product.salePriceCents / 100).toFixed(2)
              }
              placeholder="Leave blank if not on sale"
              className="w-full rounded-md border bg-background px-3 py-2"
            />

            <p className="text-xs text-muted-foreground">
              Must be lower than the regular price. Clear this field to remove
              the sale.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          All variants inherit the product regular and sale prices.
        </p>
      </div>

      

      {/* Product inventory */}
      {!hasVariants ? (
      <section className="space-y-4 rounded-xl border p-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Product Inventory</h3>

          <p className="text-sm text-muted-foreground">
            Control inventory tracking for products without variants. Products
            with variants use their own stock.
          </p>
        </div>

        <input type="hidden" name="inventoryConfigured" value="true" />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="trackInventory"
            value="on"
            checked={trackInventory}
            onChange={(event) => setTrackInventory(event.target.checked)}
            className="size-4 accent-primary"
          />

          <span className="font-medium">Track Inventory</span>
        </label>

        {trackInventory ? (
          <div className="space-y-2">
            <label
              htmlFor="edit-product-stock"
              className="block text-sm font-medium"
            >
              Stock Quantity
            </label>

            <input
              id="edit-product-stock"
              name="stockQuantity"
              type="number"
              min={0}
              max={2147483647}
              step={1}
              inputMode="numeric"
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />

            <p className="text-xs text-muted-foreground">
              Zero units means Sold Out. Increasing stock above zero makes an
              active product available again.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Inventory is not tracked for this product.
          </p>
        )}
      </section>
      ) : (
        null
      )}

      {/* Server action feedback */}
      {state?.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      {/* Save changes */}
      <SubmitButton pendingText="Saving...">Save Product Changes</SubmitButton>
    </form>
  );
};

export default EditProductForm;
