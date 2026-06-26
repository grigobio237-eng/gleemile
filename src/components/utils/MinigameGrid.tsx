'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, Dices, Gamepad2, Keyboard, Search, Shuffle, Users, Brain, Grid3X3, Trophy, ArrowLeft } from 'lucide-react';

const GAMES = [
    {
        id: 'ladder',
        title: '커피 내기 사다리',
        description: '클래식하지만 가장 수요가 많은 당첨자 뽑기',
        icon: <Shuffle className="w-8 h-8 text-white" />,
        color: 'from-orange-400 to-red-400',
        active: true,
        href: '/utils/minigames/ladder'
    },
    {
        id: 'roulette',
        title: '메뉴 결정 룰렛',
        description: '"오늘 뭐 먹지?" 고민을 해결해주는 랜덤 선택기',
        icon: <Dices className="w-8 h-8 text-white" />,
        color: 'from-green-400 to-emerald-400',
        active: true,
        href: '/utils/minigames/roulette'
    },
    {
        id: 'typing',
        title: '타이핑 스피드 배틀',
        description: '비즈니스 명언을 누가 가장 빨리 치는지 겨루기',
        icon: <Keyboard className="w-8 h-8 text-white" />,
        color: 'from-blue-400 to-indigo-400',
        active: true,
        href: '/utils/minigames/typing'
    },
    {
        id: 'emoji',
        title: '이모지 속담 퀴즈',
        description: '이모지만 보고 영화 제목이나 속담 맞히기',
        icon: <Brain className="w-8 h-8 text-white" />,
        color: 'from-pink-400 to-rose-400',
        active: true,
        href: '/utils/minigames/emoji'
    },
    {
        id: 'memory',
        title: '기억력 카드 뒤집기',
        description: '짧은 시간 집중력을 요하는 클래식 게임',
        icon: <Gamepad2 className="w-8 h-8 text-white" />,
        color: 'from-violet-400 to-purple-400',
        active: true,
        href: '/utils/minigames/memory'
    },
    {
        id: '2048',
        title: '2048 오피스 에디션',
        description: '숫자 대신 사원→대리→사장으로 승진하는 퍼즐',
        icon: <Trophy className="w-8 h-8 text-white" />,
        color: 'from-cyan-400 to-sky-400',
        active: true,
        href: '/utils/minigames/2048'
    },
    {
        id: 'bingo',
        title: '팀별 대항 빙고',
        description: '"회의 중 졸아본 적 있음" 등 직장인 공감 빙고',
        icon: <Users className="w-8 h-8 text-white" />,
        color: 'from-lime-400 to-green-500',
        active: true,
        href: '/utils/minigames/bingo'
    },
    {
        id: 'difference',
        title: '틀린 그림 찾기',
        description: '두 개의 비슷한 사무실 풍경에서 차이점 찾기',
        icon: <Search className="w-8 h-8 text-white" />,
        color: 'from-red-400 to-pink-500',
        active: true,
        href: '/utils/minigames/difference'
    }
];

export default function MinigameGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAMES.map((game) => {
                const CardContent = (
                    <Card
                        className={`group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white cursor-pointer ${!game.active ? 'opacity-90' : ''}`}
                    >
                        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${game.color}`} />
                        <div className="p-8">
                            <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${game.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                {game.icon}
                            </div>
                            <h3 className="font-bold text-obsidian mb-2 group-hover:text-secondary transition-colors text-xl">
                                {game.title}
                            </h3>
                            <p className="text-foreground/70 text-sm mb-6 line-clamp-2 h-10">
                                {game.description}
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                                <Badge variant="secondary" className="bg-gray-100 text-obsidian">
                                    {game.active ? 'Play Now' : 'Coming Soon'}
                                </Badge>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-surface group-hover:bg-indigo-50 text-foreground/70 group-hover:text-secondary transition-colors`}>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Overlay for inactive games */}
                        {!game.active && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <Badge className="bg-gray-900 text-white px-4 py-2 pointer-events-none">
                                    준비 중입니다 🚧
                                </Badge>
                            </div>
                        )}
                    </Card>
                );

                return game.active && game.href ? (
                    <Link key={game.id} href={game.href} className="block">
                        {CardContent}
                    </Link>
                ) : (
                    <div key={game.id} className="block">
                        {CardContent}
                    </div>
                );
            })}
        </div>
    );
}
