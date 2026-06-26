import { UserProfile } from '@/models/Personalization';
import UserBehavior from '@/models/UserBehavior';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import mongoose from 'mongoose';

export interface AdvancedRecommendationRequest {
  userId: string;
  itemType: 'product' | 'content' | 'category' | 'brand';
  limit?: number;
  context?: {
    page: string;
    category?: string;
    currentItemId?: string;
    sessionId?: string;
    device?: string;
    location?: string;
  };
  algorithms?: string[];
  excludeItems?: string[];
  includeItems?: string[];
  diversity?: number; // 0-1, 다양성 수준
  freshness?: number; // 0-1, 신선도 수준
  popularity?: number; // 0-1, 인기도 수준
}

export interface AdvancedRecommendationResult {
  itemId: string;
  itemType: string;
  score: number;
  confidence: number;
  reason: string;
  algorithm: string;
  metadata: {
    category?: string;
    brand?: string;
    price?: number;
    rating?: number;
    popularity?: number;
    freshness?: number;
    diversity?: number;
  };
  explanations: string[];
}

export class AdvancedRecommendationEngine {
  // 고급 추천 생성
  static async generateAdvancedRecommendations(
    request: AdvancedRecommendationRequest
  ): Promise<AdvancedRecommendationResult[]> {
    try {
      const {
        userId,
        itemType,
        limit = 10,
        context = {},
        algorithms = ['collaborative', 'content_based', 'popular', 'trending'],
        excludeItems = [],
        includeItems = [],
        diversity = 0.5,
        freshness = 0.5,
        popularity = 0.5
      } = request;

      // 사용자 프로필 조회
      const profile = await UserProfile.findOne({ userId });
      if (!profile) {
        return await this.generateFallbackRecommendations(itemType, limit);
      }

      // 행동 데이터 조회
      const behaviors = await UserBehavior.find({ userId })
        .sort({ timestamp: -1 })
        .limit(1000);

      // 구매 데이터 조회 (userId가 이메일인 경우 ObjectId로 변환)
      let userObjectId = userId;
      if (typeof userId === 'string' && userId.includes('@')) {
        const user = await User.findOne({ email: userId });
        if (user) {
          userObjectId = user._id;
        }
      }

      const orders = await Order.find({
        userId: userObjectId,
        status: { $in: ['completed', 'delivered'] }
      }).sort({ createdAt: -1 });

      // 다양한 알고리즘으로 추천 생성
      const allRecommendations: AdvancedRecommendationResult[] = [];

      // 협업 필터링 (고도화)
      if (algorithms.includes('collaborative')) {
        const collaborativeRecs = await this.generateAdvancedCollaborativeRecommendations(
          profile, behaviors, orders, itemType, limit
        );
        allRecommendations.push(...collaborativeRecs);
      }

      // 콘텐츠 기반 필터링 (고도화)
      if (algorithms.includes('content_based')) {
        const contentBasedRecs = await this.generateAdvancedContentBasedRecommendations(
          profile, behaviors, orders, itemType, limit
        );
        allRecommendations.push(...contentBasedRecs);
      }

      // 딥러닝 기반 추천
      if (algorithms.includes('deep_learning')) {
        const deepLearningRecs = await this.generateDeepLearningRecommendations(
          profile, behaviors, orders, itemType, limit
        );
        allRecommendations.push(...deepLearningRecs);
      }

      // 시계열 기반 추천
      if (algorithms.includes('time_series')) {
        const timeSeriesRecs = await this.generateTimeSeriesRecommendations(
          profile, behaviors, orders, itemType, limit
        );
        allRecommendations.push(...timeSeriesRecs);
      }

      // 그래프 기반 추천
      if (algorithms.includes('graph_based')) {
        const graphRecs = await this.generateGraphBasedRecommendations(
          profile, behaviors, orders, itemType, limit
        );
        allRecommendations.push(...graphRecs);
      }

      // 인기 상품 (고도화)
      if (algorithms.includes('popular')) {
        const popularRecs = await this.generateAdvancedPopularRecommendations(
          itemType, limit, context
        );
        allRecommendations.push(...popularRecs);
      }

      // 트렌딩 상품 (고도화)
      if (algorithms.includes('trending')) {
        const trendingRecs = await this.generateAdvancedTrendingRecommendations(
          itemType, limit, context
        );
        allRecommendations.push(...trendingRecs);
      }

      // 추천 후처리
      const processedRecommendations = await this.postProcessRecommendations(
        allRecommendations,
        {
          excludeItems,
          includeItems,
          diversity,
          freshness,
          popularity,
          limit
        }
      );

      return processedRecommendations;

    } catch (error) {
      console.error('Advanced recommendations generation error:', error);
      return await this.generateFallbackRecommendations(request.itemType, request.limit || 10);
    }
  }

