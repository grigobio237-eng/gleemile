
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { FULL_DIAGNOSIS_QUESTIONS, FullDiagnosisQuestion } from '@/lib/data/full-diagnosis-questions';
import { SimcheungDiagnosisEngine } from '@/lib/logic/simcheung-diagnosis';
import { useRouter } from 'next/navigation';

interface PaidDiagnosisModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PaidDiagnosisModal({ open, onOpenChange }: PaidDiagnosisModalProps) {
    const [step, setStep] = useState<'intro' | 'test' | 'analyzing' | 'complete'>('intro');
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const router = useRouter();

    const questions: FullDiagnosisQuestion[] = FULL_DIAGNOSIS_QUESTIONS; // All 60 questions
    const totalQuestions = questions.length;

    // Reset when opened
    useEffect(() => {
        if (open) {
            setStep('intro');
            setCurrentQIndex(0);
            setAnswers({});
        }
    }, [open]);

    const handleAnswer = (score: number) => {
        const currentQ = questions[currentQIndex];
        setAnswers(prev => ({ ...prev, [currentQ.id]: score }));

        if (currentQIndex < totalQuestions - 1) {
            setTimeout(() => setCurrentQIndex(prev => prev + 1), 250); // Small delay for UX
        } else {
            setStep('analyzing');
            finishDiagnosis();
        }
    };

    const finishDiagnosis = async () => {
        // Calculate Results
        // Note: answers state update might be slightly delayed in React batching if called immediately effectively,
        // but here we are in a callback or timeout.
        // Actually, 'answers' needs to be complete.
        // Let's rely on the latest state by passing it or using a ref if strictly needed, but here simple timeout is usually fine or pass partial.
        // Better: Wait for effect or use current `answers` merged with last answer.

        // Simulating API/Calculation delay
        setTimeout(async () => {
            // Retrieve full answers including the last one
            // (In a real app, use a proper state manager or effect to trigger this)
            // For this prototype, we'll re-construct the answers object with the last answer if missing, but `setAnswers` is async.
            // We'll trust that by the time this runs (after animation/timeout), state is consistent enough or we should pass the final payload.

            // Calculate locally
            const result = SimcheungDiagnosisEngine.calculateResults({
                answers: { ...answers }, // This might miss the last one if called synchronously
                questions: FULL_DIAGNOSIS_QUESTIONS
            });

            // To ensure we have the last answer, we should actually pass it to this function or update logic.
            // Simplified for prototype: The `handleAnswer` updates state. The `setTimeout` implies we wait.
            // Let's refine `handleAnswer`.

            // Save to DB
            try {
                await fetch('/api/diagnosis/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'paid',
                        result,
                        answers // Save detailed answers if needed
                    })
                });
            } catch (e) {
                console.error("Save failed", e);
            }

            setStep('complete');
        }, 3000);
    };

    // Need to capture the LAST answer correctly. 
    // We can modify handleAnswer to check index.

    const onAnswerClick = (score: number) => {
        const currentQ = questions[currentQIndex];
        const newAnswers = { ...answers, [currentQ.id]: score };
        setAnswers(newAnswers);

        if (currentQIndex < totalQuestions - 1) {
            setTimeout(() => setCurrentQIndex(prev => prev + 1), 250);
        } else {
            setStep('analyzing');
            // Perform analysis with `newAnswers`
            setTimeout(async () => {
                const result = SimcheungDiagnosisEngine.calculateResults({
                    answers: newAnswers,
                    questions: FULL_DIAGNOSIS_QUESTIONS
                });

                try {
                    await fetch('/api/diagnosis/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'paid',
                            result,
                            answers: newAnswers
                        })
                    });
                } catch (e) { console.error(e); }

                setStep('complete');
            }, 3000);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden bg-white/60 backdrop-blur-xl text-obsidian border-white/80 shadow-2xl flex flex-col sm:rounded-[32px]">
                {/* Accessibility: Persistent Title */}
                <DialogTitle className="sr-only">심층 상태 분석 (Premium)</DialogTitle>
                <DialogDescription className="sr-only">60문항으로 구성된 유료 심층 상태 분석 모달입니다.</DialogDescription>


                <AnimatePresence mode="wait">
                    {step === 'intro' && (
                        <IntroView key="intro" onNext={() => setStep('test')} onClose={() => onOpenChange(false)} />
                    )}
                    {step === 'test' && (
                        <TestView
                            key="test"
                            question={questions[currentQIndex]}
                            index={currentQIndex}
                            total={totalQuestions}
                            onAnswer={onAnswerClick}
                            onPrevious={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                            onClose={() => onOpenChange(false)}
                        />
                    )}
                    {step === 'analyzing' && <AnalyzingView key="analyzing" />}
                    {step === 'complete' && <CompleteView key="complete" onCheckResult={() => {
                        onOpenChange(false);
                        router.push('/diagnosis/report');
                    }} />}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}


