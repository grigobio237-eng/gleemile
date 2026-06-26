'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { updateChecklist } from '@/lib/progress';

interface LocalCheckIn {
    date: string;
    completed: boolean;
}

interface CheckInContent {
    greeting: string;
    question: string;
    options: {
        label: string;
        value: string;
        emoji: string;
    }[];
}

export default function DailyCheckInPopup() {
    const { data: session } = useSession();
    const [isVisible, setIsVisible] = useState(false);
    const [content, setContent] = useState<CheckInContent | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
        // Only check if user is logged in
        if (!session?.user) return;

        const checkDailyStatus = async () => {
            // 1. Check LocalStorage first to avoid API call if already done
            const today = new Date().toDateString();
            const storageKey = `daily_checkin_${session.user?.email}`;
            const lastCheckIn = localStorage.getItem(storageKey);

            if (lastCheckIn === today) {
                return; // Already checked in today
            }

            // 1.1 Check SessionStorage to avoid re-showing in same session if dismissed
            const sessionKey = `daily_checkin_dismissed_${session.user?.email}`;
            if (sessionStorage.getItem(sessionKey)) {
                return;
            }

            // 2. Fetch question from API
            try {
                setLoading(true);
                const res = await fetch('/api/ai/daily-checkin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: today })
                });

                if (res.ok) {
                    const data = await res.json();
                    setContent(data);
                    // Show popup after a small delay for better UX
                    setTimeout(() => setIsVisible(true), 2000);
                }
            } catch (error) {
                console.error('Failed to fetch check-in:', error);
            } finally {
                setLoading(false);
            }
        };

        checkDailyStatus();
    }, [session]);

    const handleClose = () => {
        setIsVisible(false);
        // Mark as dismissed for today in LocalStorage even if not answered
        const today = new Date().toDateString();
        if (session?.user?.email) {
            localStorage.setItem(`daily_checkin_${session.user.email}`, today);
            // Also set in SessionStorage for extra safety during current navigation
            sessionStorage.setItem(`daily_checkin_dismissed_${session.user.email}`, 'true');
        }
    };

    const handleAnswer = async (value: string) => {
        setSelectedOption(value);

        // Simulate API submission / reward logic
        // In a real app, you would send this to the server to track history

        // Mark as completed in LocalStorage
        const today = new Date().toDateString();
        if (session?.user?.email) {
            localStorage.setItem(`daily_checkin_${session.user.email}`, today);
        }

        // Award streak/points (Client-side simulation for immediate feedback)
        // Real logic should happen on server or be synced
        const { updateChecklist } = require('@/lib/progress');
        updateChecklist('daily_checkin', 10); // 10 points for check-in

        // Show feedback animation
        setShowFeedback(true);

        // Auto close after feedback
        setTimeout(() => {
            setIsVisible(false);
            setShowFeedback(false);
        }, 2500);
    };

    if (!isVisible || !content) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    {/* Decorative Header */}
                    <div className="h-32 bg-gradient-to-br from-chapter-accent/20 to-purple-100 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-chapter-accent/20 rounded-full blur-2xl" />
                        <div className="absolute left-10 bottom-10 w-20 h-20 bg-primary-container rounded-full blur-xl" />

                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white/80 rounded-full transition-colors z-10"
                            aria-label="닫기"
                        >
                            <X className="w-5 h-5 text-slate" />
                        </button>

                        <div className="absolute bottom-6 left-8 flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl">
                                🤖
                            </div>
                            <div>
                                <p className="text-xs font-bold text-chapter-accent uppercase tracking-wider">Youniqle Recovery Coach</p>
                                <p className="text-lg font-black text-obsidian">Daily Check-in</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {!showFeedback ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                {/* Greeting & Question */}
                                <div className="space-y-2">
                                    <p className="text-lg text-obsidian font-bold leading-snug">
                                        {content.greeting}
                                    </p>
                                    <p className="text-slate text-sm">
                                        {content.question}
                                    </p>
                                </div>

                                {/* Options */}
                                <div className="grid gap-3">
                                    {content.options.map((option) => (
                                        <motion.button
                                            key={option.value}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleAnswer(option.value)}
                                            className="flex items-center gap-4 p-4 rounded-2xl border border-line hover:border-chapter-accent hover:bg-chapter-accent/5 transition-all text-left group"
                                        >
                                            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                                {option.emoji}
                                            </span>
                                            <span className="font-medium text-obsidian group-hover:text-chapter-accent">
                                                {option.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-status-good/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="w-10 h-10 text-status-good animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-black text-obsidian mb-2">체크인 완료!</h3>
                                <p className="text-slate mb-6">오늘도 활기찬 하루 보내세요 💪</p>
                                <div className="inline-flex items-center gap-2 bg-reward-gold/10 text-reward-gold font-bold px-4 py-2 rounded-full">
                                    <span>+10 P</span>
                                    <span className="text-xs opacity-75">획득</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
