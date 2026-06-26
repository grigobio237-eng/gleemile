'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Crown } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export default function MembershipTierCards({ onStart }: Props) {
  return (
    <div className="w-full mt-12 md:mt-24 mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
      <div className="text-center mb-8 md:mb-12 px-2">
        <h2 className="text-xl md:text-3xl font-black text-foreground mb-3 break-keep">나에게 맞는 플랜을 선택하세요</h2>
        <p className="text-foreground/50 text-xs md:text-base font-medium break-keep">gleemile의 세밀한 데이터 분석으로 최적의 회복을 경험하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
        {/* 1. RESET */}
        <Card className="bg-white border-line shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] overflow-hidden flex flex-col group relative">
          <CardContent className="p-8 flex-1 flex flex-col">
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block">FREE</span>
              <h3 className="text-xl md:text-2xl font-black text-obsidian">RESET</h3>
              <div className="mt-2 md:mt-4 text-2xl md:text-3xl font-black text-obsidian">무료</div>
            </div>
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-1 text-xs md:text-sm text-foreground/70 font-medium break-keep">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> 일 5회 AI 라이프 스냅</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> 베이직 회복 리포트</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> 사운드 테라피 (일부 트랙)</li>
            </ul>
            <Link href="/basic-plan" className="w-full">
              <Button variant="outline" className="w-full rounded-2xl h-14 font-bold border-2 hover:bg-foreground/5">
                리셋 패스 알아보기
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 2. REBORN */}
        <Card className="bg-white border-chapter-accent/30 shadow-xl shadow-chapter-accent/5 hover:-translate-y-2 transition-all duration-500 rounded-[32px] overflow-hidden flex flex-col group relative">
          <CardContent className="p-8 flex-1 flex flex-col">
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-chapter-accent mb-2 block">POPULAR</span>
              <h3 className="text-xl md:text-2xl font-black text-obsidian flex items-center gap-2">REBORN <Crown className="w-4 h-4 md:w-5 md:h-5 text-chapter-accent" /></h3>
              <div className="mt-2 md:mt-4 flex items-end gap-1">
                <span className="text-2xl md:text-3xl font-black text-obsidian">9,900원</span>
                <span className="text-xs md:text-sm font-bold text-foreground/50 pb-1">/ 월</span>
              </div>
            </div>
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-1 text-xs md:text-sm text-foreground/70 font-medium break-keep">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-chapter-accent shrink-0" /> 무제한 AI 라이프 스냅</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-chapter-accent shrink-0" /> 7-Day 누적 패턴 분석</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-chapter-accent shrink-0" /> 사운드 테라피 전체 라이브러리</li>
            </ul>
            <Link href="/founder-ticket" className="w-full">
              <Button className="w-full rounded-2xl h-14 font-black bg-obsidian text-white hover:bg-obsidian/90 shadow-lg">
                리본 패스 알아보기
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 3. RESTART */}
        <Card className="bg-gradient-to-br from-obsidian to-slate-800 border-none shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-[32px] overflow-hidden flex flex-col group relative">
          <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none"><Sparkles className="w-24 h-24 text-reward-gold" /></div>
          <CardContent className="p-8 flex-1 flex flex-col relative z-10">
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-reward-gold mb-2 block">EXPERT</span>
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">RESTART <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-reward-gold" /></h3>
              <div className="mt-2 md:mt-4 flex items-end gap-1">
                <span className="text-2xl md:text-3xl font-black text-white">29,800원</span>
                <span className="text-xs md:text-sm font-bold text-white/50 pb-1">/ 월</span>
              </div>
            </div>
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-1 text-xs md:text-sm text-white/80 font-medium break-keep">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-reward-gold shrink-0" /> 심층 기질 분석 (30개 세부 국면)</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-reward-gold shrink-0" /> AI 보이스 스트래티지 (맞춤 명상)</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-reward-gold shrink-0" /> 전문가 1:1 커스텀 솔루션</li>
            </ul>
            <Link href="/premium-plan" className="w-full">
              <Button className="w-full rounded-2xl h-14 font-black bg-reward-gold text-obsidian hover:bg-yellow-400 shadow-[0_10px_30px_rgba(251,191,36,0.3)]">
                리스타트 패스 알아보기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
