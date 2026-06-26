'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles, Trophy, Loader2 } from 'lucide-react';
import { getKSTDate } from '@/lib/date';

interface Mission {
    id: string;
    title: string;
    desc: string;
    icon: string;
}

export default function DailySmallActions({ score = 50, initialData }: { score?: number, initialData?: any }) {
    const [missions, setMissions] = useState<Mission[]>(initialData?.tasks || []);
    const [completedIds, setCompletedIds] = useState<string[]>(initialData?.completedTasks || []);
    const [loading, setLoading] = useState(!initialData);
    const [title, setTitle] = useState(initialData?.title || '오늘의 회복 미션');

    useEffect(() => {
        if (initialData && missions.length > 0) {
            setLoading(false);
            return;
        }
        fetchDailyMissions();
    }, [score, initialData]);

    const fetchDailyMissions = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ai/routine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeSlot: 'DAILY',
                    userStatus: { score }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.tasks) {
                    setMissions(data.tasks);
                    setTitle(data.title || '오늘의 회복 미션');
                    if (data.completedTasks) {
                        setCompletedIds(data.completedTasks);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch daily missions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMission = async (missionId: string) => {
        const isCompleted = !completedIds.includes(missionId);
        const next = isCompleted
            ? [...completedIds, missionId]
            : completedIds.filter(id => id !== missionId);
        
        setCompletedIds(next);

        try {
            await fetch('/api/ai/routine/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: missionId,
                    slot: 'DAILY',
                    isCompleted
                })
            });
        } catch (err) {
            console.error('Failed to persist mission completion:', err);
        }
    };

    const completedCount = completedIds.length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs font-black text-slate/40 uppercase tracking-widest">gleemile이 오늘의 하루를 설계 중...</p>
            </div>
        );
    }
    return (
        <div className="space-y-2 py-1 md:space-y-6 md:py-4">
            <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                        <h3 className="text-sm md:text-lg font-black text-obsidian tracking-tight">{title}</h3>
                        <div className="px-1.5 py-0.5 rounded-full bg-reward-gold/10 text-reward-gold text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5">
                            <Trophy className="w-2.5 h-2.5" /> +10P
                        </div>
                    </div>
                    <p className="text-[10px] md:text-xs font-medium text-slate/60">오늘 하루 꼭 실천해야 할 3가지 루틴</p>
                </div>
                <div className="text-right leading-none">
                    <span className="font-black text-primary italic text-xl md:text-2xl">{completedCount}</span>
                    <span className="text-[10px] md:text-xs font-black text-slate/30 uppercase ml-0.5">/ {missions.length || 3}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5 md:gap-3">
                {missions.map((mission, idx) => {
                    const isDone = completedIds.includes(mission.id);
                    return (
                        <motion.div
                            key={mission.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => toggleMission(mission.id)}
                             className={`
                                 group relative flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl md:rounded-[24px] border transition-all cursor-pointer
                                 ${isDone 
                                     ? 'bg-primary/5 border-primary/20 shadow-inner' 
                                     : 'bg-white border-line hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'}
                             `}
                         >
                             <div className={`
                                 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center text-sm md:text-2xl shadow-sm transition-transform flex-shrink-0
                                 ${isDone ? 'scale-90 opacity-50' : 'group-hover:scale-110'}
                                 bg-mist/50
                             `}>
                                 {mission.icon}
                             </div>
                             
                             <div className="flex-1 min-w-0">
                                 <h4 className={`text-[11px] md:text-base font-bold transition-colors truncate ${isDone ? 'text-slate/40 line-through' : 'text-obsidian'}`}>
                                     {mission.title}
                                 </h4>
                                 <p className="text-[9px] md:text-xs font-medium text-slate/40 line-clamp-1">{mission.desc}</p>
                             </div>
 
                             <div className={`
                                 w-5 h-5 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0
                                 ${isDone ? 'bg-primary text-white scale-110' : 'bg-mist text-slate/20 group-hover:text-primary/40'}
                             `}>
                                 {isDone ? <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <Circle className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                             </div>

                            {isDone && (
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 bg-reward-gold text-white p-0.5 rounded-full shadow-lg"
                                >
                                    <Sparkles className="w-2.5 h-2.5" />
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {completedCount === missions.length && missions.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 md:p-4 bg-obsidian text-white rounded-xl md:rounded-2xl text-center"
                >
                    <p className="text-xs md:text-sm font-black italic tracking-tight">
                        🎉 오늘의 회복 루틴을 모두 완료했습니다! 꾸준한 실천이 내일의 에너지를 만듭니다.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
