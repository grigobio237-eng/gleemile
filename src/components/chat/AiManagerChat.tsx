'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useAIProgress } from '@/hooks/use-ai-progress';
import { AIProgressOverlay } from '@/components/shared/AIProgressOverlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AiManagerChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '안녕하세요! 저는 gleemile의 매니저 유니(Uni)예요. 🌿\n사이트 이용 방법, 등급 및 포인트, 서비스 혜택 등 궁금한 점이 있으시면 무엇이든 물어봐 주세요!',
            timestamp: new Date(),
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { progress, statusMessage, finish: finishProgress } = useAIProgress(isLoading);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-unni-chat', handleOpen);
        return () => window.removeEventListener('open-unni-chat', handleOpen);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/manager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content }),
            });

            if (!response.ok) {
                throw new Error('API Error');
            }

            finishProgress();
            await new Promise(r => setTimeout(r, 600));

            const data = await response.json();

            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.response || '죄송해요, 응답을 받아오는 데 실패했어요.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error('Youniqle Manager Chat Error:', error);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: '죄송해요, 잠시 연결이 원활하지 않네요. 🙏 잠시 후 다시 시도해주세요!',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Quick action 버튼들
    const quickActions = [
        '포인트 적립 방법',
        '등급 혜택 안내',
        '멤버십 혜택 안내',
    ];

    const handleQuickAction = (action: string) => {
        setInputValue(action);
    };

    return (
        <>
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-[60] w-full md:w-[380px] h-[100dvh] md:h-[600px] md:max-h-[80vh] bg-white md:rounded-[28px] shadow-2xl flex flex-col overflow-hidden border-t md:border border-line"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 md:p-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                                    <Image
                                        src="/character/youniqle-1.png"
                                        alt="유니"
                                        width={48}
                                        height={48}
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">유니 (Uni)</h3>
                                    <p className="text-white/70 text-[10px] font-medium">gleemile 매니저</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                                aria-label="닫기"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                            ? 'bg-secondary text-white rounded-br-md'
                                            : 'bg-white text-obsidian shadow-sm border border-line rounded-bl-md'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-line flex flex-col gap-2 min-w-[200px]">
                                        <div className="flex justify-between items-center text-[10px] font-black text-secondary uppercase tracking-widest">
                                            <span>Uni is Thinking</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="h-1 bg-secondary-container rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-secondary"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-foreground/70 italic">{statusMessage}</p>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        {messages.length <= 2 && (
                            <div className="px-4 py-2 bg-white border-t border-line flex gap-2 flex-wrap">
                                {quickActions.map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => handleQuickAction(action)}
                                        className="text-[11px] px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-secondary text-obsidian rounded-full font-medium transition-colors"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-line">
                            <div className="flex gap-2">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="궁금한 점을 물어보세요..."
                                    className="flex-1 h-11 rounded-xl border-line focus:ring-emerald-500 text-sm"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading || !inputValue.trim()}
                                    className="w-11 h-11 rounded-xl bg-secondary hover:bg-secondary p-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
