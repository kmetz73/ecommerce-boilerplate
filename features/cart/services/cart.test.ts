import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addCartItem, getCartView, updateCartItemQuantity } from './cart';

import {
  generateGuestCartToken,
  GUEST_CART_COOKIE,
  hashGuestCartToken,
} from '../lib/guest-token';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  cookies: vi.fn(),
  getCart: vi.fn(),
  userCart: vi.fn(),
  guestCart: vi.fn(),
  merge: vi.fn(),
  add: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({
  getCurrentDbUser: mocks.user,
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('../data/cart', () => ({
  getCartByOwner: mocks.getCart,
  getOrCreateUserCart: mocks.userCart,
  getOrCreateGuestCart: mocks.guestCart,
  mergeGuestIntoUserCart: mocks.merge,
  addCartSelection: mocks.add,
  setCartSelectionQuantity: mocks.update,
  removeCartSelection: mocks.remove,
}));

const productUuid = '550e8400-e29b-41d4-a716-446655440000';
const itemUuid = '550e8400-e29b-41d4-a716-446655440002';

beforeEach(() => {
  vi.resetAllMocks();

  mocks.user.mockResolvedValue(null);
  mocks.cookies.mockResolvedValue({
    get: vi.fn(() => undefined),
    set: vi.fn(),
    delete: vi.fn(),
  });

  mocks.guestCart.mockResolvedValue({
    uuid: 'guest-cart',
  });

  mocks.userCart.mockResolvedValue({
    uuid: 'user-cart',
  });

  mocks.merge.mockResolvedValue('user-cart');
  mocks.add.mockResolvedValue({ success: true });
  mocks.update.mockResolvedValue({ success: true });
  mocks.remove.mockResolvedValue({ success: true });
});

describe('cart service', () => {
  it('rejects invalid input without creating a cart', async () => {
    const result = await addCartItem({
      productUuid: 'invalid',
      quantity: -1,
    });

    expect(result.success).toBe(false);
    expect(mocks.guestCart).not.toHaveBeenCalled();
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it('creates a secure guest cart identity', async () => {
    const setCookie = vi.fn();

    mocks.cookies.mockResolvedValue({
      get: vi.fn(() => undefined),
      set: setCookie,
      delete: vi.fn(),
    });

    await addCartItem({
      productUuid,
      quantity: 2,
    });

    expect(mocks.guestCart).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/)
    );

    expect(mocks.add).toHaveBeenCalledWith({
      cartUuid: 'guest-cart',
      productUuid,
      variantUuid: null,
      quantity: 2,
    });

    expect(setCookie).toHaveBeenCalledWith(
      GUEST_CART_COOKIE,
      expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    );
  });

  it('merges a guest cart after sign-in', async () => {
    const token = generateGuestCartToken();
    const deleteCookie = vi.fn();

    mocks.user.mockResolvedValue({ id: 42 });

    mocks.cookies.mockResolvedValue({
      get: vi.fn(() => ({ value: token })),
      set: vi.fn(),
      delete: deleteCookie,
    });

    await addCartItem({
      productUuid,
      quantity: 1,
    });

    expect(mocks.merge).toHaveBeenCalledWith(42, hashGuestCartToken(token));

    expect(deleteCookie).toHaveBeenCalledWith(GUEST_CART_COOKIE);

    expect(mocks.add).toHaveBeenCalledWith(
      expect.objectContaining({
        cartUuid: 'user-cart',
      })
    );
  });

  it('does not accept a caller-supplied cart ID', async () => {
    mocks.user.mockResolvedValue({ id: 42 });

    await updateCartItemQuantity({
      itemUuid,
      quantity: 3,
      cartUuid: 'someone-elses-cart',
    });

    expect(mocks.update).toHaveBeenCalledWith({
      cartUuid: 'user-cart',
      itemUuid,
      quantity: 3,
    });
  });

  it('returns an empty cart for a new guest', async () => {
    const cart = await getCartView();

    expect(cart.items).toEqual([]);
    expect(cart.subtotalCents).toBe(0);
    expect(cart.canCheckout).toBe(false);
    expect(mocks.getCart).not.toHaveBeenCalled();
  });

  it('uses current product sale pricing for totals', async () => {
    mocks.user.mockResolvedValue({ id: 42 });

    mocks.getCart.mockResolvedValue({
      items: [
        {
          uuid: itemUuid,
          variantUuid: null,
          quantity: 2,
          product: {
            uuid: productUuid,
            slug: 'example-product',
            name: 'Example Product',
            priceCents: 1599,
            salePriceCents: 699,
            active: true,
            stockQuantity: 10,
            images: [],
            variants: [],
          },
        },
      ],
    });

    const cart = await getCartView();

    expect(cart.itemCount).toBe(2);
    expect(cart.subtotalCents).toBe(1398);
    expect(cart.canCheckout).toBe(true);
    expect(cart.items[0].unitPriceCents).toBe(699);
  });
});
