import { describe, expect, it } from 'vitest';

import { customerAddressSchema, parseCustomerAddressFormData } from './addresses';

const validAddress = {
  label: 'Home',
  fullName: 'Test Customer',
  line1: '123 Main Street',
  line2: null,
  city: 'Nashville',
  region: 'TN',
  postalCode: '37201',
  countryCode: 'US' as const,
  phone: null,
};

describe('customer address validation', () => {
  it('accepts a complete U.S. address', () => {
    expect(customerAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it('rejects missing street addresses', () => {
    expect(
      customerAddressSchema.safeParse({
        ...validAddress,
        line1: '',
      }).success
    ).toBe(false);
  });

  it('rejects invalid ZIP codes', () => {
    expect(
      customerAddressSchema.safeParse({
        ...validAddress,
        postalCode: '123',
      }).success
    ).toBe(false);
  });

  it('rejects unsupported countries', () => {
    expect(
      customerAddressSchema.safeParse({
        ...validAddress,
        countryCode: 'CA',
      }).success
    ).toBe(false);
  });

  it('normalizes optional fields and state codes', () => {
    const form = new FormData();

    form.set('label', '');
    form.set('fullName', 'Test Customer');
    form.set('line1', '123 Main Street');
    form.set('line2', '');
    form.set('city', 'Nashville');
    form.set('region', 'tn');
    form.set('postalCode', '37201');
    form.set('countryCode', 'US');
    form.set('phone', '');

    const result = parseCustomerAddressFormData(form);

    expect(result.region).toBe('TN');
    expect(result.label).toBeNull();
    expect(result.line2).toBeNull();
    expect(result.phone).toBeNull();
  });
});
