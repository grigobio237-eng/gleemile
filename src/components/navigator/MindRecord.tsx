'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, MessageSquare, Heart, Smile, Meh, Frown, Ghost } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Note {
    _id: string;
    content: string;
    mood?: string;
    createdAt: string;
}

const MOODS = [
    { id: 'happy', icon: <Smile className="w-5 h-5" />, color: 'text-yellow-500', label: '행복' },
    { id: 'calm', icon: <Heart className="w-5 h-5" />, color: 'text-primary', label: '편안' },
    { id: 'neutral', icon: <Meh className="w-5 h-5" />, color: 'text-foreground/70', label: '보통' },
    { id: 'tired', icon: <Frown className="w-5 h-5" />, color: 'text-secondary', label: '피곤' },
    { id: 'stressed', icon: <Ghost className="w-5 h-5" />, color: 'text-red-500', label: '스트레스' },
];

export default function MindRecord() {
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState('calm');
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const response = await fetch('/api/user/recovery-note?limit=5');
            if (response.ok) {
                const data = await response.json();
                setNotes(data);
            }
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        if (!content.trim() || loading) return;

        setLoading(true);
        try {
            const response = await fetch('/api/user/recovery-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, mood: selectedMood })
            });

            if (response.ok) {
                setContent('');
                await fetchNotes();
            }
        } catch (error) {
            console.error('Failed to save note:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 py-8">
            <div className="space-y-2 px-2">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-obsidian tracking-tight text-xl">지금 이 순간의 마음</h3>
                </div>
                <p className="text-xs font-medium text-slate/50">오늘의 감정과 생각들을 자유롭게 남겨보세요.</p>
            </div>

            <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-wrap gap-3">
                        {MOODS.map((mood) => (
                            <button
                                key={mood.id}
                                onClick={() => setSelectedMood(mood.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all
                                    ${selectedMood === mood.id 
                                        ? `border-primary bg-primary/5 ${mood.color}` 
                                        : 'border-mist bg-mist/20 text-slate/40 hover:border-slate/20'}
                                `}
                            >
                                {mood.icon}
                                <span className="text-xs font-black">{mood.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="지금 어떤 생각을 하고 계신가요? (예: 오늘 산책을 하니 기분이 훨씬 좋아졌어요.)"
                            className="w-full h-32 p-5 bg-mist/30 rounded-3xl border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm font-medium placeholder:text-slate/30"
                        />
                        <Button 
                            onClick={handleSave}
                            disabled={!content.trim() || loading}
                            className="absolute bottom-4 right-4 rounded-full w-12 h-12 p-0 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2 text-slate/40">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">최근 기록</span>
                </div>

                <div className="space-y-4 relative">
                    {/* Timeline Line */}
                    <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-mist to-transparent" />

                    <AnimatePresence mode="popLayout">
                        {fetching ? (
                            <div className="py-12 text-center text-slate/30 text-xs font-bold italic">기록을 불러오는 중...</div>
                        ) : notes.length === 0 ? (
                            <div className="py-12 text-center text-slate/30 text-xs font-bold italic">아직 기록이 없습니다. 첫 마음을 남겨보세요.</div>
                        ) : (
                            notes.map((note, idx) => {
                                const moodInfo = MOODS.find(m => m.id === note.mood) || MOODS[2];
                                const dateObj = new Date(note.createdAt);
                                const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                                const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

                                return (
                                    <motion.div
                                        key={note._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative flex gap-6 group"
                                    >
                                        <div className={`
                                            relative z-10 w-14 h-14 rounded-2xl bg-white shadow-md border border-mist flex items-center justify-center transition-transform group-hover:scale-110
                                            ${moodInfo.color}
                                        `}>
                                            {moodInfo.icon}
                                        </div>

                                        <div className="flex-1 space-y-1 pt-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate/30">{dateStr} {timeStr}</span>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-mist/50 ${moodInfo.color}`}>
                                                    {moodInfo.label}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-obsidian leading-relaxed">
                                                {note.content}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
