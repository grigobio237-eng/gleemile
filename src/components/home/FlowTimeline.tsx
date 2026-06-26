'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface FlowDay {
  day: number;
  date: string;
  type: 'PHOTO' | 'TEXT' | 'NONE';
  content?: string;
  rhythmScore: number;
  rhythmType?: string;
}

interface FlowTimelineProps {
  data: FlowDay[];
  currentDay: number;
}

export default function FlowTimeline({ data, currentDay }: FlowTimelineProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const existing = data.find(d => d.day === i + 1);
    return existing || { day: i + 1, date: '', type: 'NONE', rhythmScore: 0 };
  });

  return (
    <div className="w-full bg-white border border-line rounded-[32px] p-5 shadow-xl shadow-primary/5 relative overflow-hidden">
      {/* 백그라운드 데코 */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-line/30">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-xs font-black text-obsidian tracking-tight">7일 회복 흐름</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
            {currentDay >= 7 ? '여정 완주 ✨' : `DAY ${currentDay} / 7`}
          </span>
          <span className="text-xs font-black text-primary tracking-tight">
            {Math.min(100, Math.round((currentDay / 7) * 100))}%
          </span>
        </div>
      </div>

      {/* Progress Summary Bar */}
      <div className="h-2 bg-mist/60 rounded-full overflow-hidden p-0.5 border border-line/10 mb-4 shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentDay / 7) * 100}%` }}
          className="h-full bg-primary rounded-full"
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Aligned Node Row */}
      <div className="relative flex justify-between items-center w-full px-1">
        {/* Connecting line behind circles */}
        <div className="absolute left-4 right-4 h-[1.5px] bg-line/20 top-1/2 -translate-y-1/2 z-0" />
        <div 
          className="absolute left-4 right-4 h-[1.5px] bg-primary/40 top-1/2 -translate-y-1/2 z-0 origin-left transition-all duration-1000"
          style={{ transform: `scaleX(${Math.min(1, (currentDay - 1) / 6)})` }}
        />

        {days.map((dayObj, idx) => {
          const dayNum = dayObj.day;
          const isCompleted = dayNum <= currentDay;
          const isCurrent = dayNum === currentDay;

          return (
            <div key={dayNum} className="relative z-10 flex flex-col items-center">
              {/* Pebble Node Circle */}
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                  isCompleted 
                    ? 'bg-primary text-white font-black'
                    : 'bg-white border border-line text-slate/30 font-bold'
                } ${isCurrent ? 'scale-110 ring-4 ring-primary/15 border-primary shadow-lg shadow-primary/10' : ''}`}
              >
                <span className="text-[10px]">D{dayNum}</span>
              </div>

              {/* Status Indicator Dot */}
              <div className="mt-1.5 flex flex-col items-center">
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-primary animate-scale-in" />
                ) : (
                  <span className="w-1 h-1 bg-slate/30 rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
