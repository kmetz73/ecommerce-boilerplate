'use client';

import { useState, useTransition } from 'react';

import AddressForm, { type AddressFormAddress } from './AddressForm';

import {
  deleteAddressAction,
  setDefaultAddressAction,
} from '@/features/addresses/actions/addresses';


type AddressCardProps = {
  address: AddressFormAddress & {
    isDefault: boolean;
  };
  returnToCheckout?: boolean;
};



const AddressCard = ({
  address,
  returnToCheckout = false,
}: AddressCardProps) => {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const handleDefault = () => {
    setError('');

    startTransition(async () => {
      const result = await setDefaultAddressAction(address.uuid);

      if (!result.success) {
        setError(result.message);
      }
    });
  };

  const handleDelete = () => {
    setError('');

    startTransition(async () => {
      const result = await deleteAddressAction(address.uuid);

      if (!result.success) {
        setError(result.message);
      }
    });
  };

  return (
    <article className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          {address.label || 'Shipping Address'}
        </h3>

        {address.isDefault && (
          <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
            Default
          </span>
        )}
      </div>

      <div className="space-y-1 text-sm">
        <p className="font-medium">{address.fullName}</p>
        <p>{address.line1}</p>

        {address.line2 && <p>{address.line2}</p>}

        <p>
          {address.city}, {address.region} {address.postalCode}
        </p>

        {address.phone && <p>{address.phone}</p>}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {editing ? (
        <AddressForm
          address={address}
          returnToCheckout={returnToCheckout}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            className="rounded-md border px-3 py-2 text-sm font-medium"
          >
            Edit
          </button>

          {!address.isDefault && (
            <button
              type="button"
              onClick={handleDefault}
              disabled={pending}
              className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              Make Default
            </button>
          )}

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
            className="rounded-md border px-3 py-2 text-sm font-medium text-destructive"
          >
            Delete
          </button>
        </div>
      )}

      {confirmDelete && !editing && (
        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm">Delete this saved address?</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive disabled:opacity-50"
            >
              {pending ? 'Deleting...' : 'Confirm Delete'}
            </button>

            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={pending}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default AddressCard;
