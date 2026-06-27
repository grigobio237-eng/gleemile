'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Moon, Clock, Sparkles } from 'lucide-react';
import { SleepLogBlock } from '@/types/wellness';

interface Props {
  block: SleepLogBlock;
}

export function SleepLogWidget({ block }: Props) {
  // duration(분)을 시간/분으로 변환
  const hours = Math.floor(block.duration / 60);
  const minutes = block.duration % 60;

  return (
    <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-all overflow-hidden bg-obsidian text-white">
      <div className="bg-white/5 px-5 py-3 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <CardTitle className="text-sm font-black text-indigo-100 leading-tight tracking-tight">수면 로그</CardTitle>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{block.date}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-500">효율</p>
          <p className="text-sm font-black text-emerald-400">{block.efficiency}%</p>
        </div>
      </div>
      
      <CardContent className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 총 수면 시간
            </p>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-white tracking-tighter">{hours}</span>
              <span className="text-xs font-bold text-slate-400 mb-1.5 mr-1">h</span>
              <span className="text-3xl font-black text-white tracking-tighter">{minutes}</span>
              <span className="text-xs font-bold text-slate-400 mb-1.5">m</span>
            </div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 mb-1">취침 ~ 기상</p>
            <p className="text-sm font-black text-indigo-200">{block.bedTime} - {block.wakeTime}</p>
          </div>
        </div>

        {block.aiAnalysis && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-indigo-200/90 leading-relaxed">
              {block.aiAnalysis}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
