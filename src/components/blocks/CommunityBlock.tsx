import React from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { normalizeRole, isOwner } from '@/types/role';

interface BlockProps {
  unreadCount?: number;
  role: string;
  teamId?: string;
}

export function CommunityBlock({ role, teamId , unreadCount}: BlockProps) {
  const isLeader = isOwner(normalizeRole(role));
  
  return (
    <Link href={teamId ? `/mile/${teamId}/community` : '/'} className="block w-full">
      <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer relative">
      <NotificationBadge count={unreadCount} />
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-obsidian">커뮤니티</p>
              <p className="text-xs text-slate">팀원 간 자유로운 소통 공간.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
