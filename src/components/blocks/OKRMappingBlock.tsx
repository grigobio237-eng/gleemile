import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface BlockProps {
  role: string;
  title?: string;
}

export function OKRMappingBlock({ role, title }: BlockProps) {
  const [progress1, setProgress1] = useState([65]);
  const [progress2, setProgress2] = useState([30]);

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2 bg-gradient-to-r from-rose-50 to-white">
        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-black text-sm text-obsidian leading-tight">Q3 제품 런칭 OKR</p>
          <p className="text-[10px] font-bold text-rose-500">전사 목표 정렬도: 85%</p>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        {/* Objective */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
          <div className="absolute -left-1.5 top-5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
          <div className="ml-3">
            <h4 className="text-xs font-black text-rose-600 mb-1">OBJECTIVE (목표)</h4>
            <p className="text-sm font-bold text-obsidian">성공적인 MVP 베타 런칭 및 초기 유저 1만명 확보</p>
          </div>
        </div>

        <div className="pl-6 border-l-2 border-slate-100 ml-1 space-y-5">
          {/* KR 1 */}
          <div className="relative">
            <div className="absolute -left-[29px] top-2 w-4 h-4 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Key Result 1</span>
                <p className="text-xs font-bold text-obsidian">베타 대기 명단 10,000명 모집</p>
              </div>
              <span className="text-xs font-black text-rose-600">{progress1[0]}%</span>
            </div>
            <Slider 
              value={progress1} 
              onValueChange={setProgress1} 
              max={100} 
              step={1} 
              className="[&>[role=slider]]:bg-rose-500 [&>[role=slider]]:border-rose-500"
            />
          </div>

          {/* KR 2 */}
          <div className="relative">
            <div className="absolute -left-[29px] top-2 w-4 h-4 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Key Result 2</span>
                <p className="text-xs font-bold text-obsidian">코어 기능 개발 및 QA 완료</p>
              </div>
              <span className="text-xs font-black text-blue-600">{progress2[0]}%</span>
            </div>
            <Slider 
              value={progress2} 
              onValueChange={setProgress2} 
              max={100} 
              step={1} 
              className="[&>[role=slider]]:bg-blue-500 [&>[role=slider]]:border-blue-500"
            />
          </div>
        </div>

        <button className="w-full h-10 mt-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1">
          <CheckCircle2 className="w-4 h-4" /> 내 진척도 업데이트 반영
        </button>
      </CardContent>
    </Card>
  );
}