  // 고급 협업 필터링
  private static async generateAdvancedCollaborativeRecommendations(
    profile: any,
    behaviors: any[],
    orders: any[],
    itemType: string,
    limit: number
  ): Promise<AdvancedRecommendationResult[]> {
    const recommendations: AdvancedRecommendationResult[] = [];

    // 유사한 사용자 찾기 (고도화된 유사도 계산)
    const similarUsers = await this.findAdvancedSimilarUsers(profile, behaviors, orders);

    // 유사한 사용자들의 행동 분석
    for (const similarUser of similarUsers.slice(0, 20)) {
      const similarProfile = await UserProfile.findOne({ userId: similarUser.userId });
      if (!similarProfile) continue;

      const similarBehaviors = await UserBehavior.find({ userId: similarUser.userId })
        .sort({ timestamp: -1 })
        .limit(500);

      // 유사한 사용자의 ObjectId 조회
      const similarUserObj = await User.findOne({ email: similarUser.userId });
      if (!similarUserObj) continue;

      const similarOrders = await Order.find({
        userId: similarUserObj._id,
        status: { $in: ['completed', 'delivered'] }
      }).sort({ createdAt: -1 });

      // 행동 기반 추천
      for (const behavior of similarBehaviors) {
        if (behavior.eventType === 'product_view' || behavior.eventType === 'product_click') {
          const itemId = behavior.eventData?.productId || behavior.itemId;
          if (!itemId) continue;

          // 현재 사용자가 이미 상호작용한 아이템인지 확인
          const hasInteracted = behaviors.some(b =>
            (b.eventType === 'product_view' || b.eventType === 'product_click') &&
            (b.eventData?.productId === itemId || b.itemId === itemId)
          );

          if (!hasInteracted) {
            const score = similarUser.similarity * 0.8;
            const confidence = this.calculateConfidence(similarUser.similarity, similarBehaviors.length);

            recommendations.push({
              itemId,
              itemType: 'product',
              score,
              confidence,
              reason: `유사한 사용자가 관심을 보인 상품`,
              algorithm: 'collaborative',
              metadata: {
                category: behavior.eventData?.category,
                brand: behavior.eventData?.brand,
                price: behavior.eventData?.price
              },
              explanations: [
                `유사도: ${(similarUser.similarity * 100).toFixed(1)}%`,
                `행동 유형: ${behavior.eventType}`,
                `유사 사용자 행동 수: ${similarBehaviors.length}`
              ]
            });
          }
        }
      }

      // 구매 기반 추천
      for (const order of similarOrders) {
        for (const item of order.items) {
          const hasPurchased = orders.some(o =>
            o.items.some((oi: any) => oi.productId === item.productId)
          );

          if (!hasPurchased) {
            const score = similarUser.similarity * 0.9;
            const confidence = this.calculateConfidence(similarUser.similarity, similarOrders.length);

            recommendations.push({
              itemId: item.productId,
              itemType: 'product',
              score,
              confidence,
              reason: `유사한 사용자가 구매한 상품`,
              algorithm: 'collaborative',
              metadata: {
                category: item.category,
                brand: item.brand,
                price: item.price
              },
              explanations: [
                `유사도: ${(similarUser.similarity * 100).toFixed(1)}%`,
                `구매 시점: ${order.createdAt.toLocaleDateString()}`,
                `구매 금액: ${item.price.toLocaleString()}원`
              ]
            });
          }
        }
      }
    }

    return recommendations;
  }

