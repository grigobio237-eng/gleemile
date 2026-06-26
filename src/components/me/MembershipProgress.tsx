'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MembershipProgressProps {
    currentGrade: string;
    currentPoints: number;
}

const gradeInfo = {
    cedar: { name: 'CEDAR', emoji: '🌲', color: 'from-amber-400 to-orange-500', next: 'ROOTER', nextPoints: 5000 },
    rooter: { name: 'ROOTER', emoji: '🌱', color: 'from-blue-400 to-indigo-500', next: 'BLOOMER', nextPoints: 15000 },
    bloomer: { name: 'BLOOMER', emoji: '🌺', color: 'from-green-400 to-emerald-500', next: 'GLOWER', nextPoints: 50000 },
    glower: { name: 'GLOWER', emoji: '🌸', color: 'from-pink-400 to-rose-500', next: 'ECOSOUL', nextPoints: 100000 },
    ecosoul: { name: 'ECOSOUL', emoji: '🌿', color: 'from-purple-400 to-violet-600', next: null, nextPoints: null },
    start: { name: 'START', emoji: '🎯', color: 'from-blue-400 to-indigo-500', next: 'SIGNATURE', nextPoints: 0 },
    signature: { name: 'SIGNATURE', emoji: '💎', color: 'from-chapter-accent to-chapter-accent/80', next: 'BLACK', nextPoints: 0 },
    black: { name: 'BLACK', emoji: '👑', color: 'from-slate-700 to-obsidian', next: null, nextPoints: null },
};

const gradeColors = {
    cedar: 'bg-primary-container/50 text-primary border-primary/30',
    rooter: 'bg-primary-container text-primary border-primary/30',
    bloomer: 'bg-green-100 text-green-600 border-green-200',
    glower: 'bg-pink-100 text-pink-600 border-pink-200',
    ecosoul: 'bg-secondary-container text-secondary border-purple-200',
    start: 'bg-primary-container text-primary border-primary/30',
    signature: 'bg-chapter-accent/10 text-chapter-accent border-chapter-accent/20',
    black: 'bg-obsidian text-mist border-slate-700',
};

export default function MembershipProgress({ currentGrade, currentPoints }: MembershipProgressProps) {
    const grade = currentGrade.toLowerCase() as keyof typeof gradeInfo;
    const info = gradeInfo[grade] || gradeInfo.cedar;

    const progress = info.nextPoints
        ? Math.min((currentPoints / info.nextPoints) * 100, 100)
        : 100;

    return (
        <Card className="h-full premium-card p-6 md:p-8 flex flex-col justify-between border-line relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <Badge className={`${gradeColors[grade] || gradeColors.cedar} mb-2 border`}>
                            {currentGrade.toUpperCase()}
                        </Badge>
                        <h3 className="text-base md:text-xl font-black text-obsidian tracking-tight">멤버십 리워드</h3>
                    </div>
                    <div className="text-right">
                        <span className="font-black text-primary text-xl md:text-3xl">{currentPoints.toLocaleString()}</span>
                        <span className="text-[10px] md:text-xs font-bold text-slate block uppercase tracking-widest mt-1">Points</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end text-[10px] md:text-xs font-bold text-slate uppercase tracking-widest">
                        <span>Lv. {grade.toUpperCase()}</span>
                        <span>{info.next ? `Target: ${info.next}` : 'Max Level'}</span>
                    </div>
                    <div className="h-3 md:h-4 w-full bg-background rounded-full overflow-hidden border border-line p-0.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full bg-gradient-to-r ${info.color} rounded-full shadow-sm`}
                        />
                    </div>
                    <p className="text-[11px] md:text-xs text-foreground/70 font-medium leading-relaxed">
                        {info.nextPoints ? (
                            <>다음 등급까지 <span className="text-obsidian font-bold">{(info.nextPoints - currentPoints).toLocaleString()}P</span> 남았습니다.</>
                        ) : (
                            <span className="text-chapter-accent font-bold">당신은 이미 최상위 등급입니다!</span>
                        )}
                        <br />꾸준한 회복으로 더 많은 혜택을 누리세요.
                    </p>
                </div>
            </div>

            <div className="mt-6 md:mt-8 pt-6 border-t border-line flex justify-between items-center group-hover:translate-x-1 transition-transform">
                <span className="text-xs font-bold text-obsidian uppercase tracking-widest flex items-center gap-2">
                    My Benefits <ChevronRight className="w-3 h-3" />
                </span>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-foreground/70" />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
