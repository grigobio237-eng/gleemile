'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ActivitySquare, AlertOctagon, TrendingDown, Send, TrendingUp, Minus, ArrowLeft, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Firebase 문서의 유저 정보(session)를 가져오기 위한 임시 훅
// 실제 환경에서는 next-auth 등의 useSession을 사용하거나 props/context로 주입받아야 합니다.
// 데모 목적을 위해 현재는 로컬 스토리지 또는 임시 아이디를 사용하도록 설정합니다.
// TODO: 상위 레이아웃에서 주입된 실제 로그인 유저 ID 사용

export default function ACWRPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;
  const userId = session?.user?.id || 'test_user'; 

  const [acwrData, setAcwrData] = useState<{
    acwrRatio?: number;
    injuryRiskZone?: 'Safe' | 'Watch' | 'Danger';
    loadHistory?: { date: number, load: number }[];
  } | null>(null);

  const [rpe, setRpe] = useState(5);
  const [duration, setDuration] = useState(60);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId || !userId) return;

    const memberRef = doc(db, 'team_members', `${teamId}_${userId}`);
    const unsubscribe = onSnapshot(memberRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.acwrData) {
          setAcwrData(data.acwrData);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId, userId]);

  const currentACWR = acwrData?.acwrRatio ? Number(acwrData.acwrRatio.toFixed(2)) : 0;
  const isDanger = acwrData?.injuryRiskZone === 'Danger';
  const isSafe = acwrData?.injuryRiskZone === 'Safe';
  const history = acwrData?.loadHistory || [];

  const handleSaveDailyLoad = async () => {
    setIsUpdating(true);
    try {
      const dailyLoad = rpe * duration;
      
      // 세션 기반(입력 횟수 기반) 히스토리 구성
      const newHistory = [...history, { date: Date.now(), load: dailyLoad }];
      
      // 급성 부하(Acute): 최근 최대 2번의 세션 평균
      const acuteSessions = newHistory.slice(-2);
      const acuteLoad = acuteSessions.length > 0 
        ? acuteSessions.reduce((sum, h) => sum + h.load, 0) / acuteSessions.length 
        : 0;

      // 만성 부하(Chronic): 최근 최대 6번의 세션 평균 (주 1회 기준 약 한 달 반)
      const chronicSessions = newHistory.slice(-6);
      const chronicLoad = chronicSessions.length > 0
        ? chronicSessions.reduce((sum, h) => sum + h.load, 0) / chronicSessions.length
        : 0;

      const newRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
      
      let newZone: 'Safe' | 'Watch' | 'Danger' = 'Watch';
      if (newRatio >= 0.8 && newRatio <= 1.3) newZone = 'Safe';
      if (newRatio > 1.5 || newRatio < 0.5) newZone = 'Danger';

      const memberRef = doc(db, 'team_members', `${teamId}_${userId}`);
      await setDoc(memberRef, {
        acwrData: {
          acwrRatio: newRatio,
          injuryRiskZone: newZone,
          loadHistory: newHistory
        }
      }, { merge: true });
      toast.success('오늘의 운동 부하가 누적되었습니다.');
      
      // 입력 폼 초기화
      setRpe(5);
      setDuration(60);
    } catch (error) {
      console.error(error);
      toast.error('업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* 헤더 */}
      <div className="bg-white border-b border-line sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <button 
            onClick={() => router.push(`/mile/${teamId}/dashboard`)}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-lg text-obsidian flex items-center gap-2">
              <ActivitySquare className="w-5 h-5 text-red-600" />
              부상 위험도 모니터링
            </h1>
            <p className="text-xs font-bold text-slate-400">부상 방지 및 훈련 부하량 관리 (개인 프라이버시)</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* ACWR Widget */}
        <div className={`p-6 rounded-2xl shadow-sm border ${isDanger ? 'bg-red-50 border-red-200' : isSafe ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <span className={`text-sm font-black ${isDanger ? 'text-red-700' : isSafe ? 'text-green-700' : 'text-orange-700'}`}>나의 훈련 부하량 및 부상 위험도</span>
              <span className="text-xs font-bold opacity-70">과거 세션 대비 최근 부하 비율</span>
            </div>
            {isDanger && (
              <div className="flex items-center gap-1 text-red-600 animate-pulse bg-red-100 px-3 py-1.5 rounded-full">
                <AlertOctagon className="w-4 h-4" />
                <span className="text-xs font-black">부상 위험 구간! 휴식 권장</span>
              </div>
            )}
            {isSafe && (
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1.5 rounded-full">
                <span className="text-xs font-black">아주 좋은 컨디션! (안전 구간)</span>
              </div>
            )}
            {!isDanger && !isSafe && (
              <div className="flex items-center gap-1 text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full">
                <span className="text-xs font-black">모니터링 필요</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              <h3 className={`text-6xl font-black tracking-tighter ${isDanger ? 'text-red-600' : isSafe ? 'text-green-600' : 'text-orange-600'}`}>
                {currentACWR > 0 ? currentACWR : 'N/A'}
              </h3>
              {currentACWR > 0 && (
                <div className={`flex items-center text-sm font-bold pb-2 ${isDanger ? 'text-red-500' : isSafe ? 'text-green-500' : 'text-orange-500'}`}>
                  {isDanger ? <TrendingUp className="w-4 h-4 mr-1" /> : isSafe ? <Minus className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />} 
                  {isDanger ? '체력 한계치 돌파' : isSafe ? '안정적인 부하' : '조금씩 끌어올리세요'}
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 max-w-[200px] text-right">
              {history.length}번의 운동 세션을 바탕으로 분석된 데이터입니다.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Send className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-obsidian">오늘의 훈련 기록하기</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-obsidian">주관적 운동 강도 (RPE)</label>
                <span className="text-sm font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg">Lv. {rpe}</span>
              </div>
              <p className="text-xs font-medium text-slate-400">1: 아주 편안함 ~ 10: 한계치에 다다름</p>
              <input type="range" min="1" max="10" value={rpe} onChange={e=>setRpe(Number(e.target.value))} className="w-full accent-red-500" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-obsidian">총 훈련 시간</label>
                <span className="text-sm font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg">{duration} 분</span>
              </div>
              <p className="text-xs font-medium text-slate-400">순수하게 운동에 참여한 시간을 분 단위로 입력하세요.</p>
              <input type="range" min="0" max="180" step="10" value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-full accent-red-500" />
            </div>

            <Button 
              onClick={handleSaveDailyLoad}
              disabled={!rpe || !duration || isUpdating}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl"
            >
              {isUpdating ? '분석 중...' : '기록 저장 및 지수 업데이트'}
            </Button>
          </div>
        </div>

        {/* History Chart & List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 border-b border-line pb-4 mb-6">
            <History className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-black text-obsidian">최근 훈련 기록 트렌드</h2>
          </div>
          
          {history.length === 0 ? (
            <p className="text-center text-sm font-bold text-slate-400 py-10">아직 기록된 훈련 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-8">
              {/* Chart Area */}
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.map(h => ({ name: `${new Date(h.date).getMonth()+1}/${new Date(h.date).getDate()}`, load: h.load }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={40} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                      itemStyle={{ fontSize: '14px', fontWeight: '900', color: '#4f46e5' }}
                    />
                    <Line type="monotone" dataKey="load" name="부하량" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* List Area */}
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                {[...history].reverse().map((h, i) => {
                  const dateObj = new Date(h.date);
                  const dateStr = `${dateObj.getMonth()+1}월 ${dateObj.getDate()}일`;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-sm font-bold text-slate-600">{dateStr}</span>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">부하량: {h.load}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
