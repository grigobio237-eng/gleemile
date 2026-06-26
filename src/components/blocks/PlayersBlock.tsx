import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import Link from 'next/link';

interface BlockProps {
  role: string;
}

export function PlayersBlock({ role }: BlockProps) {
  const isLeader = role === 'director';
  
  if (!isLeader) return null; // 현재 팀원에게는 보이지 않는 메뉴 (기존 로직 유지)

  return (
    <Link href="/mile/players" className="block w-full">
      <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-obsidian">TF 멤버 명단</p>
              <p className="text-xs text-slate">팀원 현황 관리</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
