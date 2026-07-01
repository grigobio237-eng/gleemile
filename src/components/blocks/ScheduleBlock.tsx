import React from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

interface BlockProps {
  unreadCount?: number;
  role: string;
  teamId?: string;
  userId?: string;
}

export function ScheduleBlock({ role, teamId, unreadCount }: BlockProps) {
  return (
    <Link href={teamId ? `/mile/${teamId}/schedule` : '/'} className="block w-full">
      <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer relative group h-full">
        <NotificationBadge count={unreadCount} />
        <CardContent className="p-4 h-full flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform duration-300">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-obsidian text-[15px]">일정 관리</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">팀의 모든 스케줄을<br/>한눈에 확인하세요.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
