import { resolveVariantPricing } from '@/features/products/lib/resolve-price';

import { getProductVariants } from '@/features/products/data/product-variants';
import { productVariantSchema } from '@/features/products/validation/product-variants';
import EditProductVariantForm from './EditProductVariantForm';
import ProductPrice from './ProductPrice';
import DeleteProductVariantForm from '@/features/products/components/DeleteProductVariantForm';

type ProductVariantListProps = {
  productUuid: string;
  basePriceCents: number;
  baseSalePriceCents: number | null;
};

const ProductVariantList = async ({
  productUuid,
  basePriceCents,
  baseSalePriceCents,
}: ProductVariantListProps) => {
  const variants = await getProductVariants(productUuid);

  return (
    <section className="space-y-5 rounded-xl border bg-card p-5 font-sans sm:p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Existing Product Variants</h2>

        <p className="text-sm text-muted-foreground">
          View the purchasing options available for this product.
        </p>
      </div>

      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No variants have been created yet.
        </p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {variants.map((variant) => {
            const parsedOptions =
              productVariantSchema.shape.optionValues.safeParse(
                variant.optionValues
              );

            const { priceCents: effectivePrice, salePriceCents } =
              resolveVariantPricing(
                {
                  priceCents: basePriceCents,
                  salePriceCents: baseSalePriceCents,
                },
                {
                  priceCents: variant.priceCents,
                  salePriceCents: variant.salePriceCents,
                }
              );

            return (
              <article
                key={variant.uuid}
                className="min-w-0 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
              >
                <div className="space-y-5">
                  {/* Top header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Product Variant
                      </p>

                      <h3 className="break-all text-2xl font-semibold tracking-tight">
                        {variant.sku}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          variant.active
                            ? 'rounded-full bg-green-500/15 px-3 py-1 text-sm font-medium text-green-500'
                            : 'rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground'
                        }
                      >
                        {variant.active ? 'Active' : 'Inactive'}
                      </span>

                      <span
                        className={
                          variant.stockQuantity > 0
                            ? 'rounded-full bg-green-500/15 px-3 py-1 text-sm font-medium text-green-500'
                            : 'rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-400'
                        }
                      >
                        {variant.stockQuantity > 0 ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>
                  </div>

                  {/* Variant options */}
                  <div className="flex flex-wrap gap-2">
                    {parsedOptions.success ? (
                      Object.entries(parsedOptions.data).map(
                        ([name, value]) => (
                          <span
                            key={name}
                            className="inline-flex rounded-xl bg-muted/60 px-3 py-2 text-sm font-medium"
                          >
                            {name}: {value}
                          </span>
                        )
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Options unavailable.
                      </p>
                    )}
                  </div>

                  {/* Price + Inventory panels */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-black/25 p-4">
                      <p className="text-sm text-muted-foreground">Price</p>

                      <div className="mt-3">
                        <ProductPrice
                          priceCents={effectivePrice}
                          salePriceCents={salePriceCents}
                          size="detail"
                        />
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Product price
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/25 p-4">
                      <p className="text-sm text-muted-foreground">Inventory</p>

                      <p className="mt-3 text-5xl font-bold tracking-tight tabular-nums">
                        {variant.stockQuantity}
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Units available
                      </p>
                    </div>
                  </div>

                  {/* Bottom actions */}
                  {/* Variant actions */}
                  <div className="space-y-3 border-t border-border/70 pt-5">
                    <EditProductVariantForm
                      productUuid={productUuid}
                      variantUuid={variant.uuid}
                      stockQuantity={variant.stockQuantity}
                      active={variant.active}
                    />

                    <DeleteProductVariantForm
                      productUuid={productUuid}
                      variantUuid={variant.uuid}
                      sku={variant.sku}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProductVariantList;
