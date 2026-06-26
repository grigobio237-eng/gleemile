'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Lock, Brain, PieChart, BarChart3 } from 'lucide-react';
import ActionableInsightCard from './ActionableInsightCard';
import MealNutrientChart from './MealNutrientChart';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GuardianNudgeCard from './GuardianNudgeCard';
import Image from 'next/image';

interface RecoveryInsightViewProps {
    unifiedData: any;
}

export default function RecoveryInsightView({ unifiedData }: RecoveryInsightViewProps) {
    const { user, insights, score, assetStats } = unifiedData;
    const [recommendedProducts, setRecommendedProducts] = React.useState<any[]>([]);
    const [weeklyReport, setWeeklyReport] = React.useState<any>(null);
    const userTier = user?.grade?.toUpperCase() || 'NONE';
    const userRole = user?.role || 'member';
    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    const isPremium = isAdmin || ['RESTART', 'BLACK'].includes(userTier);
    const displayScore = score?.totalScore || 0;
    const isSupporter = user?.mileRole === 'supporter';

    // 법인/회사 괄호 등 지저분한 접미사 정밀 정제 로직
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
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="text-center space-y-1">
                <Badge className="bg-primary text-obsidian border-none text-[10px] font-black px-3 py-1 uppercase tracking-widest">Precision Intelligence</Badge>
                <h2 className="text-2xl font-black text-obsidian tracking-tight">전문 데이터 분석</h2>
                <p className="text-slate text-xs font-semibold">gleemile이 분석한 당신의 회복 패턴과 최적화 솔루션입니다.</p>
            </div>

            {/* AI Manager Summary Section */}
            <section>
                <Card className="bg-white border border-line rounded-[32px] overflow-hidden shadow-xl shadow-obsidian/5 hover:shadow-2xl transition-all">
                    <CardContent className="p-5 md:p-8 flex flex-col md:flex-row items-center gap-5 md:gap-8">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-mist rounded-[24px] flex items-center justify-center shadow-inner shrink-0 overflow-hidden border border-line/50">
                            <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                                src="/images/characters/char_dday.png" 
                                alt="Youniqle Manager" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex-1 w-full text-center md:text-left space-y-3">
                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                                <h3 className="font-black text-lg text-obsidian tracking-tight flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-primary" />
                                    gleemile 매니저 통합 코멘트
                                </h3>
                                <Badge className="bg-obsidian text-mist border-none text-[9px] font-black tracking-widest uppercase px-2 py-0.5">
                                    {isPremium ? 'Expert Analysis' : 'Standard Analysis'}
                                </Badge>
                            </div>
                            
                            {/* 이탤릭을 제거하고 시인성이 극대화된 고급 쿼트 보드 래퍼 */}
                            <div className="bg-mist/30 border border-line/50 p-4 md:p-5 rounded-2xl relative">
                                <span className="absolute top-2 left-3 text-3xl font-serif text-primary/30 leading-none">“</span>
                                <p className="text-xs md:text-sm font-semibold leading-relaxed text-obsidian/80 px-4 pt-1 break-keep text-left">
                                    {sanitizeText(
                                        weeklyReport?.summary || (
                                            isPremium 
                                                ? (displayScore >= 70 
                                                    ? '현재 회복 흐름이 매우 우수합니다. 수면 데이터 분석 결과, 깊은 수면 단계 진입이 빨라지고 있습니다. 이 리듬을 유지한다면 다음 주에는 신체적 가동 범위가 15% 이상 개선될 것으로 예측됩니다.' 
                                                    : '회복 지수가 불안정한 흐름을 보이고 있습니다. 어제 기록된 높은 피로도는 수면 전 블루라이트 노출과 연관이 있을 수 있습니다. 오늘부터 수면 전 30분 디지털 디톡스를 권장합니다.')
                                                : (displayScore >= 70 
                                                    ? '전반적으로 양호한 상태입니다. 꾸준한 기록이 좋은 성과를 내고 있습니다.' 
                                                    : '신체적 피로도가 감지되었습니다. 충분한 휴식과 수분 섭취가 필요합니다.')
                                        )
                                    )}
                                </p>
                            </div>

                            {!isPremium && (
                                <p className="text-[10px] text-slate/40 font-bold flex items-center justify-center md:justify-start gap-1">
                                    <Lock className="w-3 h-3 opacity-50" />
                                    기본 분석 리포트 (프리미엄 등급에서 정밀 예측 데이터가 활성화됩니다)
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Parent Nudge Card (Conditional) */}
            {isSupporter && (
                <GuardianNudgeCard 
                    playerName={user?.name || '팀원/스터디원'} 
                    fatigueLevel={displayScore < 50 ? 'HIGH' : displayScore < 80 ? 'MEDIUM' : 'LOW'} 
                />
            )}



            {/* Data-driven Insights (If available) */}
            {(insights?.posture || insights?.meal) && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-obsidian tracking-tight flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-reward-gold" />
                            영역별 정밀 가이드
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {insights.posture && (
                            <ActionableInsightCard type="posture" insight={insights.posture} />
                        )}
                        {insights.meal && (
                            <div className="space-y-6">
                                <ActionableInsightCard type="meal" insight={insights.meal} />
                                <MealNutrientChart
                                    nutrients={insights.meal.nutrients}
                                    advice={insights.meal.suggestion}
                                />
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Locked Advanced Metrics (For Non-Premium) */}
            {!isPremium && (
                <Card className="bg-mist/30 border border-line border-dashed rounded-[32px] p-6 md:p-10 text-center relative overflow-hidden">
                    <div className="space-y-6 relative z-10">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <Lock className="w-8 h-8 text-slate/40" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-black text-obsidian/40 text-xl">정밀 예측 분석 잠금</h3>
                            <p className="text-xs text-slate/50 font-medium">바이오 리듬 예측, 장기 회복 트렌드, 전문 의료진 가이드 등의 고도화된 기능은<br />RESTART 등급 이상의 멤버십에서 제공됩니다.</p>
                        </div>
                        <Link 
                            href="/membership" 
                            className="inline-block bg-obsidian text-reward-gold border border-reward-gold/30 px-8 py-3 rounded-xl font-black text-sm hover:bg-obsidian/90 transition-all shadow-xl"
                        >
                            멤버십 혜택 보기
                        </Link>
                    </div>
                </Card>
            )}
            
            {/* Recommended Products (Moved to the very bottom) */}
            {recommendedProducts && recommendedProducts.length > 0 && (
                <section className="space-y-4 pt-6 border-t border-line/30">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-obsidian tracking-tight flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-reward-gold" />
                            gleemile 샵 맞춤 추천 상품
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {recommendedProducts.map((prod: any, idx: number) => (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    if (prod.productId) {
                                        window.location.href = `/shop/product/${prod.productId}`;
                                    }
                                }}
                                className="flex flex-col bg-white border border-line rounded-[32px] overflow-hidden shadow-xl shadow-obsidian/5 hover:shadow-2xl transition-all cursor-pointer group"
                            >
                                {/* Product Image */}
                                <div className="relative aspect-video w-full overflow-hidden bg-mist">
                                    {prod.imageUrl ? (
                                        <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                                            src={prod.imageUrl} 
                                            alt={prod.name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">
                                            🛍️
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-obsidian/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
                                        gleemile Pick
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <h5 className="text-base font-black text-obsidian group-hover:text-chapter-accent transition-colors leading-tight">
                                        {prod.name}
                                    </h5>
                                    
                                    {prod.price > 0 && (
                                        <p className="text-base font-black text-obsidian/90 mt-1">
                                            {prod.price.toLocaleString()}원
                                        </p>
                                    )}

                                    <div className="mt-3 bg-mist/50 p-4 rounded-2xl border border-line/40 flex-1">
                                        <p className="text-xs font-bold text-slate/70 leading-relaxed">
                                            💡 {prod.reason}
                                        </p>
                                    </div>

                                    <div className="mt-6">
                                        <Button className="w-full h-12 bg-obsidian text-white rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-chapter-accent transition-colors">
                                            상품 자세히 보기
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
