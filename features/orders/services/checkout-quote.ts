import { getCurrentDbUser } from '@/lib/auth/current-user';

import { getAddressForUser } from '@/features/addresses/data/addresses';
import { addressUuidSchema } from '@/features/addresses/validation/addresses';

import { getCartView, syncSignedInCart } from '@/features/cart/services/cart';

import { calculateCheckoutEstimate } from '@/features/orders/lib/checkout-pricing';
import { getShippingPolicy } from '@/features/orders/lib/shipping-policy';

const MAX_CENTS = 2_147_483_647;

export async function getCheckoutQuote(addressUuid: string) {
  const user = await getCurrentDbUser();

  if (!user) {
    throw new Error('Sign in is required.');
  }

  const parsed = addressUuidSchema.safeParse(addressUuid);

  if (!parsed.success) {
    throw new Error('Select a valid shipping address.');
  }

  const address = await getAddressForUser(user.id, parsed.data);

  if (!address) {
    throw new Error('Shipping address not found.');
  }

  await syncSignedInCart();

  const cart = await getCartView();

  if (cart.items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  if (!cart.canCheckout || cart.items.some((item) => !item.available)) {
    throw new Error('Your cart contains unavailable items.');
  }

  let subtotalCents = 0;

  for (const item of cart.items) {
    const validQuantity =
      Number.isInteger(item.quantity) &&
      item.quantity >= 1 &&
      item.quantity <= 99;

    const validPrice =
      Number.isSafeInteger(item.unitPriceCents) && item.unitPriceCents >= 0;

    if (!validQuantity || !validPrice) {
      throw new Error('Invalid cart item.');
    }

    const lineTotal = item.unitPriceCents * item.quantity;

    if (
      !Number.isSafeInteger(lineTotal) ||
      lineTotal > MAX_CENTS ||
      lineTotal !== item.subtotalCents
    ) {
      throw new Error('Cart pricing is inconsistent.');
    }

    subtotalCents += lineTotal;
  }

  if (
    !Number.isSafeInteger(subtotalCents) ||
    subtotalCents > MAX_CENTS ||
    subtotalCents !== cart.subtotalCents
  ) {
    throw new Error('Cart pricing is inconsistent.');
  }

  return calculateCheckoutEstimate(
    subtotalCents,
    address.countryCode,
    getShippingPolicy()
  );
}