function IntroView({ onNext, onClose }: { onNext: () => void, onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full relative overflow-hidden"
        >
            {/* Ambient Background Glow - Subtle & Premium */}
            <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

            <Button variant="ghost" size="icon" className="absolute top-6 right-6 text-foreground/70 hover:text-obsidian hover:bg-black/5 z-50 rounded-full transition-colors" onClick={onClose}><X className="w-6 h-6" /></Button>

            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-14 text-center space-y-12 relative z-10 max-w-3xl mx-auto">

                {/* Hero Badge */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-60 rounded-full" />
                        <div className="w-24 h-24 bg-white/50 backdrop-blur-md border border-white/60 rounded-3xl flex items-center justify-center shadow-xl relative z-10 transform rotate-6 group-hover:rotate-0 transition-all duration-500">
                            <span className="drop-shadow-sm text-xl">💎</span>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-primary text-xs font-black tracking-[0.2em] uppercase">Premium Analysis</span>
                    </div>
                </motion.div>

                {/* Main Copy */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    <h2 className="font-black text-obsidian leading-tight tracking-tight text-4xl md:text-4xl">
                        당신의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">진짜 잠재력</span>을<br />
                        데이터로 마주하세요
                    </h2>
                    <p className="text-obsidian text-lg font-medium leading-relaxed max-w-lg mx-auto">
                        표면적인 리듬체크를 넘어섭니다.<br />
                        <span className="text-primary font-bold text-glow-cream">30가지 심층 국면</span>과 <span className="text-primary font-bold text-glow-cream">5대 성격 요인</span>을 정밀 분석하여<br />
                        가장 나다운 성장의 길을 제시합니다.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full"
                >
                    {[
                        { title: 'Big 5 Standard', desc: '과학적 표준 모델', color: 'bg-indigo-50/50 hover:bg-secondary-container/50' },
                        { title: 'Hyper Detail', desc: '30개 정밀 국면', color: 'bg-purple-50/50 hover:bg-secondary-container/50' },
                        { title: 'Youniqle Solution', desc: '맞춤형 성장 전략', color: 'bg-emerald-50/50 hover:bg-secondary-container/50' }
                    ].map((item, i) => (
                        <div key={i} className={`${item.color} border border-white/50 rounded-2xl p-5 text-left transition-all backdrop-blur-md group hover:shadow-md`}>
                            <div className="text-obsidian text-base font-bold mb-1 group-hover:translate-x-1 transition-transform">{item.title}</div>
                            <div className="text-foreground/70 text-xs font-semibold">{item.desc}</div>
                        </div>
                    ))}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full"
                >
                    <Button
                        onClick={onNext}
                        className="w-full max-w-sm mx-auto h-16 bg-obsidian text-white font-bold rounded-full text-lg shadow-xl shadow-obsidian/10 hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        심층 분석 시작하기 <ArrowRight className="w-5 h-5 ml-1" />

                    </Button>
                    <p className="mt-4 text-foreground/70 text-xs font-medium">약 5-10분 소요됩니다</p>
                </motion.div>
            </div>
        </motion.div>
    );
}

function TestView({ question, index, total, onAnswer, onPrevious, onClose }: any) {
    const progress = ((index + 1) / total) * 100;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="flex flex-col h-full relative overflow-hidden">

            <div className="px-6 md:px-10 pt-10 pb-6 relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary/70 tracking-[0.2em] mb-1">DEEP ANALYSIS</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-obsidian">{String(index + 1).padStart(2, '0')}</span>
                            <span className="text-sm font-bold text-foreground/70">/ {total}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-obsidian hover:bg-black/5 rounded-full w-10 h-10" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "circOut", duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-primary to-indigo-500 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center px-6 md:px-10 pb-10 max-w-3xl mx-auto w-full relative z-10">
                {/* Previous Button */}
                {index > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 left-6 md:left-10 text-foreground/70 hover:text-primary -mt-8 pl-0 hover:bg-transparent"
                        onClick={onPrevious}
                    >
                        &lt; 이전 질문
                    </Button>
                )}

                <h3 className="text-2xl md:text-3xl font-bold text-obsidian leading-relaxed mb-12 text-center text-balance break-keep drop-shadow-sm">
                    {question.text}
                </h3>

                <div className="grid gap-3 w-full max-w-xl mx-auto">
                    {[
                        { label: '매우 그렇다', score: 5, activeClass: 'border-primary bg-primary/5 text-primary' },
                        { label: '그렇다', score: 4, activeClass: 'border-primary/50 bg-primary/5 text-primary' },
                        { label: '보통이다', score: 3, activeClass: 'border-gray-300 bg-white text-obsidian' },
                        { label: '아니다', score: 2, activeClass: 'border-gray-300 bg-white text-obsidian' },
                        { label: '전혀 아니다', score: 1, activeClass: 'border-gray-300 bg-white text-obsidian' },
                    ].map((opt) => (
                        <button
                            key={opt.score}
                            onClick={() => onAnswer(opt.score)}
                            className={`w-full p-4 md:p-5 rounded-2xl border border-transparent bg-white shadow-sm text-foreground/70 font-bold transition-all text-center md:text-left flex justify-between items-center group hover:border-primary/30 hover:shadow-md hover:text-obsidian hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 duration-200`}
                        >
                            <span className="text-lg transition-colors">{opt.label}</span>
                            <span className="hidden md:flex w-6 h-6 rounded-full border border-line group-hover:border-primary items-center justify-center transition-colors">
                                <motion.div className="w-3 h-3 rounded-full bg-primary" initial={{ scale: 0 }} animate={{ scale: 0 }} whileHover={{ scale: 1 }} />
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function AnalyzingView() {
    return (
        <motion.div className="flex flex-col h-full items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="relative mb-10">
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-60 animate-pulse rounded-full" />
                <RefreshCw className="w-16 h-16 animate-spin text-primary relative z-10" />
            </div>

            <h2 className="text-3xl font-black mb-4 relative z-10 text-obsidian">데이터 정밀 분석 중</h2>
            <p className="text-foreground/70 text-lg relative z-10 font-medium">
                60개의 응답을 30가지 차원으로<br />
                재구성하고 있습니다.
            </p>
        </motion.div>
    );
}

function CompleteView({ onCheckResult }: { onCheckResult: () => void }) {
    return (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col h-full items-center justify-center p-8 text-center relative overflow-hidden">

            {/* Success Animation Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative mb-10 group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full duration-1000" />
                <div className="w-32 h-32 bg-white border border-white/60 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10">
                    <CheckCircle2 className="w-16 h-16 text-primary drop-shadow-md" />
                </div>
            </div>

            <h2 className="font-black text-obsidian mb-6 relative z-10 text-4xl">분석이 완료되었습니다</h2>
            <p className="text-foreground/70 text-lg mb-12 max-w-sm mx-auto relative z-10 leading-relaxed font-medium">
                상위 1% 정밀도의 <span className="text-primary font-bold">프리미엄 리포트</span>가<br />
                지금 막 생성되었습니다.
            </p>

            <Button onClick={onCheckResult} className="w-full max-w-sm h-16 bg-obsidian text-white font-bold rounded-full hover:scale-[1.02] hover:shadow-xl transition-all relative z-10 text-xl">
                리포트 확인하러 가기 <ArrowRight className="ml-2" />
            </Button>
        </motion.div>
    );
}
