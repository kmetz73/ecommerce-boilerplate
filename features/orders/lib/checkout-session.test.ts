import { describe, expect, it } from 'vitest';

import {
  buildCheckoutSessionParams,
  type CheckoutOrder,
} from './checkout-session';

const order: CheckoutOrder = {
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  currency: 'usd',
  subtotalCents: 2198,
  shippingCents: 0,
  taxCents: 0,
  totalCents: 2198,
  items: [
    {
      productName: 'Water Bottle',
      variantLabel: 'Color: Green',
      quantity: 2,
      unitPriceCents: 1099,
      subtotalCents: 2198,
    },
  ],
};

describe('Stripe Checkout Session preparation', () => {
  it('builds line items from the saved order', () => {
    const result = buildCheckoutSessionParams(order, 'http://localhost:3002');

    expect(result.mode).toBe('payment');
    expect(result.client_reference_id).toBe(order.uuid);
    expect(result.metadata?.orderUuid).toBe(order.uuid);

    expect(result.line_items).toEqual([
      {
        price_data: {
          currency: 'usd',
          unit_amount: 1099,
          product_data: {
            name: 'Water Bottle',
            description: 'Color: Green',
          },
        },
        quantity: 2,
      },
    ]);
  });

  it('rejects inconsistent order totals', () => {
    expect(() =>
      buildCheckoutSessionParams(
        { ...order, totalCents: 100 },
        'http://localhost:3002'
      )
    ).toThrow('Order totals do not match.');
  });

  it('rejects inconsistent line item subtotals', () => {
    const invalidOrder = {
      ...order,
      items: [
        {
          ...order.items[0],
          subtotalCents: 100,
        },
      ],
    };

    expect(() =>
      buildCheckoutSessionParams(invalidOrder, 'http://localhost:3002')
    ).toThrow('Invalid order item.');
  });

  it('rejects unsupported shipping charges', () => {
    expect(() =>
      buildCheckoutSessionParams(
        { ...order, shippingCents: 500 },
        'http://localhost:3002'
      )
    ).toThrow('Shipping and tax are not configured.');
  });
});
