'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePersonalization } from '@/hooks/usePersonalization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ThumbsUp, ThumbsDown, ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import CharacterImage from '@/components/ui/CharacterImage';

interface PersonalizedRecommendationsProps {
  title?: string;
  itemType?: 'product' | 'content' | 'category' | 'brand';
  limit?: number;
  algorithms?: string[];
  showAlgorithm?: boolean;
  showReason?: boolean;
  onItemClick?: (item: any) => void;
  onItemPurchase?: (item: any) => void;
}

export default function PersonalizedRecommendations({
  title = '당신을 위한 추천',
  itemType = 'product',
  limit = 6,
  algorithms = ['collaborative', 'content_based', 'popular'],
  showAlgorithm = false,
  showReason = true,
  onItemClick,
  onItemPurchase
}: PersonalizedRecommendationsProps) {
  const {
    recommendations,
    loading,
    error,
    generateRecommendations,
    recordRecommendationFeedback
  } = usePersonalization();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    generateRecommendations({
      itemType,
      limit,
      algorithms
    });
  }, [itemType, limit, algorithms, generateRecommendations]);


  const handleRefresh = async () => {
    setRefreshing(true);
    await generateRecommendations({
      itemType,
      limit,
      algorithms
    });
    setRefreshing(false);
  };

  const handleItemClick = async (item: any) => {
    if (onItemClick) {
      onItemClick(item);
    }

    // 클릭 피드백 기록
    await recordRecommendationFeedback(
      item.itemId,
      'positive',
      true,
      false
    );

    // 상품 상세 페이지로 이동
    window.location.href = `/products/${item.itemId}`;
  };

  const handleItemPurchase = async (item: any) => {
    if (onItemPurchase) {
      onItemPurchase(item);
    }

    try {
      // 장바구니에 추가
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: item.itemId,
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

    // 구매 피드백 기록
    await recordRecommendationFeedback(
      item.itemId,
      'positive',
      true,
      true
    );
  };

  const handleFeedback = async (itemId: string, feedback: 'positive' | 'negative') => {
    await recordRecommendationFeedback(itemId, feedback);
  };

  if (loading && recommendations.length === 0) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-text-secondary font-medium">취향을 분석하고 있습니다...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="premium-card border-status-danger/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-status-danger">
            {title}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              다시 시도
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-status-danger mb-6 font-medium">{error}</p>
            <Button onClick={handleRefresh} disabled={refreshing} className="btn-primary">
              다시 시도하기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 추천 상품이 없거나 로딩이 완료된 상태에서 빈 배열인 경우
  if (!loading && recommendations.length === 0) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="text-text-secondary mb-6">
              <Sparkles className="h-16 w-16 mx-auto mb-6 text-reward-gold" />
              <p className="text-2xl font-black text-text-primary">아직 추천 드릴 상품이 없네요</p>
              <p className="text-sm text-text-secondary mt-3">
                다양한 회복 프로토콜을 경험하시면 더욱 정밀한 추천을 해드릴 수 있습니다.
              </p>
            </div>
            <Button onClick={handleRefresh} disabled={refreshing} className="btn-primary">
              지금 둘러보기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </CardTitle>
        <CardDescription>
          gleemile이 분석한 당신의 취향에 맞는 상품들입니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((item, index) => (
            <div
              key={`${item.itemId}_${index}`}
              className="relative border rounded-lg p-4 cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              {/* 상품 이미지 */}
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative">
                {item.product?.images?.[0]?.url ? (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index < 3}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <CharacterImage
                      src="/character/youniqle-1.png"
                      alt={`추천 상품 ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm line-clamp-2">
                  {item.product?.name ||
                    (item.itemType === 'product' ? `상품 ${item.itemId}` :
                      item.itemType === 'content' ? `콘텐츠 ${item.itemId}` :
                        item.itemType === 'category' ? `카테고리 ${item.itemId}` :
                          `브랜드 ${item.itemId}`)}
                </h4>

                {/* 가격 정보 */}
                {item.product?.price && (
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-primary">
                      {item.product.price.toLocaleString()}원
                    </span>
                    {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                      <span className="text-sm text-foreground/70 line-through">
                        {item.product.originalPrice.toLocaleString()}원
                      </span>
                    )}
                  </div>
                )}

                {/* 추천 점수 */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className={`bg-primary h-2 rounded-full transition-all duration-300 rec-score-${index}`} />
                    <style jsx>{`
                      .rec-score-${index} {
                        width: ${item.score * 100}%;
                      }
                    `}</style>
                  </div>
                  <span className="text-xs text-foreground/70">
                    {(item.score * 100).toFixed(0)}%
                  </span>
                </div>

                {/* 추천 이유 */}
                {showReason && (
                  <p className="text-xs text-obsidian line-clamp-2">
                    {item.reason}
                  </p>
                )}

                {/* 알고리즘 태그 */}
                {showAlgorithm && (
                  <Badge variant="outline" className="text-xs">
                    {item.algorithm}
                  </Badge>
                )}

                {/* 액션 버튼들 */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(item.itemId, 'positive');
                      }}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(item.itemId, 'negative');
                      }}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemPurchase(item);
                      }}
                    >
                      <ShoppingCart className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 호버 효과 */}
              <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
            </div>
          ))}
        </div>

        {/* 더 많은 추천 보기 */}
        {recommendations.length >= limit && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={handleRefresh}>
              더 많은 추천 보기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}















