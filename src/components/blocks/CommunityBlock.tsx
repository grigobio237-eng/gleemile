import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface BlockProps {
  role: string;
}

export function CommunityBlock({ role }: BlockProps) {
  const isLeader = role === 'director';
  
  return (
    <Link href="/mile/community" className="block w-full">
      <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-obsidian">성장 피드백 커뮤니티</p>
              <p className="text-xs text-slate">
                {isLeader ? '팀원 전용 소통 게시판' : '조언 및 논의 스레드'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
