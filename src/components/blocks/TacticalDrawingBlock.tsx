import React from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { PenTool, Undo, Type, Eraser } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface BlockProps {
  unreadCount?: number;
}

export function TacticalDrawingBlock({ unreadCount }: BlockProps) {
  const params = useParams();
  const teamId = params.teamId as string;

  return (
    <Link href={`/mile/${teamId}/tactics`}>
      <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer relative">
      <NotificationBadge count={unreadCount} />
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
              <PenTool className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-black text-sm leading-tight text-white">전술 보드</p>
              <p className="text-[10px] text-slate-400 font-bold">경기 전술을 그리기 및 공유.</p>
            </div>
          </div>
        </div>
        <CardContent className="p-0 bg-[#2b3a42] relative aspect-video">
          {/* Chalkboard Texture Mock */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')]" />
          
          {/* Chalk drawings (Mock) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path d="M50 80 Q 150 20 250 100" stroke="#fcd34d" strokeWidth="3" fill="none" strokeDasharray="5,5" />
            <polygon points="245,95 255,100 245,105" fill="#fcd34d" />
            
            <path d="M80 150 L 180 120" stroke="#60a5fa" strokeWidth="2" fill="none" />
            <polygon points="175,115 185,118 178,125" fill="#60a5fa" />
          </svg>

          {/* Post-it Mock */}
          <div className="absolute bottom-4 right-4 bg-yellow-200 text-obsidian text-[10px] font-bold p-2 px-3 rounded shadow-md transform rotate-2 max-w-[120px]">
            작전 브리핑 준비 완료
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
