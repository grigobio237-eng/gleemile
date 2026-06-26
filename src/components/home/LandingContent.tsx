'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Sparkles, BarChart3, Map, Lightbulb, Zap, Shield, Crown, Users, Camera, Activity, Video, Music, ArrowRight, Compass, Heart, Wind, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnalysisResult } from './HeroScanner';
import ClinicConsultationSection from './ClinicConsultationSection';

interface LandingContentProps {
  onStart: (data?: AnalysisResult) => void;
  onStartTherapy?: () => void;
  isDiagnosing?: boolean;
}

export default function LandingContent({ onStart, onStartTherapy, isDiagnosing = false }: LandingContentProps) {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const
      }
    }
  };

  return (
    <div className="bg-background pb-32">
      {/* Recovery Rituals Section */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Tool 1: Snap */}
            <motion.div variants={itemVariants} className="group p-10 bg-surface/40 backdrop-blur-xl border border-white/20 rounded-5xl hover:bg-white/60 transition-all duration-500 shadow-xl shadow-primary/5">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">라이프 스냅</h3>
              <p className="text-foreground/50 leading-relaxed mb-8">당신의 하루를 사진으로 기록하세요. gleemile이 사진 속 숨겨진 회복의 신호를 읽어드립니다.</p>
              <Button 
                variant="ghost" 
                onClick={() => onStart()}
                className="p-0 hover:bg-transparent text-primary font-bold group-hover:translate-x-2 transition-transform"
              >
                기록하기 <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>

            {/* Tool 2: Rhythm Check */}
            <motion.div variants={itemVariants} className="group p-10 bg-surface/40 backdrop-blur-xl border border-white/20 rounded-5xl hover:bg-white/60 transition-all duration-500 shadow-xl shadow-primary/5">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">60초 리듬체크</h3>
              <p className="text-foreground/50 leading-relaxed mb-8">매일 아침, 당신의 컨디션을 체크하세요. 나만을 위한 회복 루틴이 새롭게 제안됩니다.</p>
              <Button 
                variant="ghost" 
                onClick={() => onStart()}
                className="p-0 hover:bg-transparent text-primary font-bold group-hover:translate-x-2 transition-transform"
              >
                시작하기 <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>

            {/* Tool 3: Insight */}
            <motion.div variants={itemVariants} className="group p-10 bg-surface/40 backdrop-blur-xl border border-white/20 rounded-5xl hover:bg-white/60 transition-all duration-500 shadow-xl shadow-primary/5">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">회복 분석 보고서</h3>
              <p className="text-foreground/50 leading-relaxed mb-8">누적된 데이터를 통해 회복의 흐름을 확인하세요. 더 건강한 내일을 위한 가이드가 됩니다.</p>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="p-0 hover:bg-transparent text-primary font-bold group-hover:translate-x-2 transition-transform"
              >
                보고서 보기 <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Deep Relaxation (Sound Therapy) Nudge */}
      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden bg-foreground text-white rounded-5xl p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -mr-48 -mt-48" />
            
            <div className="relative z-10 max-w-xl space-y-8 text-center md:text-left">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                <Music className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Deep Sound Therapy</span>
              </div>
              <h2 className="text-lg md:text-3xl font-bold leading-tight tracking-tight">
                당신의 깊은 이완을 돕는<br />
                회복 주파수를 경험해보세요
              </h2>
              <p className="text-[11px] md:text-sm text-white/60 leading-relaxed font-medium">
                일상의 소음에서 벗어나 오직 당신만을 위한<br />
                평온한 사운드스케이프 속으로 초대합니다.
              </p>
              <div className="pt-4">
                <Button 
                  onClick={onStartTherapy}
                  className="bg-primary text-white font-bold h-16 px-10 rounded-full text-lg hover:scale-105 transition-all shadow-xl shadow-primary/20"
                >
                  사운드 테라피 시작하기
                </Button>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                <Wind className="w-12 h-12 text-white/30" />
              </div>
              <div className="w-32 h-32 md:w-48 md:h-48 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 flex items-center justify-center mt-12 animate-pulse [animation-delay:1s]">
                <Moon className="w-12 h-12 text-white/30" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partner Nudge */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-6xl mx-auto text-center space-y-20">
          <div className="space-y-6">
            <h2 className="text-lg md:text-3xl font-bold tracking-tight">전문적인 회복 파트너를 만나보세요</h2>
            <p className="text-[11px] md:text-sm text-foreground/40 font-medium">gleemile이 엄선한 최고의 전문가들이 당신의 여정을 함께합니다.</p>
          </div>
          
          <ClinicConsultationSection />
          
          <div className="pt-10">
            <Button 
              variant="outline" 
              onClick={() => router.push('/partner')}
              className="h-16 px-10 rounded-full border-primary/20 text-primary font-bold hover:bg-primary/5"
            >
              모든 파트너 보기
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
