'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

type TimeSlot = 'DAWN' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

const SLOTS: { id: TimeSlot; label: string; time: string }[] = [
    { id: 'DAWN', label: '새벽', time: '05:00' },
    { id: 'MORNING', label: '오전', time: '08:00' },
    { id: 'AFTERNOON', label: '오후', time: '12:00' },
    { id: 'EVENING', label: '저녁', time: '18:00' },
    { id: 'NIGHT', label: '심야', time: '22:00' }
];

export default function DailyFlowTimeline() {
    const [scores, setScores] = useState<Record<TimeSlot, number>>({
        DAWN: 0, MORNING: 0, AFTERNOON: 0, EVENING: 0, NIGHT: 0
    });
    const [activeSlot, setActiveSlot] = useState<TimeSlot>('DAWN');

    useEffect(() => {
        // 현재 시간대에 맞는 활성 슬롯 설정
        const updateActiveSlot = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 8) setActiveSlot('DAWN');
            else if (hour >= 8 && hour < 12) setActiveSlot('MORNING');
            else if (hour >= 12 && hour < 18) setActiveSlot('AFTERNOON');
            else if (hour >= 18 && hour < 22) setActiveSlot('EVENING');
            else setActiveSlot('NIGHT');
        };

        updateActiveSlot();

        // RoutineCard에서 발생하는 점수 업데이트 이벤트 리스너
        const handleRoutineUpdate = (e: any) => {
            const { slot, score } = e.detail;
            setScores(prev => ({ ...prev, [slot]: score }));
        };

        window.addEventListener('routine_updated', handleRoutineUpdate);
        
        // 초기 로컬 스토리지 데이터 로드 (필요시)
        const saved = localStorage.getItem('routine_completions');
        if (saved) {
            const completed = JSON.parse(saved) as string[];
            const newScores = { ...scores };
            SLOTS.forEach(s => {
                const count = completed.filter(id => id.startsWith(s.id.toLowerCase())).length;
                newScores[s.id] = Math.round((count / 3) * 100);
            });
            setScores(newScores);
        }

        return () => window.removeEventListener('routine_updated', handleRoutineUpdate);
    }, []);

    return (
        <Card className="bg-surface/30 border-line rounded-[32px] overflow-hidden backdrop-blur-sm">
            <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-obsidian flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        데일리 회복 타임라인
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold opacity-60">오늘의 회복 흐름</Badge>
                </div>

                <div className="relative flex justify-between items-start">
                    {/* Background Line */}
                    <div className="absolute top-6 left-0 right-0 h-0.5 bg-line z-0" />
                    
                    {/* Animated Progress Line */}
                    <motion.div 
                        className="absolute top-6 left-0 h-0.5 bg-primary z-0 origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: (SLOTS.findIndex(s => s.id === activeSlot) / (SLOTS.length - 1)) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />

                    {SLOTS.map((slot, idx) => {
                        const isActive = slot.id === activeSlot;
                        const isPast = SLOTS.findIndex(s => s.id === activeSlot) > idx;
                        const score = scores[slot.id];
                        const isPerfect = score === 100;

                        return (
                            <div key={slot.id} className="relative z-10 flex flex-col items-center gap-4 group">
                                {/* Node Dot */}
                                <div className="relative">
                                    <motion.div 
                                        whileHover={{ scale: 1.2 }}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                                            isActive ? 'bg-primary border-primary text-background shadow-lg shadow-primary/30 scale-110' :
                                            isPast ? 'bg-white border-primary/30 text-primary' : 'bg-white border-line text-slate/30'
                                        }`}
                                    >
                                        {isPerfect ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-[10px] font-black">{slot.label}</span>}
                                    </motion.div>
                                    
                                    {/* Progress Ring for each node */}
                                    {score > 0 && score < 100 && (
                                        <div className="absolute -inset-1 pointer-events-none">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="24" cy="24" r="22" fill="transparent" stroke="currentColor" strokeWidth="2" 
                                                    strokeDasharray={138} strokeDashoffset={138 - (138 * score) / 100}
                                                    className="text-primary/40" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Label Area */}
                                <div className="text-center space-y-1">
                                    <p className={`text-[10px] font-black tracking-tighter transition-colors ${isActive ? 'text-primary' : 'text-slate/60'}`}>
                                        {slot.time}
                                    </p>
                                    {score > 0 && (
                                        <motion.p 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-[9px] font-bold text-primary"
                                        >
                                            {score}점
                                        </motion.p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
