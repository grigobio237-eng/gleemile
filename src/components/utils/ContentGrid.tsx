'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, User, Eye, Clock } from 'lucide-react';
import Link from 'next/link';

// Mock Data for Contents
const CONTENTS = [
    {
        id: 'v1',
        title: '직장인 스트레칭 가이드 10분',
        author: '요가 멘토 김요가',
        views: '1.2k',
        duration: '10:00',
        thumbnailColor: 'from-blue-400 to-indigo-500',
        tag: '건강'
    },
    {
        id: 'v2',
        title: '업무 효율 높이는 노션 활용법',
        author: '노션 마스터',
        views: '3.4k',
        duration: '15:30',
        thumbnailColor: 'from-gray-700 to-gray-900',
        tag: '생산성'
    },
    {
        id: 'v3',
        title: 'MBTI 유형별 소통 전략',
        author: '심리 상담소',
        views: '5.2k',
        duration: '08:45',
        thumbnailColor: 'from-pink-400 to-rose-500',
        tag: '심리'
    },
    {
        id: 'v4',
        title: '점심시간 꿀잠 자는 법',
        author: '수면 연구소',
        views: '800',
        duration: '05:00',
        thumbnailColor: 'from-purple-400 to-violet-500',
        tag: '휴식'
    },
    {
        id: 'v5',
        title: '신입사원 엑셀 필수 단축키',
        author: '엑셀 깎는 노인',
        views: '10k+',
        duration: '12:20',
        thumbnailColor: 'from-green-500 to-emerald-600',
        tag: '스킬'
    }
];

export default function ContentGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CONTENTS.map((content) => (
                <Card
                    key={content.id}
                    className="group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white"
                >
                    {/* Thumbnail Section */}
                    <div className={`h-48 bg-gradient-to-br ${content.thumbnailColor} relative flex items-center justify-center`}>
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                        <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                        <Badge className="absolute top-4 left-4 bg-white/90 text-obsidian hover:bg-white">{content.tag}</Badge>
                        <Badge className="absolute bottom-4 right-4 bg-black/60 text-white hover:bg-black/70 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {content.duration}
                        </Badge>
                    </div>

                    {/* Content Info */}
                    <div className="p-5">
                        <h3 className="font-bold text-obsidian text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                            {content.title}
                        </h3>

                        <div className="flex items-center justify-between text-sm text-foreground/70">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User className="w-3 h-3 text-foreground/70" />
                                </div>
                                <span className="line-clamp-1 max-w-[100px]">{content.author}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{content.views}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}

            {/* Upload CTA Card */}
            <Card className="border-dashed border-2 border-gray-300 bg-surface flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-primary/30 hover:bg-blue-50 transition-all min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-4 text-primary">
                    <User className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-obsidian mb-1">파트너 크리에이터 신청</h3>
                <p className="text-foreground/70 text-sm mb-4">나만의 노하우를 공유하고 수익을 창출하세요</p>
                <Button variant="outline" className="text-primary border-primary/30 hover:bg-primary-container">신청하기</Button>
            </Card>
        </div>
    );
}
