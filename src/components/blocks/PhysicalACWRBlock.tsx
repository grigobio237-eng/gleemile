'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ActivitySquare, AlertOctagon, TrendingDown, Send, TrendingUp, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface BlockProps {
  teamId: string;
  userId: string;
  role: string;
  risk?: 'Safe' | 'Watch' | 'Danger'; // Legacy prop, currently ignored in favor of real DB data
}

export function PhysicalACWRBlock({ teamId, userId, role }: BlockProps) {
  const [acwrData, setAcwrData] = useState<{
    acuteLoad?: number;
    chronicLoad?: number;
    acwrRatio?: number;
    injuryRiskZone?: 'Safe' | 'Watch' | 'Danger';
  } | null>(null);

  const [rpe, setRpe] = useState(5);
  const [duration, setDuration] = useState(60);
  const [isUpdating, setIsUpdating] = useState(false);

  // 실시간 구독 (onSnapshot)
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
    });

    return () => unsubscribe();
  }, [teamId, userId]);

  const currentACWR = acwrData?.acwrRatio ? Number(acwrData.acwrRatio.toFixed(2)) : 0;
  const isDanger = acwrData?.injuryRiskZone === 'Danger';
  const isSafe = acwrData?.injuryRiskZone === 'Safe';

  const handleSaveDailyLoad = async () => {
    setIsUpdating(true);
    try {
      // 아주 간단한 ACWR 시뮬레이션 계산 로직 (실제로는 누적 로직 고도화 필요)
      const dailyLoad = rpe * duration; 
      const newAcute = (acwrData?.acuteLoad || 0) * 0.8 + dailyLoad * 0.2; // 지수 가중치
      const newChronic = (acwrData?.chronicLoad || 0) * 0.95 + dailyLoad * 0.05;
      
      const newRatio = newChronic > 0 ? newAcute / newChronic : 0;
      let newZone: 'Safe' | 'Watch' | 'Danger' = 'Watch';
      if (newRatio >= 0.8 && newRatio <= 1.3) newZone = 'Safe';
      if (newRatio > 1.5 || newRatio < 0.5) newZone = 'Danger';

      const memberRef = doc(db, 'team_members', `${teamId}_${userId}`);
      await updateDoc(memberRef, {
        acwrData: {
          acuteLoad: newAcute,
          chronicLoad: newChronic,
          acwrRatio: newRatio,
          injuryRiskZone: newZone
        }
      });
      toast.success('오늘의 운동 부하가 반영되었습니다.');
    } catch (error) {
      console.error(error);
      toast.error('업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <ActivitySquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">피지컬 ACWR 부상 통계</p>
            <p className="text-[10px] font-bold text-slate-500">개인 보안 데이터 (본인만 열람)</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        
        {/* ACWR Widget */}
        <div className={`p-3 rounded-xl border ${isDanger ? 'bg-red-50 border-red-200' : isSafe ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${isDanger ? 'text-red-700' : isSafe ? 'text-green-700' : 'text-orange-700'}`}>나의 현재 ACWR 지수</span>
            </div>
            {isDanger && (
              <div className="flex items-center gap-1 text-red-600 animate-pulse">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black">부상 위험 Zone</span>
              </div>
            )}
            {isSafe && (
              <div className="flex items-center gap-1 text-green-600">
                <span className="text-[10px] font-black">안전 Zone (0.8~1.3)</span>
              </div>
            )}
          </div>
          <div className="flex items-end gap-2">
            <h3 className={`text-3xl font-black tracking-tighter ${isDanger ? 'text-red-600' : isSafe ? 'text-green-600' : 'text-orange-600'}`}>
              {currentACWR > 0 ? currentACWR : 'N/A'}
            </h3>
            {currentACWR > 0 && (
              <div className={`flex items-center text-xs font-bold pb-1 ${isDanger ? 'text-red-500' : isSafe ? 'text-green-500' : 'text-orange-500'}`}>
                {isDanger ? <TrendingUp className="w-3 h-3 mr-0.5" /> : isSafe ? <Minus className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />} 
                {isDanger ? '부하 과중' : isSafe ? '안정 유지' : '모니터링 필요'}
              </div>
            )}
          </div>
        </div>

        {/* Daily Input Form */}
        {role !== 'supporter' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-obsidian border-t border-line pt-3">오늘의 운동 부하 기록</h4>
            
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl">
              <label className="text-[10px] font-bold text-slate-600 w-20 shrink-0">주관적 강도 (RPE)</label>
              <input type="range" min="1" max="10" value={rpe} onChange={e=>setRpe(Number(e.target.value))} className="flex-1 accent-red-500" />
              <span className="text-xs font-black text-red-600 w-4 text-center">{rpe}</span>
            </div>
            
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl">
              <label className="text-[10px] font-bold text-slate-600 w-20 shrink-0">운동 시간 (분)</label>
              <input type="range" min="0" max="180" step="10" value={duration} onChange={e=>setDuration(Number(e.target.value))} className="flex-1 accent-red-500" />
              <span className="text-xs font-black text-red-600 w-6 text-center">{duration}</span>
            </div>

            <Button 
              onClick={handleSaveDailyLoad}
              disabled={!rpe || !duration || isUpdating}
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              {isUpdating ? '저장 중...' : <><Send className="w-4 h-4" /> 기록 저장 및 지수 업데이트</>}
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