  // 고급 콘텐츠 기반 필터링
  private static async generateAdvancedContentBasedRecommendations(
    profile: any,
    behaviors: any[],
    orders: any[],
    itemType: string,
    limit: number
  ): Promise<AdvancedRecommendationResult[]> {
    const recommendations: AdvancedRecommendationResult[] = [];

    // 사용자 선호도 분석
    const preferences = this.analyzeUserPreferences(profile, behaviors, orders);

    // 카테고리 기반 추천
    for (const category of preferences.categories.slice(0, 5)) {
      const categoryProducts = await this.getProductsByCategory(category.name);

      for (const product of categoryProducts.slice(0, 3)) {
        const score = category.score * 0.9;
        const confidence = this.calculateContentConfidence(category.score, preferences.categories.length);

        recommendations.push({
          itemId: product.id,
          itemType: 'product',
          score,
          confidence,
          reason: `선호하는 ${category.name} 카테고리 상품`,
          algorithm: 'content_based',
          metadata: {
            category: category.name,
            brand: product.brand,
            price: product.price,
            rating: product.rating
          },
          explanations: [
            `카테고리 선호도: ${(category.score * 100).toFixed(1)}%`,
            `카테고리 순위: ${preferences.categories.indexOf(category) + 1}위`,
            `관련 행동 수: ${category.interactionCount}`
          ]
        });
      }
    }

    // 브랜드 기반 추천
    for (const brand of preferences.brands.slice(0, 3)) {
      const brandProducts = await this.getProductsByBrand(brand.name);

      for (const product of brandProducts.slice(0, 2)) {
        const score = brand.score * 0.8;
        const confidence = this.calculateContentConfidence(brand.score, preferences.brands.length);

        recommendations.push({
          itemId: product.id,
          itemType: 'product',
          score,
          confidence,
          reason: `선호하는 ${brand.name} 브랜드 상품`,
          algorithm: 'content_based',
          metadata: {
            category: product.category,
            brand: brand.name,
            price: product.price,
            rating: product.rating
          },
          explanations: [
            `브랜드 선호도: ${(brand.score * 100).toFixed(1)}%`,
            `브랜드 순위: ${preferences.brands.indexOf(brand) + 1}위`,
            `관련 구매 수: ${brand.purchaseCount}`
          ]
        });
      }
    }

    // 가격대 기반 추천
    const priceRangeProducts = await this.getProductsByPriceRange(
      preferences.priceRange.min,
      preferences.priceRange.max
    );

    for (const product of priceRangeProducts.slice(0, 3)) {
      const priceScore = this.calculatePriceScore(product.price, preferences.priceRange);
      const score = priceScore * 0.7;
      const confidence = this.calculateContentConfidence(priceScore, 1);

      recommendations.push({
        itemId: product.id,
        itemType: 'product',
        score,
        confidence,
        reason: `선호하는 가격대 상품`,
        algorithm: 'content_based',
        metadata: {
          category: product.category,
          brand: product.brand,
          price: product.price,
          rating: product.rating
        },
        explanations: [
          `가격 적합도: ${(priceScore * 100).toFixed(1)}%`,
          `선호 가격대: ${preferences.priceRange.min.toLocaleString()}원 - ${preferences.priceRange.max.toLocaleString()}원`,
          `상품 가격: ${product.price.toLocaleString()}원`
        ]
      });
    }

    return recommendations;
  }

