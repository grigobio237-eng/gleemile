'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, Image as ImageIcon, MessageCircle, Filter } from 'lucide-react';
import Image from 'next/image';

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  title?: string;
  content: string;
  images: string[];
  isVerified: boolean;
  helpfulCount: number;
  helpfulUsers: string[];
  replies: Array<{
    userId: {
      _id: string;
      name: string;
      avatar?: string;
      role: string;
    };
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  ratingStats: Record<number, number>;
}

interface ReviewSectionProps {
  productId: string;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, ratingStats: {} });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState<string>('');
  const [showImagesOnly, setShowImagesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, filterRating, showImagesOnly, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        productId,
        page: page.toString(),
        limit: '10',
        sort: sortBy,
      });

      if (filterRating) {
        params.append('rating', filterRating);
      }

      if (showImagesOnly) {
        params.append('hasImages', 'true');
      }

      const response = await fetch(`/api/reviews?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        if (page === 1) {
          setReviews(data.reviews);
        } else {
          setReviews(prev => [...prev, ...data.reviews]);
        }
        setStats({
          averageRating: data.averageRating,
          ratingStats: data.ratingStats,
        });
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        console.error('리뷰 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('리뷰 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(prev => prev.map(review =>
          review._id === reviewId
            ? {
              ...review,
              helpfulCount: data.helpfulCount,
              helpfulUsers: data.hasVoted
                ? [...review.helpfulUsers, 'current-user']
                : review.helpfulUsers.filter(id => id !== 'current-user')
            }
            : review
        ));
      }
    } catch (error) {
      console.error('도움됨 투표 중 오류:', error);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass[size]} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    );
  };

  const totalReviews = Object.values(stats.ratingStats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* 리뷰 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-400" />
            상품 리뷰
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 평균 별점 */}
            <div className="text-center">
              <div className="font-bold text-obsidian mb-2 text-4xl">
                {stats.averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(stats.averageRating), 'lg')}
              <div className="text-sm text-obsidian mt-1">
                총 {totalReviews}개의 리뷰
              </div>
            </div>

            {/* 별점 분포 */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingStats[rating] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                return (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="text-sm text-obsidian w-2">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full rating-bar" />
                      <style jsx>{`
                        .rating-bar {
                          width: ${percentage}%;
                        }
                      `}</style>
                    </div>
                    <span className="text-sm text-obsidian w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 필터 및 정렬 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-foreground/70" />
              <span className="text-sm font-medium">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                aria-label="정렬 기준"
              >
                <option value="newest">최신순</option>
                <option value="rating">별점순</option>
                <option value="helpful">도움됨순</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">별점:</span>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                aria-label="별점 필터"
              >
                <option value="">전체</option>
                <option value="5">5점</option>
                <option value="4">4점</option>
                <option value="3">3점</option>
                <option value="2">2점</option>
                <option value="1">1점</option>
              </select>
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showImagesOnly}
                onChange={(e) => setShowImagesOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">이미지 있는 리뷰만</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 리뷰 목록 */}
      <div className="space-y-4">
        {loading && page === 1 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-foreground/70 mx-auto mb-4" />
              <p className="text-obsidian">아직 작성된 리뷰가 없습니다.</p>
              <p className="text-sm text-foreground/70 mt-2">
                첫 번째 리뷰를 작성해보세요!
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                {/* 리뷰 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {review.userId.avatar ? (
                        <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                          src={review.userId.avatar}
                          alt={review.userId.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-obsidian">
                          {review.userId.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{review.userId.name}</span>
                        {review.isVerified && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            구매인증
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating, 'sm')}
                        <span className="text-sm text-foreground/70">
                          {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 리뷰 내용 */}
                {review.title && (
                  <h4 className="font-semibold text-obsidian mb-2">{review.title}</h4>
                )}
                <p className="text-obsidian mb-4 whitespace-pre-line">{review.content}</p>

                {/* 리뷰 이미지 */}
                {review.images.length > 0 && (
                  <div className="flex space-x-2 mb-4">
                    {review.images.map((image, index) => (
                      <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                        key={index}
                        src={image}
                        alt={`리뷰 이미지 ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}

                {/* 관리자/파트너 답변 */}
                {review.replies.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 space-y-2">
                    {review.replies.map((reply, index) => (
                      <div key={index}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-blue-900">
                            {reply.userId.name}
                          </span>
                          <Badge className="bg-primary-container text-blue-800 text-xs">
                            {reply.userId.role === 'admin' ? '관리자' : '파트너'}
                          </Badge>
                          <span className="text-sm text-primary">
                            {new Date(reply.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-blue-800">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 도움됨 버튼 */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpful(review._id)}
                    className="flex items-center space-x-1"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>도움됨 {review.helpfulCount}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* 더보기 버튼 */}
        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
            >
              {loading ? '로딩 중...' : '더보기'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
