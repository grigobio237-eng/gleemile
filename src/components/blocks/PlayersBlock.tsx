import React from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import Link from 'next/link';

import { normalizeRole, isOwner } from '@/types/role';

interface BlockProps {
  unreadCount?: number;
  role: string;
  teamId?: string;
}

export function PlayersBlock({ role, teamId , unreadCount}: BlockProps) {
  const isLeader = isOwner(normalizeRole(role));

  // Mock data for players avatar preview
  const previewPlayers = [
    { id: 1, name: '김코치', initial: '김' },
    { id: 2, name: '이선수', initial: '이' },
    { id: 3, name: '박선수', initial: '박' },
  ];

  return (
    <Link href={teamId ? `/mile/${teamId}/members` : '/'} className="block w-full">
      <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer relative">
      <NotificationBadge count={unreadCount} />
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-obsidian">회원 명단</p>
              <p className="text-xs text-slate">우리 모임 회원들의 프로필 관리.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
