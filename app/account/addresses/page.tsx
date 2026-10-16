import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import Link from 'next/link';


import AddressForm from '@/features/addresses/components/AddressForm';
import AddressCard from '@/features/addresses/components/AddressCard';

import { getMyAddresses } from '@/features/addresses/services/addresses';

type AddressesPageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};




const AddressesPage = async ({
  searchParams,
}: AddressesPageProps) => {
  const { userId } = await auth();
   const { returnTo } = await searchParams;
   const returnToCheckout = returnTo === 'checkout';
   

  if (!userId) {
    redirect('/sign-in?redirect_url=%2Faccount%2Faddresses');
  }

  const addresses = await getMyAddresses();

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">My Addresses</h1>

        <p className="text-muted-foreground">
          Manage your saved shipping addresses for checkout.
        </p>
      </header>

      {returnToCheckout && (
        <Link
          href="/checkout"
          className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          ← Return to Checkout
        </Link>
      )}

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-xl font-semibold">Add Shipping Address</h2>

        <AddressForm returnToCheckout={returnToCheckout} />
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold">Saved Addresses</h2>

        {addresses.length === 0 ? (
          <p className="text-muted-foreground">
            You haven't saved any shipping addresses yet.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.uuid}
                address={address}
                returnToCheckout={returnToCheckout}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AddressesPage;
