'use client';

import { useActionState, useRef, useState } from 'react';

import {
  createProductVariantAction,
  type CreateProductVariantState,
} from '@/features/products/actions/product-variants';

type CreateProductVariantFormProps = {
  productUuid: string;
};

type OptionRow = {
  id: number;
  name: string;
  value: string;
};

const initialState: CreateProductVariantState = {
  status: 'idle',
  message: '',
};

const CreateProductVariantForm = ({
  productUuid,
}: CreateProductVariantFormProps) => {
  const [state, formAction, isPending] = useActionState(
    createProductVariantAction,
    initialState
  );

  const [options, setOptions] = useState<OptionRow[]>([
    { id: 1, name: '', value: '' },
  ]);

  const nextOptionId = useRef(2);

  // Update an individual option field.
  const updateOption = (id: number, field: 'name' | 'value', value: string) => {
    setOptions((current) =>
      current.map((option) =>
        option.id === id ? { ...option, [field]: value } : option
      )
    );
  };

  // Add another option.
  const addOption = () => {
    const id = nextOptionId.current++;

    setOptions((current) => [...current, { id, name: '', value: '' }]);
  };

  // Remove an option.
  const removeOption = (id: number) => {
    setOptions((current) => current.filter((option) => option.id !== id));
  };

  // Prevent duplicate option names.
  const optionNames = options
    .map((option) => option.name.trim().toLowerCase())
    .filter(Boolean);

  const hasDuplicateNames = new Set(optionNames).size !== optionNames.length;

  // Convert options to JSON for the server action.
  const optionValues = Object.fromEntries(
    options.map((option) => [option.name.trim(), option.value.trim()])
  );

  return (
    <section className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Add Product Variant</h2>

        <p className="text-sm text-muted-foreground">
          Create a purchasing option with its own SKU and inventory. All variants
          use the product prices.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {/* Hidden form values */}
        <input type="hidden" name="productUuid" value={productUuid} />

        <input
          type="hidden"
          name="optionValues"
          value={JSON.stringify(optionValues)}
        />

        {/* SKU */}
        <div className="space-y-2">
          <label htmlFor="variant-sku" className="block text-sm font-medium">
            SKU
          </label>

          <input
            id="variant-sku"
            name="sku"
            type="text"
            maxLength={64}
            placeholder="SHOE-BLUE-10"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Dynamic variant options */}
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Variant Options</h3>

            <p className="text-xs text-muted-foreground">
              Examples: Color = Blue, Size = 10.
            </p>
          </div>

          {options.map((option) => (
            <div
              key={option.id}
              className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              {/* Option name */}
              <div className="space-y-1">
                <label
                  htmlFor={`option-name-${option.id}`}
                  className="text-xs font-medium"
                >
                  Option Name
                </label>

                <input
                  id={`option-name-${option.id}`}
                  type="text"
                  placeholder="Color"
                  value={option.name}
                  onChange={(event) =>
                    updateOption(option.id, 'name', event.target.value)
                  }
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Option value */}
              <div className="space-y-1">
                <label
                  htmlFor={`option-value-${option.id}`}
                  className="text-xs font-medium"
                >
                  Value
                </label>

                <input
                  id={`option-value-${option.id}`}
                  type="text"
                  placeholder="Blue"
                  value={option.value}
                  onChange={(event) =>
                    updateOption(option.id, 'value', event.target.value)
                  }
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Remove option */}
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                disabled={options.length === 1}
                className="self-end rounded-md border px-3 py-2 text-sm text-destructive disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}

          {hasDuplicateNames && (
            <p role="alert" className="text-sm text-destructive">
              Each option must have a different name.
            </p>
          )}

          <button
            type="button"
            onClick={addOption}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            + Add Option
          </button>
        </div>

        {/* Inventory */}
        <div className="space-y-2">
          <label htmlFor="variant-stock" className="block text-sm font-medium">
            Stock Quantity
          </label>

          <input
            id="variant-stock"
            name="stockQuantity"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />

          <p className="text-xs text-muted-foreground">
            Enter the number of units available.
          </p>
        </div>

        {/* Active status */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked
            className="size-4"
          />
          Variant is active
        </label>

        {/* Action feedback */}
        {state.message && (
          <p
            role={state.status === 'error' ? 'alert' : 'status'}
            className={
              state.status === 'error'
                ? 'text-sm text-destructive'
                : 'text-sm text-green-600 dark:text-green-400'
            }
          >
            {state.message}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || hasDuplicateNames}
          className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? 'Creating Variant...' : 'Create Variant'}
        </button>
      </form>
    </section>
  );
};

export default CreateProductVariantForm;
