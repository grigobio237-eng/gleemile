import { useState, useEffect, useCallback } from 'react';

export interface PersonalizationProfile {
  preferences: {
    productCategories: Array<{
      category: string;
      preferenceScore: number;
      lastUpdated: string;
    }>;
    brands: Array<{
      brand: string;
      preferenceScore: number;
      lastUpdated: string;
    }>;
    priceRange: {
      min: number;
      max: number;
      preferred: number;
    };
    browsingPatterns: {
      preferredTimeSlots: number[];
      preferredDays: number[];
      sessionDuration: {
        average: number;
        typical: number;
      };
      pageViewsPerSession: {
        average: number;
        typical: number;
      };
    };
    purchasePatterns: {
      frequency: number;
      averageOrderValue: number;
      preferredPaymentMethod: string;
      preferredShippingMethod: string;
      seasonalPreferences: Array<{
        season: string;
        preferenceScore: number;
      }>;
    };
    contentPreferences: {
      preferredContentTypes: string[];
      preferredTopics: string[];
      readingTime: {
        average: number;
        typical: number;
      };
    };
    uiPreferences: {
      theme: 'light' | 'dark' | 'auto';
      language: string;
      fontSize: 'small' | 'medium' | 'large';
      layout: 'grid' | 'list' | 'compact';
      showRecommendations: boolean;
      showReviews: boolean;
      showPriceHistory: boolean;
    };
  };
  personalizationScore: {
    overall: number;
    productRecommendations: number;
    contentRecommendations: number;
    uiCustomization: number;
    marketingPersonalization: number;
    lastUpdated: string;
  };
  metadata: {
    lastActive: string;
    dataQuality: 'high' | 'medium' | 'low';
    privacySettings: {
      allowPersonalization: boolean;
      allowDataCollection: boolean;
      allowMarketingPersonalization: boolean;
    };
  };
}

export interface PersonalizationRecommendation {
  itemId: string;
  itemType: string;
  score: number;
  reason: string;
  algorithm: string;
  product?: any; // 실제 상품 정보 (선택적)
}

export interface PersonalizationResult {
  userId: string;
  recommendations: PersonalizationRecommendation[];
  content: {
    layout: string;
    theme: string;
    language: string;
    fontSize: string;
    showRecommendations: boolean;
    showReviews: boolean;
    showPriceHistory: boolean;
  };
  pricing: {
    discounts: Array<{
      type: string;
      value: number;
      reason: string;
    }>;
    personalizedPrice?: number;
  };
  marketing: {
    campaigns: Array<{
      campaignId: string;
      message: string;
      channel: string;
      priority: number;
    }>;
    notifications: Array<{
      type: string;
      message: string;
      timing: string;
    }>;
  };
  insights: Array<{
    type: string;
    message: string;
    confidence: number;
    recommendations: string[];
  }>;
}

export interface PersonalizationInsight {
  _id: string;
  insightType: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  data: {
    metrics: Record<string, number>;
    trends: Array<{
      period: string;
      value: number;
      change: number;
    }>;
    comparisons: Array<{
      group: string;
      value: number;
      difference: number;
    }>;
  };
  recommendations: Array<{
    action: string;
    description: string;
    expectedImpact: string;
    implementation: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  isActionable: boolean;
  isResolved: boolean;
  createdAt: string;
}

export function usePersonalization() {
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizationRecommendation[]>([]);
  const [insights, setInsights] = useState<PersonalizationInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 프로필 조회
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/personalization/profile');
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.error || '프로필을 불러올 수 없습니다');
      }
    } catch (err) {
      setError('프로필을 불러오는 중 오류가 발생했습니다');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 프로필 생성/업데이트
  const createOrUpdateProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/personalization/profile', {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.error || '프로필을 생성할 수 없습니다');
      }
    } catch (err) {
      setError('프로필을 생성하는 중 오류가 발생했습니다');
      console.error('Profile creation error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 프로필 업데이트
  const updateProfile = useCallback(async (updates: Partial<PersonalizationProfile['preferences'] | { privacySettings: any }>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/personalization/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.error || '프로필을 업데이트할 수 없습니다');
      }
    } catch (err) {
      setError('프로필을 업데이트하는 중 오류가 발생했습니다');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 추천 생성
  const generateRecommendations = useCallback(async (options: {
    itemType?: string;
    limit?: number;
    context?: any;
    algorithms?: string[];
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/personalization/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: options.itemType || 'product',
          limit: options.limit || 10,
          context: options.context || {},
          algorithms: options.algorithms || ['collaborative', 'content_based', 'popular']
        })
      });
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data.recommendations);
        return data.data;
      } else {
        setError(data.error || '추천을 생성할 수 없습니다');
        return null;
      }
    } catch (err) {
      setError('추천을 생성하는 중 오류가 발생했습니다');
      console.error('Recommendations generation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 추천 피드백 기록
  const recordRecommendationFeedback = useCallback(async (
    recommendationId: string,
    feedback: 'positive' | 'negative' | 'neutral',
    clicked: boolean = false,
    purchased: boolean = false
  ) => {
    try {
      const response = await fetch('/api/personalization/recommendations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId,
          feedback,
          clicked,
          purchased
        })
      });
      const data = await response.json();

      if (!data.success) {
        console.error('Feedback recording failed:', data.error);
      }
    } catch (err) {
      console.error('Feedback recording error:', err);
    }
  }, []);

  // 인사이트 조회
  const fetchInsights = useCallback(async (options: {
    insightType?: string;
    impact?: string;
    actionable?: boolean;
    limit?: number;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.insightType) params.append('type', options.insightType);
      if (options.impact) params.append('impact', options.impact);
      if (options.actionable !== undefined) params.append('actionable', options.actionable.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/personalization/insights?${params}`);
      const data = await response.json();

      if (data.success) {
        setInsights(data.data);
      } else {
        setError(data.error || '인사이트를 불러올 수 없습니다');
      }
    } catch (err) {
      setError('인사이트를 불러오는 중 오류가 발생했습니다');
      console.error('Insights fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 인사이트 해결 표시
  const resolveInsight = useCallback(async (insightId: string, resolved: boolean = true) => {
    try {
      const response = await fetch('/api/personalization/insights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insightId,
          resolved
        })
      });
      const data = await response.json();

      if (data.success) {
        setInsights(insights.map(insight => 
          insight._id === insightId ? { ...insight, isResolved: resolved } : insight
        ));
      } else {
        setError(data.error || '인사이트 상태를 업데이트할 수 없습니다');
      }
    } catch (err) {
      setError('인사이트 상태를 업데이트하는 중 오류가 발생했습니다');
      console.error('Insight resolution error:', err);
    }
  }, [insights]);

  // 초기 로드
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    recommendations,
    insights,
    loading,
    error,
    fetchProfile,
    createOrUpdateProfile,
    updateProfile,
    generateRecommendations,
    recordRecommendationFeedback,
    fetchInsights,
    resolveInsight
  };
}















