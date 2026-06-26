'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  Users,
  Eye,
  Heart,
  ShoppingCart,
  Star,
  Clock,
  Zap,
  Target,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import CharacterImage from '@/components/ui/CharacterImage';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecommendationSectionProps {
  title?: string;
  itemType?: 'product' | 'content' | 'category' | 'brand';
  algorithm?: 'collaborative' | 'content_based' | 'hybrid' | 'popular' | 'trending' | 'frequently_bought_together' | 'recently_viewed' | 'personalized';
  limit?: number;
  excludeIds?: string[];
  showTitle?: boolean;
  showAlgorithm?: boolean;
  showRefresh?: boolean;
  className?: string;
}

export default function RecommendationSection({
  title = '추천 상품',
  itemType = 'product',
  algorithm = 'personalized',
  limit = 8,
  excludeIds = [],
  showTitle = true,
  showAlgorithm = false,
  showRefresh = true,
  className = ''
}: RecommendationSectionProps) {
  const {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    trackBehavior,
    refreshRecommendations
  } = useRecommendations({
    itemType,
    algorithm,
    limit,
    excludeIds
  });

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(recommendations.length / itemsPerPage);

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative':
        return <Users className="h-4 w-4" />;
      case 'content_based':
        return <Target className="h-4 w-4" />;
      case 'hybrid':
        return <Zap className="h-4 w-4" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4" />;
      case 'trending':
        return <Clock className="h-4 w-4" />;
      case 'frequently_bought_together':
        return <ShoppingCart className="h-4 w-4" />;
      case 'recently_viewed':
        return <Eye className="h-4 w-4" />;
      case 'personalized':
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getAlgorithmName = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative':
        return '협업 필터링';
      case 'content_based':
        return '콘텐츠 기반';
      case 'hybrid':
        return '하이브리드';
      case 'popular':
        return '인기 상품';
      case 'trending':
        return '트렌딩';
      case 'frequently_bought_together':
        return '함께 구매';
      case 'recently_viewed':
        return '최근 본 상품';
      case 'personalized':
      default:
        return '개인화 추천';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-status-good text-white';
    if (score >= 0.6) return 'bg-chapter-accent text-white';
    if (score >= 0.4) return 'bg-status-amber text-white';
    return 'bg-slate text-white';
  };

  const handleItemClick = async (itemId: string, itemData: any) => {
    await trackBehavior(itemId, 'click', itemData);
    // 상품 상세 페이지로 이동
    window.location.href = `/products/${itemId}`;
  };

  const handleItemView = useCallback(async (itemId: string, itemData: any) => {
    await trackBehavior(itemId, 'view', itemData);
  }, [trackBehavior]);

  const handleAddToCart = async (itemId: string, itemData: any) => {
    try {
      // 행동 추적
      await trackBehavior(itemId, 'add_to_cart', itemData);

      // 장바구니에 추가
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: itemId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        alert('장바구니에 추가되었습니다!');
        // 헤더 장바구니 개수 업데이트
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        const errorData = await response.json();
        alert(`장바구니 추가 실패: ${errorData.error}`);
      }
    } catch (error) {
      console.error('장바구니 추가 중 오류:', error);
      alert('장바구니 추가 중 오류가 발생했습니다.');
    }
  };

  const handleLike = async (itemId: string, itemData: any) => {
    await trackBehavior(itemId, 'like', itemData);
  };

  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  const currentItems = recommendations.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // 아이템 뷰 추적 (화면에 보일 때)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const itemId = entry.target.getAttribute('data-item-id');
            const itemData = entry.target.getAttribute('data-item-data');
            if (itemId && itemData) {
              handleItemView(itemId, JSON.parse(itemData));
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const items = document.querySelectorAll('[data-item-id]');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [currentItems, handleItemView]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-obsidian tracking-tight">{title}</h2>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <Card key={index} className="animate-pulse rounded-[24px]">
              <CardContent className="p-4">
                <div className="w-full h-48 bg-mist rounded-[20px] mb-4"></div>
                <div className="h-4 bg-mist rounded mb-2"></div>
                <div className="h-4 bg-mist rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-obsidian tracking-tight">{title}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshRecommendations}
              className="rounded-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        )}
        <Card className="rounded-[40px] border-status-danger/10">
          <CardContent className="text-center py-16">
            <div className="text-status-danger mb-4">
              <Sparkles className="h-16 w-16 mx-auto mb-6 opacity-20" />
              <p className="text-lg font-bold">추천을 불러올 수 없습니다</p>
              <p className="text-sm text-slate mt-2">{error}</p>
            </div>
            <Button onClick={refreshRecommendations} variant="outline" className="rounded-full mt-6">
              다시 시도하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-obsidian tracking-tight">{title}</h2>
            {showRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshRecommendations}
                className="rounded-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            )}
          </div>
        )}
        <Card className="rounded-[40px] bg-mist/30 border-none shadow-inner">
          <CardContent className="text-center py-16">
            <Sparkles className="h-16 w-16 mx-auto mb-6 text-slate/20" />
            <h3 className="font-black text-obsidian mb-2 text-xl">아직 추천 드릴 상품이 없습니다</h3>
            <p className="text-slate font-medium">더 많은 활동을 통해 당신의 취향을 학습시켜주세요</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-black text-obsidian tracking-tight">{title}</h2>
            {showAlgorithm && (
              <Badge variant="outline" className="flex items-center space-x-1 rounded-full px-3 py-1 bg-white">
                <span className="text-chapter-accent">{getAlgorithmIcon(algorithm)}</span>
                <span className="text-[10px] font-black uppercase tracking-tighter text-slate">{getAlgorithmName(algorithm)}</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {showRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshRecommendations}
                className="rounded-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            )}
            {totalPages > 1 && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-foreground/70 px-2">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 추천 상품 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentItems.map((item, index) => (
          <Card
            key={item.itemId}
            className="cursor-pointer"
            data-item-id={item.itemId}
            data-item-data={JSON.stringify(item.metadata)}
            onClick={() => handleItemClick(item.itemId, item.metadata)}
          >
            <CardContent className="p-4">
              {/* 상품 이미지 */}
              <div className="relative w-full h-48 mb-4 bg-gray-100 rounded-lg">
                {item.product?.images?.[0]?.url ? (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    width={400}
                    height={192}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    priority={index < 4}
                  />
                ) : (
                  <CharacterImage
                    src="/character/youniqle-1.png"
                    alt={`추천 상품 ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <Badge className={getScoreColor(item.score)}>
                    {Math.round(item.score * 100)}%
                  </Badge>
                </div>
              </div>

              {/* 상품 정보 */}
              <div className="space-y-2">
                <h3 className="font-semibold text-obsidian line-clamp-2">
                  {item.product?.name || `추천 상품 ${index + 1}`}
                </h3>
                <p className="text-sm text-obsidian line-clamp-2">
                  {item.reason}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-primary">
                      ₩{item.product?.price?.toLocaleString() || (Math.random() * 100000 + 10000).toLocaleString()}
                    </span>
                    {item.product?.originalPrice && item.product.originalPrice > item.product.price && (
                      <span className="text-sm text-foreground/70 line-through">
                        ₩{item.product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-obsidian">
                      {(Math.random() * 2 + 3).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(item.itemId, item.metadata);
                  }}
                  className="flex-1 mr-2"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  장바구니
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(item.itemId, item.metadata);
                  }}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={prevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            이전
          </Button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <Button
              key={index}
              variant={currentPage === index ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(index)}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
          >
            다음
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}















