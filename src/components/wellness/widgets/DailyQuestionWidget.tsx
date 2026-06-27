'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { DailyQuestionBlock } from '@/types/wellness';

interface Props {
  block: DailyQuestionBlock;
}

export function DailyQuestionWidget({ block }: Props) {
  // Journey 타입에 따른 라벨 한글화
  const journeyLabel = 
    block.journey === 'WELLNESS' ? '웰니스 설문' :
    block.journey === 'CLINICAL_PRE' ? '시술 전 문진' : '시술 후 경과';

  return (
    <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-all overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-blue-50 to-white px-5 py-3 border-b border-line flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-black text-obsidian leading-tight tracking-tight">제출된 설문지</CardTitle>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{block.date}</p>
          </div>
        </div>
        <div className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight">
          {journeyLabel}
        </div>
      </div>
      
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-500 mb-0.5">참조 템플릿 ID</p>
            <p className="text-xs font-black text-slate-700 truncate max-w-[150px]">{block.templateId}</p>
          </div>
          {block.medicalCategory && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 mb-0.5">진료과</p>
              <p className="text-xs font-black text-slate-700">{block.medicalCategory}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-black text-obsidian mb-3 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-blue-500" /> 답변 요약 ({block.answers.length}개)
          </p>
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
            {block.answers.map((answer, index) => (
              <div key={index} className="flex justify-between items-center bg-white border border-line p-2.5 rounded-lg">
                <span className="text-xs font-bold text-slate-600">Q{answer.questionId}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                    {answer.selectedLabel}
                  </span>
                  <span className="text-[10px] font-black text-white bg-blue-400 px-1.5 py-0.5 rounded">
                    {answer.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
