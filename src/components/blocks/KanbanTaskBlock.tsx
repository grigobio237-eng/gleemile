'use client';

import React, { useState, useEffect } from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface BlockProps {
  unreadCount?: number;
  role: string;
  teamId?: string;
}

export function KanbanTaskBlock({ role, teamId , unreadCount}: BlockProps) {
  const [todoCount, setTodoCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    const tasksRef = collection(db, `teams/${teamId}/kanban_tasks`);
    // 최근 7일(주간) 기준 데이터만 썸네일에 요약 표시
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const q = query(tasksRef, where('createdAt', '>=', cutoffTime));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let todo = 0;
      let inProgress = 0;
      let done = 0;
      let urgent = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'todo') todo++;
        if (data.status === 'in_progress') inProgress++;
        if (data.status === 'done') done++;

        let isUrgent = data.urgent;
        if (!isUrgent && data.endDate && data.status !== 'done') {
          // 종료일이 설정되어 있고 완료되지 않은 업무의 경우 기한 임박(2일 이내) 여부 체크
          const endDate = new Date(data.endDate);
          // 날짜 비교를 위해 시간은 자정으로 맞춤
          endDate.setHours(23, 59, 59, 999);
          const diffDays = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          if (diffDays <= 2) {
            isUrgent = true;
          }
        }
        if (isUrgent) urgent++;
      });
      
      setTodoCount(todo);
      setInProgressCount(inProgress);
      setDoneCount(done);
      setUrgentCount(urgent);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  return (
    <Link href={`/mile/${teamId}/kanban`} className="block w-full group relative">
      <NotificationBadge count={unreadCount} />
      <Card className="rounded-2xl border-none shadow-lg group-hover:shadow-xl transition-all cursor-pointer bg-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-indigo-500" />
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
              <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-black text-base text-obsidian mb-0.5">업무현황</p>
              
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> 데이터 집계 중...
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    할 일 <span className="text-slate-900 bg-white px-1.5 rounded border border-slate-200">{todoCount}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    진행 중 <span className="text-indigo-900 bg-white px-1.5 rounded border border-indigo-100">{inProgressCount}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    완료 <span className="text-emerald-900 bg-white px-1.5 rounded border border-emerald-100">{doneCount}</span>
                  </span>
                  {urgentCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      긴급 <span className="text-red-900 bg-white px-1.5 rounded border border-red-100">{urgentCount}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0 mr-2">
            <ArrowRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
