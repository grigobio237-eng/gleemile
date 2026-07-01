'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Activity } from 'lucide-react';

interface Props {
  teamId: string;
  userId: string;
}

export function WellnessHistoryChart({ teamId, userId }: Props) {
  const [dataLimit, setDataLimit] = useState<number>(7);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [avgStrain, setAvgStrain] = useState(0);
  const [avgBurnout, setAvgBurnout] = useState(0);

  useEffect(() => {
    if (!teamId || !userId) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const memberDocPath = `team_members/${teamId}_${userId}`;
        const q = query(
          collection(db, memberDocPath, 'wellnessCheckData'),
          orderBy('date', 'desc'),
          limit(dataLimit)
        );
        
        const snapshot = await getDocs(q);
        
        // 시간순(오래된 순 -> 최신순)으로 정렬하기 위해 역순
        const historyData = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            date: d.date.substring(5), // YYYY-MM-DD -> MM-DD
            strain: d.mentalStrainIndex || 0,
            burnout: d.burnoutIndex || 0,
            originalDate: d.date
          };
        }).reverse();
        
        setData(historyData);

        // 누적 평균치 계산 (0인 데이터는 제외)
        let totalStrain = 0, strainCount = 0;
        let totalBurnout = 0, burnoutCount = 0;

        historyData.forEach(d => {
          if (d.strain > 0) { totalStrain += d.strain; strainCount++; }
          if (d.burnout > 0) { totalBurnout += d.burnout; burnoutCount++; }
        });

        setAvgStrain(strainCount > 0 ? Number((totalStrain / strainCount).toFixed(1)) : 0);
        setAvgBurnout(burnoutCount > 0 ? Number((totalBurnout / burnoutCount).toFixed(1)) : 0);

      } catch (e) {
        console.error("히스토리 차트 조회 실패:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [teamId, userId, dataLimit]);

  return (
    <Card className="rounded-2xl border-none shadow-md bg-white overflow-hidden mt-6 mb-8">
      <div className="bg-slate-50 px-5 py-4 border-b border-line flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-base font-black text-obsidian">나의 컨디션 추이</CardTitle>
        </div>
        
        {/* 날짜 선택 필터 */}
        <div className="flex bg-white p-1 rounded-xl border border-line shadow-sm">
          {[
            { label: '최근 7회', value: 7 },
            { label: '최근 30회', value: 30 },
            { label: '최근 1년', value: 365 },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setDataLimit(tab.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dataLimit === tab.value
                  ? 'bg-obsidian text-white shadow'
                  : 'text-slate-500 hover:text-obsidian hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="p-5">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs font-bold text-slate">데이터를 분석 중입니다...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm font-bold text-slate">아직 기록된 컨디션 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 누적 평균 스코어보드 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100/50">
                <p className="text-[11px] font-bold text-emerald-700 mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> 평균 몰입/활력 지수
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-obsidian">{avgBurnout}</span>
                  <span className="text-xs font-bold text-slate-400 mb-1">/ 5</span>
                </div>
                <p className="text-[10px] text-emerald-600/80 mt-1 font-medium">높을수록 번아웃 예방 (긍정)</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-100/50">
                <p className="text-[11px] font-bold text-rose-700 mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> 평균 정신적 피로도
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-obsidian">{avgStrain}</span>
                  <span className="text-xs font-bold text-slate-400 mb-1">/ 5</span>
                </div>
                <p className="text-[10px] text-rose-600/80 mt-1 font-medium">낮을수록 피로도 적음 (긍정)</p>
              </div>
            </div>

            {/* 라인 차트 */}
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]} 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ padding: '2px 0' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 'bold' }} 
                    iconType="circle"
                  />
                  <Line 
                    name="업무 몰입도 (높을수록 좋음)" 
                    type="monotone" 
                    dataKey="burnout" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }} 
                    activeDot={{ r: 5 }} 
                  />
                  <Line 
                    name="정신적 피로도 (낮을수록 좋음)" 
                    type="monotone" 
                    dataKey="strain" 
                    stroke="#F43F5E" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#F43F5E', strokeWidth: 0 }} 
                    activeDot={{ r: 5 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
