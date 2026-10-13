type ProductPricing = {
  priceCents: number;
  salePriceCents: number | null;
};

// Legacy variant overrides are deliberately ignored.
export const resolveVariantPricing = (
  product: ProductPricing,
  _variant?: { priceCents: number | null; salePriceCents: number | null }
): ProductPricing => {
  void _variant;
  return {
    priceCents: product.priceCents,
    salePriceCents:
      product.salePriceCents !== null &&
      product.salePriceCents >= 0 &&
      product.salePriceCents < product.priceCents
        ? product.salePriceCents
        : null,
  };
};
