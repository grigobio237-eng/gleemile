import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Coins, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BlockProps {
  role: string;
}

export function AssignmentMissionBlock({ role }: BlockProps) {
  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">과제 미션 대시보드</p>
            <p className="text-[10px] font-bold text-slate-500">목표 달성률 및 예치금 관리</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        
        {/* Mission Graph */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 전체 미션 달성률
            </span>
            <span className="text-sm font-black text-emerald-600">75%</span>
          </div>
          <Progress value={75} className="h-2 bg-slate-200 [&>div]:bg-emerald-500" />
        </div>

        {/* Deposit Widget */}
        <div className="flex gap-2">
          <div className="flex-1 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-3 text-white">
            <div className="flex items-center gap-1.5 opacity-80 mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">나의 남은 예치금</span>
            </div>
            <p className="text-lg font-black tracking-tight">₩ 45,000</p>
          </div>
          <div className="flex-1 bg-white border border-red-100 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-red-400 mb-1">
              <span className="text-[10px] font-bold">누적 벌금 차감</span>
            </div>
            <p className="text-lg font-black tracking-tight text-red-500">- ₩ 5,000</p>
          </div>
        </div>

        <button className="w-full h-9 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-colors">
          이번 주 미션 인증하기
        </button>

      </CardContent>
    </Card>
  );
}
