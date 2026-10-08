'use client';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <h1 className="text-2xl font-bold">Application error</h1>

          <p>The application could not recover normally.</p>

          {error.digest ? (
            <p className="text-sm text-muted-foreground">
              Error reference: {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md border px-4 py-2"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
