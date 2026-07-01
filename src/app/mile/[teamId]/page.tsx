'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function TeamGatewayPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session?.user?.id) {
      router.replace('/');
      return;
    }

    const teamId = params?.teamId as string;
    if (!teamId) {
      router.replace('/');
      return;
    }

    const checkRoleAndRedirect = async () => {
      try {
        const teamMappingRef = doc(db, `users/${session.user.id}/teams`, teamId);
        const teamMappingSnap = await getDoc(teamMappingRef);
        
        let role = 'player'; // default to player if not found, or maybe redirect out
        if (teamMappingSnap.exists()) {
          role = teamMappingSnap.data().role;
        }
        
        const { normalizeRole, isManagerOrHigher } = require('@/types/role');
        const normalizedRole = normalizeRole(role);

        if (isManagerOrHigher(normalizedRole)) {
          router.replace(`/mile/${teamId}/dashboard`);
        } else {
          router.replace(`/mile/${teamId}/community`);
        }
      } catch (error) {
        console.error('Error checking team role:', error);
        router.replace(`/mile/${teamId}/community`);
      }
    };

    checkRoleAndRedirect();
  }, [status, session, router, params]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );
}
