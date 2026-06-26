'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Activity, ArrowRight } from 'lucide-react';
import HeroScanner, { AnalysisResult } from './HeroScanner';
import MembershipTierCards from './MembershipTierCards';
import { useRecovery } from '@/contexts/RecoveryContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import Link from 'next/link';

export default function Hero({ 
  onStart, 
  isDiagnosing = false,
  initialAnalysisData = null,
  initialImage
}: { 
  onStart: (data?: AnalysisResult, image?: string) => void;
  isDiagnosing?: boolean;
  initialAnalysisData?: AnalysisResult | null;
  initialImage?: string;
}) {
  const { journey, resetJourney } = useRecovery();
  const { data: session } = useSession();
  const { trackEvent } = useActivityTracker();

  const [personalMsg, setPersonalMsg] = useState({
    title: <>당신이 머무는 공간,<br />보고 듣고 느끼는 모든 것이<br /><span className="text-primary font-bold text-glow-cream">회복의 단서</span>가 됩니다.</>,
    desc: "일상의 작은 조각들을 모아 당신만의 회복 리듬을 기록하는 퍼스널 거울, gleemile",
    nudge: "오늘의 컨디션은 어떠신가요? 가벼운 기록으로 시작해보세요."
  });

  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('60초 리듬체크 시작');

  // Advanced Progress animation logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let finishInterval: NodeJS.Timeout;

    if (isDiagnosing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          let nextProgress = prev;
          if (prev >= 90) {
            nextProgress = prev + 0.05;
            nextProgress = Math.min(99, nextProgress);
          } else if (prev < 75) {
            nextProgress = prev + 0.8;
          } else {
            const step = 0.8 + ((prev - 75) / 15) * 1.6;
            nextProgress = Math.min(90, prev + step);
          }

          if (nextProgress < 30) setLoadingText('gleemile이 상태를 분석 중입니다...');
          else if (nextProgress < 55) setLoadingText('gleemile 회복 패턴 매칭 중...');
          else if (nextProgress < 80) setLoadingText('회복 데이터를 수집하고 있습니다...');
          else if (nextProgress < 95) setLoadingText('맞춤형 질문을 설계 중입니다...');
          else setLoadingText('거의 다 되었습니다. 마지막 정리 중입니다...');

          return nextProgress;
        });
      }, 100);
    } else {
      // When isDiagnosing transitions to false, read progress state via functional update
      // and perform the acceleration finish animation!
      setProgress((currentProgress) => {
        if (currentProgress > 0 && currentProgress < 100) {
          let speed = 4;
          finishInterval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 100) {
                clearInterval(finishInterval);
                setTimeout(() => setProgress(0), 600);
                return 100;
              }
              return prev + speed;
            });
          }, 16);
          return currentProgress;
        } else {
          return 0;
        }
      });
      setLoadingText('60초 리듬체크 시작');
    }

    return () => {
      clearInterval(interval);
      if (finishInterval) clearInterval(finishInterval);
    };
  }, [isDiagnosing]);

  useEffect(() => {
    const fetchPersonalization = async () => {
      if (session?.user) {
        const userName = session.user.name || '회원';
        try {
          const res = await fetch('/api/user/status?minimal=true');
          if (res.ok) {
            const data = await res.json();
            const { score } = data;

            if (score && score.categories) {
              const categories = Object.entries(score.categories) as [string, number][];
              const weakest = categories.reduce((prev, curr) => prev[1] < curr[1] ? prev : curr);

              if (weakest[1] < 90) {
                updateMessage(userName, weakest[0]);
                return;
              }
            }
          }
        } catch (e) {
          console.error("Personalization failed", e);
        }

        updateMessage(userName, 'physical');
        return;
      }

      setPersonalMsg({
        title: <>오늘 당신의 하루는 어떤가요?<br /><span className="text-primary font-bold text-glow-cream">평온한 회복</span>이 시작되는 곳, gleemile</>,
        desc: "지친 일상을 뒤로하고, 당신만을 위해 설계된 따뜻한 회복 리듬을 경험해보세요. 우리는 당신의 모든 순간을 응원합니다.",
        nudge: "지금 이 순간, 당신의 마음이 보내는 신호에 귀를 기울여 볼까요?"
      });
    };

    const updateMessage = (name: string, categoryId: string) => {
      const categoryMap: Record<string, { label: string, question: string }> = {
        mental: { label: '마음의 평온', question: '요즘 조금은 마음이 무거우셨나요?' },
        physical: { label: '몸의 활력', question: '부쩍 몸이 무겁게 느껴지는 날이 많으셨죠?' },
        sleep: { label: '깊은 잠', question: '자고 일어나도 개운하지 않은 아침이었나요?' },
        lifestyle: { label: '일상의 리듬', question: '삶의 균형이 조금씩 무너지고 있진 않나요?' }
      };

      const info = categoryMap[categoryId] || { label: categoryId, question: '오늘의 회복 리듬을 함께 살펴볼까요?' };

      setPersonalMsg({
        title: <>{name}님, {info.question}<br />오늘은 <span className="text-primary font-bold text-glow-cream">{info.label}</span>을 위해 준비했어요.</>,
        desc: `${name}님의 기록들을 살펴보니, 지금은 ${info.label}을(를) 위한 부드러운 케어가 가장 필요한 순간인 것 같아요.`,
        nudge: `당신만을 위한 ${info.label} 리듬을 찾으러 가볼까요?`
      });
    };

    fetchPersonalization();
  }, [session, session?.user?.name]);


  return (
    <div id="scanner" className="hero-cinematic bg-background relative overflow-x-hidden pt-4 pb-6 sm:pt-6 sm:pb-12 md:pt-[60px] md:pb-32 min-h-[calc(100dvh-192px)] md:min-h-0 flex flex-col justify-center">
      {/* Decorative Blur Elements - Softer */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-[15%] -left-[10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[60%] h-[60%] bg-secondary-container/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex-1 flex flex-col justify-center w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-24 items-center">
 
          {/* 1. Texts */}
          <div className="space-y-2 md:space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-[0.5em]">RECOVERY CGM</span>
              {journey && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[11px] font-bold uppercase tracking-widest leading-none">
                  <Activity className="w-3 h-3 md:w-3.5 md:h-3.5" /> {journey} MODE
                </motion.div>
              )}
            </div>
            <h1 className="font-extrabold text-foreground leading-[1.25] tracking-tight break-keep text-xl sm:text-2xl md:text-4xl">
              {/* {personalMsg.title} */}
              당신의 몸이 보내는 작은 신호,<br />60초면 충분합니다.
            </h1>
            <p className="text-[11px] sm:text-base md:text-2xl text-foreground/40 font-medium leading-normal max-w-xl break-keep">
              {/* {personalMsg.desc} */}
              오늘의 나를 마주하는 가장 스마트한 방법, 60초 리듬체크를 시작하세요.
            </p>
            
            {/* Action Buttons: Free vs Paid */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-4 w-full">
              <Button 
                onClick={() => onStart()}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 rounded-full text-lg font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 group"
              >
                무료 60초 리듬체크 시작하기
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* 2. Scanner */}
          <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000 delay-300 flex justify-center lg:block">
            <div className="absolute -inset-10 bg-gradient-to-tr from-primary/10 to-secondary-container/10 rounded-full blur-3xl opacity-60" />
            <div className="relative w-full">
              <div className="absolute -top-16 -left-16 w-40 h-40 bg-primary/5 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-secondary-container/10 rounded-full blur-3xl animate-pulse delay-1000" />
              <HeroScanner 
                onStart={onStart} 
                isDiagnosing={isDiagnosing} 
                initialAnalysisData={initialAnalysisData}
                initialImage={initialImage}
              />
            </div>

            {/* Contextual Nudge Bubble - Softer Design */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStart()}
              className="hidden md:block absolute -bottom-10 -left-16 bg-surface/80 backdrop-blur-xl p-6 rounded-5xl shadow-2xl shadow-primary/5 border border-white/20 cursor-pointer hover:border-primary/30 transition-all z-10 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Youniqle LIVE</span>
              </div>
              <p className="text-sm font-bold text-foreground/70 leading-relaxed group-hover:text-primary transition-colors break-keep">
                {personalMsg.nudge}
              </p>
              <div className="mt-3 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                기록 시작하기 <ArrowRight className="ml-1.5 w-4 h-4" />
              </div>
            </motion.div>
          </div>

        </div>
        
        {/* Membership Tier Cards */}
        <MembershipTierCards onStart={onStart} />
      </div>
    </div>
  );
}
