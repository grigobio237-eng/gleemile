'use client';

import React, { useState, useEffect } from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import { normalizeRole } from '@/types/role';

interface WellnessBlockProps {
  role: string;
  hasCheckedIn?: boolean;
  teamId?: string;
}

export function WellnessBlock({ role, teamId }: WellnessBlockProps) {
  const { data: session } = useSession();
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const normalizedRole = normalizeRole(role);
  const isGuest = normalizedRole === 'guest';

  useEffect(() => {
    if (!session?.user?.id || !teamId || isGuest) return;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const wellnessRef = doc(db, `team_members/${teamId}_${session.user.id}`, 'wellnessCheckData', todayStr);

    const unsubscribe = onSnapshot(wellnessRef, (docSnap) => {
      setHasCheckedIn(docSnap.exists());
    });

    return () => unsubscribe();
  }, [session, teamId, isGuest]);
  
  if (isGuest) return null; // 방문자는 웰니스 블록 불필요

  // 멤버용 렌더링
  return (
    <Link href={teamId ? `/mile/${teamId}/wellness` : '/'} className="block w-full">
      <Card className={`rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer ${!hasCheckedIn ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${!hasCheckedIn ? 'bg-green-500' : 'bg-green-600/80'}`}>
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-obsidian">웰니스 컨디션</p>
              <p className="text-xs text-slate">멤버들의 피로도와 웰니스 기록.</p>
            </div>
          </div>
          {!hasCheckedIn && (
            <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-green-700">오늘의 컨디션을 아직 기록하지 않았어요!</span>
            </div>
          )}
          {hasCheckedIn && (
             <div className="mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> 
                <span className="text-xs font-bold text-green-700">오늘의 체크인 완료</span>
             </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
