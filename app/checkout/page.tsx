import { auth } from '@clerk/nextjs/server';

import { getMyAddresses } from '@/features/addresses/services/addresses';

import CheckoutReview from '@/features/orders/components/CheckoutReview';

type CheckoutPageProps = {
  searchParams: Promise<{
    address?: string;
  }>;
};

const CheckoutPage = async ({ searchParams }: CheckoutPageProps) => {
  const { userId, redirectToSignIn } = await auth();

  // Guests must sign in before checkout.
  if (!userId) {
    return redirectToSignIn({
      returnBackUrl: new URL(
        '/checkout',
        process.env.APP_URL ?? 'http://localhost:3002'
      ).toString(),
    });
  }

  // Read the address selected after returning from address management.
  const { address: initialAddressUuid } = await searchParams;

  const savedAddresses = await getMyAddresses();

  const addresses = savedAddresses.map((address) => ({
    uuid: address.uuid,
    label: address.label,
    fullName: address.fullName,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    isDefault: address.isDefault,
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Checkout</h1>

        <p className="text-muted-foreground">
          Review your order and choose a shipping address.
        </p>
      </header>

      <CheckoutReview
        addresses={addresses}
        initialAddressUuid={initialAddressUuid}
      />
    </main>
  );
};

export default CheckoutPage;
