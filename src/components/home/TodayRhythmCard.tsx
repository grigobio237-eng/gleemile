'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Moon, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

interface TodayRhythmCardProps {
  score: number;
  userName: string;
}

export default function TodayRhythmCard({ score, userName }: TodayRhythmCardProps) {
  const [missions, setMissions] = React.useState<any[]>([]);
  const [loadingMissions, setLoadingMissions] = React.useState(true);

  React.useEffect(() => {
    const fetchMissions = async () => {
      try {
        const res = await fetch('/api/user/missions');
        if (res.ok) {
          const data = await res.json();
          setMissions(data.missions);
        }
      } catch (err) {
        console.error('Failed to fetch missions:', err);
      } finally {
        setLoadingMissions(false);
      }
    };
    fetchMissions();
  }, []);

  const getRhythmType = () => {
    if (score < 40) return { 
      type: "수면 리듬 주의형", 
      description: "오늘 저녁에는 따뜻하게 일찍 이완을 시작해보세요.",
      icon: <Moon className="w-4 h-4 text-primary" />
    };
    if (score < 70) return { 
      type: "회복 성장형", 
      description: "몸의 자연 치유력이 깨어나고 있어요. 화이팅!",
      icon: <Sparkles className="w-4 h-4 text-primary animate-pulse" />
    };
    return { 
      type: "에너지 충전형", 
      description: "안정적인 리듬입니다. 나만의 건강 루틴을 지켜보세요.",
      icon: <Zap className="w-4 h-4 text-secondary" />
    };
  };

  const { type, description, icon } = getRhythmType();

  const handleMissionClick = (mission: any) => {
    if (!mission.isCompleted && mission.href) {
      window.location.href = mission.href;
    }
  };

  // Circular Score Logic
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-line rounded-[32px] p-5 shadow-xl shadow-primary/5 relative overflow-hidden"
    >
      {/* 미니멀 헤더: 점수 서클 및 가이드 1열 가로 배치 */}
      <div className="flex gap-4 items-center relative z-10 pb-3 mb-4 border-b border-line/30">
        
        {/* Left: 콤팩트 원형 다이얼 */}
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90">
            <circle
              cx="50%" cy="50%" r={radius + "%"}
              className="fill-none stroke-mist/50 stroke-[6px]"
            />
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              cx="50%" cy="50%" r={radius + "%"}
              className="fill-none stroke-primary stroke-[6px] stroke-linecap-round"
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-[24px] font-black text-obsidian tracking-tight leading-none">{score}</span>
            <span className="text-[7.5px] font-black text-primary/60 tracking-wider mt-0.5 uppercase">SCORE</span>
          </div>
        </div>

        {/* Right: 핵심 리듬체크 라벨 및 설명 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="p-0.5 bg-primary/5 rounded-full shrink-0">{icon}</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-wider">{type}</span>
          </div>
          <h3 className="text-xs font-black text-obsidian tracking-tight leading-snug">
            "{userName}님, {description}"
          </h3>
        </div>
      </div>

      {/* 리액션 미션 영역: 슬림한 한 행 체크리스트 */}
      <div className="space-y-2 relative z-10">
        <p className="text-[9px] font-black text-slate/40 uppercase tracking-widest">나를 위한 오늘의 작은 행동</p>
        <div className="grid grid-cols-1 gap-2">
          {loadingMissions ? (
            [1, 2].map(i => (
              <div key={i} className="h-10 bg-mist/30 rounded-2xl animate-pulse" />
            ))
          ) : (
            missions.map((mission, idx) => (
              <div 
                key={idx} 
                onClick={() => handleMissionClick(mission)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all group ${
                  mission.isCompleted 
                    ? 'bg-background/40 border border-primary/10 opacity-60' 
                    : 'bg-white border border-line/40 shadow-sm hover:shadow hover:border-primary/20 cursor-pointer'
                }`}
              >
                <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center border transition-all ${
                  mission.isCompleted 
                    ? 'bg-primary border-primary shadow' 
                    : 'bg-surface border-line'
                }`}>
                  {mission.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-black transition-all line-clamp-1 ${
                    mission.isCompleted ? 'text-foreground/30 line-through' : 'text-obsidian/90'
                  }`}>
                    {mission.text}
                  </span>
                  {!mission.isCompleted && (
                    <div className="w-5 h-5 shrink-0 rounded-full bg-obsidian flex items-center justify-center group-hover:bg-primary transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Decorative Accents */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-xl pointer-events-none" />
    </motion.div>
  );
}
