import React from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import Link from 'next/link';

import { normalizeRole, isOwner } from '@/types/role';

interface BlockProps {
  unreadCount?: number;
  role: string;
  teamId?: string;
}

export function AnnouncementBlock({ role, teamId , unreadCount}: BlockProps) {
  const normalizedRole = normalizeRole(role);
  const isLeader = isOwner(normalizedRole);
  const isGuest = normalizedRole === 'guest';
  
  const content = (
    <Card className={`rounded-2xl border-none shadow-lg transition-all relative ${isGuest ? 'opacity-80' : 'hover:shadow-xl cursor-pointer'}`}>
      <NotificationBadge count={unreadCount} />
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-obsidian">공지사항</p>
            <p className="text-xs text-slate">팀의 중요 공지를 띄워줍니다.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return isGuest ? (
    <div className="block w-full cursor-not-allowed">
      {content}
    </div>
  ) : (
    <Link href={teamId ? `/mile/${teamId}/announcements` : '/'} className="block w-full">
      {content}
    </Link>
  );
}
