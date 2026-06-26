'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getQuestionsForSession, DiagnosisQuestionData } from '@/lib/data/diagnosis-questions';
import { SimcheungDiagnosisEngine, FreeDiagnosisResult } from '@/lib/logic/simcheung-diagnosis';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MockPaymentModal } from '../payment/MockPaymentModal';
import { DiagnosisRadarChart } from '../charts/DiagnosisRadarChart';

interface DetailedDiagnosisModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUnlockPaid?: () => void;
    initialStep?: 'intro' | 'test' | 'analyzing' | 'result';
}

export function DetailedDiagnosisModal({ open, onOpenChange, onUnlockPaid, initialStep = 'intro' }: DetailedDiagnosisModalProps) {
    const { data: session } = useSession();
    const [step, setStep] = useState<'intro' | 'test' | 'analyzing' | 'result'>('intro');
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<FreeDiagnosisResult | null>(null);
    const [questions, setQuestions] = useState<DiagnosisQuestionData[]>([]);

    const userName = session?.user?.name || '유저';

    // Reset or Initialize when opened
    useEffect(() => {
        if (open) {
            setStep(initialStep);
            if (initialStep === 'result') {
                fetchLatestResult();
            }
        }
    }, [open, initialStep]);

    const fetchLatestResult = async () => {
        try {
            const response = await fetch('/api/user/profile');
            if (response.ok) {
                const userData = await response.json();
                const diagnosisHistory = userData.diagnosisResults || [];
                const latest = diagnosisHistory.length > 0 ? diagnosisHistory[diagnosisHistory.length - 1] : null;

                if (latest) {
                    console.log('Latest fetched:', latest);
                    // DB schema uses 'scores', component expects 'convertedScores'
                    if (latest.scores && !latest.convertedScores) {
                        setResult({
                            convertedScores: latest.scores,
                            rawScores: latest.metadata?.rawScores || {},
                            lowestCategory: latest.metadata?.lowestCategory || '',
                            totalScore: latest.totalScore
                        });
                    } else if (latest.result) {
                        setResult(latest.result);
                    } else {
                        // Fallback if structure matches directly
                        setResult(latest);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch diagnosis result:', error);
        }
    };

    const handleStart = () => {
        // Load questions based on session count
        const count = parseInt(localStorage.getItem('diagnosis_session_count') || '0', 10);
        const sessionQuestions = getQuestionsForSession(count);
        setQuestions(sessionQuestions);

        setStep('test');
        setCurrentQIndex(0);
        setAnswers({});
    };

    const handleAnswer = (score: number) => {
        const question = questions[currentQIndex];
        setAnswers(prev => ({ ...prev, [question.id]: score }));

        if (currentQIndex < questions.length - 1) {
            setTimeout(() => setCurrentQIndex(prev => prev + 1), 250); // Slight delay for visual feedback
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setStep('analyzing');

        const res = SimcheungDiagnosisEngine.calculateFreeDiagnosis(answers, questions);
        setResult(res);

        // Update session count for rotation
        const count = parseInt(localStorage.getItem('diagnosis_session_count') || '0', 10);
        localStorage.setItem('diagnosis_session_count', (count + 1).toString());

        // Save to Server
        try {
            await fetch('/api/diagnosis/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'daily',
                    result: res,
                    answers: answers
                })
            });

            // 3. Update LocalStorage for immediate Navigator reflection
            localStorage.setItem('recovery_last_score', res.totalScore.toString());
        } catch (error) {
            console.error('Failed to save result:', error);
        }

        // Simulate analysis delay
        setTimeout(() => {
            setStep('result');
        }, 1500);
    };

    const handleClose = () => onOpenChange(false);

    // Render Logic
    const currentQuestion = questions[currentQIndex];
    const progress = ((currentQIndex) / questions.length) * 100;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none rounded-[32px] bg-surface shadow-2xl h-[600px] flex flex-col">
                <DialogHeader className="sr-only">
                    <DialogTitle>{userName} 님의 정밀 상태 분석</DialogTitle>
                    <DialogDescription>
                        상태 분석을 통해 당신의 회복 흐름을 파악하고 솔루션을 제공합니다.
                    </DialogDescription>

                </DialogHeader>
                <AnimatePresence mode="wait">
                    {step === 'intro' && (
                        <IntroView key="intro" onStart={handleStart} onClose={handleClose} userName={userName} />
                    )}
                    {step === 'test' && (
                        <TestView
                            key="test"
                            question={currentQuestion}
                            index={currentQIndex}
                            total={questions.length}
                            onAnswer={handleAnswer}
                            onPrevious={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                            onClose={handleClose}
                        />
                    )}
                    {step === 'analyzing' && (
                        <AnalyzingView key="analyzing" userName={userName} />
                    )}
                    {step === 'result' && result && (
                        <ResultView
                            key="result"
                            result={result}
                            onClose={handleClose}
                            onUnlockPaid={onUnlockPaid}
                            userName={userName}
                        />
                    )}
                </AnimatePresence>
            </DialogContent>

        </Dialog>
    );
}

// ---------------- Sub Components ----------------

function IntroView({ onStart, onClose, userName }: { onStart: () => void, onClose: () => void, userName: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col h-full relative"
        >
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10 text-slate" onClick={onClose}>
                <X />
            </Button>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 bg-gradient-to-b from-mist to-white">
                <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mb-4">
                    <span className="text-4xl">🧠</span>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-obsidian mb-4">{userName} 님을 위한<br />심층 상태 분석</h2>

                    <p className="text-slate font-medium leading-relaxed max-w-sm mx-auto">
                        나의 마음, 감정, 관계, 신체 4가지 영역을<br />
                        정밀하게 분석하여<br />
                        현재 상태에 딱 맞는 회복 솔루션을 찾아드립니다.
                    </p>
                </div>
                <div className="flex gap-4 text-xs font-bold text-text-secondary uppercase tracking-widest">
                    <span>• 24 문항</span>
                    <span>• 약 3분 소요</span>
                    <span>• gleemile 정밀 분석</span>
                </div>
            </div>
            <div className="p-8 bg-white border-t border-line">
                <Button onClick={onStart} className="w-full h-14 rounded-2xl bg-primary text-background font-black text-lg shadow-lg hover:scale-[1.02] transition-transform">
                    지금 분석 시작하기

                </Button>
            </div>
        </motion.div>
    );
}

function TestView({ question, index, total, onAnswer, onPrevious, onClose }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full bg-white relative"
        >
            <div className="px-8 pt-8 pb-4">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-black text-primary/50 tracking-widest">QUESTION {index + 1}/{total}</span>
                    <Button variant="ghost" size="icon" className="text-slate -mr-2" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>
                <Progress value={(index / total) * 100} className="h-2 bg-mist" indicatorClassName="bg-primary" />
            </div>

            <div className="flex-1 flex flex-col justify-center px-8 pb-8 relative">
                {/* Previous Button (Absolute Position or Flex) */}
                {index > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 left-8 text-foreground/70 hover:text-primary -mt-2 pl-0 hover:bg-transparent"
                        onClick={onPrevious}
                    >
                        &lt; 이전 질문
                    </Button>
                )}

                <h3 className="font-bold text-obsidian leading-snug mb-12 text-center text-balance text-xl md:text-2xl">
                    {question.text}
                </h3>

                <div className="space-y-3">
                    {[
                        { label: '매우 그렇다', score: 5 },
                        { label: '그렇다', score: 4 },
                        { label: '보통이다', score: 3 },
                        { label: '아니다', score: 2 },
                        { label: '전혀 아니다', score: 1 },
                    ].map((opt) => (
                        <button
                            key={opt.score}
                            onClick={() => onAnswer(opt.score)}
                            className="w-full p-4 rounded-xl border border-line text-slate hover:border-primary hover:bg-primary/5 hover:text-primary font-bold transition-all text-left flex justify-between group active:scale-[0.98]"
                        >
                            <span>{opt.label}</span>
                            <span className="w-5 h-5 rounded-full border border-line group-hover:border-primary flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function AnalyzingView({ userName }: { userName: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col h-full items-center justify-center bg-obsidian text-white p-8 text-center"
        >
            <div className="relative mb-8">
                <RefreshCw className="w-16 h-16 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">⚡️</span>
                </div>
            </div>
            <h2 className="text-2xl font-black mb-2">분석 중입니다...</h2>
            <p className="text-white/60">{userName} 님의 응답 패턴을 gleemile 모델과 대조하여<br />심층 리포트를 생성하고 있습니다.</p>
        </motion.div>
    );
}

function ResultView({ result, onClose, onUnlockPaid, userName }: { result: FreeDiagnosisResult, onClose: () => void, onUnlockPaid?: () => void, userName: string }) {
    const [paymentOpen, setPaymentOpen] = useState(false);

    const handleUnlockClick = () => {
        setPaymentOpen(true);
    };

    const handlePaymentSuccess = () => {
        setPaymentOpen(false);
        onClose(); // Close the free result view
        if (onUnlockPaid) onUnlockPaid();
    };

    // Use standardized scores for the graph
    const standardScores = SimcheungDiagnosisEngine.mapFreeToStandard(result);
    const chartData = [
        { subject: '신체', score: standardScores.physical, fullMark: 100 },
        { subject: '멘탈', score: standardScores.mental, fullMark: 100 },
        { subject: '수면', score: standardScores.sleep, fullMark: 100 },
        { subject: '생활', score: standardScores.lifestyle, fullMark: 100 },
    ];

    const lowestCatName =
        result.lowestCategory === 'Mindset' ? '마인드셋' :
            result.lowestCategory === 'Emotional' ? '감정 조절' :
                result.lowestCategory === 'Social' ? '사회적 관계' : '신체 활력';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col h-full bg-surface relative overflow-y-auto"
        >
            <div className="absolute top-0 w-full h-48 bg-obsidian rounded-b-[40px] z-0" />

            <div className="relative z-10 pt-8 px-6 pb-20 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6 text-white">
                    <div>
                        <div className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">{userName} 님의 실시간 점수</div>
                        <div className="font-black tracking-tighter text-4xl">{result.totalScore}<span className="text-lg opacity-50">/100</span></div>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] shadow-xl border border-line p-6 mb-6 flex-shrink-0">
                    <div className="h-48 w-full -ml-2">
                        <DiagnosisRadarChart
                            data={chartData}
                            color="#2563eb"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* AI Whisper Nudge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-primary/5 border border-primary/20 rounded-2xl p-5 relative"
                    >
                        <div className="absolute -top-3 left-4 bg-white px-2 py-0.5 rounded-full border border-primary/20 text-[10px] font-bold text-primary uppercase flex items-center gap-1 shadow-sm">
                            <span className="text-sm">🤖</span> Youniqle Coach Whisper
                        </div>
                        <p className="text-sm font-medium text-obsidian leading-relaxed mt-2">
                            &quot;{userName} 님, 전반적으로 훌륭하시지만 <span className="text-primary font-bold text-glow-cream">{lowestCatName}</span> 점수가 유독 낮네요.<br /><br />
                            이 부분만 해결하면 회복 탄력성이 <span className="bg-primary/10 px-1 rounded font-bold">2배</span>는 좋아질 것 같아요. 제가 원인을 찾아드릴까요?&quot;
                        </p>
                    </motion.div>

                    <div className="bg-status-amber/10 border border-status-amber/20 rounded-2xl p-5">
                        <div className="text-xs font-black text-status-amber uppercase tracking-widest mb-2">Weakness Analysis</div>
                        <h3 className="text-lg font-bold text-obsidian mb-2">
                            &apos;{lowestCatName}&apos; 케어가 시급합니다
                        </h3>
                        <p className="text-sm text-slate leading-relaxed">
                            {userName} 님, 현재 4가지 영역 중 가장 에너지가 소진된 상태입니다.
                        </p>
                    </div>

                    {/* Blur Report (Gap Nudge) */}
                    <div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-line shadow-lg bg-white" onClick={handleUnlockClick}>
                        <div className="p-5 filter blur-[6px] select-none pointer-events-none opacity-60">
                            <div className="text-xs font-black text-obsidian uppercase tracking-widest mb-3">Deep Analysis Report</div>
                            <h3 className="text-lg font-bold text-obsidian mb-2">{userName} 님의 {lowestCatName} 점수가 낮은 결정적 원인 3가지</h3>
                            <ul className="space-y-2 mt-4 text-sm text-slate">
                                <li className="flex gap-2"><span>1.</span> <span>무의식적인 스트레스 반응 패턴이...</span></li>
                                <li className="flex gap-2"><span>2.</span> <span>수면의 질과 연관된 호르몬 불균형이...</span></li>
                                <li className="flex gap-2"><span>3.</span> <span>과거의 특정 경험으로 인한 방어 기제가...</span></li>
                            </ul>
                        </div>

                        {/* Lock Overlay */}
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] p-6 text-center transition-colors hover:bg-white/30">
                            <div className="w-12 h-12 bg-obsidian text-white rounded-full flex items-center justify-center mb-3 shadow-xl">
                                <span className="text-xl">🔒</span>
                            </div>
                            <h4 className="text-sm font-black text-obsidian mb-1">심층 분석 리포트 잠김</h4>
                            <p className="text-xs text-slate font-medium mb-4">{userName} 님의 진짜 원인을 파악하고 싶다면?</p>
                            <Button className="h-10 px-6 rounded-full bg-obsidian text-white font-bold text-xs shadow-lg hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); handleUnlockClick(); }}>
                                지금 잠금 해제하기
                            </Button>
                            {/* Temporary Dev Button for Report Page Check */}
                            <div className="mt-2">
                                <Link href="/diagnosis/report" className="text-[10px] text-foreground/70">
                                    (개발용) 리포트 페이지 미리보기
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-line">
                        <div className="text-xs font-black text-primary uppercase tracking-widest mb-3">Next Step</div>
                        <Button asChild onClick={onClose} className="w-full h-12 bg-primary text-background font-bold rounded-xl shadow-lg shadow-primary/20 cursor-pointer hover:opacity-90">
                            <Link href="/ai-advice">
                                맞춤형 회복 플랜 보기 <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
            {/* Mock Payment Modal */}
            <MockPaymentModal
                open={paymentOpen}
                onOpenChange={setPaymentOpen}
                price={3900}
                productName="심층 심리 분석 리포트 + gleemile 솔루션"
                onSuccess={handlePaymentSuccess}
            />
        </motion.div>
    );
}
