import { beforeEach, describe, expect, it, vi } from 'vitest';

import { preparePendingOrder } from './orders';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  address: vi.fn(),
  sync: vi.fn(),
  cart: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({
  getCurrentDbUser: mocks.user,
}));

vi.mock('@/features/addresses/data/addresses', () => ({
  getAddressForUser: mocks.address,
}));

vi.mock('@/features/cart/services/cart', () => ({
  getCartView: mocks.cart,
  syncSignedInCart: mocks.sync,
}));

vi.mock('@/features/orders/data/orders', () => ({
  createPendingOrder: mocks.create,
}));

const productUuid = '550e8400-e29b-41d4-a716-446655440000';

const addressUuid = '550e8400-e29b-41d4-a716-446655440001';

const shippingAddress = {
  fullName: 'Test Customer',
  line1: '123 Main Street',
  line2: null,
  city: 'Nashville',
  region: 'TN',
  postalCode: '37201',
  countryCode: 'US',
  phone: null,
};

beforeEach(() => {
  vi.resetAllMocks();

  mocks.user.mockResolvedValue({ id: 7 });

  mocks.address.mockResolvedValue({
    uuid: addressUuid,
    userId: 7,
    ...shippingAddress,
  });

  mocks.sync.mockResolvedValue(undefined);

  mocks.cart.mockResolvedValue({
    items: [
      {
        productUuid,
        variantUuid: null,
        productName: 'Test Product',
        variantLabel: null,
        quantity: 2,
        unitPriceCents: 1099,
        subtotalCents: 2198,
        available: true,
      },
    ],
    itemCount: 2,
    subtotalCents: 2198,
    canCheckout: true,
  });

  mocks.create.mockResolvedValue({
    uuid: 'order-uuid',
    status: 'PENDING_PAYMENT',
    totalCents: 2198,
  });
});

describe('order service', () => {
  it('requires a signed-in user', async () => {
    mocks.user.mockResolvedValue(null);

    await expect(preparePendingOrder(addressUuid)).rejects.toThrow(
      'Sign in is required'
    );

    expect(mocks.address).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rejects invalid address identifiers', async () => {
    await expect(preparePendingOrder('invalid')).rejects.toThrow(
      'Select a valid shipping address.'
    );

    expect(mocks.address).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rejects addresses not owned by the customer', async () => {
    mocks.address.mockResolvedValue(null);

    await expect(preparePendingOrder(addressUuid)).rejects.toThrow(
      'Shipping address not found.'
    );

    expect(mocks.address).toHaveBeenCalledWith(7, addressUuid);

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates a pending order with an address snapshot', async () => {
    const result = await preparePendingOrder(addressUuid);

    expect(mocks.address).toHaveBeenCalledWith(7, addressUuid);

    expect(mocks.sync).toHaveBeenCalled();

    expect(mocks.create).toHaveBeenCalledWith({
      userId: 7,
      subtotalCents: 2198,
      shippingAddress,
      items: [
        {
          productUuid,
          variantUuid: null,
          productName: 'Test Product',
          variantLabel: null,
          quantity: 2,
          unitPriceCents: 1099,
          subtotalCents: 2198,
        },
      ],
    });

    expect(result.status).toBe('PENDING_PAYMENT');
  });

  it('rejects an empty cart', async () => {
    mocks.cart.mockResolvedValue({
      items: [],
      itemCount: 0,
      subtotalCents: 0,
      canCheckout: false,
    });

    await expect(preparePendingOrder(addressUuid)).rejects.toThrow(
      'Your cart is empty'
    );

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rejects unavailable cart items', async () => {
    const cart = await mocks.cart();

    mocks.cart.mockResolvedValue({
      ...cart,
      canCheckout: false,
      items: [
        {
          ...cart.items[0],
          available: false,
        },
      ],
    });

    await expect(preparePendingOrder(addressUuid)).rejects.toThrow(
      'unavailable items'
    );

    expect(mocks.create).not.toHaveBeenCalled();
  });
});
