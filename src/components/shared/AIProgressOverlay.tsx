'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Brain, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIProgressOverlayProps {
  progress: number;
  message: string;
  active: boolean;
  className?: string;
  variant?: 'full' | 'compact';
}

export function AIProgressOverlay({ 
  progress, 
  message, 
  active, 
  className,
  variant = 'full'
}: AIProgressOverlayProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "z-50 flex flex-col items-center justify-center text-white",
            variant === 'full' ? "fixed inset-0 bg-obsidian/60 backdrop-blur-md" : "absolute inset-0 bg-obsidian/40 backdrop-blur-sm rounded-[inherit]",
            className
          )}
        >
          <div className="w-full max-w-sm px-8 space-y-8 text-center">
            {/* AI Icon Layer */}
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-chapter-accent/20 rounded-3xl flex items-center justify-center border border-chapter-accent/30 relative z-10">
                <Brain className="w-10 h-10 text-chapter-accent animate-pulse" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -z-0 opacity-30"
              >
                 <Sparkles className="w-full h-full text-chapter-accent" />
              </motion.div>
            </div>

            {/* Progress & Message */}
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <h4 className="font-black italic tracking-widest uppercase text-chapter-accent text-xl">
                  Youniqle Engine <span className="opacity-50">Analyzing</span>
                </h4>
                <span className="text-2xl font-black italic font-mono">{Math.round(progress)}%</span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="h-3 w-full bg-white/10 border border-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-chapter-accent via-cyan-400 to-chapter-accent relative"
                  transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                >
                  {/* Shimmer Effect */}
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
                  />
                </motion.div>
              </div>
              
              <div className="h-6 flex items-center justify-center gap-2 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={message}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-sm font-bold text-mist/70 tracking-tight"
                  >
                    {message}
                  </motion.p>
                </AnimatePresence>
                <Loader2 className="w-3 h-3 animate-spin opacity-40 shrink-0" />
              </div>
            </div>

            <div className="pt-8 opacity-20 text-[10px] font-black uppercase tracking-[0.4em]">
              Precision Recovery Protocol Active
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
