'use client';

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, History, Download, Sparkles, Moon, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { DiagnosisRadarChart } from '@/components/charts/DiagnosisRadarChart';

interface RecoveryStatusHeroProps {
    todayScore: number;
    scoreHistory: any[];
    radarData: any[];
    assetStats: any;
    userName: string;
    onOpenSleepModal?: () => void;
}

export default function RecoveryStatusHero({
    todayScore,
    scoreHistory,
    radarData,
    assetStats,
    userName,
    onOpenSleepModal
}: RecoveryStatusHeroProps) {
    // 히어로 카드 내부 탭 상태 관리: 'asset' | 'balance' | 'trend'
    const [activeHeroTab, setActiveHeroTab] = useState<'asset' | 'balance' | 'trend'>('asset');

    // 회사/법인 접미사 및 괄호 제거 정제 로직
    const cleanName = (name: string) => {
        if (!name) return '유저';
        return name
            .replace(/주식회사/g, '')
            .replace(/\(주\)/g, '')
            .replace(/주\)/g, '')
            .replace(/\(주/g, '')
            .trim();
    };

    // 회복 점수 등급 및 콤팩트 가이드 정보
    const getRecoveryInfo = (score: number) => {
        const validated = Math.max(0, Math.min(100, score || 0));
        if (validated >= 80) {
            return {
                grade: '최적',
                color: 'text-secondary bg-secondary/10 border-emerald-500/20',
                gradient: 'from-emerald-400 to-teal-500',
                circleBg: 'stroke-emerald-500/10',
                circleProgress: 'stroke-emerald-500',
                emoji: '✨',
                headline: '오늘 컨디션 최상이에요!',
                advice: '에너지가 가득 찬 하루, 도전적인 활동에 적기입니다.'
            };
        } else if (validated >= 60) {
            return {
                grade: '안정',
                color: 'text-secondary bg-secondary/10 border-secondary/30/20',
                gradient: 'from-indigo-400 to-purple-500',
                circleBg: 'stroke-indigo-500/10',
                circleProgress: 'stroke-indigo-500',
                emoji: '😊',
                headline: '안정적인 회복 리듬이에요',
                advice: '신체와 마음의 균형이 아주 좋습니다. 지금처럼만 유지하세요.'
            };
        } else if (validated >= 40) {
            return {
                grade: '주의',
                color: 'text-primary bg-primary/10 border-primary/30/20',
                gradient: 'from-amber-400 to-orange-500',
                circleBg: 'stroke-amber-500/10',
                circleProgress: 'stroke-amber-500',
                emoji: '⚠️',
                headline: '가벼운 피로가 보이기 시작해요',
                advice: '오늘 저녁은 따뜻한 이완 스트레칭으로 지친 몸을 달래보세요.'
            };
        } else {
            return {
                grade: '위험',
                color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
                gradient: 'from-rose-400 to-red-500',
                circleBg: 'stroke-rose-500/10',
                circleProgress: 'stroke-rose-500',
                emoji: '🚨',
                headline: '적극적인 온전한 휴식이 필요해요',
                advice: '방전 신호가 켜졌습니다. 오늘 밤만큼은 일찍 수면을 채워주세요.'
            };
        }
    };

    const validatedScore = Math.max(0, Math.min(100, todayScore || 0));
    const info = getRecoveryInfo(validatedScore);

    // SVG 서클 게이지 연산
    const radius = 38;
    const strokeWidth = 4.5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (validatedScore / 100) * circumference;

    // 총 자산 건수 계산
    const totalAssets = (assetStats?.precisionDiagnosis || 0) +
        (assetStats?.dailyRhythmLog || 0) +
        (assetStats?.scannerAnalysis || 0) +
        (assetStats?.toolkitUsage || 0) +
        (assetStats?.consultations || 0) +
        (assetStats?.reports || 0);

    return (
        <section className="relative pt-4 pb-2 overflow-hidden bg-background">
            {/* 은은한 배경 그라데이션 데코 */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-xl mx-auto space-y-4">
                    
                    {/* 1. 스마트워치 스타일의 '원글랜스' 히어로 카드 */}
                    <div className="bg-white border border-line rounded-[32px] p-5 shadow-xl shadow-primary/5 relative overflow-hidden">
                        <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex gap-5 items-center relative z-10">
                            {/* 디바이스 디자인 서클 게이지 */}
                            <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r={radius}
                                        className={`${info.circleBg}`}
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r={radius}
                                        className={`${info.circleProgress} transition-all duration-1000 ease-out`}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        fill="transparent"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[8px] font-black text-slate/40 tracking-widest leading-none">RHYTHM</span>
                                    <span className="text-[26px] font-black text-obsidian tracking-tight leading-none mt-0.5">{validatedScore}</span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-1.5 ${info.color} border border-transparent`}>
                                        {info.grade}
                                    </span>
                                </div>
                            </div>
                            
                            {/* 콤팩트 가이드라인 및 조언 */}
                            <div className="flex-1 min-w-0">
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/5 text-primary rounded-full text-[9px] md:text-[10px] font-black tracking-wider uppercase mb-1.5">
                                    <Sparkles className="w-2.5 h-2.5" /> CGM Active
                                </div>
                                <h1 className="font-black text-obsidian tracking-tight truncate leading-tight text-xl md:text-3xl">
                                    {cleanName(userName)}님, {info.headline} {info.emoji}
                                </h1>
                                <p className="text-xs md:text-sm text-slate font-semibold leading-relaxed mt-1 text-slate/70">
                                    {info.advice}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. 콤팩트 가로 탭 단추 스위처 */}
                    <div className="flex bg-mist/50 p-1 rounded-2xl border border-line/30 shadow-inner">
                        {[
                            { id: 'asset', label: '자산 요약', icon: <Shield className="w-3.5 h-3.5" /> },
                            { id: 'balance', label: '신체 밸런스', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                            { id: 'trend', label: '7일 흐름', icon: <Calendar className="w-3.5 h-3.5" /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveHeroTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black tracking-tight transition-all ${
                                    activeHeroTab === tab.id
                                        ? 'bg-white text-primary shadow-sm border border-line/20'
                                        : 'text-slate/50 hover:text-slate hover:bg-white/20'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* 3. 미니멀 탭 컨텐츠 컨테이너 */}
                    <div className="bg-white rounded-[32px] border border-line shadow-2xl p-5 min-h-[190px] flex flex-col justify-center relative overflow-hidden transition-all duration-300">
                        
                        {/* 탭 A: 자산 요약 뷰 (미니멀 도트 스타일) */}
                        {activeHeroTab === 'asset' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center pb-2 border-b border-line/40">
                                    <span className="text-xs md:text-base font-black text-obsidian">누적 회복 자산</span>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-lg md:text-2xl font-black text-primary">{totalAssets}</span>
                                        <span className="text-[10px] md:text-xs font-bold text-slate/40">건의 분석</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    {[
                                        { count: assetStats?.precisionDiagnosis || 0, label: '정밀 문진', dot: 'bg-secondary' },
                                        { count: assetStats?.scannerAnalysis || 0, label: '피부 스캔', dot: 'bg-secondary' },
                                        { count: assetStats?.reports || 0, label: '발행 리포트', dot: 'bg-primary' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-mist/30 border border-line/30 rounded-2xl text-center">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                                                <span className="text-[10px] md:text-xs font-black text-slate/75">{item.label}</span>
                                            </div>
                                            <span className="text-xs md:text-sm font-black text-obsidian">{item.count}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* 😴 수면 기록 퀵 인라인 단추 */}
                                <button
                                    onClick={onOpenSleepModal}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 rounded-2xl transition-all group"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-base md:text-xl animate-pulse">😴</span>
                                        <span className="text-xs md:text-sm font-black text-obsidian/90">오늘 밤 최상의 회복을 위해 수면 기록하기</span>
                                    </div>
                                    <div className="flex items-center text-[10px] md:text-xs font-black text-secondary">
                                        <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* 탭 B: 신체 밸런스 방사형 차트 뷰 */}
                        {activeHeroTab === 'balance' && radarData.length > 0 && (
                            <div className="flex items-center gap-4 animate-fade-in h-[150px]">
                                <div className="flex-1 h-full relative flex items-center justify-center">
                                    <div className="absolute w-24 h-24 bg-primary/5 rounded-full blur-xl z-0" />
                                    <div className="w-full h-full relative z-10">
                                        <DiagnosisRadarChart
                                            data={radarData.map(d => ({
                                                subject: d.category === 'PHYSICAL' ? '신체' :
                                                    d.category === 'MENTAL' ? '멘탈' :
                                                        d.category === 'SLEEP' ? '수면' : '생활',
                                                score: Math.round((d.score / d.fullMark) * 100),
                                                fullMark: 100
                                            }))}
                                            color="#0E3A3A"
                                        />
                                    </div>
                                </div>
                                <div className="w-28 flex flex-col gap-1 justify-center bg-mist/30 p-2.5 rounded-2xl border border-line/20">
                                    <h4 className="text-[9px] font-black text-slate border-b border-line/50 pb-1 mb-0.5">영역별 밸런스</h4>
                                    {radarData.map((d, i) => (
                                        <div key={i} className="flex justify-between items-center text-[9px] font-bold text-obsidian">
                                            <span className="opacity-60">
                                                {d.category === 'PHYSICAL' ? '신체' :
                                                    d.category === 'MENTAL' ? '멘탈' :
                                                        d.category === 'SLEEP' ? '수면' : '생활'}
                                            </span>
                                            <span className="font-black text-primary">{Math.round((d.score / d.fullMark) * 100)}점</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 탭 C: 7일 흐름선 그래프 뷰 */}
                        {activeHeroTab === 'trend' && (
                            <div className="space-y-2 animate-fade-in h-[150px] flex flex-col justify-between">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate/40 uppercase tracking-wider">회복 리듬 추이</span>
                                    <div className="flex items-center gap-1 text-[9px] font-black text-secondary bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>7일 실시간 트렌드</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 w-full relative pt-2">
                                    {/* X축 라벨 배경 캡슐 */}
                                    <div className="absolute bottom-1 h-6 left-1 right-1 bg-mist/40 rounded-full z-0 border border-line/10" />
                                    
                                    <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                                        <AreaChart data={scoreHistory} margin={{ top: 5, right: 10, left: 10, bottom: 2 }}>
                                            <defs>
                                                <linearGradient id="dashboardLineGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#0E3A3A" stopOpacity={0.25}/>
                                                    <stop offset="100%" stopColor="#0E3A3A" stopOpacity={0.0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis 
                                                dataKey="date" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 9, fill: '#1F2937', fontWeight: 900 }} 
                                                dy={4}
                                            />
                                            <Tooltip 
                                                cursor={{ stroke: '#0E3A3A', strokeWidth: 1, strokeDasharray: '3 3' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length && payload[0].value !== null) {
                                                        return (
                                                            <div className="bg-obsidian text-white px-2.5 py-1.5 rounded-xl shadow-xl text-[10px] font-black border border-white/10">
                                                                {payload[0].payload.date}: {payload[0].value}점
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="score" 
                                                stroke="#0E3A3A" 
                                                strokeWidth={2.5} 
                                                fillOpacity={1} 
                                                fill="url(#dashboardLineGradient)" 
                                                connectNulls={true}
                                                isAnimationActive={true}
                                                dot={{ r: 3.5, fill: '#0E3A3A', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                                                activeDot={{ r: 5, fill: '#D4AF37', stroke: '#FFFFFF', strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
