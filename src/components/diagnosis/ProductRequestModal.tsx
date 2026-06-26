
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';

interface ProductRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productConcept: {
        name: string;
        reason: string;
        ingredients: string[];
    };
}

export function ProductRequestModal({ open, onOpenChange, productConcept }: ProductRequestModalProps) {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [details, setDetails] = useState('');

    const handleSubmit = async () => {
        setStatus('submitting');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStatus('success');
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setStatus('idle');
            setDetails('');
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-[32px] overflow-hidden p-0">
                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-10 flex flex-col items-center text-center bg-surface"
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-obsidian mb-2">요청이 접수되었습니다</h2>
                            <p className="text-foreground/70 mb-8">
                                gleemile 연구소에 회원님의 의견이 전달되었습니다.<br />
                                신제품 개발 시 알림을 보내드릴게요!
                            </p>
                            <Button onClick={handleClose} className="w-full h-12 rounded-full font-bold bg-gray-900 text-white">
                                닫기
                            </Button>
                        </motion.div>
                    ) : (
                        <div className="p-8">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="font-bold text-obsidian text-xl">상품 제작 의뢰하기</DialogTitle>
                                <DialogDescription className="text-foreground/70">
                                    gleemile이 제안한 <span className="text-obsidian font-bold">"{productConcept.name}"</span>을(를)<br />
                                    실제 제품으로 만나보고 싶으신가요?
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-obsidian">추가 요청사항</Label>
                                    <Textarea
                                        placeholder="이런 기능이 더 있으면 좋겠어요..."
                                        className="resize-none bg-surface border-line focus:ring-gray-900 min-h-[120px] rounded-2xl p-4"
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                    />
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={status === 'submitting'}
                                    className="w-full h-14 rounded-full font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity"
                                >
                                    {status === 'submitting' ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            전송 중...
                                        </>
                                    ) : (
                                        <>
                                            의뢰서 보내기 <Send className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
