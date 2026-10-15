import { z } from 'zod';

export const MAX_CART_ITEM_QUANTITY = 99;

export const addCartItemSchema = z.object({
  productUuid: z.string().uuid(),
  variantUuid: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(MAX_CART_ITEM_QUANTITY),
});

export const updateCartItemSchema = z.object({
  itemUuid: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_CART_ITEM_QUANTITY),
});

export const removeCartItemSchema = z.object({
  itemUuid: z.string().uuid(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
