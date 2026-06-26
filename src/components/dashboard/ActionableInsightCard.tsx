'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface ActionableInsightCardProps {
    type: 'posture' | 'meal';
    insight: {
        title: string;
        description: string;
        habits?: string[];
        exercises?: Array<{ title: string; visualType: string; link: string }>;
        suggestion?: string;
    };
}

export default function ActionableInsightCard({ type, insight }: ActionableInsightCardProps) {
    const isPosture = type === 'posture';

    // 본문 내부의 법인/회사 괄호 정제 로직
    const sanitizeText = (text: string) => {
        if (!text) return '';
        return text
            .replace(/주식회사/g, '')
            .replace(/\(주\)/g, '')
            .replace(/주\)/g, '')
            .replace(/\(주/g, '')
            .trim();
    };

    return (
        <Card className="rounded-[32px] border-none overflow-hidden bg-obsidian text-mist shadow-2xl relative group">
            {/* 세련된 배경 글로우 데코 */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${isPosture ? 'bg-chapter-accent/20' : 'bg-reward-gold/20'} rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700 pointer-events-none`} />
            
            <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8 relative z-10">
                
                {/* 1. 헤더 */}
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${isPosture ? 'bg-chapter-accent/20 text-chapter-accent' : 'bg-reward-gold/20 text-reward-gold'}`}>
                        {isPosture ? <Activity className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 text-mist">Insight Focus</span>
                        <h3 className="font-black tracking-tight text-xl">{insight.title}</h3>
                    </div>
                </div>

                {/* 2. 본문 설명 코멘트 (이탤릭을 전면 제거하고 둥근 쿼트 박스로 가독성 극대화) */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative">
                    <span className="absolute top-2 left-3 text-3xl font-serif text-white/10 leading-none">“</span>
                    <p className="text-sm font-semibold leading-relaxed text-white/90 px-4 pt-1 break-keep">
                        {sanitizeText(insight.description)}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* 습관 체크리스트 */}
                    {isPosture && insight.habits && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-chapter-accent flex items-center gap-2">
                                <BookOpen className="w-3 h-3" /> Core Habits
                            </h4>
                            <div className="space-y-2">
                                {insight.habits?.map((habit, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-chapter-accent" />
                                        <span className="text-xs font-black text-white/80">{habit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 추천 영양 코멘트 */}
                    {insight.suggestion && (
                        <div className="p-4 bg-reward-gold/5 rounded-2xl border border-reward-gold/15 text-reward-gold/90 font-semibold text-xs leading-relaxed break-keep">
                            💡 {sanitizeText(insight.suggestion)}
                        </div>
                    )}
                </div>

                {/* 하단 가이드 버튼 링크 */}
                {isPosture && insight.exercises && (
                    <div className="pt-4 border-t border-white/10 flex flex-wrap gap-3">
                        {insight.exercises?.map((ex, idx) => (
                            <Button 
                                key={idx}
                                asChild
                                className="bg-chapter-accent hover:bg-chapter-accent/80 text-white rounded-xl font-black text-xs h-12 px-6 shadow-md"
                            >
                                <Link href={ex.link}>
                                    {ex.visualType === 'WEBTOON' ? '🎨 웹툰 가이드' : '📷 이미지 가이드'} : {ex.title}
                                </Link>
                            </Button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
