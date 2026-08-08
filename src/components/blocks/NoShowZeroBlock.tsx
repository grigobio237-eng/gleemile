'use client';

import React, { useState, lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarX2 } from 'lucide-react';

import { NotificationBadge } from '@/components/ui/NotificationBadge';

const NoShowZeroModal = lazy(() => import('@/components/modals/NoShowZeroModal'));

interface BlockProps {
  teamId?: string;
  role: string;
  unreadCount?: number;
}

export function NoShowZeroBlock({ teamId, role, unreadCount }: BlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="block w-full h-full">
        <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer relative group h-full">
          <NotificationBadge count={unreadCount} />
          <CardContent className="p-4 h-full flex flex-col justify-center relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <CalendarX2 className="w-6 h-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-obsidian text-[15px]">NoShow-Zero</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">예약금 · 노쇼 방지 · 회원권</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={null}>
        {open && teamId && <NoShowZeroModal teamId={teamId} onClose={() => setOpen(false)} />}
      </Suspense>
    </>
  );
}
