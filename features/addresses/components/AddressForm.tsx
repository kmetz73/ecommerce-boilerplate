'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import SubmitButton from '@/components/SubmitButton';

import {
  saveAddressAction,
  type AddressFormState,
} from '@/features/addresses/actions/addresses';

export type AddressFormAddress = {
  uuid: string;
  label: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  phone: string | null;
};

type AddressFormProps = {
  address?: AddressFormAddress;
  onCancel?: () => void;
  onSaved?: () => void;
  returnToCheckout?: boolean;
};

const initialState: AddressFormState = {
  status: 'idle',
  message: '',
};

const AddressForm = ({
  address,
  onCancel,
  onSaved,
  returnToCheckout = false,
}: AddressFormProps) => {
  const router = useRouter();

  const [state, formAction] = useActionState(saveAddressAction, initialState);

  const editing = Boolean(address);

  // Return to checkout after successfully saving an
  // address, but only when coming from checkout.
  useEffect(() => {
    if (state.status !== 'success') return;

    if (returnToCheckout) {
      const savedAddressUuid = address?.uuid ?? state.createdAddressUuid;

      const destination = savedAddressUuid
        ? `/checkout?address=${encodeURIComponent(savedAddressUuid)}`
        : '/checkout';

      router.replace(destination);
      return;
    }

    // Normal address management: close the edit form.
    onSaved?.();
  }, [
    state.status,
    state.createdAddressUuid,
    returnToCheckout,
    address,
    router,
    onSaved,
  ]);

  const inputClass = 'w-full rounded-md border bg-background px-3 py-2';

  return (
    <form action={formAction} className="space-y-5">
      {/* Existing address identifier */}
      {address && (
        <input type="hidden" name="addressUuid" value={address.uuid} />
      )}

      {/* Shipping country */}
      <input type="hidden" name="countryCode" value="US" />

      {/* Address label */}
      <div className="space-y-2">
        <label htmlFor={`label-${address?.uuid ?? 'new'}`}>
          Address Label (Optional)
        </label>

        <input
          id={`label-${address?.uuid ?? 'new'}`}
          name="label"
          defaultValue={address?.label ?? ''}
          placeholder="Home, Work, etc."
          maxLength={50}
          className={inputClass}
        />
      </div>

      {/* Full name */}
      <div className="space-y-2">
        <label htmlFor={`name-${address?.uuid ?? 'new'}`}>Full Name</label>

        <input
          id={`name-${address?.uuid ?? 'new'}`}
          name="fullName"
          defaultValue={address?.fullName ?? ''}
          autoComplete="name"
          maxLength={100}
          required
          className={inputClass}
        />
      </div>

      {/* Street address */}
      <div className="space-y-2">
        <label htmlFor={`line1-${address?.uuid ?? 'new'}`}>
          Street Address
        </label>

        <input
          id={`line1-${address?.uuid ?? 'new'}`}
          name="line1"
          defaultValue={address?.line1 ?? ''}
          autoComplete="address-line1"
          maxLength={200}
          required
          className={inputClass}
        />
      </div>

      {/* Apartment or suite */}
      <div className="space-y-2">
        <label htmlFor={`line2-${address?.uuid ?? 'new'}`}>
          Apartment, Suite, etc. (Optional)
        </label>

        <input
          id={`line2-${address?.uuid ?? 'new'}`}
          name="line2"
          defaultValue={address?.line2 ?? ''}
          autoComplete="address-line2"
          maxLength={200}
          className={inputClass}
        />
      </div>

      {/* City and state */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={`city-${address?.uuid ?? 'new'}`}>City</label>

          <input
            id={`city-${address?.uuid ?? 'new'}`}
            name="city"
            defaultValue={address?.city ?? ''}
            autoComplete="address-level2"
            maxLength={100}
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={`region-${address?.uuid ?? 'new'}`}>
            State (2-letter code)
          </label>

          <input
            id={`region-${address?.uuid ?? 'new'}`}
            name="region"
            defaultValue={address?.region ?? ''}
            placeholder="TN"
            autoComplete="address-level1"
            maxLength={2}
            required
            className={inputClass}
          />
        </div>
      </div>

      {/* ZIP code and phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={`zip-${address?.uuid ?? 'new'}`}>ZIP Code</label>

          <input
            id={`zip-${address?.uuid ?? 'new'}`}
            name="postalCode"
            defaultValue={address?.postalCode ?? ''}
            autoComplete="postal-code"
            placeholder="37201"
            pattern="[0-9]{5}(-[0-9]{4})?"
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={`phone-${address?.uuid ?? 'new'}`}>
            Phone (Optional)
          </label>

          <input
            id={`phone-${address?.uuid ?? 'new'}`}
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={address?.phone ?? ''}
            maxLength={30}
            className={inputClass}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Country: United States</p>

      {/* Default address option for new addresses */}
      {!editing && (
        <label className="flex items-center gap-2">
          <input type="checkbox" name="makeDefault" className="size-4" />
          Set as default shipping address
        </label>
      )}

      {/* Server Action feedback */}
      {state.message && (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={
            state.status === 'error'
              ? 'text-sm text-destructive'
              : 'text-sm text-green-600 dark:text-green-400'
          }
        >
          {state.message}
        </p>
      )}

      {/* Form actions */}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Saving...">
          {editing ? 'Save Changes' : 'Save Address'}
        </SubmitButton>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default AddressForm;
