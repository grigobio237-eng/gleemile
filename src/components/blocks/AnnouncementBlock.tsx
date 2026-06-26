import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import Link from 'next/link';

interface BlockProps {
  role: string;
}

export function AnnouncementBlock({ role }: BlockProps) {
  const isLeader = role === 'director';
  
  return (
    <Link href="/mile/announcements" className="block w-full">
      <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-obsidian">
                {isLeader ? '칸반 보드 & 공지' : 'TF 공지사항'}
              </p>
              <p className="text-xs text-slate">
                {isLeader ? '프로젝트 태스크 관리' : '칸반 보드 및 공지'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
