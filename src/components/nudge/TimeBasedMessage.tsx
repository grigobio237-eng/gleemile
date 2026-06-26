'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Coffee, Sunrise, Sunset, AlertTriangle, X, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeBasedContent {
    icon: React.ReactNode;
    greeting: string;
    message: string;
    tip: string;
    lossAversionMessage?: string;
    recommendedProducts: string[];
    color: string;
    bgColor: string;
}

const getTimeOfDay = (): TimeOfDay => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
};

const TIME_BASED_CONTENT: Record<TimeOfDay, TimeBasedContent> = {
    morning: {
        icon: <Sunrise className="w-5 h-5" />,
        greeting: '좋은 아침이에요!',
        message: '오늘 하루를 활기차게 시작해볼까요? 지금 기분은 어떠신가요?',
        tip: '아침에 물 한 잔으로 신진대사를 깨워보세요 💧',
        lossAversionMessage: '아침 루틴을 건너뛰면 오전 집중력이 30% 저하될 수 있어요',
        recommendedProducts: ['에너지 부스터', '모닝 비타민', '그린티'],
        color: 'text-primary',
        bgColor: 'bg-white/90 md:bg-amber-50/90 backdrop-blur-xl border-primary/30/50',
    },
    afternoon: {
        icon: <Sun className="w-5 h-5" />,
        greeting: '오후 슬럼프 시간대예요',
        message: '자연스러운 방법으로 리셋해볼까요? 지금 기분은 어떠신가요?',
        tip: '테아닌 차 한 잔이 카페인 부작용 없이 집중력을 높여줘요 ☕',
        lossAversionMessage: '지금 회복하지 않으면 저녁까지 피로가 20% 더 누적될 수 있어요',
        recommendedProducts: ['테아닌 차', '아로마 스프레이', '명상 가이드'],
        color: 'text-chapter-accent',
        bgColor: 'bg-white/90 md:bg-chapter-accent/10 backdrop-blur-xl border-chapter-accent/30',
    },
    evening: {
        icon: <Sunset className="w-5 h-5" />,
        greeting: '수고한 하루를 마무리할 시간이에요',
        message: '저녁에는 화면보다 휴식에 집중해보세요. 오늘 하루, 어떠셨나요?',
        tip: '취침 2시간 전부터 블루라이트를 줄이면 수면 질이 높아져요 🌙',
        lossAversionMessage: '지금 휴식을 시작하지 않으면 다음 날 피로 회복이 40% 느려질 수 있어요',
        recommendedProducts: ['블루라이트 차단 안경', '수면 스프레이', '릴렉싱 오일'],
        color: 'text-secondary',
        bgColor: 'bg-white/90 md:bg-purple-50/90 backdrop-blur-xl border-purple-200/50',
    },
    night: {
        icon: <Moon className="w-5 h-5" />,
        greeting: '밤 늦게까지 깨어 계시네요',
        message: '충분한 수면은 최고의 회복 프로토콜이에요. 지금 기분은 어떠신가요?',
        tip: '지금이라도 화면을 끄고 눈을 감아보세요. 5분 호흡이 도움이 돼요 😴',
        lossAversionMessage: '지금 자지 않으면 내일 컨디션이 50% 이상 저하될 수 있어요',
        recommendedProducts: ['수면 유도 백색소음', '멜라토닌', '허브 베개'],
        color: 'text-secondary',
        bgColor: 'bg-white/90 md:bg-indigo-50/90 backdrop-blur-xl border-secondary/30/50',
    },
};

const MOOD_EMOJIS = [
    { score: 1, emoji: '😫', label: '매우 지침' },
    { score: 2, emoji: '🙁', label: '지침' },
    { score: 3, emoji: '😐', label: '보통' },
    { score: 4, emoji: '🙂', label: '좋음' },
    { score: 5, emoji: '🤩', label: '매우 좋음' }
];

interface TimeBasedMessageProps {
    variant?: 'full' | 'compact' | 'popup';
    showLossAversion?: boolean;
    onDismiss?: () => void;
    className?: string;
}

