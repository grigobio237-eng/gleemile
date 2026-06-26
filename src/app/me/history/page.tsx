
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    Calendar,
    ChevronLeft,
    FileText,
    ArrowRight,
    Activity,
    Brain,
    Heart,
    Moon,
    Zap
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import ChapterWrapper from '@/components/layout/ChapterWrapper';

interface HistoryItem {
    _id: string;
    type: string;
    totalScore: number;
    categoryScores: {
        physical: number;
        mental: number;
        lifestyle: number;
        sleep: number;
    };
    resultTitle: string;
    createdAt: string;
}

export default function RecoveryHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/me/recovery-history');
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.history || []);
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const chartData = [...history].reverse().map(item => ({
        date: new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
        score: item.totalScore,
        physical: item.categoryScores.physical,
        mental: item.categoryScores.mental,
        sleep: item.categoryScores.sleep,
        lifestyle: item.categoryScores.lifestyle,
    }));

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Activity className="w-10 h-10 text-primary animate-pulse" />
            </div>
        );
    }

    return (
        <ChapterWrapper chapter="my-page">
            <div className="max-w-5xl mx-auto py-12 px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/me')}
                            className="p-0 hover:bg-transparent text-foreground/70 mb-2"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </Button>
                        <h1 className="font-black text-obsidian tracking-tight text-4xl">Recovery Journey</h1>
                        <p className="text-foreground/70 font-medium">시간에 따른 당신의 회복 성장 궤적입니다.</p>
                    </div>
                    <div className="hidden md:block">
                        <Badge className="bg-emerald-50 text-secondary border-emerald-100 px-4 py-2 rounded-full font-bold">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            최근 회복세 안정적
                        </Badge>
                    </div>
                </div>

                {/* Trend Chart Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-white">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="font-bold flex items-center text-xl">
                                <Activity className="w-5 h-5 mr-3 text-primary" />
                                회복 스코어 트렌드
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '20px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#10b981"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorScore)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Grid View */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <Card className="border-none shadow-md rounded-3xl bg-blue-50/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-primary-container rounded-2xl text-primary">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-primary uppercase tracking-widest">Total Sessions</p>
                                <p className="text-2xl font-black text-obsidian">{history.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md rounded-3xl bg-amber-50/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-primary-container/50 rounded-2xl text-primary">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-primary uppercase tracking-widest">Current Streak</p>
                                <p className="text-2xl font-black text-obsidian">3 Days</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md rounded-3xl bg-rose-50/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
                                <Heart className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Avg. Score</p>
                                <p className="text-2xl font-black text-obsidian">
                                    {history.length > 0
                                        ? Math.round(history.reduce((a, b) => a + b.totalScore, 0) / history.length)
                                        : 0}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* History List */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-obsidian mb-6 flex items-center">
                        <FileText className="w-6 h-6 mr-3 text-foreground/70" />
                        리듬체크 이력 리스트
                    </h3>
                    {history.map((item, idx) => (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card
                                className="border border-line shadow-sm hover:shadow-md transition-all rounded-[32px] overflow-hidden bg-white cursor-pointer group"
                                onClick={() => router.push('/diagnosis/report')}
                            >
                                <CardContent className="p-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${item.type === 'PAID' ? 'bg-primary-container/50 text-primary' : 'bg-slate-100 text-foreground/70'
                                            }`}>
                                            {item.type === 'PAID' ? 'P' : 'F'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-obsidian group-hover:text-primary transition-colors">
                                                    {item.resultTitle || '회복 리듬체크 리포트'}
                                                </h4>
                                                {item.type === 'PAID' && (
                                                    <Badge className="bg-amber-50 text-primary border-none text-[10px] font-bold">PREMIUM</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-foreground/70 font-medium">
                                                {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="flex gap-4">
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Physical</p>
                                                <p className="text-sm font-black text-rose-500">{item.categoryScores?.physical || 0}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Mental</p>
                                                <p className="text-sm font-black text-primary">{item.categoryScores?.mental || 0}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Sleep</p>
                                                <p className="text-sm font-black text-primary">{item.categoryScores?.sleep || 0}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 border-l border-line pl-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Total</p>
                                                <p className="text-2xl font-black text-obsidian">{item.totalScore}</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {history.length === 0 && (
                        <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-line">
                            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-foreground/70 font-bold">아직 리듬체크 기록이 없습니다.</p>
                            <Button
                                onClick={() => router.push('/ai-navigator')}
                                className="mt-6 bg-primary text-white rounded-full px-8"
                            >
                                첫 리듬체크 시작하기
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </ChapterWrapper>
    );
}
