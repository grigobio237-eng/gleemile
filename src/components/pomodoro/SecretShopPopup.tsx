'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, ShoppingBag, ExternalLink, RefreshCw } from 'lucide-react';

interface SecretShopPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface RecommendedProduct {
    id: string;
    title: string;
    description: string;
    price: string;
    image?: string;
    link: string;
    discount?: string;
    isExternal?: boolean;
}

export default function SecretShopPopup({ open, onOpenChange }: SecretShopPopupProps) {
    const [products, setProducts] = useState<RecommendedProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [recoveryTip, setRecoveryTip] = useState('');

    const recoveryTips = [
        '💧 물 한 잔 마시고 잠시 눈을 감아보세요',
        '🧘 5분 스트레칭으로 굳은 어깨를 풀어주세요',
        '🌬️ 4-7-8 호흡법으로 긴장을 해소해보세요',
        '👀 20-20-20 규칙: 20초간 20피트(6m) 거리를 바라보세요',
        '🚶 자리에서 일어나 잠시 걸어보세요',
        '☕ 카페인 대신 허브티나 따뜻한 물을 드세요',
    ];

    useEffect(() => {
        if (open) {
            fetchRecommendedProducts();
            setRecoveryTip(recoveryTips[Math.floor(Math.random() * recoveryTips.length)]);
        }
    }, [open]);

    const fetchRecommendedProducts = async () => {
        setLoading(true);
        try {
            // Try to get diagnosis-based recommendations
            const response = await fetch('/api/recommendations/external?tags=stress,chronic_fatigue&limit=3&shuffle=true');
            if (response.ok) {
                const data = await response.json();
                const formattedProducts = (data.externalProducts || []).map((p: any) => ({
                    id: p.id || p.productId,
                    title: p.title,
                    description: p.category2 || '회복 추천 상품',
                    price: p.priceFormatted || `${p.lprice?.toLocaleString()}원`,
                    image: p.image,
                    link: p.link,
                    isExternal: true,
                }));
                setProducts(formattedProducts);
            }
        } catch (error) {
            console.error('Failed to fetch secret shop products:', error);
            // Fallback products
            setProducts([
                {
                    id: '1',
                    title: '프리미엄 아로마 디퓨저',
                    description: '심신 안정에 도움',
                    price: '29,900원',
                    link: '/products',
                    discount: '20%',
                },
                {
                    id: '2',
                    title: '온열 목 마사지기',
                    description: '경추 피로 해소',
                    price: '45,000원',
                    link: '/products',
                    discount: '15%',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-[32px] shadow-2xl bg-gradient-to-br from-white to-mist/30">
                {/* Header */}
                <div className="bg-gradient-to-r from-reward-gold to-amber-500 text-white p-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/30 rounded-full blur-2xl" />
                        <div className="absolute -bottom-5 -right-5 w-32 h-32 bg-white/20 rounded-full blur-xl" />
                    </div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="absolute -top-2 -right-2 opacity-30 text-xl"
                    >
                        ✨
                    </motion.div>

                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                <Gift className="w-6 h-6" />
                            </div>
                            <div>
                                <Badge className="bg-white/20 text-white border-none text-[10px] font-bold mb-1">
                                    휴식 시간 특별 혜택
                                </Badge>
                                <DialogTitle className="font-black text-xl">
                                    비밀 회복 상점 🎁
                                </DialogTitle>
                            </div>
                        </div>
                        <DialogDescription className="text-white/80 text-sm">
                            집중한 당신을 위한 특별 추천
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Recovery Tip */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mt-4 p-4 bg-chapter-accent/5 border border-chapter-accent/10 rounded-2xl"
                >
                    <p className="text-sm text-chapter-accent font-medium">{recoveryTip}</p>
                </motion.div>

                {/* Products */}
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-obsidian flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-reward-gold" />
                            지금 이 순간을 위한 추천
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchRecommendedProducts}
                            disabled={loading}
                            className="text-xs"
                        >
                            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                            새로고침
                        </Button>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white rounded-2xl p-4 border border-line animate-pulse">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-mist rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-mist rounded w-3/4" />
                                            <div className="h-3 bg-mist rounded w-1/2" />
                                            <div className="h-5 bg-mist rounded w-1/4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="products"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-3"
                            >
                                {products.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {product.isExternal ? (
                                            <a
                                                href={product.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block bg-white rounded-2xl p-4 border border-line hover:border-reward-gold/50 hover:shadow-lg transition-all group"
                                                aria-label={`${product.title} 상세 보기 (새 창)`}
                                            >
                                                <ProductCard product={product} />
                                            </a>
                                        ) : (
                                            <Link
                                                href={product.link}
                                                onClick={() => onOpenChange(false)}
                                                className="block bg-white rounded-2xl p-4 border border-line hover:border-reward-gold/50 hover:shadow-lg transition-all group"
                                                aria-label={`${product.title} 상세 보기`}
                                            >
                                                <ProductCard product={product} />
                                            </Link>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 pt-0">
                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-2xl font-bold"
                        onClick={() => onOpenChange(false)}
                    >
                        휴식 계속하기
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ProductCard({ product }: { product: RecommendedProduct }) {
    return (
        <div className="flex gap-4">
            <div className="w-20 h-20 bg-mist rounded-xl overflow-hidden flex-shrink-0 relative">
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
                        sizes="80px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-slate/30" />
                    </div>
                )}
                {product.discount && (
                    <div className="absolute top-1 left-1 bg-status-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {product.discount}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-obsidian line-clamp-2 group-hover:text-reward-gold transition-colors">
                        {product.title}
                    </h4>
                    {product.isExternal && (
                        <ExternalLink className="w-4 h-4 text-slate/50 flex-shrink-0" />
                    )}
                </div>
                <p className="text-xs text-slate mt-0.5">{product.description}</p>
                <p className="text-base font-black text-obsidian mt-2">{product.price}</p>
            </div>
        </div>
    );
}
