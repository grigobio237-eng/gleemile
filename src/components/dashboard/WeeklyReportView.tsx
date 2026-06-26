'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Loader2, 
    TrendingUp, 
    Clock, 
    Lock, 
    ShieldAlert, 
    Target 
} from 'lucide-react';
import { toast } from 'sonner';

export default function WeeklyReportView({ onDataLoaded }: { onDataLoaded?: (products: any[], report?: any) => void }) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/dashboard/report');
            if (res.ok) {
                const result = await res.json();
                if (result.data) {
                    setReport(result.data);
                    if (onDataLoaded) {
                        onDataLoaded([], result.data); // recommendedProducts are excluded
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        try {
            setGenerating(true);
            const res = await fetch('/api/dashboard/report', { method: 'POST' });
            const result = await res.json();

            if (!res.ok) {
                toast.error(result.error || '리포트 생성에 실패했습니다.');
                return;
            }

            setReport(result.data);
            if (onDataLoaded) {
                onDataLoaded([], result.data); // recommendedProducts are excluded
            }
            toast.success('이번 주 회복 리포트가 성공적으로 발행되었습니다!');
        } catch (error) {
            console.error('Failed to generate report:', error);
            toast.error('리포트 생성 중 오류가 발생했습니다.');
        } finally {
            setGenerating(false);
        }
    };

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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-chapter-accent" />
            </div>
        );
    }

    // 1. Lock UI state when report is not complete or empty
    if (!report) {
        return (
            <div className="bg-white rounded-[32px] p-6 md:p-10 border border-line shadow-xl space-y-8 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                
                {/* Header Lock Status */}
                <div className="space-y-2">
                    <div className="w-16 h-16 bg-mist/50 rounded-full flex items-center justify-center mx-auto shadow-inner border border-line">
                        <Lock className="w-6 h-6 text-obsidian/40 animate-pulse" />
                    </div>
                    <h3 className="font-black text-obsidian tracking-tight mt-4 text-xl md:text-2xl">7일 회복 리포트 잠김</h3>
                </div>

                {/* Timeline Progress */}
                <div className="relative max-w-md mx-auto pt-6 pb-2">
                    <div className="absolute top-[38px] left-[15%] right-[15%] h-1 bg-line rounded-full" />
                    {/* Simulated active progress bar */}
                    <div className="absolute top-[38px] left-[15%] w-[35%] h-1 bg-primary rounded-full" />

                    <div className="grid grid-cols-3 relative z-10">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-obsidian flex items-center justify-center font-bold text-xs shadow-md">
                                1d
                            </div>
                            <span className="text-[10px] font-black text-slate/60 mt-2">1일차 완료</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-mist border-2 border-line text-slate/40 flex items-center justify-center font-bold text-xs shadow-sm">
                                <Lock className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-black text-slate/40 mt-2">3일차 대기</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-mist border-2 border-line text-slate/40 flex items-center justify-center font-bold text-xs shadow-sm">
                                <Lock className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-black text-slate/40 mt-2">7일차 잠금</span>
                        </div>
                    </div>
                </div>

                {/* Mandated Instructions (가독성을 극대화한 프렌들리 가이드 카드) */}
                <div className="bg-mist/30 p-5 rounded-2xl border border-line/50 max-w-sm mx-auto">
                    <p className="text-slate/60 text-xs font-semibold leading-relaxed break-keep text-center">
                        아직 첫 번째 회복 리포트가 생성되지 않았습니다.<br />
                        <span className="text-obsidian font-bold">7일 동안 1분 기록</span>을 완료하시면,<br />
                        회복 흐름 · 반복 패턴 · 향후 루틴이 제공됩니다.
                    </p>
                </div>

                {/* Action Trigger */}
                <Button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="w-full max-w-[280px] h-14 rounded-2xl bg-obsidian text-white font-black tracking-widest hover:scale-105 transition-transform shadow-xl"
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            회복 기록 분석 중...
                        </>
                    ) : (
                        <>
                            <TrendingUp className="w-5 h-5 mr-2" />
                            회복 리포트 활성화하기
                        </>
                    )}
                </Button>
            </div>
        );
    }

    // 2. Premium 7-Day Recovery Audit Report UI
    return (
        <div className="space-y-6 pb-6">
            
            {/* [Section 1] Cover & Profile Summary */}
            <div className="bg-white rounded-[32px] p-6 border border-line shadow-xl relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 bg-primary/10 text-primary border-l border-b border-line text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                    개인 기록 및 참고용
                </div>
                <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-black text-slate/40 uppercase tracking-widest block">REPORT HEADER</span>
                    <h3 className="font-black text-obsidian tracking-tight text-xl md:text-2xl">당신의 7일 회복 흐름이 정리되었습니다.</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-line text-left">
                    <div>
                        <span className="text-[9px] font-black text-slate/40 uppercase tracking-widest block">대상자</span>
                        <span className="text-sm font-bold text-obsidian">회원 님</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate/40 uppercase tracking-widest block">측정 기간</span>
                        <span className="text-sm font-bold text-obsidian">최근 7일간 (주간)</span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-[9px] font-black text-slate/40 uppercase tracking-widest block">분석 기관</span>
                        <span className="text-sm font-bold text-obsidian">gleemile 라이프케어 OS</span>
                    </div>
                </div>
            </div>

            {/* [Section 2] Highlights Table */}
            <div className="bg-white rounded-[32px] p-6 border border-line shadow-xl space-y-6 text-left">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h4 className="text-base md:text-lg font-black text-obsidian tracking-tight">주간 회복 지표 변동 요약</h4>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[320px]">
                        <thead>
                            <tr className="border-b border-line">
                                <th className="pb-3 text-[10px] font-black text-slate/40 uppercase tracking-widest">핵심 지표</th>
                                <th className="pb-3 text-center text-[10px] font-black text-slate/40 uppercase tracking-widest">전기 (1~3일차)</th>
                                <th className="pb-3 text-center text-[10px] font-black text-slate/40 uppercase tracking-widest">당기 (4~7일차)</th>
                                <th className="pb-3 text-center text-[10px] font-black text-slate/40 uppercase tracking-widest">흐름 변동</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            <tr>
                                <td className="py-3 text-sm font-bold text-obsidian">수면 리듬 (Sleep)</td>
                                <td className="py-3 text-center"><span className="text-[10px] font-black text-status-critical bg-status-critical/10 px-2.5 py-0.5 rounded-full">주의 필요</span></td>
                                <td className="py-3 text-center"><span className="text-[10px] font-black text-status-normal bg-status-normal/10 px-2.5 py-0.5 rounded-full">안정적</span></td>
                                <td className="py-3 text-center text-xs font-black text-status-normal">개선 (▲)</td>
                            </tr>
                            <tr>
                                <td className="py-3 text-sm font-bold text-obsidian">식습관 패턴 (Meals)</td>
                                <td className="py-3 text-center"><span className="text-[10px] font-black text-slate/60 bg-mist px-2.5 py-0.5 rounded-full">참고 필요</span></td>
                                <td className="py-3 text-center"><span className="text-[10px] font-black text-status-critical bg-status-critical/10 px-2.5 py-0.5 rounded-full">주의 필요</span></td>
                                <td className="py-3 text-center text-xs font-black text-status-critical">주의 (▼)</td>
                            </tr>
                            <tr>
                                <td className="py-3 text-sm font-bold text-obsidian">활동/피로 (Activity)</td>
                                <td className="py-3 text-center"><span className="text-[10px] font-black text-status-normal bg-status-normal/10 px-2.5 py-0.5 rounded-full">안정적</span></td>
                                <td className="py-3 text-center"><span className="text-[10px] font-black text-status-normal bg-status-normal/10 px-2.5 py-0.5 rounded-full">안정적</span></td>
                                <td className="py-3 text-center text-xs font-black text-slate/40">유지 (＝)</td>
                            </tr>
                            <tr>
                                <td className="py-3 text-sm font-bold text-obsidian">스트레스 내성 (Tolerance)</td>
                                <td className="py-3 text-center"><span className="text-[10px] font-black text-slate/60 bg-mist px-2.5 py-0.5 rounded-full">참고 필요</span></td>
                                <td className="py-3 text-center"><span className="text-[10px] font-black text-status-normal bg-status-normal/10 px-2.5 py-0.5 rounded-full">안정적</span></td>
                                <td className="py-3 text-center text-xs font-black text-status-normal">개선 (▲)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Fluctuation Comment (이탤릭을 전면 제거하고 둥글고 정갈한 가독성 레이아웃으로 변경) */}
                <div className="bg-mist/30 p-4.5 rounded-2xl border border-line/50">
                    <span className="text-primary font-black block mb-1.5 text-xs">📝 지표 변동 사유 요약 코멘트</span>
                    <p className="text-xs font-semibold text-obsidian/85 leading-relaxed break-keep">
                        {sanitizeText(report.summary || '수면 및 활동성 지표는 양호한 흐름을 유지하고 있으나, 야간 식사 패턴 등의 영향으로 식습관 지표가 일시적으로 하락하였습니다. 야간 소화 부하에 따른 피로 신호 누적을 예방하기 위한 루틴 설정이 권장됩니다.')}
                    </p>
                </div>
            </div>

            {/* [Section 3] Rhythm Ratio & Obstacle Causes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-white rounded-[32px] p-6 border border-line shadow-xl space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate/40" />
                        <h4 className="text-sm font-black text-obsidian tracking-tight">무너지는 시간 비율 (피로 점유율)</h4>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-xs font-bold text-obsidian mb-1">
                                <span>심야 (Late Night)</span>
                                <span className="text-status-critical">45% 🔴</span>
                            </div>
                            <div className="h-2 w-full bg-mist rounded-full overflow-hidden">
                                <div className="h-full bg-status-critical w-[45%]" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-obsidian mb-1">
                                <span>오후 (Afternoon)</span>
                                <span className="text-slate/60">30% 🟡</span>
                            </div>
                            <div className="h-2 w-full bg-mist rounded-full overflow-hidden">
                                <div className="h-full bg-slate/40 w-[30%]" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-obsidian mb-1">
                                <span>저녁 (Evening)</span>
                                <span>15%</span>
                            </div>
                            <div className="h-2 w-full bg-mist rounded-full overflow-hidden">
                                <div className="h-full bg-slate/20 w-[15%]" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-obsidian mb-1">
                                <span>오전 (Morning)</span>
                                <span>10%</span>
                            </div>
                            <div className="h-2 w-full bg-mist rounded-full overflow-hidden">
                                <div className="h-full bg-slate/10 w-[10%]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 border border-line shadow-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-status-critical" />
                            <h4 className="text-sm font-black text-obsidian tracking-tight">주요 회복 방해요인 조합</h4>
                        </div>
                        <p className="text-[10px] font-bold text-slate/40">생활 스냅 분석 결과 감지된 원인 결합</p>
                    </div>

                    <div className="bg-mist p-5 rounded-2xl text-center font-black text-base text-obsidian tracking-tight shadow-inner">
                        [심야 활동 기록 증가] <span className="text-primary">×</span> [늦은 식생활]
                    </div>

                    <p className="text-xs font-semibold text-slate/60 leading-relaxed break-keep">
                        야간 각성 활동이 증가하면서 수면 진입 직전 신체 피로도가 증가하였고, 이와 함께 늦은 시각 식사가 소화 기관에 스트레스를 더해 아침 기상 시의 회복감을 저해하고 있습니다.
                    </p>
                </div>
            </div>

            {/* [Section 4] Recovery Type */}
            <div className="bg-obsidian text-white rounded-[32px] p-6 border border-line shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mt-16 -mr-16" />
                <div className="space-y-1.5 relative z-10">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest block">My Recovery Type</span>
                    <h4 className="text-lg md:text-xl font-black text-white">최근 7일간 당신의 회복 흐름 유형</h4>
                </div>
                <div className="bg-primary text-obsidian font-black text-base md:text-lg px-8 py-3 rounded-2xl shadow-lg relative z-10">
                    오후 피로 집중형
                </div>
            </div>

            {/* [Section 5] Next 7-Day Routine */}
            <div className="bg-white rounded-[32px] p-6 border border-line shadow-xl space-y-6 text-left">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h4 className="text-base md:text-lg font-black text-obsidian tracking-tight">향후 7일간의 회복 실천 루틴 (Day 1 ~ Day 7)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-mist/30 p-5 rounded-2xl border border-line/60 space-y-2">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest block">Day 1 ~ Day 2</span>
                        <h5 className="font-bold text-sm text-obsidian">오후 야외 가벼운 산책</h5>
                        <p className="text-xs font-semibold text-slate/50 leading-relaxed">
                            오후 2시경 야외 가벼운 산책 10분으로 낮 시간대의 활동성을 고르게 유도합니다.
                        </p>
                    </div>
                    <div className="bg-mist/30 p-5 rounded-2xl border border-line/60 space-y-2">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest block">Day 3 ~ Day 5</span>
                        <h5 className="font-bold text-sm text-obsidian">심야 디바이스 화면 잠금</h5>
                        <p className="text-xs font-semibold text-slate/50 leading-relaxed">
                            밤 10시 이후 디바이스 노출을 최소화하여 수면 진입 전의 생체 각성을 줄여 줍니다.
                        </p>
                    </div>
                    <div className="bg-mist/30 p-5 rounded-2xl border border-line/60 space-y-2">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest block">Day 6 ~ Day 7</span>
                        <h5 className="font-bold text-sm text-obsidian">식사 후 3시간 공복 후 수면</h5>
                        <p className="text-xs font-semibold text-slate/50 leading-relaxed">
                            수면 전 식사 간격을 최소 3시간 유지하여 야간 소화계 무리를 방지합니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* [Section 6] Legal Disclaimer Footer */}
            <div className="text-center max-w-xl mx-auto pt-4 border-t border-line/30">
                <p className="text-[10px] font-semibold text-slate/40 leading-relaxed break-keep">
                    이 리포트는 의학적 리듬체크서가 아닙니다. 사용자가 입력한 생활 기록을 바탕으로 회복 흐름과 반복 패턴을 이해하기 위한 개인 참고용 리포트이며, 정확한 의학적 판단은 전문 의료진과 상담해야 합니다.
                </p>
            </div>

        </div>
    );
}
