'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { BatteryCharging, Quote, Camera } from 'lucide-react';
import { RecoveryScoreBlock } from '@/types/wellness';

interface Props {
  block: RecoveryScoreBlock;
}

export function RecoveryScoreWidget({ block }: Props) {
  // answers Map 객체를 배열로 변환하여 렌더링
  const answerList = Object.entries(block.answers).map(([key, value]) => ({
    id: key,
    ...value
  }));

  return (
    <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-all overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-emerald-50 to-white px-5 py-3 border-b border-line flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
            <BatteryCharging className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-black text-obsidian leading-tight tracking-tight">회복 및 컨디션</CardTitle>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{block.date}</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-5">
        <div className="flex items-center gap-6 mb-5">
          <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 border-emerald-100 bg-white shadow-sm">
            <span className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">{block.totalScore}</span>
            <span className="text-[10px] font-bold text-slate-400 mt-1">SCORE</span>
          </div>
          <div className="flex-1">
            <Quote className="w-4 h-4 text-emerald-300 mb-1" />
            <h3 className="text-lg font-black text-obsidian leading-snug tracking-tight">
              "{block.metaphor}"
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          {answerList.map((item, index) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
              <span className="text-xs font-bold text-slate-600 capitalize">
                {index + 1}. {item.category}
              </span>
              <div className="flex items-center gap-3">
                {item.detail && <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{item.detail}</span>}
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {item.score} 점
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 미디어 첨부 내역 표시 */}
        {block.snapData && (
          <div className="mt-4 bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">첨부된 {block.snapData.type === 'PHOTO' ? '사진' : '메모'}</span>
            </div>
            {block.snapData.type === 'PHOTO' ? (
              <span className="text-[10px] font-bold text-indigo-500 cursor-pointer hover:underline">보기</span>
            ) : (
              <span className="text-xs text-slate-500 truncate max-w-[120px]">{block.snapData.content}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
