import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Smile, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockProps {
  role: string;
}

export function StudySatisfactionBlock({ role }: BlockProps) {
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="rounded-2xl border-none bg-gradient-to-br from-amber-400 to-orange-500 text-white">
        <CardContent className="p-6 text-center space-y-2">
          <Smile className="w-8 h-8 mx-auto opacity-80" />
          <h4 className="font-black text-lg">피드백 감사합니다!</h4>
          <p className="text-xs font-medium opacity-90">제출해주신 내용은 익명으로 취합되어<br/>더 나은 스터디를 위해 쓰입니다.</p>
        </CardContent>
      </Card>
    );
  }

  const ScoreButtons = ({ value, onChange }: { value: number | null, onChange: (v: number) => void }) => (
    <div className="flex justify-between gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          onClick={() => onChange(score)}
          className={`flex-1 h-8 rounded-md text-xs font-bold border transition-all ${
            value === score ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
          }`}
        >
          {score}
        </button>
      ))}
    </div>
  );

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2 bg-gradient-to-r from-amber-50 to-white">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
          <Smile className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-black text-sm text-obsidian leading-tight">스터디 만족도 체크</p>
          <p className="text-[10px] font-bold text-slate-500">세션 종료 직후 15초 리뷰</p>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-xs font-bold text-obsidian">Q1. 오늘 다룬 과제와 진도의 양이 적절했나요?</p>
          <div className="flex justify-between text-[8px] text-slate-400 mt-2 px-1">
            <span>너무 적음 (1)</span>
            <span>적절함 (3)</span>
            <span>너무 많음 (5)</span>
          </div>
          <ScoreButtons value={q1} onChange={setQ1} />
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-xs font-bold text-obsidian">Q2. 스터디원들의 전반적인 준비성은 어땠나요?</p>
          <div className="flex justify-between text-[8px] text-slate-400 mt-2 px-1">
            <span>미흡함 (1)</span>
            <span>보통 (3)</span>
            <span>완벽함 (5)</span>
          </div>
          <ScoreButtons value={q2} onChange={setQ2} />
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!q1 || !q2}
          className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl gap-2"
        >
          <Send className="w-4 h-4" /> 익명으로 제출하기
        </Button>
      </CardContent>
    </Card>
  );
}
