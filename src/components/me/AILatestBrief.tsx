'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Activity, Moon, Utensils, Dumbbell } from 'lucide-react';
import Link from 'next/link';

interface AILatestBriefProps {
    solution: any;
    createdAt?: string;
}

export default function AILatestBrief({ solution, createdAt }: AILatestBriefProps) {
    if (!solution) {
        return (
            <div className="bg-obsidian rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-2xl relative overflow-hidden text-white group h-full flex flex-col justify-between min-h-[320px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <Brain className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">YOUNIQLE Navigator</p>
                            <h3 className="text-base md:text-xl font-black tracking-tight">gleemile 맞춤 리커버리 요약</h3>
                        </div>
                    </div>

                    <p className="text-[11px] md:text-sm font-bold text-slate-300 leading-relaxed">
                        아직 기록된 회복 솔루션이 존재하지 않습니다.<br />
                        매일 60초 리듬 체크와 gleemile 리듬체크를 통해 나에게 딱 맞는 1:1 맞춤 회복 처방 솔루션을 확인해보세요!
                    </p>
                </div>

                <div className="relative z-10 mt-6 space-y-3">
                    <div className="p-4 rounded-[20px] bg-white/5 border border-white/5 flex items-center gap-3">
                        <span className="text-base">💡</span>
                        <p className="text-[11px] font-bold text-foreground/70">CGM 분석을 통해 수면, 영양, 운동 맞춤 추천 처방</p>
                    </div>
                    <Link href="/ai-navigator" className="w-full py-3.5 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                        gleemile 리듬체크 시작하기 <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const items = [
        { icon: Dumbbell, title: "Exercise", content: solution.exercise, color: "text-primary", bg: "bg-blue-50" },
        { icon: Utensils, title: "Nutrition", content: solution.nutrition, color: "text-green-500", bg: "bg-green-50" },
        { icon: Moon, title: "Sleep", content: solution.sleep, color: "text-secondary", bg: "bg-indigo-50" },
    ];

    return (
        <div className="bg-obsidian rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-2xl relative overflow-hidden text-white group h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                        <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">YOUNIQLE Weekly Brief</p>
                        <h3 className="text-base md:text-xl font-black tracking-tight">gleemile 맞춤 리커버리 요약</h3>
                    </div>
                </div>
                {createdAt && (
                    <span className="text-[10px] font-bold text-white/60">
                        {new Date(createdAt).toLocaleDateString()}
                    </span>
                )}
            </div>

            <p className="text-[11px] md:text-sm font-medium text-slate-300 leading-relaxed mb-8 relative z-10 line-clamp-2">
                {solution.analysis}
            </p>

            <div className="grid grid-cols-1 gap-4 relative z-10 mb-8">
                {items.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black opacity-70 uppercase mb-1">{item.title}</p>
                            <p className="text-xs font-bold leading-snug line-clamp-1">{item.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Link href="/diagnosis/report" className="relative z-10 w-full py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                View Full Report <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
