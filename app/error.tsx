'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const AppError = ({ error, reset }: AppErrorProps) => {
  useEffect(() => {
    console.error('Application route error', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Something went wrong</h1>

      <p className="text-muted-foreground">
        The application hit an unexpected error.
      </p>

      <Button onClick={() => reset()}>Try again</Button>
    </main>
  );
};

export default AppError;
