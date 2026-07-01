'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Send, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PulsePage() {
  const { data: session } = useSession();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!session?.user?.id || !teamId) {
      alert('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    try {
      const average = (q1 + q2 + q3) / 3;
      
      await addDoc(collection(db, 'teams', teamId, 'pulses'), {
        userId: session.user.id,
        scores: { q1, q2, q3 },
        average,
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (error) {
      console.error('펄스 제출 오류:', error);
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 pb-24 font-sans">
      <div className="max-w-md mx-auto space-y-6 pt-4 md:pt-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href=".." className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-800">주간 펄스 체크</h1>
            <p className="text-xs font-bold text-slate-400">이번 주 나의 업무 컨디션은?</p>
          </div>
        </div>

        {submitted ? (
          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white mt-10">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-black text-lg text-slate-800 mb-2">이번 주 펄스 제출 완료!</h4>
              <p className="text-sm font-medium text-slate-500">
                솔직한 답변 감사합니다.<br/>팀의 건강한 문화를 만드는데 큰 도움이 됩니다.
              </p>
              <Link href="..">
                <button className="w-full h-12 mt-8 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
                  대시보드로 돌아가기
                </button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
            <div className="p-5 border-b border-slate-100 bg-slate-800 text-white flex items-center gap-3">
              <Activity className="w-5 h-5 text-white/80" />
              <div>
                <p className="font-black text-sm">UWES-3 번아웃 자가진단</p>
                <p className="text-[10px] text-white/60">모든 답변은 익명으로 통계에만 반영됩니다.</p>
              </div>
            </div>
            
            <CardContent className="p-5 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 leading-tight block">1. 일할 때 에너지가 넘치고 활력이 돕니까? <span className="text-xs text-slate-400 font-normal">(활력)</span></label>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400">전혀</span>
                  <input type="range" min="1" max="5" value={q1} onChange={(e) => setQ1(Number(e.target.value))} className="w-2/3 accent-slate-800" />
                  <span className="text-xs font-bold text-slate-800">항상</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 leading-tight block">2. 내 일에 강한 열정과 자부심을 느끼나요? <span className="text-xs text-slate-400 font-normal">(헌신)</span></label>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400">전혀</span>
                  <input type="range" min="1" max="5" value={q2} onChange={(e) => setQ2(Number(e.target.value))} className="w-2/3 accent-slate-800" />
                  <span className="text-xs font-bold text-slate-800">항상</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 leading-tight block">3. 일에 푹 빠져서 시간 가는 줄 모를 때가 있나요? <span className="text-xs text-slate-400 font-normal">(몰입)</span></label>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400">전혀</span>
                  <input type="range" min="1" max="5" value={q3} onChange={(e) => setQ3(Number(e.target.value))} className="w-2/3 accent-slate-800" />
                  <span className="text-xs font-bold text-slate-800">항상</span>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!q1 || !q2 || !q3 || loading}
                className="w-full h-12 mt-4 bg-slate-800 text-white font-bold text-sm rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-slate-300"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> 결과 제출하기</>}
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
