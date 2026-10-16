import { z } from 'zod';

const optionalText = (value: FormDataEntryValue | null) => {
  if (value === null) return null;

  if (typeof value === 'string' && !value.trim()) {
    return null;
  }

  return value;
};

export const customerAddressSchema = z
  .object({
    label: z.string().trim().max(50).nullable(),

    fullName: z.string().trim().min(1, 'Full name is required.').max(100),

    line1: z.string().trim().min(1, 'Street address is required.').max(200),

    line2: z.string().trim().max(200).nullable(),

    city: z.string().trim().min(1, 'City is required.').max(100),

    region: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, 'Enter a two-letter state code.'),

    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}(-\d{4})?$/, 'Enter a valid U.S. ZIP code.'),

    countryCode: z.literal('US'),

    phone: z.string().trim().max(30).nullable(),
  })
  .strict();

export const addressUuidSchema = z.string().uuid();

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;

export function parseCustomerAddressFormData(
  formData: FormData
): CustomerAddressInput {
  return customerAddressSchema.parse({
    label: optionalText(formData.get('label')),
    fullName: formData.get('fullName'),
    line1: formData.get('line1'),
    line2: optionalText(formData.get('line2')),
    city: formData.get('city'),
    region: formData.get('region'),
    postalCode: formData.get('postalCode'),
    countryCode: formData.get('countryCode'),
    phone: optionalText(formData.get('phone')),
  });
}
