import { productVariantSchema } from '@/features/products/validation/product-variants';
import { MAX_CART_ITEM_QUANTITY } from '../validation/cart';

export type CartProduct = {
  uuid: string;
  active: boolean;
  stockQuantity: number | null;
  variants: Array<{
    uuid: string;
    productUuid: string;
    active: boolean;
    stockQuantity: number;
    optionValues: unknown;
  }>;
};

export const getSelectionKey = (
  productUuid: string,
  variantUuid: string | null
) => `${productUuid}:${variantUuid ?? 'base'}`;

export const validateCartSelection = (
  product: CartProduct | null,
  variantUuid: string | null,
  quantity: number
): { success: true } | { success: false; message: string } => {
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_CART_ITEM_QUANTITY
  ) {
    return {
      success: false,
      message: 'Quantity must be between 1 and 99.',
    };
  }

  if (!product || !product.active) {
    return {
      success: false,
      message: 'This product is unavailable.',
    };
  }

  // Products with variants must have a valid selected variant.
  if (product.variants.length > 0) {
    if (!variantUuid) {
      return {
        success: false,
        message: 'Select a product variant.',
      };
    }

    const variant = product.variants.find(
      (item) => item.uuid === variantUuid && item.productUuid === product.uuid
    );

    if (
      !variant ||
      !variant.active ||
      !productVariantSchema.shape.optionValues.safeParse(variant.optionValues)
        .success
    ) {
      return {
        success: false,
        message: 'This product variant is unavailable.',
      };
    }

    if (quantity > variant.stockQuantity) {
      return {
        success: false,
        message: 'Insufficient variant inventory.',
      };
    }

    return { success: true };
  }

  // Products without variants cannot accept variant UUIDs.
  if (variantUuid) {
    return {
      success: false,
      message: 'This product has no selectable variants.',
    };
  }

  // Null means this product does not track finite inventory.
  if (product.stockQuantity !== null && quantity > product.stockQuantity) {
    return {
      success: false,
      message: 'Insufficient product inventory.',
    };
  }

  return { success: true };
};
