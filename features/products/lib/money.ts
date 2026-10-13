const MAX_PRICE_CENTS = 2_147_483_647;

/**
 * Convert a dollar amount entered in a form into integer cents.
 *
 * "20.99" -> 2099
 * "20"    -> 2000
 * ""      -> null
 *
 * Blank values represent optional prices.
 */
export const parseDollarsToCents = (value: string): number | null => {
  const trimmed = value.trim();

  if (trimmed === '') {
    return null;
  }

  // Allow whole dollars or up to two decimal places.
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(
      'Enter a valid dollar amount with up to two decimal places.'
    );
  }

  const [dollars, fraction = ''] = trimmed.split('.');

  // Convert separately to avoid fractional floating-point rounding.
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, '0'));

  if (!Number.isSafeInteger(cents) || cents > MAX_PRICE_CENTS) {
    throw new Error('Price is too large.');
  }

  return cents;
};

// Format only valid complete inputs; leave invalid text intact for form feedback.
export const normalizeDollarInput = (value: string): string => {
  try {
    const cents = parseDollarsToCents(value);
    return cents === null ? '' : (cents / 100).toFixed(2);
  } catch {
    return value;
  }
};
