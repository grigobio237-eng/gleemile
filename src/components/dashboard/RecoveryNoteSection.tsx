'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Smile, Frown, Meh, Heart, Zap, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
    { id: 'happy', emoji: '😊', label: '행복해요', color: 'text-yellow-500' },
    { id: 'calm', emoji: '😌', label: '평온해요', color: 'text-green-500' },
    { id: 'tired', emoji: '😴', label: '피곤해요', color: 'text-primary' },
    { id: 'stressed', emoji: '😫', label: '힘들어요', color: 'text-red-500' },
    { id: 'inspired', emoji: '✨', label: '활기차요', color: 'text-secondary' },
];

export default function RecoveryNoteSection() {
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState('happy');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/user/recovery-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    mood: selectedMood
                })
            });

            if (res.ok) {
                setIsSaved(true);
                setContent('');
                setTimeout(() => setIsSaved(false), 3000);
            }
        } catch (err) {
            console.error('Failed to save recovery note:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="container mx-auto px-2 md:px-6 pb-4 md:pb-20 max-w-5xl">
            <Card className="bg-surface/60 backdrop-blur-2xl text-foreground rounded-2xl md:rounded-5xl p-4 md:p-14 border border-white/20 shadow-xl shadow-primary/5 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-10 items-start justify-between">
                    
                    <div className="space-y-2 md:space-y-4 md:max-w-xs w-full">
                        <h3 className="text-sm md:text-3xl font-black text-obsidian tracking-tight">오늘의 마음 기록</h3>
                        <p className="text-foreground/50 text-[10px] md:text-lg font-semibold leading-normal md:leading-relaxed">
                            수치화된 리듬체크보다 더 중요한 것은 당신의 진솔한 생각입니다. 지금 기분은 어떠신가요?
                        </p>
                        
                        <div className="flex flex-wrap gap-1.5 md:gap-3 pt-1 md:pt-4">
                            {MOODS.map((mood) => (
                                <button
                                    key={mood.id}
                                    onClick={() => setSelectedMood(mood.id)}
                                    className={`flex flex-col items-center p-2 md:p-3 rounded-xl md:rounded-2xl transition-all border ${
                                        selectedMood === mood.id 
                                        ? 'bg-white border-primary/20 shadow-md scale-105' 
                                        : 'bg-white/30 border-transparent grayscale hover:grayscale-0'
                                    }`}
                                >
                                    <span className="text-lg md:text-2xl mb-0.5">{mood.emoji}</span>
                                    <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${selectedMood === mood.id ? mood.color : 'text-foreground/30'}`}>
                                        {mood.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
 
                    <div className="flex-1 w-full space-y-3 md:space-y-6">
                        <div className="relative">
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="지금 이 순간 떠오르는 생각이나 기분을 자유롭게 적어주세요..."
                                className="min-h-[100px] md:min-h-[180px] bg-white/40 border-white/20 rounded-xl md:rounded-[32px] p-3 md:p-8 text-xs md:text-lg font-medium placeholder:text-foreground/20 focus:bg-white/60 transition-all resize-none shadow-inner"
                            />
                            
                            <AnimatePresence>
                                {isSaved && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl md:rounded-[32px] flex flex-col items-center justify-center text-center p-4 md:p-8 z-20"
                                    >
                                        <CheckCircle2 className="w-8 h-8 md:w-16 md:h-16 text-primary mb-2 md:mb-4" />
                                        <h4 className="text-sm md:text-2xl font-bold text-obsidian">마음이 기록되었습니다</h4>
                                        <p className="text-[10px] md:text-sm text-foreground/70 mt-1">사용자님의 소중한 회복 타임라인에 저장되었습니다.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
 
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !content.trim()}
                                className="h-10 md:h-16 px-6 md:px-10 bg-primary text-white rounded-lg md:rounded-full font-bold text-xs md:text-lg hover:scale-105 active:scale-95 transition-all shadow-lg md:shadow-2xl shadow-primary/20 flex items-center gap-2"
                            >
                                {isSaving ? "기록 중..." : "마음 남기기"}
                                <Send className="w-3.5 h-3.5 md:w-5 md:h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
 
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-24 h-24 md:w-40 md:h-40 bg-primary/10 blur-[50px] md:blur-[80px] -mr-12 -mt-12 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 md:w-40 md:h-40 bg-secondary-container/10 blur-[50px] md:blur-[80px] -ml-12 -mb-12 pointer-events-none" />
            </Card>
        </section>
    );
}
