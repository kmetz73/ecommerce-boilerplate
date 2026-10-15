import { createHash, randomBytes } from 'node:crypto';

export const GUEST_CART_COOKIE = 'commerce_guest_cart';

export const GUEST_CART_MAX_AGE = 60 * 60 * 24 * 30;

export function generateGuestCartToken() {
  return randomBytes(32).toString('base64url');
}

export function isValidGuestCartToken(
  value: string | undefined
): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function hashGuestCartToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
