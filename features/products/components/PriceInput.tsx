'use client';

import { useState, type ComponentProps } from 'react';
import { normalizeDollarInput } from '../lib/money';

// Keep entered dollars intact while typing and across failed submissions.
export default function PriceInput({
  defaultValue = '',
  ...props
}: ComponentProps<'input'>) {
  const [value, setValue] = useState(String(defaultValue));
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => setValue(normalizeDollarInput(value))}
    />
  );
}
