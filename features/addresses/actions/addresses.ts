'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';

import {
  createMyAddress,
  updateMyAddress,
  deleteMyAddress,
  makeMyAddressDefault,
} from '@/features/addresses/services/addresses';

import { parseCustomerAddressFormData } from '@/features/addresses/validation/addresses';

export type AddressFormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  createdAddressUuid?: string;
};

export type AddressMutationResult =
  | { success: true }
  | { success: false; message: string };

const refreshAddresses = () => {
  revalidatePath('/account/addresses');
};

export async function saveAddressAction(
  _previousState: AddressFormState,
  formData: FormData
): Promise<AddressFormState> {
  try {
    const input = parseCustomerAddressFormData(formData);

    const addressUuid = String(formData.get('addressUuid') ?? '').trim();

    let createdAddressUuid: string | undefined;

    if (addressUuid) {
      await updateMyAddress(addressUuid, input);
    } else {
      const makeDefault = formData.get('makeDefault') === 'on';

      const created = await createMyAddress(input, makeDefault);

      createdAddressUuid = created.uuid;
    }

    refreshAddresses();

    return {
      status: 'success',
      message: addressUuid
        ? 'Address updated successfully.'
        : 'Address saved successfully.',
      createdAddressUuid,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: 'error',
        message:
          error.issues[0]?.message ?? 'Please check your address information.',
      };
    }

    if (error instanceof Error && error.message === 'Address not found.') {
      return {
        status: 'error',
        message: 'Address not found.',
      };
    }

    return {
      status: 'error',
      message: 'Unable to save address.',
    };
  }
}

export async function deleteAddressAction(
  addressUuid: string
): Promise<AddressMutationResult> {
  try {
    await deleteMyAddress(addressUuid);

    refreshAddresses();

    return { success: true };
  } catch {
    return {
      success: false,
      message: 'Unable to delete address.',
    };
  }
}

export async function setDefaultAddressAction(
  addressUuid: string
): Promise<AddressMutationResult> {
  try {
    await makeMyAddressDefault(addressUuid);

    refreshAddresses();

    return { success: true };
  } catch {
    return {
      success: false,
      message: 'Unable to change default address.',
    };
  }
}
