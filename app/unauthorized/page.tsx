import Link from 'next/link';

const UnauthorizedPage = () => {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold text-muted-foreground">403</p>

        <h1 className="text-3xl font-bold">
          You are not authorized to view this page
        </h1>

        <p className="text-muted-foreground">
          Your account does not have permission to access this area.
        </p>

        <Link href="/" className="inline-block rounded-md border px-4 py-2">
          Return Home
        </Link>
      </div>
    </main>
  );
};

export default UnauthorizedPage;
