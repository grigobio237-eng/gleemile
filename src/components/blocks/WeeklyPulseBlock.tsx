import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Send } from 'lucide-react';

interface BlockProps {
  role: string;
}

export function WeeklyPulseBlock({ role }: BlockProps) {
  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // 펄스 지표가 낮으면 백엔드 Dynamic Probing 호출 로직 연동 지점
    const average = (q1 + q2 + q3) / 3;
    console.log(`Pulse score: ${average}. Sending to backend...`);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="rounded-2xl border border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-black text-green-800">이번 주 펄스 제출 완료!</h4>
          <p className="text-xs text-green-600 mt-1">팀의 건강한 문화를 만드는데 큰 도움이 됩니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2 bg-gradient-to-r from-purple-50 to-white">
        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-black text-sm text-obsidian leading-tight">주간 펄스 체크 (UWES-3)</p>
          <p className="text-[10px] font-bold text-slate-500">직무 몰입 및 번아웃 측정</p>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-obsidian">1. 일할 때 에너지가 넘치고 활력이 돕니까? (활력)</label>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400">전혀</span>
            <input type="range" min="1" max="5" value={q1} onChange={(e) => setQ1(Number(e.target.value))} className="w-2/3 accent-purple-500" />
            <span className="text-[10px] text-purple-600 font-bold">항상</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-obsidian">2. 내 일에 강한 열정과 자부심을 느끼나요? (헌신)</label>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400">전혀</span>
            <input type="range" min="1" max="5" value={q2} onChange={(e) => setQ2(Number(e.target.value))} className="w-2/3 accent-purple-500" />
            <span className="text-[10px] text-purple-600 font-bold">항상</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-obsidian">3. 일에 푹 빠져서 시간 가는 줄 모를 때가 있나요? (몰입)</label>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400">전혀</span>
            <input type="range" min="1" max="5" value={q3} onChange={(e) => setQ3(Number(e.target.value))} className="w-2/3 accent-purple-500" />
            <span className="text-[10px] text-purple-600 font-bold">항상</span>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!q1 || !q2 || !q3}
          className="w-full h-10 mt-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-slate-400"
        >
          <Send className="w-4 h-4" /> 이번 주 결과 제출하기
        </button>
      </CardContent>
    </Card>
  );
}