export default function TimeBasedMessage({
    variant = 'compact',
    showLossAversion = true,
    onDismiss,
    className = '',
}: TimeBasedMessageProps) {
    const router = useRouter();
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    // Mood tracker state
    const [isSavingMood, setIsSavingMood] = useState(false);
    const [moodSaved, setMoodSaved] = useState(false);
    const [selectedMood, setSelectedMood] = useState<number | null>(null);

    useEffect(() => {
        setTimeOfDay(getTimeOfDay());
        setMounted(true);

        const dismissedKey = `nudge_dismissed_${new Date().toDateString()}`;
        const wasDismissed = localStorage.getItem(dismissedKey);
        if (wasDismissed) {
            setDismissed(true);
        }

        const interval = setInterval(() => {
            setTimeOfDay(getTimeOfDay());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const content = useMemo(() => (timeOfDay ? TIME_BASED_CONTENT[timeOfDay] : null), [timeOfDay]);

    const handleDismiss = () => {
        setDismissed(true);
        const dismissedKey = `nudge_dismissed_${new Date().toDateString()}`;
        localStorage.setItem(dismissedKey, 'true');
        onDismiss?.();
    };

    const handleMoodClick = async (score: number) => {
        if (isSavingMood || moodSaved) return;
        
        setIsSavingMood(true);
        setSelectedMood(score);
        
        try {
            await fetch('/api/user/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moodScore: score,
                    timeOfDay: timeOfDay,
                    sessionId: 'session_' + Math.random().toString(36).substring(2, 9)
                })
            });
            
            setMoodSaved(true);
            setIsSavingMood(false);
            
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
            
            setTimeout(() => {
                handleDismiss();
                router.push(`/?action=diagnose&mood=${score}`);
            }, 1500);
            
        } catch (err) {
            console.error('Failed to save mood', err);
            setIsSavingMood(false);
            setTimeout(() => {
                handleDismiss();
                router.push(`/?action=diagnose&mood=${score}`);
            }, 1500);
        }
    };

    if (!mounted || dismissed || !content) return null;

    if (variant === 'compact') {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`${content.bgColor} border rounded-2xl p-4 ${className}`}
            >
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${content.color} bg-white/80 flex items-center justify-center flex-shrink-0`}>
                        {content.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className={`text-sm font-bold ${content.color}`}>{content.greeting}</p>
                                <p className="text-xs text-slate mt-0.5">{content.message}</p>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-slate/50 hover:text-slate p-1"
                                aria-label="닫기"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-obsidian font-medium mt-2 bg-white/60 rounded-lg px-2 py-1.5">
                            {content.tip}
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (variant === 'full') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${content.bgColor} border rounded-[32px] p-6 relative overflow-hidden ${className}`}
            >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/30 rounded-full blur-2xl" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl ${content.color} bg-white/80 flex items-center justify-center shadow-sm`}>
                                {content.icon}
                            </div>
                            <div>
                                <p className={`text-lg font-black ${content.color}`}>{content.greeting}</p>
                                <p className="text-sm text-slate">{content.message}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-slate/50 hover:text-slate p-2"
                            aria-label="닫기"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-white/60 rounded-2xl p-4 mb-4">
                        <p className="text-sm text-obsidian font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-reward-gold" />
                            {content.tip}
                        </p>
                    </div>

                    {showLossAversion && content.lossAversionMessage && (
                        <div className="bg-status-amber/10 border border-status-amber/20 rounded-xl p-3 mb-4">
                            <p className="text-xs text-status-amber font-medium flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                {content.lossAversionMessage}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Link href="/products">
                            <Button size="sm" className="rounded-xl font-bold">
                                <Zap className="w-4 h-4 mr-1" />
                                추천 상품 보기
                            </Button>
                        </Link>
                        <Link href="/utils/breathing">
                            <Button variant="outline" size="sm" className="rounded-xl font-medium">
                                호흡 가이드
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Popup variant with Micro-Journaling
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`fixed bottom-4 left-4 right-4 md:bottom-20 md:right-6 md:left-auto z-[60] w-auto md:w-80 ${content.bgColor} border rounded-[24px] p-5 shadow-2xl ${className}`}
            >
                {!moodSaved && (
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 text-slate/50 hover:text-slate p-1"
                        aria-label="닫기"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                <div className="flex items-center gap-3 mb-3 pr-6">
                    <div className={`w-10 h-10 rounded-xl ${content.color} bg-white/80 flex items-center justify-center flex-shrink-0`}>
                        {content.icon}
                    </div>
                    <div className="min-w-0">
                        <p className={`text-sm font-bold ${content.color} truncate`}>{content.greeting}</p>
                        <p className="text-[10px] md:text-xs text-slate truncate">{content.message}</p>
                    </div>
                </div>

                {!moodSaved ? (
                    <div className="mt-4">
                        <div className="flex justify-between items-center bg-white/50 rounded-2xl p-2 border border-white/60">
                            {MOOD_EMOJIS.map((mood) => (
                                <button
                                    key={mood.score}
                                    onClick={() => handleMoodClick(mood.score)}
                                    disabled={isSavingMood}
                                    className={`text-2xl md:text-3xl hover:scale-110 active:scale-95 transition-transform p-1 rounded-xl
                                        ${selectedMood === mood.score ? 'bg-white shadow-sm ring-2 ring-primary/20' : 'hover:bg-white/40'}
                                    `}
                                    title={mood.label}
                                >
                                    {mood.emoji}
                                </button>
                            ))}
                        </div>
                        {isSavingMood && (
                            <p className="text-[10px] text-center text-slate mt-2 animate-pulse">기록 중...</p>
                        )}
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 bg-primary/10 border border-primary/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2"
                    >
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        <div>
                            <p className="text-sm font-bold text-primary">기록이 저장되었습니다</p>
                            <p className="text-[10px] text-primary/80 mt-0.5">정확한 상태 분석을 위해 리듬체크 화면으로 이동합니다...</p>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
