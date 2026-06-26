'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Activity } from 'lucide-react';

interface RealtimeActivityBannerProps {
    className?: string;
}

export default function RealtimeActivityBanner({ className = '' }: RealtimeActivityBannerProps) {
    const [activeUsers, setActiveUsers] = useState(0);
    const [todayRecoveries, setTodayRecoveries] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Simulate loading real-time stats
        const loadStats = () => {
            // Generate realistic random numbers
            const baseUsers = 800 + Math.floor(Math.random() * 400); // 800-1200
            const baseRecoveries = 150 + Math.floor(Math.random() * 100); // 150-250

            setActiveUsers(baseUsers);
            setTodayRecoveries(baseRecoveries);
            setIsVisible(true);
        };

        // Load with delay for natural feel
        const timer = setTimeout(loadStats, 1000);

        // Periodic updates
        const updateInterval = setInterval(() => {
            setActiveUsers((prev) => {
                const change = Math.floor(Math.random() * 20) - 10; // -10 to +10
                return Math.max(500, prev + change);
            });
            setTodayRecoveries((prev) => {
                const change = Math.floor(Math.random() * 3); // 0 to 2
                return prev + change;
            });
        }, 30000); // Update every 30 seconds

        return () => {
            clearTimeout(timer);
            clearInterval(updateInterval);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-r from-chapter-accent/5 to-status-good/5 border border-chapter-accent/10 rounded-2xl p-4 ${className}`}
        >
            <div className="flex items-center justify-center gap-8 flex-wrap">
                {/* Active Users */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-chapter-accent/10 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-chapter-accent" />
                    </div>
                    <div>
                        <p className="text-xs text-slate font-medium">지금 이 순간</p>
                        <p className="text-lg font-black text-obsidian">
                            <motion.span
                                key={activeUsers}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {activeUsers.toLocaleString()}
                            </motion.span>
                            <span className="text-sm font-bold text-chapter-accent ml-1">명이 함께 리셋 중</span>
                        </p>
                    </div>
                    <div className="ml-2 flex items-center gap-1 text-status-good text-xs font-bold">
                        <Activity className="w-3 h-3" />
                        <span className="animate-pulse">LIVE</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-10 w-px bg-line hidden sm:block" />

                {/* Today's Recoveries */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-status-good/10 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-status-good" />
                    </div>
                    <div>
                        <p className="text-xs text-slate font-medium">오늘 회복 완료</p>
                        <p className="text-lg font-black text-obsidian">
                            <motion.span
                                key={todayRecoveries}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {todayRecoveries.toLocaleString()}
                            </motion.span>
                            <span className="text-sm font-bold text-status-good ml-1">건</span>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
