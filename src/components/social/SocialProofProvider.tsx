'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Eye, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';

interface SocialActivity {
    id: string;
    type: 'cart' | 'wishlist' | 'view' | 'purchase';
    productName: string;
    productLink?: string;
    tag?: string;
    timeAgo: string;
}

const ACTIVITY_TEMPLATES: Omit<SocialActivity, 'id' | 'timeAgo'>[] = [
    { type: 'cart', productName: '프리미엄 경추 베개', tag: '수면부족', productLink: '/products' },
    { type: 'cart', productName: '테아닌 릴랙스 티', tag: '스트레스', productLink: '/products' },
    { type: 'wishlist', productName: '온열 목 마사지기', tag: '만성피로', productLink: '/products' },
    { type: 'view', productName: '슬립 케어 마스크', tag: '수면부족', productLink: '/products' },
    { type: 'purchase', productName: '마인드풀 호흡 가이드', tag: '멘탈케어', productLink: '/products' },
    { type: 'cart', productName: '아로마 릴렉싱 오일', tag: '스트레스', productLink: '/products' },
    { type: 'wishlist', productName: '블루라이트 차단 안경', tag: '눈피로', productLink: '/products' },
    { type: 'view', productName: '자세교정 쿠션', tag: '근육통', productLink: '/products' },
    { type: 'purchase', productName: '수면 유도 백색소음기', tag: '수면부족', productLink: '/products' },
    { type: 'cart', productName: '루테인 영양제', tag: '눈피로', productLink: '/products' },
];

const getActivityMessage = (activity: SocialActivity): string => {
    const tagPrefix = activity.tag ? `${activity.tag} ` : '';

    switch (activity.type) {
        case 'cart':
            return `방금 ${tagPrefix}태그의 유저가 '${activity.productName}'를 장바구니에 담았습니다`;
        case 'wishlist':
            return `${tagPrefix}고민 중인 유저가 '${activity.productName}'를 위시리스트에 저장했어요`;
        case 'view':
            return `${tagPrefix}상태의 유저가 '${activity.productName}'를 확인 중입니다`;
        case 'purchase':
            return `${tagPrefix}회복 여정을 시작한 유저가 '${activity.productName}'를 구매했어요`;
        default:
            return '';
    }
};

const getActivityIcon = (type: SocialActivity['type']) => {
    switch (type) {
        case 'cart':
            return <ShoppingCart className="w-4 h-4" />;
        case 'wishlist':
            return <Heart className="w-4 h-4" />;
        case 'view':
            return <Eye className="w-4 h-4" />;
        case 'purchase':
            return <Sparkles className="w-4 h-4" />;
        default:
            return <Users className="w-4 h-4" />;
    }
};

const getActivityColor = (type: SocialActivity['type']) => {
    switch (type) {
        case 'cart':
            return 'bg-chapter-accent text-white';
        case 'wishlist':
            return 'bg-status-danger text-white';
        case 'view':
            return 'bg-slate/80 text-white';
        case 'purchase':
            return 'bg-reward-gold text-white';
        default:
            return 'bg-obsidian text-white';
    }
};

interface SocialProofToastProps {
    activity: SocialActivity;
    onClose: () => void;
    duration?: number;
}

export function SocialProofToast({ activity, onClose, duration = 5000 }: SocialProofToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const content = (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="bg-white rounded-2xl shadow-2xl border border-line p-4 max-w-sm cursor-pointer hover:shadow-3xl transition-shadow"
            onClick={onClose}
        >
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}>
                    {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-obsidian font-medium leading-snug">
                        {getActivityMessage(activity)}
                    </p>
                    <p className="text-[10px] text-slate mt-1">{activity.timeAgo}</p>
                </div>
            </div>
        </motion.div>
    );

    if (activity.productLink) {
        return (
            <Link href={activity.productLink} onClick={onClose}>
                {content}
            </Link>
        );
    }

    return content;
}

interface SocialProofProviderProps {
    children: React.ReactNode;
    enabled?: boolean;
    minInterval?: number;
    maxInterval?: number;
}

export function SocialProofProvider({
    children,
    enabled = true,
    minInterval = 30000, // 30 seconds
    maxInterval = 90000, // 90 seconds
}: SocialProofProviderProps) {
    const [currentActivity, setCurrentActivity] = useState<SocialActivity | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const usedIndicesRef = useRef<Set<number>>(new Set());

    const generateActivity = useCallback((): SocialActivity => {
        // Get unused template index
        let index: number;
        if (usedIndicesRef.current.size >= ACTIVITY_TEMPLATES.length) {
            usedIndicesRef.current.clear();
        }

        do {
            index = Math.floor(Math.random() * ACTIVITY_TEMPLATES.length);
        } while (usedIndicesRef.current.has(index));

        usedIndicesRef.current.add(index);

        const template = ACTIVITY_TEMPLATES[index];
        const timeAgos = ['방금 전', '1분 전', '2분 전', '3분 전'];

        return {
            ...template,
            id: `${Date.now()}-${Math.random()}`,
            timeAgo: timeAgos[Math.floor(Math.random() * timeAgos.length)],
        };
    }, []);

    const scheduleNextActivity = useCallback(() => {
        if (!enabled) return;

        const delay = Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval;

        timeoutRef.current = setTimeout(() => {
            const activity = generateActivity();
            setCurrentActivity(activity);
            setIsVisible(true);

            // Schedule next activity
            scheduleNextActivity();
        }, delay);
    }, [enabled, minInterval, maxInterval, generateActivity]);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => setCurrentActivity(null), 300);
    }, []);

    useEffect(() => {
        if (enabled) {
            // Start after initial delay
            const initialDelay = Math.floor(Math.random() * 10000) + 5000; // 5-15 seconds
            timeoutRef.current = setTimeout(() => {
                const activity = generateActivity();
                setCurrentActivity(activity);
                setIsVisible(true);
                scheduleNextActivity();
            }, initialDelay);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [enabled, generateActivity, scheduleNextActivity]);

    return (
        <>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 left-6 z-50">
                <AnimatePresence>
                    {isVisible && currentActivity && (
                        <SocialProofToast
                            activity={currentActivity}
                            onClose={handleClose}
                        />
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

export default SocialProofProvider;
