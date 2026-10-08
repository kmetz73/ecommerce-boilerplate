'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type SubmitButtonProps = {
  children: ReactNode;
  pendingText?: string;
  className?: string;
};

const SubmitButton = ({
  children,
  pendingText = 'Saving...',
  className,
}: SubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </Button>
  );
};

export default SubmitButton;
