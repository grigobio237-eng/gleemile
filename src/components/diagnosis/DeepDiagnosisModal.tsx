'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { IPIP60_QUESTIONS, IPIP60Question } from '@/lib/data/ipip60-questions';
import { IPIP60Engine, IPIP60Result } from '@/lib/logic/ipip60-engine';
import { DiagnosisRadarChart } from '../charts/DiagnosisRadarChart';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, RefreshCw, X, Brain, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { useRouter } from 'next/navigation';

interface DeepDiagnosisModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeepDiagnosisModal({ open, onOpenChange }: DeepDiagnosisModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<'intro' | 'test' | 'analyzing' | 'result'>('intro');
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [result, setResult] = useState<IPIP60Result | null>(null);

    // Reset when opened
    useEffect(() => {
        if (open) {
            setStep('intro');
            setCurrentQIndex(0);
            setAnswers({});
        }
    }, [open]);

    const handleStart = () => {
        setStep('test');
    };

    const handleAnswer = (score: number) => {
        const question = IPIP60_QUESTIONS[currentQIndex];
        setAnswers(prev => ({ ...prev, [question.id]: score }));

        if (currentQIndex < IPIP60_QUESTIONS.length - 1) {
            // Auto-next with small delay
            setTimeout(() => setCurrentQIndex(prev => prev + 1), 200);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setStep('analyzing');

        // Final calculation
        const res = IPIP60Engine.calculate(answers);
        setResult(res);

        // Save to Server
        try {
            await fetch('/api/diagnosis/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'DEEP',
                    result: res,
                    answers: answers
                })
            });
            console.log('✅ Deep diagnosis result saved');
        } catch (error) {
            console.error('Failed to save deep diagnosis:', error);
        }

        setTimeout(() => {
            setStep('result');
        }, 2500); // Premium analysis feel
    };

    const currentQuestion = IPIP60_QUESTIONS[currentQIndex];
    const progress = ((currentQIndex + 1) / IPIP60_QUESTIONS.length) * 100;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none rounded-[40px] bg-surface shadow-2xl h-[700px] flex flex-col">
                <DialogHeader className="sr-only">
                    <DialogTitle>IPIP-NEO-60 심층 리듬체크</DialogTitle>
                    <DialogDescription>
                        60개의 정밀 문항을 통해 당신의 성격 5요인과 30개 국면을 분석합니다.
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === 'intro' && (
                        <DeepIntroView onStart={handleStart} onClose={() => onOpenChange(false)} />
                    )}
                    {step === 'test' && (
                        <DeepTestView
                            question={currentQuestion}
                            index={currentQIndex}
                            total={IPIP60_QUESTIONS.length}
                            onAnswer={handleAnswer}
                            onPrevious={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                        />
                    )}
                    {step === 'analyzing' && <DeepAnalyzingView />}
                    {step === 'result' && result && (
                        <DeepResultView result={result} onClose={() => onOpenChange(false)} />
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

// --- Sub-components ---

function DeepIntroView({ onStart, onClose }: { onStart: () => void, onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col h-full bg-gradient-to-br from-obsidian to-[#1A1A1A] text-white"
        >
            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-8">
                <div className="relative">
                    <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                        <Brain className="w-12 h-12 text-primary" />
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 text-yellow-400" />
                </div>

                <div>
                    <Badge variant="outline" className="text-primary border-primary mb-4 px-3 py-1">PREMIUM ANALYSIS</Badge>
                    <h2 className="font-black mb-4 tracking-tight text-4xl">IPIP-NEO-60 심층 리듬체크</h2>
                    <p className="text-white/60 leading-relaxed max-w-sm mx-auto">
                        단순 성향 파악을 넘어, 30가지 세부 심리 국면과<br />
                        요인 간 상호작용을 gleemile 알고리즘으로 분석합니다.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-8 w-full max-w-md pt-4">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">📋</span>
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">60 문항</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-white/10">
                        <span className="text-2xl mb-1">⏱️</span>
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">약 7분</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">⚖️</span>
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">T-Score 규준</span>
                    </div>
                </div>
            </div>

            <div className="p-10 bg-white/5 border-t border-white/10">
                <Button onClick={onStart} className="w-full h-16 rounded-2xl bg-primary text-background font-black hover:scale-[1.02] transition-transform shadow-2xl shadow-primary/20 text-xl">
                    심층 분석 시작하기
                </Button>
            </div>
        </motion.div>
    );
}

function DeepTestView({ question, index, total, onAnswer, onPrevious }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full bg-white"
        >
            <div className="px-10 pt-10 pb-6">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 mb-2 border-none font-black text-[10px] tracking-widest">
                            {question.facetName} ANALYSIS
                        </Badge>
                        <h4 className="text-xs font-black text-slate uppercase tracking-widest">Question {index + 1} / {total}</h4>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black italic text-primary">{Math.round(((index + 1) / total) * 100)}%</span>
                    </div>
                </div>
                <Progress value={((index + 1) / total) * 100} className="h-2 bg-mist" indicatorClassName="bg-primary" />
            </div>

            <div className="flex-1 flex flex-col justify-center px-10 pb-10">
                <div className="mb-12 text-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-obsidian leading-tight mb-4 min-h-[4em] flex items-center justify-center">
                        {question.text}
                    </h3>
                    <p className="text-foreground/70 italic text-sm font-medium">{question.textEn}</p>
                </div>

                <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
                    {[
                        { label: '매우 그렇다', score: 5, color: 'hover:bg-primary/10 hover:border-primary hover:text-primary' },
                        { label: '그렇다', score: 4, color: 'hover:bg-primary/5' },
                        { label: '보통이다', score: 3, color: 'hover:bg-surface' },
                        { label: '아니다', score: 2, color: 'hover:bg-surface' },
                        { label: '전혀 아니다', score: 1, color: 'hover:bg-red-50 hover:border-red-200 hover:text-red-500' },
                    ].map((opt) => (
                        <button
                            key={opt.score}
                            onClick={() => onAnswer(opt.score)}
                            className={`w-full p-5 rounded-2xl border border-line text-slate font-bold transition-all text-left flex justify-between items-center group active:scale-[0.98] ${opt.color}`}
                        >
                            <span>{opt.label}</span>
                            <div className="w-6 h-6 rounded-full border border-line flex items-center justify-center group-hover:border-current">
                                <div className="w-3 h-3 rounded-full bg-current opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {index > 0 && (
                <div className="px-10 pb-6">
                    <button onClick={onPrevious} className="text-xs font-bold text-foreground/70 hover:text-primary transition-colors flex items-center gap-1">
                        ← 이전 질문으로 돌아가기
                    </button>
                </div>
            )}
        </motion.div>
    );
}

function DeepAnalyzingView() {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col h-full items-center justify-center bg-obsidian text-white p-10 text-center space-y-8"
        >
            <div className="relative">
                <RefreshCw className="w-20 h-20 animate-spin text-primary opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <ShieldCheck className="w-10 h-10 text-primary" />
                    </motion.div>
                </div>
            </div>

            <div>
                <h2 className="text-3xl font-black mb-4">데이터 정밀 분석 중</h2>
                <div className="space-y-3">
                    <p className="text-white/60 text-sm animate-pulse">• IPIP-NEO-60 규준 대조 중...</p>
                    <p className="text-white/60 text-sm animate-pulse delay-700">• 30개 심리 국면 가중치 산출 중...</p>
                    <p className="text-white/60 text-sm animate-pulse delay-1000">• 요인 간 상호작용 내러티브 생성 중...</p>
                </div>
            </div>
        </motion.div>
    );
}

function DeepResultView({ result, onClose }: { result: IPIP60Result, onClose: () => void }) {
    const router = useRouter();
    const chartData = [
        { subject: '신경증', score: result.tScores.N, fullMark: 80 },
        { subject: '외향성', score: result.tScores.E, fullMark: 80 },
        { subject: '개방성', score: result.tScores.O, fullMark: 80 },
        { subject: '우호성', score: result.tScores.A, fullMark: 80 },
        { subject: '성실성', score: result.tScores.C, fullMark: 80 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col h-full bg-surface relative overflow-y-auto"
        >
            {/* Result Header */}
            <div className="bg-obsidian text-white p-10 pb-24 rounded-b-[60px] relative">
                <Button variant="ghost" size="icon" className="absolute top-6 right-6 text-white/40 hover:text-white" onClick={onClose}>
                    <X />
                </Button>
                <Badge className="bg-primary text-background border-none mb-4 font-black tracking-widest">DEPTH ANALYSIS COMPLETE</Badge>
                <h2 className="font-black mb-2 italic text-4xl">Your Core Persona</h2>
                <p className="text-white/60 font-medium">60개의 문항으로 분석된 당신의 심층 성격 프로파일입니다.</p>
            </div>

            {/* Content (Overlapping) */}
            <div className="px-8 -mt-16 pb-12 space-y-6 relative z-10">
                {/* 1. Radar Chart */}
                <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-line">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-sm font-black text-obsidian uppercase tracking-widest">Big Five Profile</h4>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <span className="text-[10px] font-bold text-slate">T-SCORE</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <DiagnosisRadarChart data={chartData} color="#2563eb" />
                    </div>
                </div>

                {/* 2. Key Interpretations */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-foreground/70 uppercase tracking-[0.2em] ml-2">Expert Insights</h4>
                    {result.interpretations.map((text, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (idx * 0.1) }}
                            className="bg-white p-6 rounded-[28px] border border-line shadow-lg flex gap-4 items-start"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-obsidian font-bold leading-relaxed">{text}</p>
                        </motion.div>
                    ))}
                </div>

                {/* 3. Detailed Facets Preview Nudge */}
                <div className="bg-gradient-to-r from-obsidian to-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Brain className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="font-black mb-2 text-xl">30개 하위 국면 상세 리포트</h3>
                        <p className="text-white/60 text-sm mb-6 leading-relaxed">
                            각 요인별 6가지 상세 국면(불안, 주장성, 도덕성 등)에 대한<br />
                            수치화된 분석과 맞춤형 개선 가이드를 확인하세요.
                        </p>
                        <Button 
                            onClick={() => {
                                router.push('/ai-navigator/report');
                                onClose();
                            }}
                            className="w-full h-14 bg-white text-obsidian font-black rounded-2xl hover:bg-white/90"
                        >
                            전체 분석 리포트 확인하기
                            <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
