'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, ChevronRight, Sparkles, AlertCircle, ExternalLink, Store, ArrowRight } from 'lucide-react';

import { useSession } from 'next-auth/react';

interface RecommendationItem {
    id: string;
    type: 'product' | 'protocol' | 'content';
    title: string;
    description: string;
    link: string;
    icon?: string;
    tag?: string;
    priority: number;
    category: string;
    price?: string;
    productId?: string;
    imageUrl?: string;
    isExternal?: boolean;
}

interface CategoryStatus {
    score: number;
    level: 'critical' | 'low' | 'mid' | 'high';
    message: string;
}

interface DiagnosisRecommendationsProps {
    limit?: number;
    showProducts?: boolean;
    showProtocols?: boolean;
    showContent?: boolean;
    showCategoryStatus?: boolean;
    showExternalProducts?: boolean;
    className?: string;
}

export default function DiagnosisBasedRecommendations({
    limit = 6,
    showProducts = true,
    showProtocols = true,
    showContent = true,
    showCategoryStatus = false,
    showExternalProducts = true,
    className = ''
}: DiagnosisRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
    const [externalProducts, setExternalProducts] = useState<any[]>([]);
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // 브릿지 팝업 상태
    const [bridgeDialogOpen, setBridgeDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const fetchRecommendations = async () => {
        try {
            setError(null);
            const params = new URLSearchParams({
                limit: limit.toString(),
                products: showProducts.toString(),
                protocols: showProtocols.toString(),
                content: showContent.toString()
            });

            // 내부 추천 API
            const response = await fetch(`/api/recommendations/diagnosis?${params}`);
            if (!response.ok) throw new Error('추천을 불러오는 데 실패했습니다.');

            const data = await response.json();
            setRecommendations(data.recommendations || []);
            setMetadata(data.metadata || null);

            // 외부 상품 API (선택적)
            if (showExternalProducts && data.metadata?.categoryScores) {
                await fetchExternalProducts(data.metadata, false);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // 외부 파트너 상품 불러오기 (별도 함수로 분리)
    const fetchExternalProducts = async (meta: any, shuffle: boolean = false) => {
        try {
            const weakest = meta?.weakestCategory;
            const tagMap: Record<string, string[]> = {
                'physical': ['chronic_fatigue', 'muscle_pain'],
                'mental': ['mental_care', 'stress'],
                'sleep': ['sleep_lack'],
                'lifestyle': ['stress', 'chronic_fatigue']
            };
            const tags = tagMap[weakest?.category] || ['chronic_fatigue'];

            const extParams = new URLSearchParams({
                tags: tags.join(','),
                limit: '3',
                includeInternal: 'false'
            });

            // 셔플 파라미터 추가 (새로고침 시)
            if (shuffle) {
                extParams.append('shuffle', 'true');
            }

            const extResponse = await fetch(`/api/recommendations/external?${extParams}`);
            if (extResponse.ok) {
                const extData = await extResponse.json();
                setExternalProducts(extData.externalProducts || []);
            }
        } catch (extErr) {
            console.error('External products fetch error:', extErr);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, [limit, showProducts, showProtocols, showContent, showExternalProducts]);

    const handleRefresh = () => {
        setRefreshing(true);
        setExternalProducts([]);
        fetchRecommendations();
    };

    // 파트너 상품만 새로고침 (셔플 적용)
    const handleRefreshExternalProducts = () => {
        if (metadata) {
            setRefreshing(true);
            fetchExternalProducts(metadata, true).finally(() => setRefreshing(false));
        }
    };

    const handleExternalClick = (product: any) => {
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

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'product': return 'bg-reward-gold';
            case 'protocol': return 'bg-chapter-accent';
            case 'content': return 'bg-status-normal';
            default: return 'bg-obsidian';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'product': return '상품';
            case 'protocol': return '프로토콜';
            case 'content': return '콘텐츠';
            default: return '';
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'critical': return 'text-status-danger';
            case 'low': return 'text-status-amber';
            case 'mid': return 'text-status-normal';
            case 'high': return 'text-status-good';
            default: return 'text-slate';
        }
    };

    const { data: session } = useSession();
    const isPaid = !!session?.user?.pass; // 패스(Pass) 구매 여부 확인

    // 로딩 상태
    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="flex justify-between items-end">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-mist animate-pulse rounded-lg" />
                        <div className="h-4 w-48 bg-mist animate-pulse rounded" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-[32px] p-6 border border-line animate-pulse">
                            <div className="aspect-[4/3] bg-mist rounded-2xl mb-4" />
                            <div className="h-6 w-3/4 bg-mist rounded mb-2" />
                            <div className="h-4 w-1/2 bg-mist rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className={`bg-status-danger/5 border border-status-danger/20 rounded-[32px] p-8 text-center ${className}`}>
                <AlertCircle className="w-12 h-12 text-status-danger mx-auto mb-4" />
                <p className="text-status-danger font-bold mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline" className="rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    다시 시도
                </Button>
            </div>
        );
    }


    // 추천이 없는 경우
    if (recommendations.length === 0) {
        return (
            <div className={`bg-mist/50 rounded-[32px] p-12 text-center ${className}`}>
                <Sparkles className="w-16 h-16 text-reward-gold mx-auto mb-6" />
                <h3 className="text-2xl font-black text-obsidian mb-3">
                    맞춤 추천을 준비 중입니다
                </h3>
                <p className="text-slate font-medium mb-6">
                    {isPaid 
                        ? '정밀 성격 분석을 통해 당신에게 완벽히 맞춤화된 회복 솔루션을 설계해 보세요.' 
                        : 'gleemile 네비게이터에서 약식 또는 정밀 리듬체크를 완료하시면 더욱 정밀한 추천을 받으실 수 있습니다.'}
                </p>
                <Button asChild className="bg-obsidian text-white rounded-2xl h-16 px-10 text-lg font-black shadow-xl hover:scale-105 transition-all">
                    <Link href="/ai-navigator">
                        gleemile 네비게이터에서 분석 시작하기 <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className={`space-y-8 ${className}`}>
                {/* 헤더 */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-obsidian tracking-tight">
                            🔥 내게 맞는 회복 프로토콜
                        </h2>
                        {metadata?.weakestCategory && (
                            <p className="text-sm text-slate font-medium mt-2">
                                <span className={`font-bold ${getLevelColor(metadata.weakestCategory.level)}`}>
                                    {metadata.weakestCategory.category.toUpperCase()}
                                </span>
                                {' '}영역 집중 추천
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
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
                        <Link
                            href="/products"
                            className="text-sm font-bold text-slate hover:text-chapter-accent transition-colors"
                        >
                            전체 큐레이션 보기 &gt;
                        </Link>
                    </div>
                </div>

                {/* 카테고리 상태 표시 (선택적) */}
                {showCategoryStatus && metadata?.statusSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(metadata.statusSummary).map(([category, status]) => {
                            const s = status as CategoryStatus;
                            return (
                                <div
                                    key={category}
                                    className="bg-white rounded-2xl p-4 border border-line"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate">
                                            {category}
                                        </span>
                                        <span className={`text-lg font-black ${getLevelColor(s.level)}`}>
                                            {s.score}/40
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate font-medium line-clamp-2">
                                        {s.message}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 추천 카드 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendations.map((item, index) => (
                        <Link
                            href={item.link}
                            key={item.id}
                            className="block group"
                            target={item.isExternal ? '_blank' : undefined}
                            rel={item.isExternal ? 'noopener noreferrer' : undefined}
                        >
                            <Card className="h-full border-line rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all bg-white">
                                {/* 이미지/아이콘 영역 */}
                                <div className="aspect-[4/3] bg-mist relative overflow-hidden">
                                    {/* 타입 태그 */}
                                    <div className={`absolute top-4 left-4 ${getTypeColor(item.type)} text-mist text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest z-10 shadow-lg`}>
                                        {item.tag || getTypeLabel(item.type)}
                                    </div>

                                    {/* 이미지 또는 아이콘 */}
                                    {item.imageUrl ? (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <span className="mb-2 group-hover:scale-125 transition-transform duration-300 text-xl">
                                                {item.icon || '✨'}
                                            </span>
                                            <span className="text-slate/20 font-black text-lg italic tracking-tighter">
                                                YU PROTOCOL
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 컨텐츠 영역 */}
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-lg font-black text-obsidian group-hover:text-chapter-accent transition-colors tracking-tight line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <ChevronRight className="w-5 h-5 text-line group-hover:text-chapter-accent flex-shrink-0 transition-colors" />
                                    </div>
                                    <p className="text-sm text-slate font-medium mt-2 line-clamp-2">
                                        {item.description}
                                    </p>

                                    {/* 가격 (상품인 경우) */}
                                    {item.price && (
                                        <div className="mt-4 pt-4 border-t border-line">
                                            <span className="font-black text-obsidian text-xl">
                                                {item.price}
                                            </span>
                                        </div>
                                    )}

                                    {/* 카테고리 배지 */}
                                    <div className="mt-4 flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            {item.category}
                                        </Badge>
                                        {item.isExternal && (
                                            <Badge className="bg-slate/10 text-slate text-[10px]">
                                                외부 링크
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* 외부 파트너 상품 섹션 */}
                {showExternalProducts && externalProducts.length > 0 && (
                    <div className="mt-10 pt-8 border-t border-line">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-[#0E3A3A] text-mist border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                                    <Store className="w-3 h-3 mr-1" />
                                    Partner
                                </Badge>
                                <h3 className="text-lg font-black text-obsidian">추천 파트너 상품</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefreshExternalProducts}
                                disabled={refreshing}
                                className="text-slate hover:text-obsidian"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                새로고침
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {externalProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => handleExternalClick(product)}
                                    className="block group cursor-pointer"
                                >
                                    <Card className="h-full border-line rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all bg-gradient-to-b from-white to-mist/30 hover:border-[#0E3A3A]/30">
                                        <div className="aspect-[4/3] bg-mist relative overflow-hidden">
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
                                                    sizes="(max-width: 768px) 100vw, 33vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Store className="w-10 h-10 text-slate/20" />
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-5">
                                            <h4 className="text-sm font-bold text-obsidian line-clamp-2 mb-2 group-hover:text-[#0E3A3A] transition-colors">
                                                {product.title}
                                            </h4>
                                            <p className="text-lg font-black text-obsidian">
                                                {product.priceFormatted}
                                            </p>
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
                )}

                {/* 1일 회복 리듬체크 (매일 참여 및 포인트 획득 유도) */}
                <div className="mt-12 bg-obsidian text-mist rounded-[32px] p-10 text-center border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <Sparkles className="w-10 h-10 text-reward-gold mx-auto mb-4" />
                        <h3 className="text-2xl font-black mb-2 tracking-tight">1일 회복 리듬체크 시작하기</h3>

                        <p className="text-mist/60 font-medium mb-6">
                            오늘의 에너지를 체크하고 나만의 회복 리포트를 받아보세요.<br />
                            지금 리듬체크를 완료하면 <span className="bg-reward-gold text-obsidian px-2 py-0.5 rounded font-black">100 PT</span>를 즉시 드립니다!
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            <Button asChild size="lg" className="bg-reward-gold text-obsidian font-black rounded-2xl px-12 h-16 shadow-xl shadow-reward-gold/20 hover:scale-105 transition-transform border-none">
                                <Link href="/diagnosis?type=daily">
                                    리듬체크 시작하고 포인트 받기 <ArrowRight className="w-5 h-5 ml-2" />

                                </Link>
                            </Button>
                            <p className="text-xs font-bold text-mist/30">
                                * 정밀 성격 리듬체크(24/60문항)은 <Link href="/ai-navigator" className="text-mist/50 underline hover:text-mist">gleemile 네비게이터</Link>에서 가능합니다.
                            </p>
                        </div>
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
                                    <p className="text-lg font-black text-chapter-accent mt-1">
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

