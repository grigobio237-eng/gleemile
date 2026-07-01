'use client';

import React, { useEffect, useState } from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { ActivitySquare, AlertOctagon, TrendingDown, TrendingUp, Minus, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';

interface BlockProps {
  unreadCount?: number;
  teamId: string;
  userId: string;
  role: string;
}

export function PhysicalACWRBlock({ teamId, userId, role , unreadCount}: BlockProps) {
  const [acwrData, setAcwrData] = useState<{
    acwrRatio?: number;
    injuryRiskZone?: 'Safe' | 'Watch' | 'Danger';
  } | null>(null);

  // 실시간 구독 (onSnapshot)
  useEffect(() => {
    if (!teamId || !userId) return;

    const memberRef = doc(db, 'team_members', `${teamId}_${userId}`);
    const unsubscribe = onSnapshot(memberRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.acwrData) {
          setAcwrData(data.acwrData);
        }
      }
    });

    return () => unsubscribe();
  }, [teamId, userId]);

  const currentACWR = acwrData?.acwrRatio ? Number(acwrData.acwrRatio.toFixed(2)) : 0;
  const isDanger = acwrData?.injuryRiskZone === 'Danger';
  const isSafe = acwrData?.injuryRiskZone === 'Safe';

  const textColor = isDanger ? 'text-red-600' : isSafe ? 'text-green-600' : 'text-orange-600';

  return (
    <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white hover:shadow-md hover:border-red-200 transition-all cursor-pointer group relative">
      <NotificationBadge count={unreadCount} />
      <Link href={`/mile/${teamId}/acwr`} className="block">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <ActivitySquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-obsidian leading-tight">부상 위험도 모니터링</p>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">부상 방지 및 훈련 부하량 관리.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`font-black text-base leading-tight ${currentACWR > 0 ? textColor : 'text-slate-400'}`}>
                {currentACWR > 0 ? currentACWR : 'N/A'}
              </p>
              {currentACWR > 0 && (
                <p className={`text-[10px] font-bold mt-0.5 ${isDanger ? 'text-red-500' : isSafe ? 'text-green-500' : 'text-orange-500'}`}>
                  {isDanger ? '부하 과중' : isSafe ? '안정 유지' : '모니터링 필요'}
                </p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </Link>
    </Card>
  );
}
