'use client';

import { useState, useEffect, useCallback } from 'react';

interface RecommendationItem {
  itemId: string;
  itemType: string;
  score: number;
  reason: string;
  recommendationType: string;
  metadata: any;
  product?: any; // 실제 상품 정보 (선택적)
}

interface RecommendationRequest {
  itemType?: 'product' | 'content' | 'category' | 'brand';
  algorithm?: 'collaborative' | 'content_based' | 'hybrid' | 'popular' | 'trending' | 'frequently_bought_together' | 'recently_viewed' | 'personalized';
  limit?: number;
  excludeIds?: string[];
  context?: {
    pageUrl?: string;
    sessionId?: string;
    deviceType?: string;
    category?: string;
  };
}

interface UseRecommendationsReturn {
  recommendations: RecommendationItem[];
  loading: boolean;
  error: string | null;
  fetchRecommendations: (request?: RecommendationRequest) => Promise<void>;
  trackBehavior: (itemId: string, eventType: string, itemData?: any, context?: any) => Promise<void>;
  refreshRecommendations: () => Promise<void>;
}

export function useRecommendations(initialRequest?: RecommendationRequest): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<RecommendationRequest>(initialRequest || {});

  // 추천 데이터 가져오기
  const fetchRecommendations = useCallback(async (request?: RecommendationRequest) => {
    try {
      setLoading(true);
      setError(null);

      const requestData = { ...currentRequest, ...request };
      setCurrentRequest(requestData);

      let response;
      
      // 신상품 알고리즘인 경우 최신 상품 API 사용
      if (requestData.algorithm === 'trending') {
        const params = new URLSearchParams();
        if (requestData.limit) params.append('limit', requestData.limit.toString());
        if (requestData.context?.category) params.append('category', requestData.context.category);
        
        response = await fetch(`/api/products/latest?${params}`);
      } else {
        // 기존 추천 API 사용
        const params = new URLSearchParams();
        if (requestData.itemType) params.append('itemType', requestData.itemType);
        if (requestData.algorithm) params.append('algorithm', requestData.algorithm);
        if (requestData.limit) params.append('limit', requestData.limit.toString());
        if (requestData.excludeIds?.length) params.append('excludeIds', requestData.excludeIds.join(','));
        if (requestData.context?.pageUrl) params.append('pageUrl', requestData.context.pageUrl);
        if (requestData.context?.sessionId) params.append('sessionId', requestData.context.sessionId);
        if (requestData.context?.deviceType) params.append('deviceType', requestData.context.deviceType);

        response = await fetch(`/api/recommendations?${params}`);
      }
      
      if (!response.ok) {
        throw new Error('추천을 불러올 수 없습니다.');
      }

      const data = await response.json();
      
      if (requestData.algorithm === 'trending') {
        // 신상품 데이터를 추천 형식으로 변환
        const recommendations = data.data.products.map((product: any, index: number) => ({
          itemId: product._id.toString(),
          itemType: 'product',
          score: 0.8 - (index * 0.05),
          reason: '최신 상품',
          algorithm: 'trending',
          product: product
        }));
        setRecommendations(recommendations);
      } else {
        setRecommendations(data.data.recommendations || []);
      }

    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentRequest]);

  // 사용자 행동 추적
  const trackBehavior = useCallback(async (
    itemId: string, 
    eventType: string, 
    itemData?: any, 
    context?: any
  ) => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          itemType: currentRequest.itemType || 'product',
          eventType,
          itemData,
          context: {
            pageUrl: window.location.href,
            sessionId: getSessionId(),
            deviceType: getDeviceType(),
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...context
          }
        }),
      });

      if (!response.ok) {
        throw new Error('사용자 행동 기록에 실패했습니다.');
      }

    } catch (error) {
      console.error('Failed to track behavior:', error);
    }
  }, [currentRequest.itemType]);

  // 추천 새로고침
  const refreshRecommendations = useCallback(async () => {
    await fetchRecommendations();
  }, [fetchRecommendations]);

  // 초기 로드 (한 번만 실행)
  useEffect(() => {
    if (Object.keys(currentRequest).length > 0) {
      fetchRecommendations();
    }
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 세션 ID 생성/가져오기
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('recommendation_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('recommendation_session_id', sessionId);
    }
    return sessionId;
  };

  // 디바이스 타입 감지
  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    trackBehavior,
    refreshRecommendations
  };
}















