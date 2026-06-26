'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function RecoveryLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('/api/community/leaderboard');
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data.leaderboard || []);
                }
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) return (
        <div className="h-64 flex items-center justify-center bg-white rounded-[32px] animate-pulse">
            <span className="text-foreground/70 font-bold">리더보드 로드 중...</span>
        </div>
    );

    return (
        <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden border border-line h-full flex flex-col justify-between">
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-primary">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-obsidian tracking-tighter">주간 회복 리더보드</h3>
                                <p className="text-xs font-bold text-slate">이번 주 커뮤니티 성취 랭킹</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate bg-surface px-3 py-1 rounded-full uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3 text-secondary" />
                            Live Update
                        </div>
                    </div>

                    <div className="space-y-4">
                        {leaderboard.length > 0 ? (
                            leaderboard.map((user, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                        idx === 0 ? 'bg-amber-50/30 border-amber-100' : 
                                        idx === 1 ? 'bg-surface/50 border-line' :
                                        idx === 2 ? 'bg-orange-50/30 border-orange-100' :
                                        'bg-white border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 flex justify-center">
                                            {idx === 0 ? <Crown className="w-6 h-6 text-primary" /> :
                                             idx === 1 ? <Medal className="w-5 h-5 text-foreground/70" /> :
                                             idx === 2 ? <Medal className="w-5 h-5 text-orange-400" /> :
                                             <span className="text-sm font-black text-slate-300">{idx + 1}</span>}
                                        </div>
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white overflow-hidden">
                                                {user.avatar ? (
                                                    <Image src={user.avatar} alt={user.name} width={40} height={40} className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-foreground/70 bg-surface">
                                                        {user.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            {user.membershipTier === 'BLACK' && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-obsidian text-white rounded-full flex items-center justify-center text-[8px] border border-white">
                                                    B
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-obsidian">{user.name}</p>
                                            <p className="text-[10px] font-bold text-slate opacity-60">체크인 {user.checkinCount}회</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-obsidian tracking-tighter">{user.totalScore}pts</p>
                                        <p className="text-[10px] font-bold text-secondary uppercase">Avg {user.averageScore}%</p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <p className="text-sm font-bold text-foreground/70">이번 주 기록된 리듬이 아직 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    {leaderboard.length < 4 && (
                        <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/50 flex items-start gap-3">
                            <span className="text-lg shrink-0 mt-0.5">🔥</span>
                            <div>
                                <p className="text-xs font-black text-emerald-800">회복 리듬 랭킹 챌린지</p>
                                <p className="text-[10px] font-semibold text-secondary mt-1 leading-relaxed">
                                    매일 60초 리듬 체크를 진행하면 획득하는 리커버리 점수로 실시간 랭킹이 산정됩니다. 
                                    지속적인 회복 Rhythms를 기록하고 특별 기프트 뱃지를 획득하세요!
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <p className="text-[10px] leading-relaxed text-secondary font-bold">
                            * 리더보드는 익명성을 원칙으로 하며, 상위 10명의 성취를 축하하기 위해 제공됩니다. 매주 월요일 새벽에 초기화됩니다.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
