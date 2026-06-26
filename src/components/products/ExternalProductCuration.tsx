'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, ExternalLink, Sparkles, ShoppingBag, AlertCircle, Store } from 'lucide-react';

interface ExternalProduct {
    id: string;
    title: string;
    price: number;
    priceFormatted: string;
    image: string;
    link: string;
    mallName?: string;
    brand?: string;
    category?: string;
    source?: 'naver' | 'coupang';
    isExternal?: boolean;
    isInternal?: boolean;
    description?: string;
}

interface ExternalProductCurationProps {
    recoveryScore?: number;
    tags?: string[];
    maxItems?: number;
    className?: string;
}

export default function ExternalProductCuration({
    recoveryScore,
    tags = [],
    maxItems = 6,
    className = ''
}: ExternalProductCurationProps) {
    const [internalProducts, setInternalProducts] = useState<ExternalProduct[]>([]);
    const [externalProducts, setExternalProducts] = useState<ExternalProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // 브릿지 팝업 상태
    const [bridgeDialogOpen, setBridgeDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ExternalProduct | null>(null);

    const fetchProducts = async (shuffle: boolean = false) => {
        try {
            setError(null);
            const params = new URLSearchParams({
                limit: maxItems.toString(),
                includeInternal: 'true'
            });

            if (recoveryScore !== undefined) {
                params.append('score', recoveryScore.toString());
            }

            if (tags.length > 0) {
                params.append('tags', tags.join(','));
            }

            // 새로고침 시 shuffle=true로 다른 상품 노출
            if (shuffle) {
                params.append('shuffle', 'true');
            }

            const response = await fetch(`/api/recommendations/external?${params}`);
            if (!response.ok) throw new Error('추천 상품을 불러오는 데 실패했습니다.');

            const data = await response.json();
            setInternalProducts(data.internalProducts || []);
            setExternalProducts(data.externalProducts || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts(false);
    }, [recoveryScore, tags.join(','), maxItems]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProducts(true);  // shuffle=true로 호출하여 다른 상품 노출
    };

    const handleExternalClick = (product: ExternalProduct) => {
        setSelectedProduct(product);
        setBridgeDialogOpen(true);
    };

    const handleConfirmNavigation = () => {
        if (selectedProduct?.link) {
            window.open(selectedProduct.link, '_blank', 'noopener,noreferrer');
        }
        setBridgeDialogOpen(false);
        setSelectedProduct(null);
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="flex justify-between items-center">
                    <div className="h-8 w-64 bg-mist animate-pulse rounded-lg" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[24px] p-4 border border-line animate-pulse">
                            <div className="aspect-square bg-mist rounded-xl mb-3" />
                            <div className="h-4 w-3/4 bg-mist rounded mb-2" />
                            <div className="h-5 w-1/2 bg-mist rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className={`bg-status-danger/5 border border-status-danger/20 rounded-[24px] p-6 text-center ${className}`}>
                <AlertCircle className="w-10 h-10 text-status-danger mx-auto mb-3" />
                <p className="text-status-danger font-bold mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline" size="sm" className="rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    다시 시도
                </Button>
            </div>
        );
    }

    // 상품이 없는 경우
    if (internalProducts.length === 0 && externalProducts.length === 0) {
        return null;
    }

    return (
        <>
            <div className={`space-y-8 ${className}`}>
                {/* 섹션 헤더 */}
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-gradient-to-r from-[#0E3A3A] to-[#1a5555] text-mist border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                                <Sparkles className="w-3 h-3 mr-1" />
                                gleemile 추천
                            </Badge>
                            {externalProducts.length > 0 && (
                                <Badge variant="outline" className="text-[10px] font-bold">
                                    파트너 큐레이션
                                </Badge>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-obsidian tracking-tight">
                            🛒 gleemile 추천 외부 큐레이션
                        </h2>
                        <p className="text-sm text-slate font-medium mt-1">
                            당신의 회복 상태에 맞춘 엄선된 파트너 제품
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="text-slate hover:text-obsidian"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        새로고침
                    </Button>
                </div>

                {/* 상품 그리드 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* 내부 상품 먼저 표시 */}
                    {internalProducts.map((product) => (
                        <Link
                            href={product.link}
                            key={product.id}
                            className="block group"
                        >
                            <Card className="h-full border-line rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all bg-white hover:border-primary">
                                <div className="aspect-square bg-mist relative overflow-hidden">
                                    <Badge className="absolute top-3 left-3 bg-primary text-mist text-[9px] font-black z-10 shadow-md">
                                        YOUNIQLE
                                    </Badge>
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-12 h-12 text-slate/20" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="text-sm font-bold text-obsidian line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                        {product.title}
                                    </h3>
                                    <p className="text-lg font-black text-obsidian">
                                        {product.priceFormatted}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {/* 외부 상품 */}
                    {externalProducts.map((product) => (
                        <div
                            key={product.id}
                            onClick={() => handleExternalClick(product)}
                            className="block group cursor-pointer"
                        >
                            <Card className="h-full border-line rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all bg-gradient-to-b from-white to-mist/30 hover:border-[#0E3A3A]/30">
                                <div className="aspect-square bg-mist relative overflow-hidden">
                                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                                        <Badge className="bg-[#0E3A3A] text-mist text-[9px] font-black shadow-md">
                                            PARTNER
                                        </Badge>
                                        <ExternalLink className="w-4 h-4 text-white drop-shadow-lg" />
                                    </div>
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Store className="w-12 h-12 text-slate/20" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="text-sm font-bold text-obsidian line-clamp-2 mb-2 group-hover:text-[#0E3A3A] transition-colors">
                                        {product.title}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-black text-obsidian">
                                            {product.priceFormatted}
                                        </p>
                                    </div>
                                    {product.mallName && (
                                        <p className="text-[10px] text-slate mt-1 truncate">
                                            {product.mallName}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            {/* 브릿지 팝업 */}
            <Dialog open={bridgeDialogOpen} onOpenChange={setBridgeDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[32px] p-8">
                    <DialogHeader className="text-center">
                        <div className="w-16 h-16 bg-[#0E3A3A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ExternalLink className="w-8 h-8 text-[#0E3A3A]" />
                        </div>
                        <DialogTitle className="font-black text-obsidian text-xl">
                            파트너사 페이지로 이동
                        </DialogTitle>
                        <DialogDescription className="text-slate font-medium pt-2 leading-relaxed">
                            Youniqle이 추천하는 회복 파트너사 페이지로 이동합니다.
                            <br />
                            <span className="text-xs opacity-70">외부 사이트의 정책이 적용됩니다.</span>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProduct && (
                        <div className="bg-mist/50 rounded-2xl p-4 my-4">
                            <div className="flex gap-4">
                                {selectedProduct.image && (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                                        <Image
                                            src={selectedProduct.image}
                                            alt={selectedProduct.title}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-obsidian text-sm line-clamp-2">
                                        {selectedProduct.title}
                                    </p>
                                    <p className="text-lg font-black text-primary mt-1">
                                        {selectedProduct.priceFormatted}
                                    </p>
                                    {selectedProduct.mallName && (
                                        <p className="text-xs text-slate">
                                            {selectedProduct.mallName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col gap-3 sm:flex-col">
                        <Button
                            onClick={handleConfirmNavigation}
                            className="w-full h-14 rounded-2xl bg-[#0E3A3A] hover:bg-[#0E3A3A]/90 text-mist font-black"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            파트너사로 이동하기
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setBridgeDialogOpen(false)}
                            className="w-full h-12 rounded-2xl text-slate font-bold"
                        >
                            취소
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
