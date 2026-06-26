import UserBehavior from '@/models/UserBehavior';
import Recommendation from '@/models/Recommendation';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';

export interface RecommendationRequest {
  userId: string;
  itemType: 'product' | 'content' | 'category' | 'brand';
  limit?: number;
  excludeIds?: string[];
  context?: {
    pageUrl?: string;
    sessionId?: string;
    deviceType?: string;
  };
}

export interface RecommendationResult {
  itemId: string;
  itemType: string;
  score: number;
  reason: string;
  recommendationType: string;
  metadata: any;
}

export class RecommendationEngine {
  // 협업 필터링 (Collaborative Filtering)
  static async getCollaborativeRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userId, itemType, limit = 10, excludeIds = [] } = request;

    try {
      // 1. 사용자의 행동 데이터 수집
      const userBehaviors = await UserBehavior.find({
        userId,
        itemType,
        eventType: { $in: ['view', 'click', 'add_to_cart', 'purchase', 'like'] }
      }).sort({ timestamp: -1 }).limit(1000);

      if (userBehaviors.length === 0) {
        return [];
      }

      // 2. 유사한 사용자 찾기 (Jaccard 유사도)
      const userItems = new Set(userBehaviors.map(b => b.itemId?.toString()).filter(Boolean));
      const similarUsers = await this.findSimilarUsers(userId, userItems, itemType);

      if (similarUsers.length === 0) {
        return [];
      }

      // 3. 유사한 사용자들이 선호하는 아이템 추천
      const recommendations = await this.getItemsFromSimilarUsers(similarUsers, userItems, itemType, limit, excludeIds);

      return recommendations.map(rec => ({
        itemId: rec.itemId,
        itemType: itemType,
        score: rec.score,
        reason: `유사한 사용자들이 선호하는 ${itemType}`,
        recommendationType: 'collaborative',
        metadata: { similarUsers: rec.similarUsers }
      }));

    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  // 콘텐츠 기반 필터링 (Content-Based Filtering)
  static async getContentBasedRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userId, itemType, limit = 10, excludeIds = [] } = request;

    try {
      // 1. 사용자가 선호하는 아이템의 특성 분석
      const userPreferences = await this.analyzeUserPreferences(userId, itemType);

      if (userPreferences.length === 0) {
        return [];
      }

      // 2. 유사한 특성을 가진 아이템 찾기
      const recommendations = await this.findSimilarItems(userPreferences, itemType, limit, excludeIds);

      return recommendations.map(rec => ({
        itemId: rec.itemId,
        itemType: itemType,
        score: rec.score,
        reason: `선호하신 ${itemType}과 유사한 특성`,
        recommendationType: 'content_based',
        metadata: { matchedAttributes: rec.matchedAttributes }
      }));

    } catch (error) {
      console.error('Content-based filtering error:', error);
      return [];
    }
  }

  // 하이브리드 추천 (Hybrid Recommendation)
  static async getHybridRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userId, itemType, limit = 10, excludeIds = [] } = request;

    try {
      // 협업 필터링과 콘텐츠 기반 필터링을 병렬로 실행
      const [collaborativeRecs, contentBasedRecs] = await Promise.all([
        this.getCollaborativeRecommendations({ ...request, limit: limit * 2 }),
        this.getContentBasedRecommendations({ ...request, limit: limit * 2 })
      ]);

      // 가중 평균으로 점수 결합
      const combinedRecs = this.combineRecommendations(collaborativeRecs, contentBasedRecs, {
        collaborative: 0.6,
        contentBased: 0.4
      });

      return combinedRecs.slice(0, limit);

    } catch (error) {
      console.error('Hybrid recommendation error:', error);
      return [];
    }
  }

  // 인기 아이템 추천
  static async getPopularRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { itemType, limit = 10, excludeIds = [] } = request;

    try {
      const timeRange = 30; // 최근 30일
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      // 최근 인기 아이템 조회
      const popularItems = await UserBehavior.aggregate([
        {
          $match: {
            itemType,
            eventType: { $in: ['view', 'click', 'add_to_cart', 'purchase'] },
            timestamp: { $gte: startDate },
            itemId: { $nin: excludeIds.map((id: string) => new (mongoose as any).Types.ObjectId(id)) }
          }
        },
        {
          $group: {
            _id: '$itemId',
            viewCount: { $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] } },
            clickCount: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
            addToCartCount: { $sum: { $cond: [{ $eq: ['$eventType', 'add_to_cart'] }, 1, 0] } },
            purchaseCount: { $sum: { $cond: [{ $eq: ['$eventType', 'purchase'] }, 1, 0] } },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            itemId: '$_id',
            score: {
              $add: [
                { $multiply: ['$viewCount', 1] },
                { $multiply: ['$clickCount', 2] },
                { $multiply: ['$addToCartCount', 3] },
                { $multiply: ['$purchaseCount', 5] },
                { $multiply: [{ $size: '$uniqueUsers' }, 0.5] }
              ]
            },
            totalInteractions: {
              $add: ['$viewCount', '$clickCount', '$addToCartCount', '$purchaseCount']
            }
          }
        },
        { $sort: { score: -1 as const } },
        { $limit: limit }
      ]);

      return popularItems.map(rec => ({
        itemId: rec.itemId.toString(),
        itemType: itemType,
        score: Math.min(rec.score / 100, 1), // 0-1 범위로 정규화
        reason: `현재 인기 ${itemType}`,
        recommendationType: 'popular',
        metadata: { totalInteractions: rec.totalInteractions }
      }));

    } catch (error) {
      console.error('Popular recommendations error:', error);
      return [];
    }
  }

  // 트렌딩 아이템 추천
  static async getTrendingRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { itemType, limit = 10, excludeIds = [] } = request;

    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // 최근 1주일과 2주일 전 데이터 비교
      const [recentData, previousData] = await Promise.all([
        this.getInteractionData(itemType, oneWeekAgo, now, excludeIds),
        this.getInteractionData(itemType, twoWeeksAgo, oneWeekAgo, excludeIds)
      ]);

      // 트렌드 점수 계산 (최근 성장률)
      const trendingItems = this.calculateTrendScores(recentData, previousData);

      return trendingItems.slice(0, limit).map(rec => ({
        itemId: rec.itemId,
        itemType: itemType,
        score: rec.trendScore,
        reason: `지금 뜨는 ${itemType}`,
        recommendationType: 'trending',
        metadata: { 
          growthRate: rec.growthRate,
          recentInteractions: rec.recentInteractions 
        }
      }));

    } catch (error) {
      console.error('Trending recommendations error:', error);
      return [];
    }
  }

  // 함께 구매한 상품 추천
  static async getFrequentlyBoughtTogetherRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userId, itemType, limit = 10, excludeIds = [] } = request;

    try {
      // 사용자의 구매 이력 조회
      const userPurchases = await UserBehavior.find({
        userId,
        itemType,
        eventType: 'purchase'
      }).sort({ timestamp: -1 }).limit(100);

      if (userPurchases.length === 0) {
        return [];
      }

      // 함께 구매된 상품 패턴 분석
      const purchasePatterns = await this.analyzePurchasePatterns(userPurchases, itemType);

      // 추천 상품 생성
      const recommendations = await this.generateFrequentlyBoughtTogether(purchasePatterns, excludeIds, limit);

      return recommendations.map(rec => ({
        itemId: rec.itemId,
        itemType: itemType,
        score: rec.confidence,
        reason: `함께 구매하는 ${itemType}`,
        recommendationType: 'frequently_bought_together',
        metadata: { 
          support: rec.support,
          confidence: rec.confidence,
          lift: rec.lift 
        }
      }));

    } catch (error) {
      console.error('Frequently bought together error:', error);
      return [];
    }
  }

  // 최근 본 상품 기반 추천
  static async getRecentlyViewedRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userId, itemType, limit = 10, excludeIds = [] } = request;

    try {
      // 최근 본 상품 조회
      const recentViews = await UserBehavior.find({
        userId,
        itemType,
        eventType: 'view'
      })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('itemId itemData');

      if (recentViews.length === 0) {
        return [];
      }

      // 유사한 상품 찾기
      const recommendations = await this.findSimilarToRecentlyViewed(recentViews, itemType, limit, excludeIds);

      return recommendations.map(rec => ({
        itemId: rec.itemId,
        itemType: itemType,
        score: rec.similarity,
        reason: `최근 본 ${itemType}과 유사한 상품`,
        recommendationType: 'recently_viewed',
        metadata: { 
          basedOn: rec.basedOn,
          similarity: rec.similarity 
        }
      }));

    } catch (error) {
      console.error('Recently viewed recommendations error:', error);
      return [];
    }
  }

  // 개인화된 추천 (종합)
  static async getPersonalizedRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userId, itemType, limit = 10, excludeIds = [] } = request;

    try {
      // 다양한 추천 알고리즘을 병렬로 실행
      const [
        collaborativeRecs,
        contentBasedRecs,
        popularRecs,
        trendingRecs,
        frequentlyBoughtRecs,
        recentlyViewedRecs
      ] = await Promise.all([
        this.getCollaborativeRecommendations({ ...request, limit: 20 }),
        this.getContentBasedRecommendations({ ...request, limit: 20 }),
        this.getPopularRecommendations({ ...request, limit: 20 }),
        this.getTrendingRecommendations({ ...request, limit: 20 }),
        this.getFrequentlyBoughtTogetherRecommendations({ ...request, limit: 20 }),
        this.getRecentlyViewedRecommendations({ ...request, limit: 20 })
      ]);

      // 가중치 설정 (사용자별로 동적 조정 가능)
      const weights = {
        collaborative: 0.25,
        contentBased: 0.20,
        popular: 0.15,
        trending: 0.15,
        frequentlyBought: 0.15,
        recentlyViewed: 0.10
      };

      // 모든 추천을 결합
      const allRecommendations = [
        ...collaborativeRecs.map(r => ({ ...r, weight: weights.collaborative })),
        ...contentBasedRecs.map(r => ({ ...r, weight: weights.contentBased })),
        ...popularRecs.map(r => ({ ...r, weight: weights.popular })),
        ...trendingRecs.map(r => ({ ...r, weight: weights.trending })),
        ...frequentlyBoughtRecs.map(r => ({ ...r, weight: weights.frequentlyBought })),
        ...recentlyViewedRecs.map(r => ({ ...r, weight: weights.recentlyViewed }))
      ];

      // 아이템별로 점수 집계
      const aggregatedRecs = this.aggregateRecommendations(allRecommendations);

      // 최종 추천 결과 반환
      return aggregatedRecs
        .filter(rec => !excludeIds.includes(rec.itemId))
        .slice(0, limit)
        .map(rec => ({
          itemId: rec.itemId,
          itemType: itemType,
          score: rec.finalScore,
          reason: rec.reasons.join(', '),
          recommendationType: 'personalized',
          metadata: { 
            algorithms: rec.algorithms,
            confidence: rec.confidence 
          }
        }));

    } catch (error) {
      console.error('Personalized recommendations error:', error);
      return [];
    }
  }

  // 유사한 사용자 찾기
  private static async findSimilarUsers(userId: string, userItems: Set<string>, itemType: string): Promise<any[]> {
    const pipeline = [
      {
        $match: {
          userId: { $ne: userId },
          itemType,
          eventType: { $in: ['view', 'click', 'add_to_cart', 'purchase', 'like'] }
        }
      },
      {
        $group: {
          _id: '$userId',
          items: { $addToSet: '$itemId' }
        }
      },
      {
        $project: {
          userId: '$_id',
          items: 1,
          jaccardSimilarity: {
            $let: {
              vars: {
                intersection: {
                  $size: {
                    $setIntersection: [
                      '$items',
                      Array.from(userItems).map((id: string) => new (mongoose as any).Types.ObjectId(id))
                    ]
                  }
                },
                union: {
                  $size: {
                    $setUnion: [
                      '$items',
                      Array.from(userItems).map((id: string) => new (mongoose as any).Types.ObjectId(id))
                    ]
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: ['$$union', 0] },
                  { $divide: ['$$intersection', '$$union'] },
                  0
                ]
              }
            }
          }
        }
      },
      {
        $match: {
          jaccardSimilarity: { $gte: 0.1 } // 최소 유사도 임계값
        }
      },
        { $sort: { jaccardSimilarity: -1 as const } },
      { $limit: 50 }
    ];

    return await UserBehavior.aggregate(pipeline);
  }

  // 유사한 사용자들이 선호하는 아이템 조회
  private static async getItemsFromSimilarUsers(similarUsers: any[], userItems: Set<string>, itemType: string, limit: number, excludeIds: string[]): Promise<any[]> {
    const similarUserIds = similarUsers.map(u => u.userId);
    const excludeObjectIds = excludeIds.map((id: string) => new (mongoose as any).Types.ObjectId(id));

    const pipeline = [
      {
        $match: {
          userId: { $in: similarUserIds },
          itemType,
          eventType: { $in: ['view', 'click', 'add_to_cart', 'purchase', 'like'] },
          itemId: { $nin: excludeObjectIds }
        }
      },
      {
        $group: {
          _id: '$itemId',
          totalScore: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$eventType', 'view'] }, then: 1 },
                  { case: { $eq: ['$eventType', 'click'] }, then: 2 },
                  { case: { $eq: ['$eventType', 'add_to_cart'] }, then: 3 },
                  { case: { $eq: ['$eventType', 'purchase'] }, then: 5 },
                  { case: { $eq: ['$eventType', 'like'] }, then: 4 }
                ],
                default: 0
              }
            }
          },
          userCount: { $addToSet: '$userId' },
          similarUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          itemId: '$_id',
          score: {
            $divide: [
              '$totalScore',
              { $size: '$userCount' }
            ]
          },
          similarUsers: 1
        }
      },
      { $sort: { score: -1 as const } },
      { $limit: limit }
    ];

    return await UserBehavior.aggregate(pipeline);
  }

  // 사용자 선호도 분석
  private static async analyzeUserPreferences(userId: string, itemType: string): Promise<any[]> {
    const pipeline = [
      {
        $match: {
          userId,
          itemType,
          eventType: { $in: ['view', 'click', 'add_to_cart', 'purchase', 'like'] }
        }
      },
      {
        $group: {
          _id: '$itemId',
          totalScore: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$eventType', 'view'] }, then: 1 },
                  { case: { $eq: ['$eventType', 'click'] }, then: 2 },
                  { case: { $eq: ['$eventType', 'add_to_cart'] }, then: 3 },
                  { case: { $eq: ['$eventType', 'purchase'] }, then: 5 },
                  { case: { $eq: ['$eventType', 'like'] }, then: 4 }
                ],
                default: 0
              }
            }
          },
          itemData: { $first: '$itemData' }
        }
      },
      {
        $match: {
          totalScore: { $gte: 3 } // 최소 선호도 임계값
        }
      },
      { $sort: { totalScore: -1 as const } },
      { $limit: 20 }
    ];

    return await UserBehavior.aggregate(pipeline);
  }

  // 유사한 아이템 찾기
  private static async findSimilarItems(userPreferences: any[], itemType: string, limit: number, excludeIds: string[]): Promise<any[]> {
    // 간단한 구현 - 실제로는 더 정교한 유사도 계산 필요
    const excludeObjectIds = excludeIds.map(id => new (mongoose as any).Types.ObjectId(id));
    
    const pipeline = [
      {
        $match: {
          itemType,
          itemId: { $nin: excludeObjectIds }
        }
      },
      {
        $group: {
          _id: '$itemId',
          itemData: { $first: '$itemData' },
          totalInteractions: { $sum: 1 }
        }
      },
      {
        $project: {
          itemId: '$_id',
          itemData: 1,
          score: { $divide: ['$totalInteractions', 100] }, // 간단한 점수 계산
          matchedAttributes: ['category', 'brand'] // 실제로는 더 정교한 매칭
        }
      },
      { $sort: { score: -1 as const } },
      { $limit: limit }
    ];

    return await UserBehavior.aggregate(pipeline);
  }

  // 추천 결과 결합
  private static combineRecommendations(collaborativeRecs: RecommendationResult[], contentBasedRecs: RecommendationResult[], weights: any): RecommendationResult[] {
    const combined = new Map<string, any>();

    // 협업 필터링 결과 추가
    collaborativeRecs.forEach(rec => {
      combined.set(rec.itemId, {
        ...rec,
        finalScore: rec.score * weights.collaborative,
        algorithms: ['collaborative']
      });
    });

    // 콘텐츠 기반 결과 추가/업데이트
    contentBasedRecs.forEach(rec => {
      if (combined.has(rec.itemId)) {
        const existing = combined.get(rec.itemId);
        existing.finalScore += rec.score * weights.contentBased;
        existing.algorithms.push('content_based');
      } else {
        combined.set(rec.itemId, {
          ...rec,
          finalScore: rec.score * weights.contentBased,
          algorithms: ['content_based']
        });
      }
    });

    return Array.from(combined.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(rec => ({
        itemId: rec.itemId,
        itemType: rec.itemType,
        score: rec.finalScore,
        reason: rec.reason,
        recommendationType: 'hybrid',
        metadata: { algorithms: rec.algorithms }
      }));
  }

  // 상호작용 데이터 조회
  private static async getInteractionData(itemType: string, startDate: Date, endDate: Date, excludeIds: string[]): Promise<any[]> {
    const excludeObjectIds = excludeIds.map(id => new (mongoose as any).Types.ObjectId(id));

    const pipeline = [
      {
        $match: {
          itemType,
          timestamp: { $gte: startDate, $lt: endDate },
          itemId: { $nin: excludeObjectIds }
        }
      },
      {
        $group: {
          _id: '$itemId',
          interactions: { $sum: 1 }
        }
      },
      {
        $project: {
          itemId: '$_id',
          interactions: 1
        }
      }
    ];

    return await UserBehavior.aggregate(pipeline);
  }

  // 트렌드 점수 계산
  private static calculateTrendScores(recentData: any[], previousData: any[]): any[] {
    const previousMap = new Map(previousData.map(item => [item.itemId.toString(), item.interactions]));

    return recentData.map(item => {
      const previousInteractions = previousMap.get(item.itemId.toString()) || 0;
      const growthRate = previousInteractions > 0 
        ? (item.interactions - previousInteractions) / previousInteractions 
        : item.interactions;
      
      return {
        itemId: item.itemId.toString(),
        trendScore: Math.min(growthRate, 1), // 0-1 범위로 제한
        growthRate,
        recentInteractions: item.interactions
      };
    }).sort((a, b) => b.trendScore - a.trendScore);
  }

  // 구매 패턴 분석
  private static async analyzePurchasePatterns(userPurchases: any[], itemType: string): Promise<any[]> {
    // 간단한 구현 - 실제로는 더 정교한 연관 규칙 분석 필요
    const itemIds = userPurchases.map(p => p.itemId);
    
    const pipeline = [
      {
        $match: {
          itemType,
          eventType: 'purchase',
          itemId: { $in: itemIds }
        }
      },
      {
        $group: {
          _id: '$userId',
          items: { $addToSet: '$itemId' }
        }
      },
      {
        $match: {
          'items.1': { $exists: true } // 2개 이상 구매한 사용자만
        }
      }
    ];

    return await UserBehavior.aggregate(pipeline);
  }

  // 함께 구매한 상품 생성
  private static async generateFrequentlyBoughtTogether(purchasePatterns: any[], excludeIds: string[], limit: number): Promise<any[]> {
    // 간단한 구현 - 실제로는 연관 규칙 마이닝 알고리즘 사용
    const itemCounts = new Map<string, number>();
    
    purchasePatterns.forEach(pattern => {
      pattern.items.forEach((itemId: string) => {
        itemCounts.set(itemId.toString(), (itemCounts.get(itemId.toString()) || 0) + 1);
      });
    });

    return Array.from(itemCounts.entries())
      .filter(([itemId]) => !excludeIds.includes(itemId))
      .map(([itemId, count]) => ({
        itemId,
        support: count / purchasePatterns.length,
        confidence: count / purchasePatterns.length,
        lift: 1.0 // 간단한 구현
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // 최근 본 상품과 유사한 상품 찾기
  private static async findSimilarToRecentlyViewed(recentViews: any[], itemType: string, limit: number, excludeIds: string[]): Promise<any[]> {
    // 간단한 구현 - 실제로는 더 정교한 유사도 계산 필요
    const excludeObjectIds = excludeIds.map(id => new (mongoose as any).Types.ObjectId(id));
    const viewedItemIds = recentViews.map(v => v.itemId);

    const pipeline = [
      {
        $match: {
          itemType,
          itemId: { $nin: excludeObjectIds }
        }
      },
      {
        $group: {
          _id: '$itemId',
          itemData: { $first: '$itemData' },
          totalInteractions: { $sum: 1 }
        }
      },
      {
        $project: {
          itemId: '$_id',
          itemData: 1,
          similarity: { $divide: ['$totalInteractions', 100] },
          basedOn: viewedItemIds[0] // 간단한 구현
        }
      },
      { $sort: { similarity: -1 as const } },
      { $limit: limit }
    ];

    return await UserBehavior.aggregate(pipeline);
  }

  // 추천 결과 집계
  private static aggregateRecommendations(allRecommendations: any[]): any[] {
    const aggregated = new Map<string, any>();

    allRecommendations.forEach(rec => {
      if (aggregated.has(rec.itemId)) {
        const existing = aggregated.get(rec.itemId);
        existing.finalScore += rec.score * rec.weight;
        existing.algorithms.push(rec.recommendationType);
        existing.reasons.push(rec.reason);
      } else {
        aggregated.set(rec.itemId, {
          itemId: rec.itemId,
          itemType: rec.itemType,
          finalScore: rec.score * rec.weight,
          algorithms: [rec.recommendationType],
          reasons: [rec.reason],
          confidence: rec.score
        });
      }
    });

    return Array.from(aggregated.values())
      .sort((a, b) => b.finalScore - a.finalScore);
  }
}
