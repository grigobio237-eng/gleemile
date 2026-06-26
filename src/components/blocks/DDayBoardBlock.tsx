import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Flag, CheckSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BlockProps {
  role: string;
}

export function DDayBoardBlock({ role }: BlockProps) {
  // Mock data
  const totalTasks = 12;
  const completedTasks = 8;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="h-20 bg-gradient-to-r from-teal-500 to-emerald-600 relative overflow-hidden flex flex-col justify-center items-center text-white">
        <div className="absolute opacity-20 -right-4 -top-4">
          <CalendarDays className="w-24 h-24" />
        </div>
        <p className="text-xs font-bold opacity-90 z-10">졸업 연주회 리사이틀</p>
        <h2 className="text-3xl font-black tracking-tight z-10 drop-shadow-md">D-14</h2>
      </div>
      <CardContent className="p-4 space-y-4">
        
        <div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-1.5 text-obsidian">
              <Flag className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold">준비 진척도</span>
            </div>
            <span className="text-xs font-black text-teal-600">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-slate-100 [&>div]:bg-teal-500" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-bold text-slate-700 line-through">포스터 디자인 확정</span>
            </div>
            <span className="text-[10px] text-slate-400">완료</span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-bold text-obsidian">대관료 잔금 입금</span>
            </div>
            <span className="text-[10px] text-red-500 font-bold">D-2</span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
