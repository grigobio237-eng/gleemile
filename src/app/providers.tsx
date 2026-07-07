'use client';

import { SessionProvider } from 'next-auth/react';
import { GlobalBadgeProvider } from '@/components/providers/GlobalBadgeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GlobalBadgeProvider>
        {children}
      </GlobalBadgeProvider>
    </SessionProvider>
  );
}
