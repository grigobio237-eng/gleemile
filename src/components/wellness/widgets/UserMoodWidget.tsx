'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Smile, Clock } from 'lucide-react';
import { UserMoodBlock } from '@/types/wellness';

interface Props {
  block: UserMoodBlock;
}

export function UserMoodWidget({ block }: Props) {
  // moodScore에 따른 시각적 인디케이터 색상 및 퍼센테이지
  const getMoodColor = (score: number) => {
    switch(score) {
      case 5: return 'bg-emerald-500';
      case 4: return 'bg-teal-400';
      case 3: return 'bg-blue-400';
      case 2: return 'bg-orange-400';
      case 1: return 'bg-rose-500';
      default: return 'bg-slate-300';
    }
  };
  
  const getMoodLabel = (score: number) => {
    switch(score) {
      case 5: return '최상';
      case 4: return '좋음';
      case 3: return '보통';
      case 2: return '나쁨';
      case 1: return '최악';
      default: return '알 수 없음';
    }
  };

  const scorePercentage = (block.moodScore / 5) * 100;

  return (
    <Card className="rounded-xl border border-line shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${getMoodColor(block.moodScore)} bg-opacity-20`}>
              <Smile className={`w-4 h-4 ${getMoodColor(block.moodScore).replace('bg-', 'text-')}`} />
            </div>
            <div>
              <p className="text-sm font-black text-obsidian tracking-tight">무드 스코어</p>
              <p className="text-[10px] font-bold text-slate-400">{getMoodLabel(block.moodScore)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-bold tracking-tight">{block.timeOfDay}</span>
          </div>
        </div>

        {/* 미니멀 인디케이터 바 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
            <span>Low</span>
            <span className="text-obsidian">{block.moodScore} / 5</span>
            <span>High</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${getMoodColor(block.moodScore)}`}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
