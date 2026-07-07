'use client';

import { SessionProvider } from 'next-auth/react';
import { GlobalBadgeProvider } from '@/components/providers/GlobalBadgeProvider';
import { TeamMemberProvider } from '@/providers/TeamMemberProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GlobalBadgeProvider>
        <TeamMemberProvider>
          {children}
        </TeamMemberProvider>
      </GlobalBadgeProvider>
    </SessionProvider>
  );
}
