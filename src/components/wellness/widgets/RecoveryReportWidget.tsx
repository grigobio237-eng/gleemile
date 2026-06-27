'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { CalendarRange, Sparkles, Target, ArrowRight } from 'lucide-react';
import { RecoveryReportBlock } from '@/types/wellness';

interface Props {
  block: RecoveryReportBlock;
}

export function RecoveryReportWidget({ block }: Props) {
  return (
    <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-all overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-violet-50 to-white px-5 py-3 border-b border-line flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shrink-0 shadow-sm">
            <CalendarRange className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-black text-obsidian leading-tight tracking-tight">회복 애널리틱스 리포트</CardTitle>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{block.date}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400">분석 기간</p>
          <p className="text-[10px] font-black text-violet-600 tracking-tighter">
            {block.startDate} ~ {block.endDate}
          </p>
        </div>
      </div>
      
      <CardContent className="p-5">
        <div className="mb-6">
          <h3 className="text-xl font-black text-obsidian leading-snug tracking-tight mb-2">
            {block.summary}
          </h3>
          {block.insight && (
            <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                {block.insight}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-black text-obsidian mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-violet-500" /> 추천 액션 플랜
          </p>
          <div className="space-y-2">
            {block.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600 text-[10px] font-black shrink-0 mt-0.5 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  {index + 1}
                </div>
                <p className="text-xs font-bold text-slate-700 leading-relaxed flex-1">
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>

        {block.percentileFeedback && (
          <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400">소셜 프루프</p>
            <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
              {block.percentileFeedback} <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
