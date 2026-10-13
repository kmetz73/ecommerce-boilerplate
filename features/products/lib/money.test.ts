import { describe, expect, it } from 'vitest';

import { parseDollarsToCents, normalizeDollarInput } from './money';

describe('parseDollarsToCents', () => {
  it('converts whole dollars to cents', () => {
    expect(parseDollarsToCents('20')).toBe(2000);
  });

  it('converts dollars with two decimal places', () => {
    expect(parseDollarsToCents('20.99')).toBe(2099);
  });

  it('handles one decimal place', () => {
    expect(parseDollarsToCents('20.5')).toBe(2050);
  });

  it('handles amounts under one dollar', () => {
    expect(parseDollarsToCents('0.99')).toBe(99);
  });

  it('allows zero dollars', () => {
    expect(parseDollarsToCents('0')).toBe(0);
  });

  it('returns null for blank optional prices', () => {
    expect(parseDollarsToCents('')).toBeNull();
    expect(parseDollarsToCents('   ')).toBeNull();
  });

  it('rejects more than two decimal places', () => {
    expect(() => parseDollarsToCents('20.999')).toThrow();
  });

  it('rejects negative prices', () => {
    expect(() => parseDollarsToCents('-5.00')).toThrow();
  });

  it('rejects invalid text', () => {
    expect(() => parseDollarsToCents('abc')).toThrow();
  });

  it('accepts the maximum PostgreSQL integer amount', () => {
    expect(parseDollarsToCents('21474836.47')).toBe(2147483647);
  });

  it('rejects prices larger than PostgreSQL allows', () => {
    expect(() => parseDollarsToCents('21474836.48')).toThrow(
      'Price is too large.'
    );
  });
});

describe('dollar input normalization', () => {
  it.each([['399', '399.00', 39900], ['3.99', '3.99', 399], ['3.9', '3.90', 390], ['0', '0.00', 0], ['21474836.47', '21474836.47', 2147483647]])('preserves the value of %s across formatting and repeated parsing', (input, formatted, cents) => {
    expect(normalizeDollarInput(input)).toBe(formatted);
    expect(parseDollarsToCents(formatted)).toBe(cents);
    expect(normalizeDollarInput(formatted)).toBe(formatted);
  });
  it.each(['3.999', '-1', 'abc', '21474836.48', '1e2'])('leaves invalid input %s intact for validation', (input) => {
    expect(normalizeDollarInput(input)).toBe(input);
  });
});
