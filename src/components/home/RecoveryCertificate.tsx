'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Sparkles, TrendingUp, Calendar, ChevronRight, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecoveryCertificateProps {
  userName: string;
  completionDate: string;
  signalsFound: number;
  improvement: number;
  daysActive: number;
  grade: string;
}

export default function RecoveryCertificate({ 
  userName = '사용자', 
  completionDate = new Date().toLocaleDateString(),
  signalsFound = 12,
  improvement = 24,
  daysActive = 7,
  grade = 'GATE'
}: RecoveryCertificateProps) {
  return (
    <div className="min-h-screen bg-mist p-3 sm:p-6 md:p-10 pb-28 sm:pb-20 flex flex-col items-center">
      {/* 🏛️ The Certificate Body */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[32px] sm:rounded-[48px] shadow-2xl overflow-hidden border border-line/50 relative"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-reward-gold/10 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-chapter-accent/5 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        {/* Top Branding Section */}
        <div className="pt-10 pb-6 px-5 sm:pt-16 sm:pb-8 sm:px-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-obsidian rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl transform rotate-3 shrink-0">
            <Award className="w-8 h-8 sm:w-10 sm:h-10 text-reward-gold" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-chapter-accent mb-2">Recovery CGM Certificate</span>
          <h1 className="font-serif-display text-obsidian tracking-tighter leading-tight italic text-3xl sm:text-4xl md:text-4xl">
            7일의 회복 여정,<br />완주를 증명합니다
          </h1>
        </div>

        {/* Content Section */}
        <div className="px-5 py-6 sm:px-10 sm:py-10 md:px-16 space-y-8 sm:space-y-12">
          {/* User Info */}
          <div className="text-center space-y-1.5 sm:space-y-2">
            <div className="h-[1px] w-12 bg-line mx-auto mb-3 sm:mb-4" />
            <p className="text-slate/60 text-xs sm:text-sm font-medium">위 사람은 gleemile 회복 CGM을 통해</p>
            <h2 className="text-2xl sm:text-3xl font-black text-obsidian tracking-tight">{userName} 님</h2>
            <p className="text-slate/60 text-xs sm:text-sm font-medium">자신의 리듬을 기록하고 긍정적인 변화를 일구어냈습니다.</p>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-mist/30 p-4 sm:p-6 rounded-[20px] sm:rounded-3xl border border-line/30 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-chapter-accent">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Found Signals</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-obsidian">{signalsFound}<span className="text-xs sm:text-sm ml-1 font-bold">개</span></p>
              <p className="text-[9px] sm:text-[10px] text-slate/50 font-bold leading-tight">7일간 발견한 당신만의 회복 지표</p>
            </div>
            <div className="bg-mist/30 p-4 sm:p-6 rounded-[20px] sm:rounded-3xl border border-line/30 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-reward-gold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Growth rate</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-obsidian">+{improvement}<span className="text-xs sm:text-sm ml-1 font-bold">%</span></p>
              <p className="text-[9px] sm:text-[10px] text-slate/50 font-bold leading-tight">이전 대비 향상된 회복 탄력성</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-between items-end border-t border-line/50 pt-6 sm:pt-10">
            <div className="space-y-0.5">
              <p className="text-[8px] sm:text-[9px] font-black text-slate/40 uppercase tracking-widest">Issuing Date</p>
              <p className="text-xs sm:text-sm font-bold text-obsidian">{completionDate}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[8px] sm:text-[9px] font-black text-chapter-accent uppercase tracking-widest">Authenticated by</p>
              <p className="text-lg sm:text-xl font-serif-display italic text-obsidian font-black leading-none">YOUNIQLE</p>
            </div>
          </div>
        </div>

        {/* Footer Pattern */}
        <div className="h-6 bg-gradient-to-r from-chapter-accent via-reward-gold to-chapter-accent opacity-50" />
      </motion.div>

      {/* 🚀 Next Journey Nudge (Motivation) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-2xl mt-8 sm:mt-12 space-y-6 sm:space-y-8"
      >
        {/* Benefit Info */}
        <div className="bg-white/50 backdrop-blur-md rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 border border-line/50 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-chapter-accent/10 rounded-full mb-3 sm:mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-chapter-accent" />
            <span className="text-[9px] sm:text-[10px] font-black text-chapter-accent uppercase tracking-widest">Membership Progress</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-obsidian mb-2">증명서 3개를 더 모으면 혜택이 쏟아집니다!</h3>
          <p className="text-xs sm:text-sm text-slate font-medium max-w-md mx-auto leading-relaxed">
            완주 증명서 5개를 모으시면 <span className="text-chapter-accent font-bold">ROOTER</span> 등급으로 자동 승급되며, 
            프리미엄 리듬 분석 리포트와 멤버십 전용 굿즈 패키지가 제공됩니다.
          </p>
          
          {/* Progress Bar (Visual nudge) */}
          <div className="mt-6 sm:mt-8 space-y-2">
            <div className="flex justify-between text-[9px] sm:text-[10px] font-black text-slate uppercase tracking-widest">
              <span>Current Progress</span>
              <span>2 / 5 Completed</span>
            </div>
            <div className="h-3 bg-mist rounded-full overflow-hidden p-0.5 border border-line/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '40%' }}
                className="h-full bg-chapter-accent rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
          <Button 
            className="w-full sm:flex-1 h-14 sm:h-16 bg-obsidian hover:bg-obsidian/90 text-white rounded-2xl font-black text-base sm:text-lg shadow-2xl transition-all group flex items-center justify-center"
            onClick={() => window.location.href='/dashboard'}
          >
            새로운 7일의 리듬 설계하기
            <ChevronRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <div className="flex gap-3 sm:gap-4 w-full sm:w-auto shrink-0">
            <Button variant="outline" className="flex-1 sm:flex-none h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border-line hover:bg-mist transition-all group flex items-center justify-center" title="이미지 저장">
              <Download className="w-5 h-5 sm:w-6 sm:h-6 text-obsidian group-hover:scale-110 transition-transform" />
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border-line hover:bg-mist transition-all group flex items-center justify-center" title="공유하기">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-obsidian group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
