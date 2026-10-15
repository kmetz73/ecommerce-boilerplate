import { cookies } from 'next/headers';

import { getCurrentDbUser } from '@/lib/auth/current-user';

import { getCatalogPricing } from '@/features/products/lib/catalog-pricing';
import { productVariantSchema } from '@/features/products/validation/product-variants';

import {
  addCartSelection,
  getCartByOwner,
  getOrCreateGuestCart,
  getOrCreateUserCart,
  mergeGuestIntoUserCart,
  removeCartSelection,
  setCartSelectionQuantity,
} from '../data/cart';

import {
  generateGuestCartToken,
  GUEST_CART_COOKIE,
  GUEST_CART_MAX_AGE,
  hashGuestCartToken,
  isValidGuestCartToken,
} from '../lib/guest-token';

import { validateCartSelection } from '../lib/cart-policy';

import {
  addCartItemSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from '../validation/cart';

type CartResult = { success: true } | { success: false; message: string };

const invalidInput: CartResult = {
  success: false,
  message: 'Invalid cart information.',
};

// Only call this from Server Actions or Route Handlers,
// because it can create or delete cookies.
async function getWritableCartUuid() {
  const cookieStore = await cookies();
  const user = await getCurrentDbUser();

  const cookieValue = cookieStore.get(GUEST_CART_COOKIE)?.value;

  const guestToken = isValidGuestCartToken(cookieValue) ? cookieValue : null;

  if (user) {
    if (guestToken) {
      const cartUuid = await mergeGuestIntoUserCart(
        user.id,
        hashGuestCartToken(guestToken)
      );

      cookieStore.delete(GUEST_CART_COOKIE);

      return cartUuid;
    }

    // Clear any malformed guest cookie after sign-in.
    if (cookieValue) {
      cookieStore.delete(GUEST_CART_COOKIE);
    }

    const cart = await getOrCreateUserCart(user.id);

    return cart.uuid;
  }

  // Reuse an existing valid guest token or create one.
  const token = guestToken ?? generateGuestCartToken();

  const cart = await getOrCreateGuestCart(hashGuestCartToken(token));

  if (!guestToken) {
    cookieStore.set(GUEST_CART_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: GUEST_CART_MAX_AGE,
    });
  }

  return cart.uuid;
}

// Called through a trusted Server Action after sign-in.
// Merges any existing guest cart into the customer's cart.
export async function syncSignedInCart(): Promise<CartResult> {
  const user = await getCurrentDbUser();

  if (!user) {
    return {
      success: false,
      message: 'Sign in to synchronize your cart.',
    };
  }

  await getWritableCartUuid();

  return { success: true };
}

export async function addCartItem(input: unknown): Promise<CartResult> {
  const parsed = addCartItemSchema.safeParse(input);

  if (!parsed.success) {
    return invalidInput;
  }

  const cartUuid = await getWritableCartUuid();

  return addCartSelection({
    cartUuid,
    productUuid: parsed.data.productUuid,
    variantUuid: parsed.data.variantUuid ?? null,
    quantity: parsed.data.quantity,
  });
}

export async function updateCartItemQuantity(
  input: unknown
): Promise<CartResult> {
  const parsed = updateCartItemSchema.safeParse(input);

  if (!parsed.success) {
    return invalidInput;
  }

  const cartUuid = await getWritableCartUuid();

  return setCartSelectionQuantity({
    cartUuid,
    itemUuid: parsed.data.itemUuid,
    quantity: parsed.data.quantity,
  });
}

export async function removeCartItem(input: unknown): Promise<CartResult> {
  const parsed = removeCartItemSchema.safeParse(input);

  if (!parsed.success) {
    return invalidInput;
  }

  const cartUuid = await getWritableCartUuid();

  return removeCartSelection({
    cartUuid,
    itemUuid: parsed.data.itemUuid,
  });
}

// Read cart data without creating cookies or database records.
export async function getCartView() {
  const user = await getCurrentDbUser();
  const cookieStore = await cookies();

  const token = cookieStore.get(GUEST_CART_COOKIE)?.value;

  const cart = user
    ? await getCartByOwner({ userId: user.id })
    : isValidGuestCartToken(token)
      ? await getCartByOwner({
          guestTokenHash: hashGuestCartToken(token),
        })
      : null;

  const items = (cart?.items ?? []).map((item) => {
    const product = item.product;

    const pricing = getCatalogPricing(product, product.variants);

    const availability = validateCartSelection(
      product,
      item.variantUuid,
      item.quantity
    );

    const selectedVariant = product.variants.find(
      (variant) => variant.uuid === item.variantUuid
    );

    const parsedOptions = selectedVariant
      ? productVariantSchema.shape.optionValues.safeParse(
          selectedVariant.optionValues
        )
      : null;

    const variantLabel = parsedOptions?.success
      ? Object.entries(parsedOptions.data)
          .map(([name, value]) => `${name}: ${value}`)
          .join(' / ')
      : null;

    const unitPriceCents = pricing.displayPriceCents;

    return {
      uuid: item.uuid,
      productUuid: product.uuid,
      productSlug: product.slug,
      productName: product.name,
      variantUuid: item.variantUuid,
      variantLabel,
      quantity: item.quantity,
      image: product.images[0] ?? null,
      unitPriceCents,
      regularPriceCents: pricing.priceCents,
      salePriceCents: pricing.salePriceCents,
      subtotalCents: unitPriceCents * item.quantity,
      available: availability.success,
      unavailableReason: availability.success ? null : availability.message,
    };
  });

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const subtotalCents = items.reduce(
    (total, item) => total + item.subtotalCents,
    0
  );

  return {
    items,
    itemCount,
    subtotalCents,
    canCheckout: items.length > 0 && items.every((item) => item.available),
  };
}
