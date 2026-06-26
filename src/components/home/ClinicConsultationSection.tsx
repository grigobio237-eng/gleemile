'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Activity, ClipboardCheck, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

/**
 * ClinicConsultationSection (Compact 1/3 Size)
 * 클리닉 시술 전/후를 선택할 수 있는 콤팩트한 전용 섹션입니다.
 */
export default function ClinicConsultationSection() {
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<'pre' | 'post' | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');

  const handleStart = (type: 'pre' | 'post', href: string) => {
    setLoadingType(type);
    setProgress(0);
    
    setLoadingText(type === 'pre' ? '사용자 회복 리듬 분석 중...' : '최근 시술 데이터 동기화 중...');

    // Smooth and realistic acceleration/deceleration simulated via an adaptive interval
    const interval = setInterval(() => {
      setProgress((prev) => {
        let nextProgress = prev;
        
        if (prev >= 90) {
          // Beyond 90%, slowly creep forward simulating complex clinical protocol preparation
          nextProgress = prev + 0.1;
          nextProgress = Math.min(99, nextProgress);
        } else if (prev < 75) {
          // Slow deliberative depth phase
          nextProgress = prev + 1.2;
        } else {
          // Dynamic acceleration phase
          const step = 1.2 + ((prev - 75) / 15) * 2.5;
          nextProgress = Math.min(90, prev + step);
        }

        // Dynamic texts based on progress steps
        if (nextProgress > 30 && nextProgress < 60) {
          setLoadingText(type === 'pre' ? '정밀 회복 가이드 구성 중...' : '사후 관리 프로토콜 분석 중...');
        } else if (nextProgress >= 60 && nextProgress < 90) {
          setLoadingText(type === 'pre' ? 'gleemile 맞춤형 문진지 생성 완료!' : '회복 로드맵 업데이트 완료!');
        } else if (nextProgress >= 90) {
          setLoadingText('준비가 완료되었습니다!');
        }

        // Finish threshold (e.g. close to 99%)
        if (nextProgress >= 99) {
          clearInterval(interval);
          
          // Instant super fast charge from 99% to 100%
          let finishProgress = 99;
          const finishInterval = setInterval(() => {
            finishProgress += 1;
            setProgress(finishProgress);
            if (finishProgress >= 100) {
              clearInterval(finishInterval);
              setTimeout(() => {
                router.push(`${href}?action=new`);
              }, 300);
            }
          }, 16);
        }

        return nextProgress;
      });
    }, 50);
  };

  return (
    <section className="container mx-auto px-6 py-10">
      <div className="relative group overflow-hidden rounded-[40px] border border-white/10 shadow-2xl">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 bg-obsidian" />
        <div className="absolute inset-0 bg-gradient-to-br from-chapter-accent/20 via-transparent to-reward-gold/10 opacity-30 group-hover:opacity-50 transition-opacity duration-1000" />
        
        {/* Interactive Light Spot (Small) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-chapter-accent/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 p-8 md:p-14 flex flex-col items-center text-center space-y-8">
          {/* Header Badge (Compact) */}
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Heart className="w-3 h-3 text-chapter-accent fill-chapter-accent" />
            <span className="text-[9px] font-black uppercase text-mist tracking-widest">Clinic Care</span>
          </div>

          {/* Main Title & Description (Smaller) */}
          <div className="space-y-4 max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-lg md:text-3xl font-black text-white leading-tight tracking-tight italic"
            >
              The Design for <span className="text-chapter-accent">Perfect Recovery</span>
            </motion.h2>
            <p className="text-mist/70 text-[11px] md:text-sm font-medium break-keep">
              시술은 결과만 보는 것이 아니라 과정을 설계하는 것입니다.<br />
              현재 당신의 상황에 맞는 정밀 케어를 선택하세요.
            </p>
          </div>

          {/* Features Row (Mini Version) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl">
            <div className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/5 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-chapter-accent" />
              <span className="text-xs font-black text-white">정밀 문진</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/5 flex items-center gap-3">
              <Activity className="w-5 h-5 text-chapter-accent" />
              <span className="text-xs font-black text-white">gleemile 데이터 분석</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/5 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-chapter-accent" />
              <span className="text-xs font-black text-white">시술 결과 완성</span>
            </div>
          </div>

          {/* Dual Choice Buttons (Responsive) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl pt-4">
            {/* Option 1: Pre-hospital */}
            <div className="block">
              <Button 
                onClick={() => handleStart('pre', '/event/consultation')}
                disabled={loadingType !== null}
                variant="outline"
                className="w-full h-16 md:h-20 bg-white/5 hover:bg-white text-mist hover:text-obsidian border-white/10 rounded-[24px] flex flex-col items-center justify-center gap-1 group transition-all relative overflow-hidden"
              >
                {/* Progress Bar Background */}
                {loadingType === 'pre' && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="absolute inset-0 bg-chapter-accent/20 z-0"
                  />
                )}

                <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2">
                    {loadingType === 'pre' ? (
                      <Sparkles className="w-5 h-5 animate-spin" />
                    ) : (
                      <ClipboardCheck className="w-5 h-5" />
                    )}
                    <span className="text-base md:text-lg font-black">
                      <AnimatePresence mode="wait">
                        {loadingType === 'pre' ? (
                          <motion.span
                            key={loadingText}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                          >
                            {loadingText}
                          </motion.span>
                        ) : (
                          <span>병원 방문 전 정밀 문진</span>
                        )}
                      </AnimatePresence>
                    </span>
                  </div>
                  <span className="text-[10px] opacity-60 font-medium">최적의 시술 결과 설계</span>
                </div>
              </Button>
            </div>

            {/* Option 2: Post-op */}
            <div className="block">
              <Button 
                onClick={() => handleStart('post', '/event/post-care')}
                disabled={loadingType !== null}
                className="w-full h-16 md:h-20 bg-chapter-accent hover:bg-white text-white hover:text-obsidian rounded-[24px] flex flex-col items-center justify-center gap-1 group transition-all shadow-xl shadow-chapter-accent/20 relative overflow-hidden"
              >
                {/* Progress Bar Background */}
                {loadingType === 'post' && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="absolute inset-0 bg-white/30 z-0"
                  />
                )}

                <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2">
                    {loadingType === 'post' ? (
                      <Sparkles className="w-5 h-5 animate-spin" />
                    ) : (
                      <History className="w-5 h-5" />
                    )}
                    <span className="text-base md:text-lg font-black">
                      <AnimatePresence mode="wait">
                        {loadingType === 'post' ? (
                          <motion.span
                            key={loadingText}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                          >
                            {loadingText}
                          </motion.span>
                        ) : (
                          <span>시술/수술 후 맞춤 케어</span>
                        )}
                      </AnimatePresence>
                    </span>
                  </div>
                  <span className="text-[10px] opacity-80 group-hover:opacity-60 font-medium">부기 및 회복 실시간 분석</span>
                </div>
              </Button>
            </div>
          </div>
          
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-mist/20">
            Professional Clinic-Only Experience
          </p>
        </div>

        {/* Decorative Particles (Smaller) */}
        <div className="absolute bottom-5 right-5 w-16 h-16 bg-chapter-accent/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-10 left-5 w-10 h-10 bg-reward-gold/5 rounded-full blur-lg animate-bounce" />
      </div>
    </section>
  );
}
