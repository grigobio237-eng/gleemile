'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Play,
    Pause,
    RotateCcw,
    SkipForward,
    Minimize2,
    Maximize2,
    Timer,
    Coffee,
    Zap,
    X,
} from 'lucide-react';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import SecretShopPopup from './SecretShopPopup';

interface FloatingPomodoroTimerProps {
    defaultMinimized?: boolean;
}

export default function FloatingPomodoroTimer({
    defaultMinimized = true,
}: FloatingPomodoroTimerProps) {
    const [showSecretShop, setShowSecretShop] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const {
        mode,
        status,
        timeRemaining,
        completedSessions,
        totalFocusTime,
        isMinimized,
        progress,
        start,
        pause,
        resume,
        reset,
        skip,
        toggleMinimize,
        formatTime,
        getModeLabel,
        getModeColor,
    } = usePomodoroTimer(
        {},
        () => {
            // onBreakStart - show secret shop
            setShowSecretShop(true);
        },
        () => {
            // onSessionComplete
            console.log('Session completed!');
        }
    );

    // Initial minimize state
    useEffect(() => {
        if (defaultMinimized && status === 'idle') {
            // Timer starts minimized by default
        }
    }, [defaultMinimized, status]);

    if (!isVisible) return null;

    // Minimized view
    if (isMinimized) {
        return (
            <>
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <button
                        onClick={toggleMinimize}
                        aria-label="타이머 열기"
                        className={`w-16 h-16 rounded-full ${getModeColor()} text-white shadow-2xl flex items-center justify-center group hover:scale-110 transition-transform relative`}
                    >
                        {status === 'running' ? (
                            <>
                                <span className="text-lg font-black">{formatTime(timeRemaining).split(':')[0]}</span>
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                </span>
                            </>
                        ) : (
                            <Timer className="w-6 h-6" />
                        )}
                    </button>
                </motion.div>

                <SecretShopPopup
                    open={showSecretShop}
                    onOpenChange={setShowSecretShop}
                />
            </>
        );
    }

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="fixed bottom-6 right-6 z-50 w-80"
                >
                    <div className="bg-white rounded-[32px] shadow-2xl border border-line overflow-hidden">
                        {/* Header */}
                        <div className={`${getModeColor()} text-white p-4 relative overflow-hidden`}>
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16" />
                            </div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {mode === 'focus' ? (
                                        <Zap className="w-5 h-5" />
                                    ) : (
                                        <Coffee className="w-5 h-5" />
                                    )}
                                    <div>
                                        <h3 className="text-sm font-bold">{getModeLabel()}</h3>
                                        <p className="text-[10px] opacity-70">
                                            {completedSessions}회 완료 · 총 {Math.floor(totalFocusTime / 60)}분 집중
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={toggleMinimize}
                                        aria-label="최소화"
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                    >
                                        <Minimize2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsVisible(false)}
                                        aria-label="닫기"
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Timer Display */}
                        <div className="p-6 text-center">
                            <div className="relative w-40 h-40 mx-auto mb-4">
                                {/* Progress Ring */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        className="text-mist"
                                    />
                                    <motion.circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * progress) / 100}
                                        strokeLinecap="round"
                                        className={mode === 'focus' ? 'text-chapter-accent' : 'text-status-good'}
                                        initial={{ strokeDashoffset: 440 }}
                                        animate={{ strokeDashoffset: 440 - (440 * progress) / 100 }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </svg>

                                {/* Time Display */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-black text-obsidian tracking-tighter text-4xl">
                                        {formatTime(timeRemaining)}
                                    </span>
                                    <span className="text-xs text-slate font-medium mt-1">
                                        {mode === 'focus' ? '남은 집중 시간' : '휴식 중'}
                                    </span>
                                </div>
                            </div>

                            {/* Session Dots */}
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full transition-all ${i <= (completedSessions % 4) || (completedSessions % 4 === 0 && completedSessions > 0 && i === 4)
                                            ? 'bg-chapter-accent'
                                            : 'bg-mist border border-line'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={reset}
                                    className="w-12 h-12 rounded-full border-2"
                                    disabled={status === 'idle'}
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </Button>

                                {status === 'running' ? (
                                    <Button
                                        size="icon"
                                        onClick={pause}
                                        className="w-16 h-16 rounded-full bg-obsidian hover:bg-obsidian/90 shadow-xl"
                                    >
                                        <Pause className="w-7 h-7" />
                                    </Button>
                                ) : (
                                    <Button
                                        size="icon"
                                        onClick={status === 'paused' ? resume : start}
                                        className={`w-16 h-16 rounded-full ${getModeColor()} hover:opacity-90 shadow-xl`}
                                    >
                                        <Play className="w-7 h-7 ml-1" />
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={skip}
                                    className="w-12 h-12 rounded-full border-2"
                                >
                                    <SkipForward className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Quick Tips */}
                            {mode === 'focus' && status === 'running' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-3 bg-chapter-accent/5 rounded-2xl border border-chapter-accent/10"
                                >
                                    <p className="text-xs text-chapter-accent font-medium">
                                        💡 집중이 흐려지면 깊은 호흡 3번으로 리셋하세요
                                    </p>
                                </motion.div>
                            )}

                            {mode !== 'focus' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-3 bg-status-good/5 rounded-2xl border border-status-good/10"
                                >
                                    <p className="text-xs text-status-good font-medium">
                                        ☕ 휴식 시간! 스트레칭이나 물 한 잔 어때요?
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowSecretShop(true)}
                                        className="mt-2 text-xs font-bold text-chapter-accent"
                                    >
                                        🎁 특별 추천 보기
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <SecretShopPopup
                open={showSecretShop}
                onOpenChange={setShowSecretShop}
            />
        </>
    );
}
