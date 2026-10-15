'use client';

import { useActionState, useState } from 'react';
import PriceInput from './PriceInput';
import { createProduct } from '@/features/products/actions/products';
import SubmitButton from '@/components/SubmitButton';

const CreateProductForm = () => {
  const [state, formAction] = useActionState(createProduct, null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trackInventory, setTrackInventory] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('0');

  return (
    <form action={formAction} className="space-y-5">
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

      {/* Description */}
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
              placeholder="49.99"
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />

            <p className="text-xs text-muted-foreground">
              Example: 49.99 means $49.99.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          All variants inherit this price. Add an optional sale price when
          editing the product.
        </p>
      </div>

      {/* Product inventory */}
      <section className="space-y-4 rounded-xl border p-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Product Inventory</h3>

          <p className="text-sm text-muted-foreground">
            Track inventory for products without variants. Products with
            variants use their own stock quantities.
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
              htmlFor="product-stock"
              className="block text-sm font-medium"
            >
              Stock Quantity
            </label>

            <input
              id="product-stock"
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
              Set to 0 to mark this product sold out automatically.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Inventory is not tracked. This product can be purchased while
            active.
          </p>
        )}
      </section>

      {/* Optional primary image */}
      <div className="space-y-2">
        <label htmlFor="product-image" className="block text-sm font-medium">
          Primary Product Image (Optional)
        </label>

        <input
          id="product-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
        />

        <p className="text-sm text-muted-foreground">
          JPG, PNG, or WebP. Maximum 5 MB. You can add additional photos after
          creating the product.
        </p>
      </div>

      {state?.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      {/* Submit */}
      <SubmitButton pendingText="Creating...">Create Product</SubmitButton>
    </form>
  );
};

export default CreateProductForm;
