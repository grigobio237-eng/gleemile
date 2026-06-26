import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, CreditCard, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface MockPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    price: number;
    productName: string;
    onSuccess: () => void;
}

export function MockPaymentModal({ open, onOpenChange, price, productName, onSuccess }: MockPaymentModalProps) {
    const [step, setStep] = useState<'info' | 'processing' | 'success'>('info');

    // Reset step when modal opens
    useEffect(() => {
        if (open) setStep('info');
    }, [open]);

    const handlePayment = async () => {
        setStep('processing');

        // Simulate processing time
        setTimeout(async () => {
            try {
                // Call mock payment approval API
                const response = await fetch('/api/payment/mock-approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: price, productName })
                });

                if (response.ok) {
                    setStep('success');
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#0E3A3A', '#D4AF37', '#FFD700']
                    });

                    setTimeout(() => {
                        onSuccess();
                    }, 2000);
                } else {
                    alert('결제 처리 중 오류가 발생했습니다.');
                    setStep('info');
                }
            } catch (error) {
                console.error('Payment Error:', error);
                alert('결제 처리 중 오류가 발생했습니다.');
                setStep('info');
            }
        }, 1500);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden bg-surface border-none shadow-2xl">
                <AnimatePresence mode="wait">
                    {step === 'info' && (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-8 space-y-6"
                        >
                            <DialogHeader>
                                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <DialogTitle className="text-2xl font-black text-center text-obsidian">
                                    프리미엄 리포트 잠금 해제
                                </DialogTitle>
                                <DialogDescription className="text-center text-slate font-medium">
                                    남은 36개의 숨겨진 분석 데이터를 확인하고<br />
                                    나를 위한 완벽한 회복 솔루션을 받으세요.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="bg-mist/50 rounded-2xl p-6 border border-line space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-line">
                                    <span className="text-sm font-bold text-slate">상품명</span>
                                    <span className="font-bold text-obsidian">{productName}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-bold text-obsidian">결제 금액</span>
                                    <span className="font-black text-primary text-2xl">{price.toLocaleString()}원</span>
                                </div>
                            </div>

                            <Button
                                onClick={handlePayment}
                                className="w-full h-14 bg-obsidian text-white font-black rounded-2xl text-lg shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 hover:opacity-90"
                            >
                                <CreditCard className="w-5 h-5" />
                                지금 바로 확인하기
                            </Button>

                            <p className="text-[10px] text-center text-slate opacity-60">
                                * 이것은 테스트용 가상 결제입니다. 실제 비용이 청구되지 않습니다.
                            </p>
                        </motion.div>
                    )}

                    {step === 'processing' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-12 flex flex-col items-center justify-center space-y-6 min-h-[400px]"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                            </div>
                            <h3 className="font-bold text-text-primary animate-pulse text-xl">결제를 안전하게 처리 중입니다...</h3>
                            <p className="text-sm text-text-secondary">잠시만 기다려주세요.</p>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-12 flex flex-col items-center justify-center space-y-6 min-h-[400px] bg-primary/5"
                        >
                            <div className="w-20 h-20 bg-status-good rounded-full flex items-center justify-center text-white shadow-xl mb-2">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-obsidian">결제 성공!</h3>
                                <p className="text-text-secondary font-medium">이제 모든 분석 결과를 확인할 수 있습니다.</p>
                            </div>

                            <div className="flex items-center gap-2 text-primary font-bold bg-primary/10 px-4 py-2 rounded-full">
                                <Sparkles className="w-4 h-4" />
                                <span>Premium Access Granted</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
