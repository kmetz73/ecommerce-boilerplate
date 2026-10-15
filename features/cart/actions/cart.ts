'use server';

import { revalidatePath } from 'next/cache';

import {
  addCartItem,
  getCartView,
  removeCartItem,
  syncSignedInCart,
  updateCartItemQuantity,
} from '../services/cart';

// Reading also merges an existing guest cart after sign-in.
export async function fetchCartAction() {
  await syncSignedInCart();
  return getCartView();
}

export async function addCartItemAction(input: unknown) {
  const result = await addCartItem(input);

  if (!result.success) {
    return result;
  }

  revalidatePath('/cart');

  return {
    success: true as const,
    cart: await getCartView(),
  };
}

export async function updateCartItemAction(input: unknown) {
  const result = await updateCartItemQuantity(input);

  if (!result.success) {
    return result;
  }

  revalidatePath('/cart');

  return {
    success: true as const,
    cart: await getCartView(),
  };
}

export async function removeCartItemAction(input: unknown) {
  const result = await removeCartItem(input);

  if (!result.success) {
    return result;
  }

  revalidatePath('/cart');

  return {
    success: true as const,
    cart: await getCartView(),
  };
}
