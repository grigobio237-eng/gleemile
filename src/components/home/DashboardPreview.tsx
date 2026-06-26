'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles, Zap, ArrowRight, Calendar, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DiagnosisForm from './DiagnosisForm';
import { useSession } from 'next-auth/react';
import FlowTimeline from './FlowTimeline';
import TodayRhythmCard from './TodayRhythmCard';
import HabitAlertBanner from './HabitAlertBanner';
import RecoveryNoteSection from '@/components/dashboard/RecoveryNoteSection';


interface DashboardPreviewProps {
  unifiedData: any;
  onOpenWebtoon: () => void;
  onRefresh?: () => void;
}

export default function DashboardPreview({ unifiedData, onOpenWebtoon, onRefresh }: DashboardPreviewProps) {
  const { data: session } = useSession();
  const [showDiagnosisModal, setShowDiagnosisModal] = React.useState(false);
  const [diagnosisQuestions, setDiagnosisQuestions] = React.useState<any[]>([]);
  const [isDiagnosing, setIsDiagnosing] = React.useState(false);
  const [flowData, setFlowData] = React.useState<any[]>([]);
  const [currentJourneyDay, setCurrentJourneyDay] = React.useState(0);

  const { score, user } = unifiedData;
  const displayScore = score?.totalScore || 0;

  // Fetch Real Flow Data
  React.useEffect(() => {
    const fetchFlowData = async () => {
      try {
        const res = await fetch('/api/recovery/score');
        if (res.ok) {
          const { scores } = await res.json();
          if (scores && Array.isArray(scores)) {
            // Filter scores if necessary, but API already skips claimed ones
            const mappedData = scores.map((s: any, idx: number) => ({
              day: idx + 1,
              date: s.date,
              type: s.snapData?.type || 'TEXT',
              rhythmScore: s.totalScore
            }));
            setFlowData(mappedData);
            setCurrentJourneyDay(mappedData.length);
          }
        } else {
          // Fallback to localStorage if API fails
          const savedScore = localStorage.getItem('recovery_last_score');
          if (savedScore) {
            setFlowData([{ day: 1, date: new Date().toISOString(), type: 'TEXT', rhythmScore: parseInt(savedScore) }]);
            setCurrentJourneyDay(1);
          }
        }
      } catch (err) {
        console.error('Failed to fetch flow data:', err);
      }
    };
    fetchFlowData();
  }, [unifiedData]); // Re-fetch when dashboard data refreshes (e.g. after claim)

  // 🔮 Dynamic Insight Generation for the Black Modal (HabitAlertBanner)
  const getDynamicInsight = () => {
    if (!score || !score.categories) return null;
    
    const categories = Object.entries(score.categories) as [string, number][];
    const weakest = categories.reduce((prev, curr) => prev[1] < curr[1] ? prev : curr);
    
    const insightMap: Record<string, { title: string, description: string, habits: string[] }> = {
      mental: {
        title: "자연 치유와 탄력 회복을 위한 시너지",
        description: "마음의 평온이 신체 회복의 시작입니다.",
        habits: ["오늘 하루 10분간 의식적인 심호흡 실시하기"]
      },
      physical: {
        title: "신체적 활력과 에너지 순환",
        description: "작은 움직임이 정체된 에너지를 깨웁니다.",
        habits: ["산책 후 30분 이내에 단백질 간식 챙기기 (예: 삶은 계란)"]
      },
      sleep: {
        title: "깊은 숙면과 세포 재생 가이드",
        description: "밤 사이 일어나는 기적같은 회복을 준비하세요.",
        habits: ["잠들기 1시간 전 스마트폰 멀리하고 명상하기"]
      },
      lifestyle: {
        title: "균형 잡힌 일상과 리듬의 완성",
        description: "나쁜 습관을 덜어내는 것만으로도 충분합니다.",
        habits: ["식사 후 가벼운 5분 스트레칭 습관화"]
      }
    };

    return insightMap[weakest[0]] || insightMap.physical;
  };

  const dynamicInsight = getDynamicInsight();

  const handleStartDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/diagnosis/dynamic-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: session?.user?.name || '사용자'
        })
      });

      const data = await res.json();
      if (data.questions) {
        setDiagnosisQuestions(data.questions);
        setShowDiagnosisModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch dynamic questions:', error);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleDiagnosisComplete = async (rawScore: number, finalAnswers: any[], note: string) => {
    const totalPossible = diagnosisQuestions.length * 10;
    const unifiedScore = Math.round((rawScore / totalPossible) * 100);

    if (session?.user?.email) {
      try {
        await fetch('/api/diagnosis/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'daily',
            result: {
              totalScore: unifiedScore,
              convertedScores: { physical: unifiedScore, mental: unifiedScore, lifestyle: unifiedScore, sleep: unifiedScore }
            },
            answers: finalAnswers.map(a => ({
              questionId: a.questionId,
              category: a.category,
              score: a.score,
              answer: a.answer,
              detail: a.detail
            }))
          })
        });
      } catch (error) {
        console.error('Failed to save daily diagnosis:', error);
      }
    }

    localStorage.setItem('recovery_last_score', unifiedScore.toString());
    setShowDiagnosisModal(false);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="w-full bg-background text-foreground relative pb-24 md:pb-10">
      
      {/* 🔮 Premium Black Modal (Habit Protocol) */}
      <HabitAlertBanner insight={dynamicInsight} />

      {/* 🟡 0. Completion Nudge */}
      {currentJourneyDay >= 7 && (
        <section className="container mx-auto px-6 pt-10 max-w-5xl animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="bg-surface/80 backdrop-blur-2xl text-foreground rounded-5xl p-10 md:p-16 relative overflow-hidden shadow-2xl shadow-primary/5 border border-white/20">
            {/* Golden Decorative Accents */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-reward-gold/10 rounded-full blur-[120px] -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-[100px] -ml-20 -mb-20" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 bg-reward-gold/10 rounded-full flex items-center justify-center border border-reward-gold/20">
                <Sparkles className="w-10 h-10 text-reward-gold" />
              </div>
              <div className="space-y-4">
                <h2 className="font-bold tracking-tight leading-tight text-3xl md:text-4xl">
                  7일간의 아름다운 여정을<br />완주하셨네요!
                </h2>
                <p className="text-foreground/50 font-medium max-w-md mx-auto leading-relaxed text-lg">
                  당신의 기록을 통해 <span className="text-primary font-bold">12개의 소중한 회복 시그널</span>을 발견했어요.<br />
                  {session?.user?.name || '사용자'}님의 회복 에너지가 눈에 띄게 건강해졌네요.
                </p>
              </div>
              <Button 
                className={`w-full max-w-sm h-20 rounded-full font-bold text-xl shadow-2xl transition-all hover:scale-105 ${
                  !unifiedData.certificateStatus?.nextCycleToClaim 
                  ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20" 
                  : "bg-reward-gold hover:bg-reward-gold/90 text-white shadow-reward-gold/20"
                }`}
                onClick={async () => {
                  const nextCycle = unifiedData.certificateStatus?.nextCycleToClaim;
                  if (nextCycle) {
                    try {
                      const res = await fetch('/api/user/certificate/claim', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cycleNumber: nextCycle })
                      });
                      if (res.ok) {
                        if (onRefresh) onRefresh();
                        window.location.href='/certificate';
                      }
                    } catch (err) {
                      console.error('Failed to claim certificate:', err);
                      window.location.href='/certificate';
                    }
                  } else {
                    window.location.href='/archive/certificates';
                  }
                }}
              >
                {unifiedData.certificateStatus?.nextCycleToClaim 
                  ? `${unifiedData.certificateStatus.nextCycleToClaim}회차 완주 증명서 받기` 
                  : "나의 완주 기록 확인하기"}
              </Button>
              <button 
                onClick={() => window.location.href='/reports'}
                className="text-xs font-bold text-foreground/20 uppercase tracking-[0.3em] hover:text-primary transition-colors"
              >
                회복 리포트로 가기
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 🟢 1. Recovery Flow Timeline */}
      <section className="container mx-auto px-4 pt-3 pb-3 max-w-5xl relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary/60" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/30">Recovery Journey</span>
          </div>
          <Badge className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            {(unifiedData.certificateStatus?.issuedCertificates?.length || 0) + 1}회차: {currentJourneyDay}/7 Days
          </Badge>
        </div>
        <FlowTimeline data={flowData} currentDay={currentJourneyDay} />
      </section>

      {/* 🟣 2. Today's Rhythm Analysis */}
      <section className="container mx-auto px-4 pb-3 max-w-5xl relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-reward-gold" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/30">Today's Insight</span>
        </div>
        <TodayRhythmCard 
          score={displayScore} 
          userName={session?.user?.name || '사용자'} 
        />
      </section>

      {/* 🔵 3. Secondary Info Grid */}
      <section className="container mx-auto px-4 pb-3 max-w-5xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Membership Management - Premium Dark Mode */}
          <div className="bg-obsidian rounded-[32px] p-6 border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-[#1a1a1a] transition-all shadow-xl shadow-obsidian/20 relative overflow-hidden" onClick={() => window.location.href='/membership'}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-reward-gold/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-reward-gold mb-2">Membership</p>
              <h3 className="font-bold text-white tracking-tight mb-1 text-xl md:text-2xl">멤버십 혜택 관리</h3>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">MY GRADE: {(user?.grade || 'GATE')}</p>
            </div>
            <div className="w-12 h-12 shrink-0 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:bg-reward-gold group-hover:text-obsidian transition-colors relative z-10 shadow-inner">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
          
          {/* Recovery Report - High Contrast White */}
          <div className="bg-white rounded-[32px] p-6 border border-obsidian/5 flex items-center justify-between group cursor-pointer hover:border-obsidian/20 transition-all shadow-lg shadow-obsidian/5 relative overflow-hidden" onClick={() => window.location.href='/reports'}>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mb-16 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Recovery Report</p>
              <h3 className="font-bold text-obsidian tracking-tight mb-1 text-xl md:text-2xl">내 회복 리포트</h3>
              <p className="text-[11px] font-bold text-obsidian/40 uppercase tracking-widest">TOTAL {(unifiedData.assetStats?.totalInsights || 0)} INSIGHTS</p>
            </div>
            <div className="w-12 h-12 shrink-0 bg-obsidian rounded-full flex items-center justify-center text-white group-hover:bg-primary transition-colors relative z-10 shadow-sm">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* 🟠 4. Daily Recovery Note (Self-Reflection) */}
      <RecoveryNoteSection />

      <Dialog open={showDiagnosisModal} onOpenChange={setShowDiagnosisModal}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-5xl shadow-2xl bg-background">
          <DialogHeader className="sr-only">
            <DialogTitle>오늘의 회복 리듬 측정</DialogTitle>
            <DialogDescription>따뜻한 관심으로 설계하는 당신만의 일상 리듬</DialogDescription>
          </DialogHeader>
          <DiagnosisForm questions={diagnosisQuestions} onComplete={handleDiagnosisComplete} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
