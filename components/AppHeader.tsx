import { auth } from '@clerk/nextjs/server';

import AuthControls from '@/components/AuthControls';
import NavLinks from '@/components/NavLinks';

import CartButton from '@/features/cart/components/CartButton';
import { getCurrentDbUser } from '@/lib/auth/current-user';

const AppHeader = async () => {
  const { userId } = await auth();
  const dbUser = await getCurrentDbUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 p-4">
        <NavLinks
          isSignedIn={Boolean(userId)}
          isAdmin={dbUser?.role === 'ADMIN'}
        />

        <div className="flex items-center gap-3">
          <CartButton />
          <AuthControls />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
