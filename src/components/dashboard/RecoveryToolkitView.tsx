'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Scan, Layout, Activity, Zap, ChevronRight, Laptop, Smartphone, Pill } from 'lucide-react';

interface ToolkitItemProps {
    label: string;
    desc: string;
    icon: string | React.ReactNode;
    href: string;
    color: string;
    isLocked?: boolean;
}

function ToolkitItem({ label, desc, icon, href, color, isLocked }: ToolkitItemProps) {
    return (
        <Link href={isLocked ? '#' : href} className={`group ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}>
            <div className="bg-white border border-line/80 rounded-[32px] p-6 md:p-8 shadow-xl shadow-obsidian/5 hover:shadow-2xl transition-all flex flex-col items-center text-center h-full relative overflow-hidden group-hover:border-chapter-accent/30">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-mist rounded-[20px] md:rounded-[24px] mb-4 md:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner relative text-3xl md:text-4xl">
                    {typeof icon === 'string' ? icon : icon}
                    {isLocked && (
                        <div className="absolute inset-0 bg-obsidian/40 rounded-[24px] flex items-center justify-center">
                            <span className="text-white text-xs font-black uppercase tracking-widest">Locked</span>
                        </div>
                    )}
                </div>
                <h3 className="text-lg md:text-xl font-black text-obsidian mb-1 md:mb-2">{label}</h3>
                <p className="text-[11px] md:text-xs text-slate font-medium mb-4 md:mb-6 leading-relaxed opacity-60 px-2 md:px-4">{desc}</p>
                <div className="mt-auto text-[10px] font-black tracking-[0.2em] uppercase opacity-40 group-hover:opacity-100 group-hover:text-chapter-accent transition-all">
                    {isLocked ? 'Upgrade to Unlock' : 'Launch Protocol >'}
                </div>
            </div>
        </Link>
    );
}

export default function RecoveryToolkitView({ userTier = 'NONE', userRole = 'member' }: { userTier?: string, userRole?: string }) {
    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    const isPremium = isAdmin || ['RESTART', 'BLACK'].includes(userTier.toUpperCase());

    return (
        <div className="space-y-8 md:space-y-12 pb-10 md:pb-20">
            {/* Header */}
            <div className="text-center space-y-2">
                <Badge className="bg-chapter-accent text-white border-none text-[10px] font-black px-3 py-1 uppercase tracking-widest">Expert Protocols</Badge>
                <h2 className="text-3xl font-black text-obsidian tracking-tight italic">전문 회복 툴킷</h2>
                <p className="text-slate text-sm font-medium">나의 상태에 맞는 전문 도구를 활용하여 회복 속도를 높이세요.</p>
            </div>

            {/* Main Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolkitItem 
                    label="사운드 테라피" 
                    desc="바이오 뇌파 동기화 및 심층 이완을 돕는 정밀 사운드 데이터" 
                    icon="🎧" 
                    href="/?tool=sound" 
                    color="blue" 
                />
                <ToolkitItem 
                    label="자세 밸런스 분석" 
                    desc="gleemile 비전 기술을 활용한 실시간 체형 및 균형 측정" 
                    icon="🧘" 
                    href="/utils?tool=posture" 
                    color="emerald" 
                />
                <ToolkitItem 
                    label="센서리 스캐너" 
                    desc="공간의 조도, 소음 및 식단 영양 성분 정밀 스캔" 
                    icon="🍱" 
                    href="/utils/food-scanner" 
                    color="reward-gold" 
                />
                <ToolkitItem 
                    label="수면 사이클 가이드" 
                    desc="생체 리듬에 최적화된 수면 시간 및 환경 제안" 
                    icon="🌙" 
                    href="/utils?tool=sleep" 
                    color="purple"
                    isLocked={!isPremium}
                />
                <ToolkitItem 
                    label="수분/영양 트래커" 
                    desc="회복에 필요한 필수 영양소 및 수분 섭취 정밀 기록" 
                    icon="💧" 
                    href="/utils?tool=hydration" 
                    color="cyan"
                    isLocked={!isPremium}
                />
                <ToolkitItem 
                    label="메디컬 체크인" 
                    desc="전문 의료진과의 상담 전 준비를 위한 정밀 문진 시스템" 
                    icon="🏥" 
                    href="/event/consultation" 
                    color="red"
                />
            </div>

            {/* Action Card */}
            <Card className="bg-obsidian text-white rounded-[32px] md:rounded-[40px] overflow-hidden border-none shadow-2xl relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
                <CardContent className="p-6 md:p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-reward-gold font-black text-[10px] tracking-widest uppercase">
                            <Zap className="w-4 h-4 fill-reward-gold/20" /> Customized Routine
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">나만의 맞춤 루틴 생성하기</h3>
                        <p className="text-white/70 text-sm font-medium">데이터 분석을 통해 오늘 당신에게 가장 필요한 3가지 도구를 추천해 드립니다.</p>
                    </div>
                    <Link href="/diagnosis?type=daily" className="bg-white text-obsidian px-8 py-4 md:px-10 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-white/90 hover:scale-105 transition-all shadow-xl shadow-white/10 whitespace-nowrap w-full md:w-auto text-center">
                        지금 분석 시작하기
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
