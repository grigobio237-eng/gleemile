'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getKSTDate } from '@/lib/date';

interface HabitAlertBannerProps {
  insight: {
    title: string;
    description: string;
    habits: string[];
  } | null;
}

export default function HabitAlertBanner({ insight }: HabitAlertBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!insight) return;

    // Check if shown today (KST-aware)
    const today = getKSTDate();
    const lastShown = localStorage.getItem('youniqle_habit_alert_date');

    if (lastShown !== today) {
      // First time today
      const timer = setTimeout(() => setIsVisible(true), 1500); // Delay for better impact
      return () => clearTimeout(timer);
    }
  }, [insight]);

  const handleClose = () => {
    const today = getKSTDate();
    localStorage.setItem('youniqle_habit_alert_date', today);
    setIsVisible(false);
  };

  if (!insight || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-24 left-6 right-6 z-[100] max-w-xl mx-auto"
      >
        <div className="bg-surface/80 backdrop-blur-2xl text-foreground p-8 rounded-5xl shadow-2xl shadow-primary/10 border border-white/20 relative overflow-hidden group">
          {/* Decorative subtle light */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
          
          <div className="flex items-start gap-5 relative z-10">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="w-7 h-7 text-primary animate-pulse" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary/60">오늘의 마음 챙김</span>
                <button onClick={handleClose} aria-label="닫기" className="text-foreground/20 hover:text-primary transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-2xl font-bold tracking-tight text-foreground">{insight.title}</h3>
              <p className="text-base text-foreground/50 font-medium leading-relaxed">
                {insight.habits?.[0] || '오늘 하루, 당신의 마음을 조금 더 따뜻하게 보살펴주세요.'}
              </p>
              
              <div className="pt-3">
                <Button 
                  onClick={handleClose}
                  className="bg-primary text-white font-bold rounded-full text-xs h-10 px-6 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  알겠어요, 기억할게요
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
