'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, TrendingUp, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';

function isManagerOrHigher(role: string) {
  return role === 'owner' || role === 'manager';
}

function RPEContent() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string;

  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('guest');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    if (status === 'authenticated' && teamId) {
      fetchData();
    }
  }, [status, teamId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!session?.user?.id) return;
      
      // 1. 권한 확인
      let fetchedRole = 'guest';
      const myMemberRef = doc(db, `teams/${teamId}/member_summaries/${session.user.id}`);
      const mySnap = await getDoc(myMemberRef);
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists() && teamSnap.data().ownerId === session.user.id) {
        fetchedRole = 'owner';
      } else if (mySnap.exists()) {
        fetchedRole = mySnap.data().role;
      }
      setUserRole(fetchedRole);

      // 2. RPE 로그 가져오기
      let q;
      if (isManagerOrHigher(fetchedRole)) {
        // 관리자는 전체 최근 로그 (최대 100개)
        q = query(
          collection(db, `teams/${teamId}/rpe_logs`),
          orderBy('createdAt', 'desc')
        );
      } else {
        // 일반 유저는 본인 것만
        q = query(
          collection(db, `teams/${teamId}/rpe_logs`),
          where('userId', '==', session.user.id),
          // orderBy('createdAt', 'desc') // Need composite index, so just sort in memory
        );
      }
      
      const snap = await getDocs(q);
      const fetchedLogs: any[] = [];
      snap.forEach(d => {
        fetchedLogs.push({ id: d.id, ...d.data() });
      });

      // Memory sort for user view
      if (!isManagerOrHigher(fetchedRole)) {
        fetchedLogs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      }
      
      setLogs(fetchedLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = isManagerOrHigher(userRole);

  const renderAdminView = () => {
    if (logs.length === 0) {
      return (
        <div className="py-20 text-center flex flex-col items-center">
          <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold">아직 제출된 난이도 피드백이 없습니다.</p>
        </div>
      );
    }

    const totalScore = logs.reduce((acc, log) => acc + log.difficulty, 0);
    const avgScore = (totalScore / logs.length).toFixed(1);
    
    const counts = [0, 0, 0, 0, 0];
    logs.forEach(log => {
      if (log.difficulty >= 1 && log.difficulty <= 5) {
        counts[log.difficulty - 1]++;
      }
    });
    const maxCount = Math.max(...counts, 1);

    const labels = ['너무 쉬움', '쉬움', '적당함', '어려움', '매우 어려움'];

    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
          <div className="px-4 py-3 border-b border-line bg-gradient-to-r from-orange-50 to-white">
            <h3 className="font-black text-sm text-obsidian">최근 체감 난이도 통계</h3>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <span className="text-4xl font-black text-orange-500">{avgScore}</span>
              <span className="text-xs text-slate-500 font-bold mt-1">평균 체감 난이도 (총 {logs.length}건)</span>
            </div>

            <div className="space-y-3">
              {counts.map((count, idx) => {
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-16 text-[10px] font-bold text-slate-600 text-right">{labels[idx]}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-400 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-6 text-[10px] font-bold text-slate-500">{count}명</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <h3 className="font-black text-sm text-obsidian px-1 pt-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-500" />
          상세 피드백 코멘트
        </h3>
        
        <div className="space-y-3">
          {logs.filter(log => log.feedback).map(log => (
            <Card key={log.id} className="rounded-xl border border-slate-100 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400">{log.date}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    log.difficulty >= 4 ? 'bg-red-100 text-red-600' :
                    log.difficulty === 1 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {labels[log.difficulty - 1]}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-700 leading-relaxed">
                  "{log.feedback}"
                </p>
              </CardContent>
            </Card>
          ))}
          {logs.filter(log => log.feedback).length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">작성된 코멘트가 없습니다.</p>
          )}
        </div>
      </div>
    );
  };

  const renderMemberView = () => {
    if (logs.length === 0) {
      return (
        <div className="py-20 text-center flex flex-col items-center">
          <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold">제출하신 피드백 이력이 없습니다.</p>
        </div>
      );
    }
    const labels = ['너무 쉬움', '쉬움', '적당함', '어려움', '매우 어려움'];

    return (
      <div className="space-y-3">
        {logs.map(log => (
          <Card key={log.id} className="rounded-xl border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500">{log.date}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  log.difficulty >= 4 ? 'bg-orange-100 text-orange-600' :
                  log.difficulty === 1 ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {labels[log.difficulty - 1]}
                </span>
              </div>
              {log.feedback && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs font-medium text-slate-600">"{log.feedback}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 pb-24 font-sans selection:bg-orange-200">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        <div>
          <Link href={`/mile/${teamId}/dashboard`} className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1">
            <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
          </Link>
          <h1 className="text-2xl font-black text-obsidian flex items-center gap-2 mt-2">
            <TrendingUp className="w-6 h-6 text-orange-500" /> 
            {isAdmin ? '팀 전체 난이도 분석' : '나의 피드백 기록'}
          </h1>
          <p className="text-sm text-slate mt-1">
            {isAdmin ? '우리 팀의 체감 난이도 제출 현황입니다.' : '내가 제출한 오늘 모임 어땠나요 기록입니다.'}
          </p>
        </div>

        {isAdmin ? renderAdminView() : renderMemberView()}
      </div>
    </div>
  );
}

export default function RPEPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6]" />}>
      <RPEContent />
    </Suspense>
  );
}
