import type { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

import ThemeProvider from '@/components/theme-provider';


import CartProvider from '@/features/cart/components/CartProvider';
import CartDrawer from '@/features/cart/components/CartDrawer';


export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Commerce Starter',
  description: 'Browse our product catalog.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CartProvider>
              <AppHeader />
              {children}
              <CartDrawer/>
            </CartProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