  // 딥러닝 기반 추천
  private static async generateDeepLearningRecommendations(
    profile: any,
    behaviors: any[],
    orders: any[],
    itemType: string,
    limit: number
  ): Promise<AdvancedRecommendationResult[]> {
    const recommendations: AdvancedRecommendationResult[] = [];

    // 실제로는 딥러닝 모델을 사용하지만, 여기서는 시뮬레이션
    const userFeatures = this.extractUserFeatures(profile, behaviors, orders);
    const itemFeatures = await this.extractItemFeatures(itemType);

    // 신경망 기반 점수 계산 (시뮬레이션)
    for (const item of itemFeatures.slice(0, limit * 2)) {
      const score = this.calculateNeuralNetworkScore(userFeatures, item.features);

      if (score > 0.3) {
        recommendations.push({
          itemId: item.id,
          itemType: item.type,
          score,
          confidence: score * 0.8,
          reason: `AI가 분석한 맞춤 추천`,
          algorithm: 'deep_learning',
          metadata: {
            category: item.category,
            brand: item.brand,
            price: item.price,
            rating: item.rating
          },
          explanations: [
            `AI 신뢰도: ${(score * 100).toFixed(1)}%`,
            `특징 유사도: ${(item.features.similarity * 100).toFixed(1)}%`,
            `패턴 매칭: ${(item.features.patternMatch * 100).toFixed(1)}%`
          ]
        });
      }
    }

    return recommendations;
  }

  // 시계열 기반 추천
  private static async generateTimeSeriesRecommendations(
    profile: any,
    behaviors: any[],
    orders: any[],
    itemType: string,
    limit: number
  ): Promise<AdvancedRecommendationResult[]> {
    const recommendations: AdvancedRecommendationResult[] = [];

    // 시간대별 패턴 분석
    const timePatterns = this.analyzeTimePatterns(behaviors, orders);

    // 계절성 패턴 분석
    const seasonalPatterns = this.analyzeSeasonalPatterns(behaviors, orders);

    // 최근 트렌드 분석
    const recentTrends = this.analyzeRecentTrends(behaviors, orders);

    // 시간 기반 추천 생성
    for (const pattern of timePatterns) {
      const timeBasedProducts = await this.getProductsByTimePattern(pattern);

      for (const product of timeBasedProducts.slice(0, 2)) {
        const score = pattern.score * 0.8;
        const confidence = this.calculateTimeConfidence(pattern);

        recommendations.push({
          itemId: product.id,
          itemType: 'product',
          score,
          confidence,
          reason: `시간대별 패턴 기반 추천`,
          algorithm: 'time_series',
          metadata: {
            category: product.category,
            brand: product.brand,
            price: product.price
          },
          explanations: [
            `활성 시간대: ${pattern.timeSlot}시`,
            `패턴 강도: ${(pattern.score * 100).toFixed(1)}%`,
            `관련 행동 수: ${pattern.interactionCount}`
          ]
        });
      }
    }

    return recommendations;
  }

  // 그래프 기반 추천
  private static async generateGraphBasedRecommendations(
    profile: any,
    behaviors: any[],
    orders: any[],
    itemType: string,
    limit: number
  ): Promise<AdvancedRecommendationResult[]> {
    const recommendations: AdvancedRecommendationResult[] = [];

    // 사용자-아이템 그래프 구축
    const userItemGraph = this.buildUserItemGraph(profile, behaviors, orders);

    // 아이템-아이템 그래프 구축
    const itemItemGraph = this.buildItemItemGraph(behaviors, orders);

    // 그래프 기반 추천 생성
    const graphRecommendations = this.generateGraphRecommendations(
      userItemGraph,
      itemItemGraph,
      profile.userId.toString(),
      limit * 2
    );

    for (const rec of graphRecommendations) {
      recommendations.push({
        itemId: rec.itemId,
        itemType: 'product',
        score: rec.score,
        confidence: rec.confidence,
        reason: `그래프 기반 연관 상품`,
        algorithm: 'graph_based',
        metadata: {
          category: rec.category,
          brand: rec.brand,
          price: rec.price
        },
        explanations: [
          `연관도: ${(rec.score * 100).toFixed(1)}%`,
          `경로 길이: ${rec.pathLength}`,
          `연결 강도: ${(rec.connectionStrength * 100).toFixed(1)}%`
        ]
      });
    }

    return recommendations;
  }

