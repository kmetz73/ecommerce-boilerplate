import prisma from '@/lib/prisma';

export type NewOrderItem = {
  productUuid: string | null;
  variantUuid: string | null;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
};


export type NewOrderShippingAddress = {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  phone: string | null;
};



export type NewOrderInput = {
  userId: number;
  subtotalCents: number;
  items: NewOrderItem[];
  shippingAddress: NewOrderShippingAddress;
};


export async function createPendingOrder(input: NewOrderInput) {
  return prisma.order.create({
    data: {
      userId: input.userId,
      status: 'PENDING_PAYMENT',
      currency: 'usd',
      subtotalCents: input.subtotalCents,
      shippingCents: 0,
      taxCents: 0,
      totalCents: input.subtotalCents,

      items: {
        create: input.items.map((item) => ({
          productUuid: item.productUuid,
          variantUuid: item.variantUuid,
          productName: item.productName,
          variantLabel: item.variantLabel,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          subtotalCents: item.subtotalCents,
        })),
      },

      shippingAddress: {
        create: {
          ...input.shippingAddress,
        },
      },
    },

    select: {
      uuid: true,
      status: true,
      totalCents: true,
    },
  });
}
