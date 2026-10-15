import { resolveVariantPricing } from './resolve-price';
import { productVariantSchema } from '../validation/product-variants';

type ProductPricing = {
  priceCents: number;
  salePriceCents: number | null;
  active: boolean;
  stockQuantity?: number | null;
};

type CatalogVariant = {
  priceCents?: number | null;
  salePriceCents?: number | null;
  optionValues: unknown;
  stockQuantity: number;
  active: boolean;
};

export type CatalogPricingSummary = {
  priceCents: number;
  salePriceCents: number | null;
  displayPriceCents: number;
  isAvailable: boolean;
  showFrom: boolean;
};

export const getCatalogPricing = (
  product: ProductPricing,
  variants: CatalogVariant[]
): CatalogPricingSummary => {
  const pricing = resolveVariantPricing(product);
  return {
    ...pricing,
    displayPriceCents: pricing.salePriceCents ?? pricing.priceCents,

    isAvailable:
      product.active &&
      (variants.length === 0
        ? product.stockQuantity == null || product.stockQuantity > 0
        : variants.some(
            (variant) =>
              variant.active &&
              variant.stockQuantity > 0 &&
              productVariantSchema.shape.optionValues.safeParse(
                variant.optionValues
              ).success
          )),

    showFrom: false,
  };
};
