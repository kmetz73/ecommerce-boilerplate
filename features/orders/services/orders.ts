import { getCurrentDbUser } from '@/lib/auth/current-user';

import { getCartView, syncSignedInCart } from '@/features/cart/services/cart';

import {
  createPendingOrder,
  type NewOrderItem,
} from '@/features/orders/data/orders';


import { getAddressForUser } from '@/features/addresses/data/addresses';

import { addressUuidSchema } from '@/features/addresses/validation/addresses';


const MAX_INTEGER = 2_147_483_647;

export async function preparePendingOrder(addressUuid: string) {
  // Checkout requires an authenticated database user.
  const user = await getCurrentDbUser();

  if (!user) {
    throw new Error('Sign in is required to checkout.');
  }

  // Validate the address identifier.
  const parsedAddressUuid = addressUuidSchema.safeParse(addressUuid);

  if (!parsedAddressUuid.success) {
    throw new Error('Select a valid shipping address.');
  }

  // Verify the address belongs to this customer.
  const address = await getAddressForUser(user.id, parsedAddressUuid.data);

  if (!address) {
    throw new Error('Shipping address not found.');
  }

  // Copy only the fields needed for the order snapshot.
  const shippingAddress = {
    fullName: address.fullName,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    phone: address.phone,
  };

  // Merge an existing guest cart into the signed-in cart.
  await syncSignedInCart();

  // Never trust prices or totals submitted by the browser.
  const cart = await getCartView();

  if (cart.items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  if (!cart.canCheckout) {
    throw new Error('Your cart contains unavailable items.');
  }

  const items: NewOrderItem[] = cart.items.map((item) => {
    if (
      !item.available ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99 ||
      !Number.isInteger(item.unitPriceCents) ||
      item.unitPriceCents < 0
    ) {
      throw new Error('Invalid cart item.');
    }

    const subtotalCents = item.unitPriceCents * item.quantity;

    if (!Number.isSafeInteger(subtotalCents) || subtotalCents > MAX_INTEGER) {
      throw new Error('Cart total is too large.');
    }

    return {
      productUuid: item.productUuid,
      variantUuid: item.variantUuid,
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      subtotalCents,
    };
  });

  const subtotalCents = items.reduce(
    (total, item) => total + item.subtotalCents,
    0
  );

  if (!Number.isSafeInteger(subtotalCents) || subtotalCents > MAX_INTEGER) {
    throw new Error('Cart total is too large.');
  }

  if (subtotalCents !== cart.subtotalCents) {
    throw new Error('Cart pricing changed. Please refresh your cart.');
  }

  
return createPendingOrder({
  userId: user.id,
  subtotalCents,
  items,
  shippingAddress,
});

}
