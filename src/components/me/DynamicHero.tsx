'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Cloud, Zap, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface DynamicHeroProps {
    userName: string;
}

export default function DynamicHero({ userName }: DynamicHeroProps) {
    const hour = new Date().getHours();

    let greeting = "";
    let Icon = Sun;
    let iconColor = "text-amber-400";
    let bgGradient = "from-[#0F172A] via-[#1E293B] to-[#0F172A]"; // Default Dark Premium
    let accentColor = "bg-primary/20";
    let timeText = "morning";

    if (hour >= 5 && hour < 12) {
        greeting = `Good Morning`;
        Icon = Sun;
        iconColor = "text-amber-400";
        bgGradient = "from-[#1e293b] via-[#0f172a] to-[#1e293b]";
        accentColor = "bg-orange-500/20";
        timeText = "morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = `Good Afternoon`;
        Icon = Zap;
        iconColor = "text-sky-400";
        bgGradient = "from-[#0c4a6e] via-[#075985] to-[#0c4a6e]";
        accentColor = "bg-cyan-500/20";
        timeText = "afternoon";
    } else if (hour >= 17 && hour < 22) {
        greeting = `Good Evening`;
        Icon = Cloud;
        iconColor = "text-indigo-400";
        bgGradient = "from-[#312e81] via-[#1e1b4b] to-[#312e81]";
        accentColor = "bg-rose-500/20";
        timeText = "evening";
    } else {
        greeting = `Quiet Night`;
        Icon = Moon;
        iconColor = "text-purple-400";
        bgGradient = "from-[#020617] via-[#0f172a] to-[#020617]";
        accentColor = "bg-secondary/20";
        timeText = "night";
    }

    return (
        <section className={`rounded-[32px] md:rounded-[48px] p-5 md:p-16 bg-gradient-to-br ${bgGradient} relative overflow-hidden mb-6 md:mb-16 min-h-[200px] md:min-h-[400px] flex items-center shadow-2xl`}>
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-1/4 -right-1/4 w-3/4 h-3/4 rounded-full blur-[80px] md:blur-[120px] ${accentColor} opacity-50`} />
                <div className={`absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-[60px] md:blur-[100px] bg-primary/10 opacity-30`} />
            </div>

            <div className="container mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 px-1 md:px-0">
                <div className="flex-1 text-center md:text-left space-y-4 md:space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-inner"
                    >
                        <Icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${iconColor} fill-current animate-pulse`} />
                        <span className="text-[9px] md:text-xs font-black text-white/90 uppercase tracking-[0.2em]">{timeText} CHECKPOINT</span>
                    </motion.div>

                    <div className="space-y-2 md:space-y-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="font-black text-white leading-[1.2] md:leading-tight tracking-tighter max-w-full md:max-w-3xl break-keep text-xl md:text-4xl"
                        >
                            {greeting}, <br className="hidden md:block" /> {userName}님.
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center justify-center md:justify-start gap-2 md:gap-3"
                        >
                            <span className="h-[1px] w-6 md:w-12 bg-white/30" />
                            <p className="text-white/70 text-[11px] md:text-sm font-medium tracking-tight">
                                {timeText.charAt(0).toUpperCase() + timeText.slice(1)} Recovery Protocol Active.
                            </p>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 80 }}
                    className="flex-shrink-0 relative"
                >
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-72 md:h-72">
                        {/* Glow Behind Character */}
                        <div className={`absolute inset-0 ${accentColor} rounded-full blur-[60px] md:blur-[100px] animate-pulse`} />

                        {/* Character Frame */}
                        <div className="absolute inset-2 md:inset-4 bg-white/5 backdrop-blur-2xl rounded-[40px] md:rounded-[64px] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
                            <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                                src="/character/youniqle-1.png"
                                alt="Youniqle AI Coach"
                                className="w-[85%] h-[85%] object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>

                        {/* Floating Badges */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-4 -right-4 w-10 h-10 md:w-16 md:h-16 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-xl"
                        >
                            <Sparkles className="w-5 h-5 md:w-8 md:h-8 text-amber-400" />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
