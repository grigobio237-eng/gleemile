import React, { useState, useEffect } from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

interface BlockProps {
  unreadCount?: number;
  role: string;
  teamId?: string;
  userId?: string;
}

export function SessionDifficultyBlock({ role, teamId, userId , unreadCount}: BlockProps) {
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [needsGemini, setNeedsGemini] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    const checkSubmission = async () => {
      if (!teamId || !userId) return;
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, `teams/${teamId}/rpe_logs`),
        where('userId', '==', userId),
        where('date', '==', today)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setAlreadySubmitted(true);
      }
    };
    checkSubmission();
  }, [teamId, userId]);

  const handleDifficultySelect = (val: number) => {
    setDifficulty(val);
    if (val === 1 || val >= 4) {
      setNeedsGemini(true);
    } else {
      setNeedsGemini(false);
    }
  };

  const handleSubmit = async () => {
    if (!teamId || !userId || !difficulty) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, `teams/${teamId}/rpe_logs`), {
        userId,
        date: today,
        difficulty,
        feedback: needsGemini ? feedback : '',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert('제출에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (alreadySubmitted || submitted) {
    return (
      <Card className="rounded-2xl border border-stone-200 bg-stone-50 relative">
      <NotificationBadge count={unreadCount} />
        <Link href={teamId ? `/mile/${teamId}/rpe` : '#'}>
          <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-stone-100 to-white hover:bg-stone-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-black text-sm text-obsidian leading-tight">오늘 모임 어땠나요?</p>
                <p className="text-[10px] font-bold text-slate-500">당일 체감 난이도 수렴기</p>
              </div>
            </div>
          </div>
        </Link>
        <CardContent className="p-6 text-center">
          <h4 className="font-black text-stone-700">오늘의 피드백을 제출 완료했습니다!</h4>
          <p className="text-xs text-stone-500 mt-1">다음 일정 난이도 조율에 반영할게요.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white relative">
      <NotificationBadge count={unreadCount} />
      <Link href={teamId ? `/mile/${teamId}/rpe` : '#'}>
        <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-stone-100 to-white hover:bg-stone-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-obsidian leading-tight">오늘 모임 어땠나요?</p>
              <p className="text-[10px] font-bold text-slate-500">당일 체감 난이도 수렴기</p>
            </div>
          </div>
        </div>
      </Link>
      <CardContent className="p-4 space-y-4">
        
        <div className="space-y-3 mt-2">
          <p className="text-xs font-bold text-center text-obsidian">오늘 모임의 난이도는 어땠나요?</p>
          <div className="flex justify-between gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            {['너무 쉬움', '쉬움', '적당함', '어려움', '매우 어려움'].map((label, idx) => {
              const val = idx + 1;
              return (
                <button
                  key={val}
                  onClick={() => handleDifficultySelect(val)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                    difficulty === val 
                      ? 'bg-orange-500 text-white shadow-md' 
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
                ? "난이도가 조금 높게 느껴지셨군요! 진도가 빠르거나 벅찼나요? 구체적인 피드백을 남겨주시면 조율에 도움이 됩니다." 
                : "너무 쉬우셨군요! 심화 자료나 더 빠른 진도를 원하시나요?"}
            </p>
            <div className="relative">
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="자유롭게 피드백을 남겨주세요."
                className="w-full h-16 bg-white border border-indigo-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <MessageSquare className="absolute right-2 bottom-2 w-3.5 h-3.5 text-indigo-300" />
            </div>
          </div>
        )}

        <Button 
          onClick={handleSubmit}
          disabled={!difficulty || loading}
          className="w-full h-10 bg-obsidian hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          제출하기
        </Button>

      </CardContent>
    </Card>
  );
}
