'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, HeartPulse, ShieldAlert } from 'lucide-react';
import { WellnessCheckBlock } from '@/types/wellness';

interface Props {
  block: WellnessCheckBlock;
}

export function WellnessCheckWidget({ block }: Props) {
  // 안전한 날짜 파싱 방어 로직 (Timestamp 객체 처리)
  const renderDate = () => {
    if (!block.createdAt) return '';
    if (typeof (block.createdAt as any).toDate === 'function') {
      return (block.createdAt as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return ''; // FieldValue인 경우 임시 숨김 처리 (낙관적 UI 렌더링 시)
  };

  return (
    <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-all overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-teal-50 to-white px-5 py-3 border-b border-line flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-black text-obsidian leading-tight tracking-tight">일간 웰니스 점검</CardTitle>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{block.date}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-400">{renderDate()}</span>
      </div>
      
      <CardContent className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-500 mb-1">정신적 인지 부하</span>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-obsidian tracking-tighter">{block.dailyCognitiveLoad}</span>
              <span className="text-xs font-bold text-slate-400 mb-1">/ 15</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-500 mb-1">주관적 피로도</span>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-obsidian tracking-tighter">{block.fatigue}</span>
              <span className="text-xs font-bold text-slate-400 mb-1">/ 5</span>
            </div>
          </div>
        </div>

        {block.injuryNote && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-red-700 uppercase mb-0.5">부상/특이사항 메모</p>
              <p className="text-xs font-medium text-red-600/80 leading-relaxed">{block.injuryNote}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
