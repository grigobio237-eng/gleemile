'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { WellnessBlock, wellnessBlockConverter } from '@/types/wellness';
import { WellnessWidgetFactory } from '@/components/wellness/WellnessWidgetFactory';
import { WellnessHistoryChart } from '@/components/wellness/widgets/WellnessHistoryChart';

export default function MyConditionPage() {
  const { data: session } = useSession();
  const [blocks, setBlocks] = useState<WellnessBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const params = useParams();
  const teamId = params?.teamId as string || 'default-team';

  useEffect(() => {
    if (!session?.user) return;
    
    const userId = session.user.id;
    const memberDocPath = `team_members/${teamId}_${userId}`;
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    const wellnessRef = doc(db, memberDocPath, 'wellnessCheckData', todayStr).withConverter(wellnessBlockConverter);
    const sleepRef = doc(db, memberDocPath, 'sleepData', todayStr).withConverter(wellnessBlockConverter);
    const moodQuery = query(
      collection(db, memberDocPath, 'moodLogs').withConverter(wellnessBlockConverter),
      where('date', '==', todayStr)
    );

    let activeBlocks: WellnessBlock[] = [];
    
    const updateBlocks = (newBlock: WellnessBlock | null, type: string) => {
      activeBlocks = activeBlocks.filter(b => b.type !== type);
      if (newBlock) activeBlocks.push(newBlock);
      setBlocks([...activeBlocks]);
      setLoading(false);
    };

    const unsubWellness = onSnapshot(wellnessRef, (docSnap) => {
      if (docSnap.exists()) updateBlocks(docSnap.data(), 'WELLNESS_CHECK');
      else { updateBlocks(null, 'WELLNESS_CHECK'); setLoading(false); }
    }, (error) => { console.error(error); setLoading(false); });

    const unsubSleep = onSnapshot(sleepRef, (docSnap) => {
      if (docSnap.exists()) updateBlocks(docSnap.data(), 'SLEEP_LOG');
      else { updateBlocks(null, 'SLEEP_LOG'); setLoading(false); }
    }, (error) => { console.error(error); setLoading(false); });

    const unsubMood = onSnapshot(moodQuery, (snap) => {
      if (!snap.empty) updateBlocks(snap.docs[0].data(), 'USER_MOOD');
      else { updateBlocks(null, 'USER_MOOD'); setLoading(false); }
    }, (error) => { console.error(error); setLoading(false); });

    return () => {
      unsubWellness();
      unsubSleep();
      unsubMood();
    };
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse"></div>
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 font-sans">
        <Card className="max-w-md w-full rounded-[32px] border-none shadow-2xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="text-4xl">📊</div>
            <h1 className="text-2xl font-black text-obsidian">오늘의 웰니스 리포트가 아직 비어있습니다.</h1>
            <p className="text-slate">지금 컨디션을 기록하고 맞춤 케어를 시작하세요.</p>
            <Button asChild className="w-full h-12 rounded-2xl font-black bg-green-600 hover:bg-green-700">
              <Link href={`/mile/${teamId}/wellness`}>컨디션 기록하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 pb-24 font-sans selection:bg-emerald-200">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        <div>
          <Link href={`/mile/${teamId}/dashboard`} className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1 font-bold">
            <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
          </Link>
        </div>

        {/* 헤더 */}
        <div className="text-center space-y-2">
          <Badge className="bg-green-100 text-green-700 border-none font-bold text-xs px-4 py-1">MY CONDITION</Badge>
          <h1 className="text-3xl font-black text-obsidian">나의 컨디션</h1>
          <p className="text-slate text-sm">오늘의 상태 브리핑</p>
        </div>

        {/* Wellness Blocks 바인딩 */}
        <div className="space-y-4">
          {blocks.map(block => (
            <WellnessWidgetFactory key={block.id || block.type} block={block} />
          ))}
        </div>

        {/* 히스토리 차트 */}
        {session?.user?.id && (
          <WellnessHistoryChart teamId={teamId} userId={session.user.id} />
        )}
      </div>
    </div>
  );
}
