import { auth, currentUser } from '@clerk/nextjs/server';

import prisma from '@/lib/prisma';

export async function getCurrentDbUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Fast path:
  // Most requests will find the existing database user here.
  const existingUser = await prisma.user.findUnique({
    where: {
      clerkId: userId,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  // The Clerk user is authenticated but does not exist
  // in our application's database yet.
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw new Error('Authenticated Clerk user does not have an email address.');
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    clerkUser.username ||
    primaryEmail.split('@')[0];

  return prisma.user.upsert({
    where: {
      clerkId: userId,
    },

    update: {
      name,
      email: primaryEmail,
    },

    create: {
      clerkId: userId,
      name,
      email: primaryEmail,
    },
  });
}