  // 고급 인기 상품 추천
  private static async generateAdvancedPopularRecommendations(
    itemType: string,
    limit: number,
    context: any
  ): Promise<AdvancedRecommendationResult[]> {
    const recommendations: AdvancedRecommendationResult[] = [];

    // 카테고리별 인기 상품
    if (context.category) {
      const categoryPopular = await this.getPopularProducts(limit);

      for (const product of categoryPopular) {
        recommendations.push({
          itemId: product.id,
          itemType: 'product',
          score: product.popularityScore,
          confidence: 0.8,
          reason: `${context.category} 카테고리 인기 상품`,
          algorithm: 'popular',
          metadata: {
            category: context.category,
            brand: product.brand,
            price: product.price,
            rating: product.rating,
            popularity: product.popularityScore
          },
          explanations: [
            `카테고리 인기도: ${(product.popularityScore * 100).toFixed(1)}%`,
            `전체 순위: ${product.rank}위`,
            `판매량: ${product.salesCount}개`
          ]
        });
      }
    } else {
      // 전체 인기 상품
      const popularProducts = await this.getPopularProducts(limit);

      for (const product of popularProducts) {
        recommendations.push({
          itemId: product.id,
          itemType: 'product',
          score: product.popularityScore,
          confidence: 0.8,
          reason: '전체 인기 상품',
          algorithm: 'popular',
          metadata: {
            category: product.category,
            brand: product.brand,
            price: product.price,
            rating: product.rating,
            popularity: product.popularityScore
          },
          explanations: [
            `전체 인기도: ${(product.popularityScore * 100).toFixed(1)}%`,
            `전체 순위: ${product.rank}위`,
            `판매량: ${product.salesCount}개`
          ]
        });
      }
    }

    return recommendations;
  }

  // 고급 트렌딩 상품 추천
  private static async generateAdvancedTrendingRecommendations(
    itemType: string,
    limit: number,
    context: any
  ): Promise<AdvancedRecommendationResult[]> {
    const recommendations: AdvancedRecommendationResult[] = [];

    // 최근 트렌드 분석
    const trendingProducts = await this.getTrendingProducts(limit * 2);

    for (const product of trendingProducts) {
      recommendations.push({
        itemId: product.id,
        itemType: 'product',
        score: product.trendScore,
        confidence: 0.7,
        reason: '지금 뜨는 상품',
        algorithm: 'trending',
        metadata: {
          category: product.category,
          brand: product.brand,
          price: product.price,
          rating: product.rating,
          freshness: product.trendScore
        },
        explanations: [
          `트렌드 점수: ${(product.trendScore * 100).toFixed(1)}%`,
          `성장률: ${(product.growthRate * 100).toFixed(1)}%`,
          `최근 주문 수: ${product.recentOrders}개`
        ]
      });
    }

    return recommendations;
  }

