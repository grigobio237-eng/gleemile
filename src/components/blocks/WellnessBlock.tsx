import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface WellnessBlockProps {
  role: string;
  hasCheckedIn?: boolean;
}

export function WellnessBlock({ role, hasCheckedIn = false }: WellnessBlockProps) {
  const isLeader = role === 'director';
  const isSupporter = role === 'supporter';
  
  if (isSupporter) return null; // 청강생은 웰니스 블록 불필요

  if (isLeader) {
    return (
      <Link href="/mile/dashboard" className="block w-full">
        <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-obsidian">주간 펄스 체크(번아웃)</p>
                <p className="text-xs text-slate">스쿼드 컨디션 오버뷰</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // 멤버용 렌더링
  return (
    <Link href="/mile/wellness" className="block w-full">
      <Card className={`rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer ${!hasCheckedIn ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${!hasCheckedIn ? 'bg-green-500' : 'bg-green-600/80'}`}>
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-obsidian">오늘의 펄스 체크인</p>
              <p className="text-xs text-slate">데일리 웰니스/번아웃 기록</p>
            </div>
          </div>
          {!hasCheckedIn && (
            <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-green-700">오늘의 컨디션을 아직 기록하지 않았어요!</span>
            </div>
          )}
          {hasCheckedIn && (
             <div className="mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> 
                <span className="text-xs font-bold text-green-700">오늘의 체크인 완료</span>
             </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
