'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TimeSlot = 'DAWN' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

interface Task {
    id: string;
    title: string;
    desc: string;
    icon: string;
}

const getTimeSlot = (date: Date): TimeSlot => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 8) return 'DAWN';
    if (hour >= 8 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 18) return 'AFTERNOON';
    if (hour >= 18 && hour < 22) return 'EVENING';
    return 'NIGHT';
};

const THEMES: Record<TimeSlot, string> = {
    DAWN: 'from-indigo-500 to-purple-500',
    MORNING: 'from-amber-400 to-orange-500',
    AFTERNOON: 'from-blue-400 to-primary',
    EVENING: 'from-purple-600 to-obsidian',
    NIGHT: 'from-slate-900 to-black'
};

const LABELS: Record<TimeSlot, string> = {
    DAWN: '새벽 루틴', MORNING: '오전 루틴', AFTERNOON: '오후 루틴', EVENING: '저녁 루틴', NIGHT: '심야 루틴'
};

export default function RoutineCard({ userStatus, initialData }: { userStatus?: any, initialData?: any }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>(initialData?.tasks || []);
    const [title, setTitle] = useState(initialData?.title || '');
    const [loading, setLoading] = useState(!initialData);
    const [completedTasks, setCompletedTasks] = useState<string[]>(initialData?.completedTasks || []);
    
    const fetchedRef = React.useRef<string | null>(initialData ? getTimeSlot(new Date()) : null);
    const currentSlot = getTimeSlot(currentTime);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        
        const loadData = async () => {
            // Prevent double fetching for the same slot
            if (fetchedRef.current === currentSlot) return;
            
            // If we have initialData and the slot matches, skip first fetch
            if (initialData && !fetchedRef.current) {
                fetchedRef.current = currentSlot;
                return;
            }

            setLoading(true);
            await fetchAiRoutine();
            fetchedRef.current = currentSlot;
        };

        loadData();
        
        return () => clearInterval(timer);
    }, [currentSlot, initialData]);

    const fetchAiRoutine = async () => {
        try {
            const status = userStatus || { physical: 70, mental: 70, sleep: 70, weakestCategory: '에너지' };
            
            const response = await fetch('/api/ai/routine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeSlot: LABELS[currentSlot],
                    environment: { location: '서울', weather: '맑음', temp: 22, dust: '보통' },
                    userStatus: status
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.tasks) {
                    setTasks(data.tasks);
                    setTitle(data.title || `${LABELS[currentSlot]} 회복 루틴`);
                    if (data.completedTasks) {
                        setCompletedTasks(data.completedTasks);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to fetch AI routine', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (taskId: string) => {
        const isCompleted = !completedTasks.includes(taskId);
        const next = isCompleted
            ? [...completedTasks, taskId]
            : completedTasks.filter(id => id !== taskId);
        
        setCompletedTasks(next);

        try {
            await fetch('/api/ai/routine/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, slot: currentSlot, isCompleted })
            });
        } catch (err) {
            console.error('Failed to persist routine completion:', err);
        }

        window.dispatchEvent(new CustomEvent('routine_updated', { 
            detail: { slot: currentSlot, score: Math.round((next.length / (tasks.length || 1)) * 100) } 
        }));
    };

    const completedCount = completedTasks.length;
    const totalTasks = tasks.length || 3;
    const progress = Math.round((completedCount / totalTasks) * 100);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentSlot}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
            >
                <Card className="bg-obsidian border-none rounded-[20px] md:rounded-[40px] overflow-hidden shadow-2xl relative min-h-[170px] md:min-h-[300px]">
                    <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${THEMES[currentSlot]}`} />
                     
                     <CardContent className="p-3 md:p-10 relative z-10">
                         {loading ? (
                             <div className="flex flex-col items-center justify-center py-16 md:py-24 space-y-4 md:space-y-6 w-full">
                                 <div className="relative">
                                     <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-primary animate-spin" />
                                     <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping" />
                                 </div>
                                 <div className="space-y-1 md:space-y-2 text-center">
                                     <p className="text-mist font-black text-sm md:text-base tracking-tighter">
                                         gleemile이 당신을 위한 루틴을 설계 중입니다...
                                     </p>
                                     <p className="text-mist/30 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em]">
                                         회복 데이터 및 환경 분석 중
                                     </p>
                                 </div>
                             </div>
                         ) : (
                             <div className="flex flex-col gap-2.5 md:gap-8">
                                 <div className="flex justify-between items-center gap-2">
                                     <div className="space-y-0.5 md:space-y-1">
                                         <div className="flex items-center gap-2 md:gap-3">
                                             <Badge className="bg-primary text-background font-black text-[9px] md:text-[10px] uppercase tracking-widest px-2 md:px-3 py-0.5">
                                                 {LABELS[currentSlot]}
                                             </Badge>
                                             <span className="text-mist/40 text-[9px] md:text-[10px] font-bold">
                                                 {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                             </span>
                                         </div>
                                         <h3 className="text-base md:text-3xl font-black text-mist tracking-tight leading-tight">
                                             {title}
                                         </h3>
                                     </div>
                                     
                                     <div className="flex items-center gap-1.5 md:gap-4 bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl px-2 py-0.5 md:px-5 md:py-3 border border-white/10 flex-shrink-0">
                                         <div className="relative w-8 h-8 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0">
                                             <svg className="w-full h-full transform -rotate-90">
                                                 <circle cx="16" cy="16" r="13" fill="transparent" stroke="currentColor" strokeWidth="2.5" className="text-white/10 hidden md:block" />
                                                 <circle cx="16" cy="16" r="13" fill="transparent" stroke="currentColor" strokeWidth="2.5" 
                                                     strokeDasharray={82} strokeDashoffset={82 - (82 * progress) / 100}
                                                     className="text-primary transition-all duration-1000 ease-out hidden md:block" />
                                                 
                                                 <circle cx="12" cy="12" r="9" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-white/10 md:hidden" />
                                                 <circle cx="12" cy="12" r="9" fill="transparent" stroke="currentColor" strokeWidth="2" 
                                                     strokeDasharray={57} strokeDashoffset={57 - (57 * progress) / 100}
                                                     className="text-primary transition-all duration-1000 ease-out md:hidden" />
                                             </svg>
                                             <span className="absolute text-[8px] md:text-[10px] font-black text-mist">{progress}%</span>
                                         </div>
                                         <div className="text-right leading-none">
                                             <p className="text-[8px] md:text-[10px] font-bold text-mist/40 uppercase mb-0.5">회복 점수</p>
                                             <p className="text-xs md:text-xl font-black text-mist">{completedCount}/{tasks.length}</p>
                                         </div>
                                     </div>
                                 </div>
 
                                 <div className="space-y-1.5 md:space-y-4">
                                     {tasks.map((task, idx) => {
                                         const isDone = completedTasks.includes(task.id);
                                         return (
                                             <motion.div
                                                 key={task.id}
                                                 initial={{ opacity: 0, x: -20 }}
                                                 animate={{ opacity: 1, x: 0 }}
                                                 transition={{ delay: idx * 0.1 }}
                                                 onClick={() => handleToggleTask(task.id)}
                                                 className={`group cursor-pointer flex items-center gap-2 md:gap-3.5 p-2 md:p-3 rounded-xl md:rounded-2xl transition-all border ${
                                                     isDone ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                                 }`}
                                             >
                                                 <div className={`w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center text-sm md:text-2xl bg-black/20 group-hover:scale-110 transition-transform flex-shrink-0 ${isDone ? 'grayscale-0' : 'grayscale'}`}>
                                                     {task.icon}
                                                 </div>
                                                 
                                                 <div className="flex-1 min-w-0">
                                                     <h4 className={`text-sm md:text-lg font-black transition-colors truncate ${isDone ? 'text-primary' : 'text-mist'}`}>
                                                         {task.title}
                                                     </h4>
                                                     <p className="text-[11px] md:text-sm font-medium text-mist/50 line-clamp-1">
                                                         {task.desc}
                                                     </p>
                                                 </div>
 
                                                 <div className={`w-5 h-5 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isDone ? 'bg-primary text-background' : 'border-2 border-white/20 text-white/20'}`}>
                                                     {isDone ? <CheckCircle2 className="w-3.5 h-3.5 md:w-6 md:h-6" /> : <Circle className="w-3.5 h-3.5 md:w-6 md:h-6" />}
                                                 </div>
                                             </motion.div>
                                         );
                                     })}
                                 </div>
 
                                 {progress === 100 && tasks.length > 0 && (
                                     <motion.div 
                                         initial={{ opacity: 0, scale: 0.9 }}
                                         animate={{ opacity: 1, scale: 1 }}
                                         className="bg-primary/20 border border-primary/30 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3"
                                     >
                                         <Trophy className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                         <p className="text-xs md:text-sm font-black text-primary uppercase tracking-tighter">오늘의 완벽한 회복! +10 포인트 적립</p>
                                     </motion.div>
                                 )}
                             </div>
                         )}
                     </CardContent>
                 </Card>
             </motion.div>
         </AnimatePresence>
     );
 }
