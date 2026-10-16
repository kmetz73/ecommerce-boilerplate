import type Stripe from 'stripe';

export type CheckoutOrder = {
  uuid: string;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  items: {
    productName: string;
    variantLabel: string | null;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
  }[];
};

export function buildCheckoutSessionParams(
  order: CheckoutOrder,
  appUrl: string
): Stripe.Checkout.SessionCreateParams {
  if (order.currency !== 'usd') {
    throw new Error('Unsupported checkout currency.');
  }

  // Shipping and tax are not implemented yet.
  if (order.shippingCents !== 0 || order.taxCents !== 0) {
    throw new Error('Shipping and tax are not configured.');
  }

  if (order.items.length === 0 || order.items.length > 100) {
    throw new Error('Invalid number of order items.');
  }

  for (const item of order.items) {
    if (
      !item.productName.trim() ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99 ||
      !Number.isSafeInteger(item.unitPriceCents) ||
      item.unitPriceCents < 0 ||
      !Number.isSafeInteger(item.subtotalCents) ||
      item.subtotalCents !== item.unitPriceCents * item.quantity
    ) {
      throw new Error('Invalid order item.');
    }
  }

  const subtotal = order.items.reduce(
    (total, item) => total + item.subtotalCents,
    0
  );

  if (
    !Number.isSafeInteger(subtotal) ||
    subtotal <= 0 ||
    subtotal > 2_147_483_647 ||
    subtotal !== order.subtotalCents ||
    subtotal !== order.totalCents
  ) {
    throw new Error('Order totals do not match.');
  }

  const url = new URL(appUrl);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Invalid application URL.');
  }

  const origin = url.origin;

  
return {
  mode: 'payment',
  ui_mode: 'hosted',

  client_reference_id: order.uuid,

  metadata: {
    orderUuid: order.uuid,
  },

  payment_intent_data: {
    metadata: {
      orderUuid: order.uuid,
    },
  },

  line_items: order.items.map((item) => ({
    price_data: {
      currency: 'usd',
      unit_amount: item.unitPriceCents,
      product_data: {
        name: item.productName,
        ...(item.variantLabel ? { description: item.variantLabel } : {}),
      },
    },
    quantity: item.quantity,
  })),

  success_url:
    `${origin}/checkout/success` + '?session_id={CHECKOUT_SESSION_ID}',

  cancel_url: `${origin}/cart`,
};
}
