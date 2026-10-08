'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

type ProductsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ProductsError = ({ error, reset }: ProductsErrorProps) => {
  useEffect(() => {
    console.error('Products route error', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Something went wrong</h1>

      <p className="text-muted-foreground">
        We couldn&apos;t load this part of the application.
      </p>

      <Button onClick={() => reset()}>Try again</Button>
    </main>
  );
};

export default ProductsError;
