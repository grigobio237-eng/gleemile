'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface RecoveryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function RecoveryModal({ open, onOpenChange }: RecoveryModalProps) {
    const [bedtimeHour, setBedtimeHour] = useState(23);
    const [bedtimeMin, setBedtimeMin] = useState(0);
    const [wakeHour, setWakeHour] = useState(7);
    const [wakeMin, setWakeMin] = useState(0);
    const [quality, setQuality] = useState('good');
    const [disturbances, setDisturbances] = useState<string[]>([]);
    const [isSaved, setIsSaved] = useState(false);

    const disturbanceOptions = [
        { id: 'woke_up', icon: '🌙', label: '중간에 깸' },
        { id: 'dreams', icon: '💭', label: '꿈' },
        { id: 'noise', icon: '🔊', label: '소음' },
        { id: 'temp', icon: '🌡️', label: '온도' },
        { id: 'stress', icon: '😰', label: '스트레스' },
        { id: 'phone', icon: '📱', label: '스마트폰' },
    ];

    const qualityOptions = [
        { id: 'poor', icon: '😫', label: '나쁨', color: 'border-red-400 bg-red-50' },
        { id: 'fair', icon: '😑', label: '보통', color: 'border-yellow-400 bg-yellow-50' },
        { id: 'good', icon: '🙂', label: '좋음', color: 'border-green-400 bg-green-50' },
        { id: 'great', icon: '🤩', label: '완벽', color: 'border-primary/30 bg-blue-50' }
    ];

    // 수면 시간 계산
    const calculateSleepDuration = () => {
        let bedtime = bedtimeHour * 60 + bedtimeMin;
        let waketime = wakeHour * 60 + wakeMin;

        if (waketime < bedtime) {
            waketime += 24 * 60; // 다음날로 넘어간 경우
        }

        const duration = waketime - bedtime;
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        return { hours, mins, total: duration };
    };

    const sleepDuration = calculateSleepDuration();

    const toggleDisturbance = (id: string) => {
        setDisturbances(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        const today = new Date().toISOString().split('T')[0];
        const sleepData = {
            date: today,
            bedtime: `${bedtimeHour.toString().padStart(2, '0')}:${bedtimeMin.toString().padStart(2, '0')}`,
            waketime: `${wakeHour.toString().padStart(2, '0')}:${wakeMin.toString().padStart(2, '0')}`,
            duration: sleepDuration.total,
            quality: quality,
            efficiency: Math.round((sleepDuration.hours / 8) * 100), // 기본 효율 계산
            aiAnalysis: `총 ${sleepDuration.hours}시간 ${sleepDuration.mins}분 수면하셨습니다. ${advice.text}`
        };

        try {
            // API를 통한 DB 저장
            const response = await fetch('/api/user/sleep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sleepData)
            });

            if (!response.ok) throw new Error('Failed to save to DB');

            // 레거시 로컬 저장소와 호환성 보장
            localStorage.setItem('recovery_sleep_data', JSON.stringify(sleepData));
            localStorage.setItem('recovery_last_score', String(Math.round(sleepDuration.hours * 10)));

            setIsSaved(true);
            setTimeout(() => {
                setIsSaved(false);
                onOpenChange(false);
            }, 1500);
        } catch (error) {
            console.error('Error saving sleep data:', error);
            alert('데이터 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    const getSleepAdvice = () => {
        if (sleepDuration.hours >= 8) return { text: "충분한 수면 시간이에요! 👍", color: "text-green-600" };
        if (sleepDuration.hours >= 7) return { text: "적정 수면 시간이에요.", color: "text-primary" };
        if (sleepDuration.hours >= 6) return { text: "조금 더 자면 좋겠어요.", color: "text-yellow-600" };
        return { text: "수면이 많이 부족해요! 😴", color: "text-red-600" };
    };

    const advice = getSleepAdvice();

    if (isSaved) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-[40px] shadow-2xl bg-surface">
                    <div className="h-80 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <div className="mb-4 animate-bounce text-xl">✅</div>
                        <h2 className="text-2xl font-black">저장 완료!</h2>
                        <p className="text-white/70 mt-2">수면 데이터가 기록되었습니다</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-[40px] shadow-2xl bg-surface max-h-[90vh] overflow-y-auto">
                <div className="relative">
                    <DialogHeader className="sr-only">
                        <DialogTitle>수면 리커버리 기록</DialogTitle>
                        <DialogDescription>어젯밤의 수면 데이터를 입력하세요.</DialogDescription>
                    </DialogHeader>

                    <div className="h-40 bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiPjwvcmVjdD4KPC9zdmc+')]"></div>
                        <div className="relative z-10 flex flex-col items-center text-white">
                            <div className="mb-2 text-4xl">🌙</div>
                            <h2 className="font-black tracking-tight text-xl">수면 기록</h2>
                            <p className="text-sm text-white/70">어젯밤 수면을 기록해주세요</p>
                        </div>
                    </div>

                    <div className="p-4 md:p-6 space-y-6">
                        {/* 시간 선택 */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] md:text-xs font-black text-slate uppercase tracking-widest">취침 시간</label>
                                <div className="flex items-center gap-1 bg-mist rounded-xl p-2 md:p-3">
                                    <select
                                        value={bedtimeHour}
                                        onChange={(e) => setBedtimeHour(parseInt(e.target.value))}
                                        className="bg-transparent text-2xl font-black text-obsidian w-14 text-center focus:outline-none"
                                        aria-label="취침 시간 (시)"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                    <span className="text-2xl font-black text-obsidian">:</span>
                                    <select
                                        value={bedtimeMin}
                                        onChange={(e) => setBedtimeMin(parseInt(e.target.value))}
                                        className="bg-transparent text-2xl font-black text-obsidian w-14 text-center focus:outline-none"
                                        aria-label="취침 시간 (분)"
                                    >
                                        {[0, 15, 30, 45].map(m => (
                                            <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] md:text-xs font-black text-slate uppercase tracking-widest">기상 시간</label>
                                <div className="flex items-center gap-1 bg-mist rounded-xl p-2 md:p-3">
                                    <select
                                        value={wakeHour}
                                        onChange={(e) => setWakeHour(parseInt(e.target.value))}
                                        className="bg-transparent text-2xl font-black text-obsidian w-14 text-center focus:outline-none"
                                        aria-label="기상 시간 (시)"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                    <span className="text-2xl font-black text-obsidian">:</span>
                                    <select
                                        value={wakeMin}
                                        onChange={(e) => setWakeMin(parseInt(e.target.value))}
                                        className="bg-transparent text-2xl font-black text-obsidian w-14 text-center focus:outline-none"
                                        aria-label="기상 시간 (분)"
                                    >
                                        {[0, 15, 30, 45].map(m => (
                                            <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 총 수면 시간 */}
                        <div className="bg-indigo-50 border border-secondary/30 rounded-2xl p-4 text-center">
                            <p className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">총 수면 시간</p>
                            <p className="text-3xl font-black text-secondary">
                                {sleepDuration.hours}시간 {sleepDuration.mins > 0 && `${sleepDuration.mins}분`}
                            </p>
                            <p className={`text-sm font-medium mt-1 ${advice.color}`}>{advice.text}</p>
                        </div>

                        {/* 수면 품질 */}
                        <div className="space-y-3">
                            <label className="text-[10px] md:text-xs font-black text-slate uppercase tracking-widest">수면 품질</label>
                            <div className="grid grid-cols-4 gap-2">
                                {qualityOptions.map((q) => (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => setQuality(q.id)}
                                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${quality === q.id
                                            ? `${q.color} border-2 shadow-md transform -translate-y-0.5`
                                            : 'border-line bg-white hover:border-line-heavy'
                                            }`}
                                    >
                                        <span className="text-2xl">{q.icon}</span>
                                        <span className="text-[10px] font-bold text-slate">{q.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 방해 요소 */}
                        <div className="space-y-3">
                            <label className="text-[10px] md:text-xs font-black text-slate uppercase tracking-widest">방해 요소 (선택)</label>
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {disturbanceOptions.map((d) => (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => toggleDisturbance(d.id)}
                                        className={`px-3 py-2 rounded-full border-2 transition-all flex items-center gap-1.5 text-sm ${disturbances.includes(d.id)
                                            ? 'border-obsidian bg-obsidian text-mist'
                                            : 'border-line bg-white text-slate hover:border-line-heavy'
                                            }`}
                                    >
                                        <span>{d.icon}</span>
                                        <span className="font-medium">{d.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 저장 버튼 */}
                        <Button
                            className="w-full h-14 rounded-2xl bg-secondary hover:bg-secondary text-white font-black shadow-xl"
                            onClick={handleSave}
                        >
                            🌙 수면 기록 저장하기
                        </Button>
                    </div>

                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors z-20"
                        aria-label="모달 닫기"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