  // 추천 후처리
  private static async postProcessRecommendations(
    recommendations: AdvancedRecommendationResult[],
    options: {
      excludeItems: string[];
      includeItems: string[];
      diversity: number;
      freshness: number;
      popularity: number;
      limit: number;
    }
  ): Promise<AdvancedRecommendationResult[]> {
    let processed = [...recommendations];

    // 제외할 아이템 필터링
    if (options.excludeItems.length > 0) {
      processed = processed.filter(rec => !options.excludeItems.includes(rec.itemId));
    }

    // 포함할 아이템 추가
    if (options.includeItems.length > 0) {
      const includeRecs = await this.generateIncludeRecommendations(options.includeItems);
      processed = [...includeRecs, ...processed];
    }

    // 중복 제거
    processed = this.deduplicateRecommendations(processed);

    // 다양성 적용
    if (options.diversity > 0) {
      processed = this.applyDiversity(processed, options.diversity);
    }

    // 신선도 적용
    if (options.freshness > 0) {
      processed = this.applyFreshness(processed, options.freshness);
    }

    // 인기도 적용
    if (options.popularity > 0) {
      processed = this.applyPopularity(processed, options.popularity);
    }

    // 점수 정규화
    processed = this.normalizeScores(processed);

    // 정렬 및 제한
    return processed
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit);
  }

  // 유틸리티 메서드들
  private static async findAdvancedSimilarUsers(
    profile: any,
    behaviors: any[],
    orders: any[]
  ): Promise<any[]> {
    // 고도화된 유사도 계산
    const allProfiles = await UserProfile.find({ userId: { $ne: profile.userId } });

    return allProfiles.map(otherProfile => {
      const similarity = this.calculateAdvancedSimilarity(profile, otherProfile, behaviors, orders);
      return {
        userId: otherProfile.userId,
        similarity
      };
    }).sort((a, b) => b.similarity - a.similarity).slice(0, 50);
  }

  private static calculateAdvancedSimilarity(
    profile1: any,
    profile2: any,
    behaviors1: any[],
    behaviors2: any[]
  ): number {
    // 다차원 유사도 계산
    let similarity = 0;

    // 기본 선호도 유사도
    const basicSimilarity = this.calculateBasicSimilarity(profile1, profile2);
    similarity += basicSimilarity * 0.3;

    // 행동 패턴 유사도
    const behaviorSimilarity = this.calculateBehaviorSimilarity(behaviors1, behaviors2);
    similarity += behaviorSimilarity * 0.4;

    // 시간 패턴 유사도
    const timeSimilarity = this.calculateTimeSimilarity(behaviors1, behaviors2);
    similarity += timeSimilarity * 0.2;

    // 구매 패턴 유사도
    const purchaseSimilarity = this.calculatePurchaseSimilarity(profile1, profile2);
    similarity += purchaseSimilarity * 0.1;

    return Math.min(1, similarity);
  }

  private static calculateBasicSimilarity(profile1: any, profile2: any): number {
    // 카테고리 선호도 유사도
    const categories1 = new Set(profile1.preferences.productCategories.map((c: any) => c.category));
    const categories2 = new Set(profile2.preferences.productCategories.map((c: any) => c.category));
    const categoryIntersection = new Set([...categories1].filter(c => categories2.has(c)));
    const categoryUnion = new Set([...categories1, ...categories2]);
    const categorySimilarity = categoryUnion.size > 0 ? categoryIntersection.size / categoryUnion.size : 0;

    return categorySimilarity;
  }

  private static calculateBehaviorSimilarity(behaviors1: any[], behaviors2: any[]): number {
    // 행동 패턴 유사도 계산
    const behaviorTypes1 = new Map<string, number>();
    const behaviorTypes2 = new Map<string, number>();

    behaviors1.forEach(b => {
      behaviorTypes1.set(b.eventType, (behaviorTypes1.get(b.eventType) || 0) + 1);
    });

    behaviors2.forEach(b => {
      behaviorTypes2.set(b.eventType, (behaviorTypes2.get(b.eventType) || 0) + 1);
    });

    // 코사인 유사도 계산
    const allTypes = new Set([...behaviorTypes1.keys(), ...behaviorTypes2.keys()]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const type of allTypes) {
      const count1 = behaviorTypes1.get(type) || 0;
      const count2 = behaviorTypes2.get(type) || 0;

      dotProduct += count1 * count2;
      norm1 += count1 * count1;
      norm2 += count2 * count2;
    }

    return norm1 > 0 && norm2 > 0 ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0;
  }

  private static calculateTimeSimilarity(behaviors1: any[], behaviors2: any[]): number {
    // 시간대별 패턴 유사도
    const timeSlots1 = new Map<number, number>();
    const timeSlots2 = new Map<number, number>();

    behaviors1.forEach(b => {
      const hour = b.timestamp.getHours();
      timeSlots1.set(hour, (timeSlots1.get(hour) || 0) + 1);
    });

    behaviors2.forEach(b => {
      const hour = b.timestamp.getHours();
      timeSlots2.set(hour, (timeSlots2.get(hour) || 0) + 1);
    });

    // 시간대별 유사도 계산
    let similarity = 0;
    for (let hour = 0; hour < 24; hour++) {
      const count1 = timeSlots1.get(hour) || 0;
      const count2 = timeSlots2.get(hour) || 0;
      const maxCount = Math.max(count1, count2);

      if (maxCount > 0) {
        similarity += Math.min(count1, count2) / maxCount;
      }
    }

    return similarity / 24;
  }

  private static calculatePurchaseSimilarity(profile1: any, profile2: any): number {
    // 구매 패턴 유사도
    const freq1 = profile1.preferences.purchasePatterns.frequency;
    const freq2 = profile2.preferences.purchasePatterns.frequency;
    const avgValue1 = profile1.preferences.purchasePatterns.averageOrderValue;
    const avgValue2 = profile2.preferences.purchasePatterns.averageOrderValue;

    const freqSimilarity = 1 - Math.abs(freq1 - freq2) / Math.max(freq1, freq2, 1);
    const valueSimilarity = 1 - Math.abs(avgValue1 - avgValue2) / Math.max(avgValue1, avgValue2, 1);

    return (freqSimilarity + valueSimilarity) / 2;
  }

  private static calculateConfidence(similarity: number, dataPoints: number): number {
    // 유사도와 데이터 포인트 수를 기반으로 신뢰도 계산
    const similarityWeight = similarity;
    const dataWeight = Math.min(1, dataPoints / 100); // 100개 이상이면 최대 신뢰도

    return (similarityWeight * 0.7 + dataWeight * 0.3);
  }

  private static calculateContentConfidence(preferenceScore: number, totalPreferences: number): number {
    // 선호도 점수와 총 선호도 수를 기반으로 신뢰도 계산
    const preferenceWeight = preferenceScore;
    const diversityWeight = Math.min(1, totalPreferences / 10); // 10개 이상이면 최대 신뢰도

    return (preferenceWeight * 0.8 + diversityWeight * 0.2);
  }

  private static calculateTimeConfidence(pattern: any): number {
    // 시간 패턴의 강도와 일관성을 기반으로 신뢰도 계산
    const strengthWeight = pattern.score;
    const consistencyWeight = Math.min(1, pattern.interactionCount / 20); // 20개 이상이면 최대 신뢰도

    return (strengthWeight * 0.6 + consistencyWeight * 0.4);
  }

  // 더미 데이터 메서드들 (실제로는 데이터베이스에서 조회)
  private static async getProductsByCategory(category: string): Promise<any[]> {
    return [
      { id: `product_${category}_1`, name: `${category} 상품 1`, brand: 'Brand A', price: 10000, rating: 4.5 },
      { id: `product_${category}_2`, name: `${category} 상품 2`, brand: 'Brand B', price: 15000, rating: 4.2 },
      { id: `product_${category}_3`, name: `${category} 상품 3`, brand: 'Brand C', price: 20000, rating: 4.8 }
    ];
  }

  private static async getProductsByBrand(brand: string): Promise<any[]> {
    return [
      { id: `product_${brand}_1`, name: `${brand} 상품 1`, category: 'Category A', price: 12000, rating: 4.3 },
      { id: `product_${brand}_2`, name: `${brand} 상품 2`, category: 'Category B', price: 18000, rating: 4.6 }
    ];
  }

  private static async getProductsByPriceRange(min: number, max: number): Promise<any[]> {
    return [
      { id: 'product_price_1', name: '가격대 상품 1', category: 'Category A', brand: 'Brand A', price: (min + max) / 2, rating: 4.4 },
      { id: 'product_price_2', name: '가격대 상품 2', category: 'Category B', brand: 'Brand B', price: min + (max - min) * 0.7, rating: 4.1 }
    ];
  }

  private static async getPopularProducts(limit: number): Promise<any[]> {
    return Array.from({ length: limit }, (_, i) => ({
      id: `popular_product_${i + 1}`,
      name: `인기 상품 ${i + 1}`,
      category: `Category ${i % 3 + 1}`,
      brand: `Brand ${i % 5 + 1}`,
      price: 10000 + i * 5000,
      rating: 4.0 + Math.random() * 1.0,
      popularityScore: 0.9 - i * 0.1,
      rank: i + 1,
      salesCount: 1000 - i * 100
    }));
  }

  private static async getTrendingProducts(limit: number): Promise<any[]> {
    return Array.from({ length: limit }, (_, i) => ({
      id: `trending_product_${i + 1}`,
      name: `트렌딩 상품 ${i + 1}`,
      category: `Category ${i % 3 + 1}`,
      brand: `Brand ${i % 5 + 1}`,
      price: 15000 + i * 3000,
      rating: 4.2 + Math.random() * 0.8,
      trendScore: 0.8 - i * 0.05,
      growthRate: 0.1 + Math.random() * 0.3,
      recentOrders: 50 + i * 10
    }));
  }

  private static async generateFallbackRecommendations(itemType: string, limit: number): Promise<AdvancedRecommendationResult[]> {
    const products = await this.getPopularProducts(limit);

    return products.map((product, index) => ({
      itemId: product.id,
      itemType: 'product',
      score: 0.5 - index * 0.05,
      confidence: 0.5,
      reason: '기본 추천',
      algorithm: 'fallback',
      metadata: {
        category: product.category,
        brand: product.brand,
        price: product.price,
        rating: product.rating
      },
      explanations: ['기본 추천 시스템']
    }));
  }

  // 기타 유틸리티 메서드들...
  private static analyzeUserPreferences(profile: any, behaviors: any[], orders: any[]): any {
    // 사용자 선호도 분석 로직
    return {
      categories: profile.preferences.productCategories,
      brands: profile.preferences.brands,
      priceRange: profile.preferences.priceRange
    };
  }

  private static calculatePriceScore(price: number, priceRange: any): number {
    if (price < priceRange.min || price > priceRange.max) return 0;
    const preferred = priceRange.preferred;
    const distance = Math.abs(price - preferred);
    const maxDistance = Math.max(priceRange.max - preferred, preferred - priceRange.min);
    return 1 - (distance / maxDistance);
  }

  private static extractUserFeatures(profile: any, behaviors: any[], orders: any[]): any {
    // 사용자 특징 추출 로직
    return {
      preferences: profile.preferences,
      behaviorCount: behaviors.length,
      orderCount: orders.length
    };
  }

  private static async extractItemFeatures(itemType: string): Promise<any[]> {
    // 아이템 특징 추출 로직
    return [];
  }

  private static calculateNeuralNetworkScore(userFeatures: any, itemFeatures: any): number {
    // 신경망 점수 계산 (시뮬레이션)
    return Math.random() * 0.8 + 0.2;
  }

  private static analyzeTimePatterns(behaviors: any[], orders: any[]): any[] {
    // 시간 패턴 분석 로직
    return [];
  }

  private static analyzeSeasonalPatterns(behaviors: any[], orders: any[]): any[] {
    // 계절성 패턴 분석 로직
    return [];
  }

  private static analyzeRecentTrends(behaviors: any[], orders: any[]): any[] {
    // 최근 트렌드 분석 로직
    return [];
  }

  private static async getProductsByTimePattern(pattern: any): Promise<any[]> {
    // 시간 패턴 기반 상품 조회
    return [];
  }

  private static buildUserItemGraph(profile: any, behaviors: any[], orders: any[]): any {
    // 사용자-아이템 그래프 구축
    return {};
  }

  private static buildItemItemGraph(behaviors: any[], orders: any[]): any {
    // 아이템-아이템 그래프 구축
    return {};
  }

  private static generateGraphRecommendations(userItemGraph: any, itemItemGraph: any, userId: string, limit: number): any[] {
    // 그래프 기반 추천 생성
    return [];
  }

  private static deduplicateRecommendations(recommendations: AdvancedRecommendationResult[]): AdvancedRecommendationResult[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const key = `${rec.itemId}_${rec.itemType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private static applyDiversity(recommendations: AdvancedRecommendationResult[], diversity: number): AdvancedRecommendationResult[] {
    // 다양성 적용 로직
    return recommendations;
  }

  private static applyFreshness(recommendations: AdvancedRecommendationResult[], freshness: number): AdvancedRecommendationResult[] {
    // 신선도 적용 로직
    return recommendations;
  }

  private static applyPopularity(recommendations: AdvancedRecommendationResult[], popularity: number): AdvancedRecommendationResult[] {
    // 인기도 적용 로직
    return recommendations;
  }

  private static normalizeScores(recommendations: AdvancedRecommendationResult[]): AdvancedRecommendationResult[] {
    // 점수 정규화 로직
    return recommendations;
  }

  private static async generateIncludeRecommendations(includeItems: string[]): Promise<AdvancedRecommendationResult[]> {
    // 포함할 아이템 추천 생성
    return [];
  }
}
