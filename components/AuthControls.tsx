'use client';

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

const AuthControls = () => {
  return (
    <div className="flex items-center gap-4">
      <Show when="signed-out">
        <SignInButton />
        <SignUpButton />
      </Show>

      <Show when="signed-in">

        <UserButton />
      </Show>
    </div>
  );
};

export default AuthControls;
