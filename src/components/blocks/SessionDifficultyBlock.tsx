import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockProps {
  role: string;
}

export function SessionDifficultyBlock({ role }: BlockProps) {
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [needsGemini, setNeedsGemini] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleDifficultySelect = (val: number) => {
    setDifficulty(val);
    // If difficulty is too hard (4, 5) or too easy (1), trigger Gemini probing
    if (val === 1 || val >= 4) {
      setNeedsGemini(true);
    } else {
      setNeedsGemini(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="rounded-2xl border border-stone-200 bg-stone-50">
        <CardContent className="p-6 text-center">
          <h4 className="font-black text-stone-700">의견이 제출되었습니다.</h4>
          <p className="text-xs text-stone-500 mt-1">다음 클래스 난이도 조율에 반영할게요!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-stone-100 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">세션 난이도 수렴기</p>
            <p className="text-[10px] font-bold text-slate-500">클래스 진행 속도 조율</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        
        <div className="space-y-3">
          <p className="text-xs font-bold text-center text-obsidian">오늘 클래스의 난이도는 어땠나요?</p>
          <div className="flex justify-between gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            {['너무 쉬움', '쉬움', '적당함', '어려움', '매우 어려움'].map((label, idx) => {
              const val = idx + 1;
              return (
                <button
                  key={val}
                  onClick={() => handleDifficultySelect(val)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                    difficulty === val 
                      ? 'bg-stone-500 text-white shadow-md' 
                      : 'bg-transparent text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gemini AI Intervention Frame */}
        {needsGemini && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-xl border border-indigo-100 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-1.5 text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black tracking-tight">Gemini AI Assistant</span>
            </div>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              {difficulty && difficulty >= 4 
                ? "난이도가 조금 높게 느껴지셨군요! 진도가 빠르거나, 실습 시간이 부족했나요? 자유롭게 남겨주세요." 
                : "너무 쉬우셨군요! 추가 심화 자료나 더 빠른 진도를 원하시나요?"}
            </p>
            <div className="relative">
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="예: 강사님 말이 너무 빨라서 따라가기 벅찼어요."
                className="w-full h-16 bg-white border border-indigo-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <MessageSquare className="absolute right-2 bottom-2 w-3.5 h-3.5 text-indigo-300" />
            </div>
          </div>
        )}

        <Button 
          onClick={handleSubmit}
          disabled={!difficulty}
          className="w-full h-10 bg-obsidian hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
        >
          제출하기
        </Button>

      </CardContent>
    </Card>
  );
}
