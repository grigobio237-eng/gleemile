import { UserProfile, PersonalizationRule, PersonalizationExperiment, PersonalizationInsight } from '@/models/Personalization';
import User from '@/models/User';
import UserBehavior from '@/models/UserBehavior';
import Order from '@/models/Order';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

export interface PersonalizationResult {
  userId: string;
  recommendations: Array<{
    itemId: string;
    itemType: string;
    score: number;
    reason: string;
    algorithm: string;
  }>;
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

export interface RecommendationRequest {
  userId: string;
  itemType: 'product' | 'content' | 'category' | 'brand';
  limit?: number;
  context?: {
    page: string;
    category?: string;
    currentItemId?: string;
  };
  algorithms?: string[];
}

export class PersonalizationEngine {
  // 사용자 프로필 생성/업데이트
  static async createOrUpdateUserProfile(userId: string): Promise<any> {
    try {
      // MongoDB 연결 확인
      await connectDB();
      
      // 타임아웃 설정으로 쿼리 실행
      const user = await User.findOne({ email: userId }).maxTimeMS(5000);
      if (!user) {
        // 사용자가 없으면 익명 사용자로 처리
        console.log(`[PersonalizationEngine] 사용자를 찾을 수 없음: ${userId}, 익명 사용자로 처리`);
        return null;
      }

      // 기존 프로필 조회
      await connectDB(); // MongoDB 연결 확인
      let profile = await UserProfile.findOne({ userId }).maxTimeMS(5000);
      
      if (!profile) {
        // 새 프로필 생성
        profile = new UserProfile({
          userId,
          preferences: await this.extractUserPreferences(userId),
          behaviorHistory: [],
          recommendationHistory: [],
          personalizationScore: {
            overall: 0,
            productRecommendations: 0,
            contentRecommendations: 0,
            uiCustomization: 0,
            marketingPersonalization: 0,
            lastUpdated: new Date()
          },
          metadata: {
            createdBy: user._id,
            lastActive: new Date(),
            dataQuality: 'medium',
            privacySettings: {
              allowPersonalization: true,
              allowDataCollection: true,
              allowMarketingPersonalization: true
            }
          }
        });
      } else {
        // 기존 프로필 업데이트
        profile.preferences = await this.extractUserPreferences(userId);
        profile.metadata.lastActive = new Date();
        profile.personalizationScore = await this.calculatePersonalizationScore(profile);
        profile.updatedAt = new Date();
      }

      await profile.save();
      return profile;

    } catch (error) {
      console.error('User profile creation/update error:', error);
      
      // MongoDB 타임아웃 에러인 경우 null 반환 (익명 사용자로 처리)
      if (error instanceof Error && error.message.includes('buffering timed out')) {
        console.log(`[PersonalizationEngine] MongoDB 타임아웃으로 인해 익명 사용자로 처리: ${userId}`);
        return null;
      }
      
      throw error;
    }
  }

  // 사용자 프로필 업데이트 (외부에서 호출)
  static async updateUserProfile(userId: string, updateData: any): Promise<any> {
    try {
      await connectDB();
      const profile = await UserProfile.findOne({ userId }).maxTimeMS(5000);
      
      if (!profile) {
        throw new Error('Profile not found');
      }

      // 업데이트할 데이터가 있으면 적용
      if (updateData.preferences) {
        profile.preferences = { ...profile.preferences, ...updateData.preferences };
      }
      if (updateData.interests) {
        profile.interests = { ...profile.interests, ...updateData.interests };
      }
      if (updateData.behavior) {
        profile.behavior = { ...profile.behavior, ...updateData.behavior };
      }

      profile.updatedAt = new Date();
      await profile.save();
      
      return profile;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // 사용자 선호도 추출
  private static async extractUserPreferences(userId: string): Promise<any> {
    // 사용자 ID를 ObjectId로 변환
    const user = await User.findOne({ email: userId });
    if (!user) {
      throw new Error('User not found');
    }
    const userObjectId = user._id;

    // 구매 데이터 분석
    const orders = await Order.find({
      userId: userObjectId,
      status: { $in: ['completed', 'delivered'] }
    }).sort({ createdAt: -1 });

    // 행동 데이터 분석
    const behaviors = await UserBehavior.find({ userId: userObjectId })
      .sort({ timestamp: -1 })
      .limit(1000);

    // 제품 카테고리 선호도 계산
    const categoryPreferences = this.calculateCategoryPreferences(orders);
    
    // 브랜드 선호도 계산
    const brandPreferences = this.calculateBrandPreferences(orders);
    
    // 가격 범위 계산
    const priceRange = this.calculatePriceRange(orders);
    
    // 브라우징 패턴 분석
    const browsingPatterns = this.analyzeBrowsingPatterns(behaviors);
    
    // 구매 패턴 분석
    const purchasePatterns = this.analyzePurchasePatterns(orders);
    
    // 콘텐츠 선호도 분석
    const contentPreferences = this.analyzeContentPreferences(behaviors);
    
    // UI 선호도 (기본값)
    const uiPreferences = {
      theme: 'auto',
      language: 'ko',
      fontSize: 'medium',
      layout: 'grid',
      showRecommendations: true,
      showReviews: true,
      showPriceHistory: false
    };

    return {
      productCategories: categoryPreferences,
      brands: brandPreferences,
      priceRange,
      browsingPatterns,
      purchasePatterns,
      contentPreferences,
      uiPreferences
    };
  }

  // 제품 카테고리 선호도 계산
  private static calculateCategoryPreferences(orders: any[]): any[] {
    const categoryCount = new Map<string, number>();
    const categoryValue = new Map<string, number>();
    
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const category = item.category || '기타';
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
        categoryValue.set(category, (categoryValue.get(category) || 0) + item.price * item.quantity);
      });
    });

    const totalOrders = orders.length;
    const totalValue = Array.from(categoryValue.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(categoryCount.entries()).map(([category, count]) => {
      const value = categoryValue.get(category) || 0;
      const frequencyScore = count / totalOrders;
      const valueScore = totalValue > 0 ? value / totalValue : 0;
      const preferenceScore = (frequencyScore * 0.6 + valueScore * 0.4);

      return {
        category,
        preferenceScore: Math.min(1, preferenceScore),
        lastUpdated: new Date()
      };
    }).sort((a, b) => b.preferenceScore - a.preferenceScore);
  }

  // 브랜드 선호도 계산
  private static calculateBrandPreferences(orders: any[]): any[] {
    const brandCount = new Map<string, number>();
    const brandValue = new Map<string, number>();
    
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const brand = item.brand || '기타';
        brandCount.set(brand, (brandCount.get(brand) || 0) + 1);
        brandValue.set(brand, (brandValue.get(brand) || 0) + item.price * item.quantity);
      });
    });

    const totalOrders = orders.length;
    const totalValue = Array.from(brandValue.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(brandCount.entries()).map(([brand, count]) => {
      const value = brandValue.get(brand) || 0;
      const frequencyScore = count / totalOrders;
      const valueScore = totalValue > 0 ? value / totalValue : 0;
      const preferenceScore = (frequencyScore * 0.6 + valueScore * 0.4);

      return {
        brand,
        preferenceScore: Math.min(1, preferenceScore),
        lastUpdated: new Date()
      };
    }).sort((a, b) => b.preferenceScore - a.preferenceScore);
  }

  // 가격 범위 계산
  private static calculatePriceRange(orders: any[]): any {
    if (orders.length === 0) {
      return { min: 0, max: 100000, preferred: 50000 };
    }

    const orderValues = orders.map(order => order.totalAmount);
    const min = Math.min(...orderValues);
    const max = Math.max(...orderValues);
    const average = orderValues.reduce((sum, value) => sum + value, 0) / orderValues.length;
    const median = this.calculateMedian(orderValues);

    return {
      min: Math.max(0, min * 0.8),
      max: max * 1.2,
      preferred: median
    };
  }

  // 브라우징 패턴 분석
  private static analyzeBrowsingPatterns(behaviors: any[]): any {
    if (behaviors.length === 0) {
      return {
        preferredTimeSlots: [],
        preferredDays: [],
        sessionDuration: { average: 0, typical: 0 },
        pageViewsPerSession: { average: 0, typical: 0 }
      };
    }

    // 시간대별 분석
    const timeSlots = new Map<number, number>();
    const days = new Map<number, number>();
    
    behaviors.forEach(behavior => {
      const hour = behavior.timestamp.getHours();
      const day = behavior.timestamp.getDay();
      
      timeSlots.set(hour, (timeSlots.get(hour) || 0) + 1);
      days.set(day, (days.get(day) || 0) + 1);
    });

    const preferredTimeSlots = Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    const preferredDays = Array.from(days.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);

    // 세션 분석
    const sessionMap = new Map<string, any[]>();
    behaviors.forEach(behavior => {
      const sessionId = behavior.sessionId;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      sessionMap.get(sessionId)!.push(behavior);
    });

    const sessionDurations = Array.from(sessionMap.values()).map(session => {
      if (session.length < 2) return 0;
      const start = session[session.length - 1].timestamp;
      const end = session[0].timestamp;
      return (end.getTime() - start.getTime()) / (1000 * 60); // 분 단위
    });

    const pageViewsPerSession = Array.from(sessionMap.values()).map(session => session.length);

    return {
      preferredTimeSlots,
      preferredDays,
      sessionDuration: {
        average: sessionDurations.length > 0 ? 
          sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length : 0,
        typical: this.calculateMedian(sessionDurations)
      },
      pageViewsPerSession: {
        average: pageViewsPerSession.length > 0 ? 
          pageViewsPerSession.reduce((sum, views) => sum + views, 0) / pageViewsPerSession.length : 0,
        typical: this.calculateMedian(pageViewsPerSession)
      }
    };
  }

  // 구매 패턴 분석
  private static analyzePurchasePatterns(orders: any[]): any {
    if (orders.length === 0) {
      return {
        frequency: 0,
        averageOrderValue: 0,
        preferredPaymentMethod: 'card',
        preferredShippingMethod: 'standard',
        seasonalPreferences: []
      };
    }

    // 구매 빈도 계산 (월 단위)
    const firstOrder = orders[orders.length - 1];
    const lastOrder = orders[0];
    const monthsBetween = (lastOrder.createdAt.getTime() - firstOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const frequency = monthsBetween > 0 ? orders.length / monthsBetween : 0;

    // 평균 주문 금액
    const averageOrderValue = orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length;

    // 결제 방법 선호도
    const paymentMethods = new Map<string, number>();
    orders.forEach(order => {
      const method = order.paymentMethod || 'card';
      paymentMethods.set(method, (paymentMethods.get(method) || 0) + 1);
    });
    const preferredPaymentMethod = Array.from(paymentMethods.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'card';

    // 배송 방법 선호도
    const shippingMethods = new Map<string, number>();
    orders.forEach(order => {
      const method = order.shippingMethod || 'standard';
      shippingMethods.set(method, (shippingMethods.get(method) || 0) + 1);
    });
    const preferredShippingMethod = Array.from(shippingMethods.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'standard';

    // 계절성 선호도
    const seasonalPreferences = this.calculateSeasonalPreferences(orders);

    return {
      frequency,
      averageOrderValue,
      preferredPaymentMethod,
      preferredShippingMethod,
      seasonalPreferences
    };
  }

  // 콘텐츠 선호도 분석
  private static analyzeContentPreferences(behaviors: any[]): any {
    const contentTypes = new Map<string, number>();
    const topics = new Map<string, number>();
    const readingTimes: number[] = [];

    behaviors.forEach(behavior => {
      if (behavior.eventType === 'content_view') {
        const contentType = behavior.eventData?.contentType || 'unknown';
        const topic = behavior.eventData?.topic || 'unknown';
        const readingTime = behavior.eventData?.readingTime || 0;

        contentTypes.set(contentType, (contentTypes.get(contentType) || 0) + 1);
        topics.set(topic, (topics.get(topic) || 0) + 1);
        
        if (readingTime > 0) {
          readingTimes.push(readingTime);
        }
      }
    });

    const preferredContentTypes = Array.from(contentTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);

    const preferredTopics = Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);

    return {
      preferredContentTypes,
      preferredTopics,
      readingTime: {
        average: readingTimes.length > 0 ? 
          readingTimes.reduce((sum, time) => sum + time, 0) / readingTimes.length : 0,
        typical: this.calculateMedian(readingTimes)
      }
    };
  }

  // 계절성 선호도 계산
  private static calculateSeasonalPreferences(orders: any[]): any[] {
    const seasonalCount = new Map<string, number>();
    
    orders.forEach(order => {
      const month = order.createdAt.getMonth() + 1;
      let season = 'spring';
      
      if (month >= 3 && month <= 5) season = 'spring';
      else if (month >= 6 && month <= 8) season = 'summer';
      else if (month >= 9 && month <= 11) season = 'fall';
      else season = 'winter';
      
      seasonalCount.set(season, (seasonalCount.get(season) || 0) + 1);
    });

    const totalOrders = orders.length;
    
    return Array.from(seasonalCount.entries()).map(([season, count]) => ({
      season,
      preferenceScore: totalOrders > 0 ? count / totalOrders : 0
    }));
  }

  // 개인화 점수 계산
  private static async calculatePersonalizationScore(profile: any): Promise<any> {
    let productRecommendations = 0;
    let contentRecommendations = 0;
    let uiCustomization = 0;
    let marketingPersonalization = 0;

    // 제품 추천 점수 (카테고리, 브랜드 선호도 기반)
    if (profile.preferences.productCategories.length > 0) {
      const avgCategoryScore = profile.preferences.productCategories    
        .reduce((sum: number, cat: any) => sum + cat.preferenceScore, 0) / profile.preferences.productCategories.length;
      productRecommendations = avgCategoryScore;
    }

    // 콘텐츠 추천 점수 (콘텐츠 선호도 기반)
    if (profile.preferences.contentPreferences.preferredContentTypes.length > 0) {
      contentRecommendations = 0.7; // 기본 점수
    }

    // UI 커스터마이제이션 점수 (UI 선호도 기반)
    const uiPrefs = profile.preferences.uiPreferences;
    let uiScore = 0;
    if (uiPrefs.theme !== 'auto') uiScore += 0.2;
    if (uiPrefs.fontSize !== 'medium') uiScore += 0.2;
    if (uiPrefs.layout !== 'grid') uiScore += 0.2;
    if (!uiPrefs.showRecommendations) uiScore += 0.2;
    if (uiPrefs.showReviews) uiScore += 0.1;
    if (uiPrefs.showPriceHistory) uiScore += 0.1;
    uiCustomization = Math.min(1, uiScore);

    // 마케팅 개인화 점수 (구매 패턴 기반)
    if (profile.preferences.purchasePatterns.frequency > 0) {
      marketingPersonalization = 0.8; // 구매 이력이 있으면 높은 점수
    }

    const overall = (productRecommendations + contentRecommendations + uiCustomization + marketingPersonalization) / 4;

    return {
      overall,
      productRecommendations,
      contentRecommendations,
      uiCustomization,
      marketingPersonalization,
      lastUpdated: new Date()
    };
  }

  // 개인화 추천 생성
  static async generatePersonalizedRecommendations(request: RecommendationRequest): Promise<PersonalizationResult> {
    try {
      const { userId, itemType, limit = 10, context, algorithms = ['collaborative', 'content_based', 'popular'] } = request;

      // 익명 사용자 처리
      if (userId === 'anonymous') {
        return await this.generateDefaultRecommendations(itemType, limit);
      }

      // 사용자 프로필 조회/생성
      await connectDB(); // MongoDB 연결 확인
      let profile = await UserProfile.findOne({ userId });
      if (!profile) {
        profile = await this.createOrUpdateUserProfile(userId);
      }

      // 프로필이 여전히 null인 경우 기본 추천 반환
      if (!profile) {
        return await this.generateDefaultRecommendations(itemType, limit);
      }

      // 사용자 활동 이력 확인
      const hasActivity = await this.checkUserActivity(userId);
      
      let recommendations: any[] = [];
      
      if (!hasActivity) {
        // 활동 이력이 없는 신규 사용자: 관리자 추천 상품 우선 노출
        const adminProducts = await this.getAdminRecommendedProducts(Math.ceil(limit * 0.7));
        const popularProducts = await this.getPopularProducts(Math.ceil(limit * 0.3));
        
        recommendations = [
          ...adminProducts.map((product, index) => ({
            itemId: product._id.toString(),
            itemType: 'product',
            score: 0.9 - (index * 0.05),
            reason: product.adminRecommendationReason || '관리자 추천 상품',
            algorithm: 'admin_recommended',
            product: product
          })),
          ...popularProducts.map((product, index) => ({
            itemId: product._id.toString(),
            itemType: 'product',
            score: 0.7 - (index * 0.05),
            reason: '인기 상품',
            algorithm: 'popular',
            product: product
          }))
        ];
      } else {
        // 활동 이력이 있는 사용자: 개인화된 추천
        recommendations = await this.generateRecommendations(profile, itemType, limit, context, algorithms);
      }

      // 개인화된 콘텐츠 설정
      const content = this.generatePersonalizedContent(profile);

      // 개인화된 가격
      const pricing = this.generatePersonalizedPricing(profile);

      // 개인화된 마케팅
      const marketing = this.generatePersonalizedMarketing(profile);

      // 인사이트 생성
      const insights = await this.generatePersonalizationInsights(profile);

      return {
        userId,
        recommendations: recommendations.slice(0, limit),
        content,
        pricing,
        marketing,
        insights
      };

    } catch (error) {
      console.error('Personalized recommendations generation error:', error);
      throw error;
    }
  }

  // 추천 생성
  private static async generateRecommendations(
    profile: any,
    itemType: string,
    limit: number,
    context: any,
    algorithms: string[]
  ): Promise<any[]> {
    const recommendations: any[] = [];

    // 협업 필터링
    if (algorithms.includes('collaborative')) {
      const collaborativeRecs = await this.generateCollaborativeRecommendations(profile, itemType, limit);
      recommendations.push(...collaborativeRecs);
    }

    // 콘텐츠 기반 필터링
    if (algorithms.includes('content_based')) {
      const contentBasedRecs = await this.generateContentBasedRecommendations(profile, itemType, limit);
      recommendations.push(...contentBasedRecs);
    }

    // 인기 상품
    if (algorithms.includes('popular')) {
      const popularRecs = await this.generatePopularRecommendations(itemType, limit);
      recommendations.push(...popularRecs);
    }

    // 트렌딩 상품
    if (algorithms.includes('trending')) {
      const trendingRecs = await this.generateTrendingRecommendations(itemType, limit);
      recommendations.push(...trendingRecs);
    }

    // 추천 결과 정렬 및 중복 제거
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    return uniqueRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // 협업 필터링 추천
  private static async generateCollaborativeRecommendations(profile: any, itemType: string, limit: number): Promise<any[]> {
    // 유사한 사용자 찾기
    const similarUsers = await this.findSimilarUsers(profile);
    
    // 유사한 사용자들이 구매한 상품 중 현재 사용자가 구매하지 않은 상품 추천
    const recommendations: any[] = [];
    
    for (const similarUser of similarUsers) {
      await connectDB(); // MongoDB 연결 확인
      const similarProfile = await UserProfile.findOne({ userId: similarUser.userId });
      if (similarProfile) {
        // 이메일 형태의 userId를 ObjectId로 변환
        const similarUserObj = await User.findOne({ email: similarUser.userId });
        if (!similarUserObj) continue;
        
        const userOrders = await Order.find({
          userId: similarUserObj._id,
          status: { $in: ['completed', 'delivered'] }
        });

        for (const order of userOrders) {
          for (const item of order.items) {
            // 현재 사용자가 구매하지 않은 상품인지 확인
            const currentUserObj = await User.findOne({ email: profile.userId });
            if (!currentUserObj) continue;
            
            const hasPurchased = await Order.exists({
              userId: currentUserObj._id,
              'items.productId': item.productId,
              status: { $in: ['completed', 'delivered'] }
            });

            if (!hasPurchased) {
              recommendations.push({
                itemId: item.productId,
                itemType: 'product',
                score: similarUser.similarity * 0.8,
                reason: `유사한 사용자가 구매한 상품`,
                algorithm: 'collaborative'
              });
            }
          }
        }
      }
    }

    return recommendations;
  }

  // 콘텐츠 기반 추천
  private static async generateContentBasedRecommendations(profile: any, itemType: string, limit: number): Promise<any[]> {
    const recommendations: any[] = [];
    
    // 선호하는 카테고리 기반 추천
    for (const category of profile.preferences.productCategories.slice(0, 3)) {
      // 해당 카테고리의 상품 조회
      const categoryProducts = await this.getProductsByCategory(category.category);
      
      for (const product of categoryProducts.slice(0, 5)) {
        recommendations.push({
          itemId: product._id.toString(),
          itemType: 'product',
          score: category.preferenceScore * 0.9,
          reason: `선호하는 ${category.category} 카테고리 상품`,
          algorithm: 'content_based',
          product: product
        });
      }
    }

    // 선호하는 브랜드 기반 추천
    for (const brand of profile.preferences.brands.slice(0, 2)) {
      const brandProducts = await this.getProductsByBrand(brand.brand);
      
      for (const product of brandProducts.slice(0, 3)) {
        recommendations.push({
          itemId: product._id.toString(),
          itemType: 'product',
          score: brand.preferenceScore * 0.8,
          reason: `선호하는 ${brand.brand} 브랜드 상품`,
          algorithm: 'content_based',
          product: product
        });
      }
    }

    return recommendations;
  }

  // 인기 상품 추천
  private static async generatePopularRecommendations(itemType: string, limit: number): Promise<any[]> {
    const popularProducts = await this.getPopularProducts(limit);
    
    return popularProducts.map((product, index) => ({
      itemId: product._id.toString(),
      itemType: 'product',
      score: 0.7 - (index * 0.05), // 순위에 따라 점수 감소
      reason: '인기 상품',
      algorithm: 'popular',
      product: product
    }));
  }

  // 트렌딩 상품 추천
  private static async generateTrendingRecommendations(itemType: string, limit: number): Promise<any[]> {
    const trendingProducts = await this.getTrendingProducts(limit);
    
    return trendingProducts.map((product, index) => ({
      itemId: product._id.toString(),
      itemType: 'product',
      score: 0.8 - (index * 0.05),
      reason: '지금 뜨는 상품',
      algorithm: 'trending',
      product: product
    }));
  }

  // 기본 추천 (익명 사용자용)
  private static async generateDefaultRecommendations(itemType: string, limit: number): Promise<any> {
    try {
      // 관리자가 추천한 상품 조회
      const adminRecommendedProducts = await this.getAdminRecommendedProducts(limit);
      
      const recommendations = adminRecommendedProducts.map((product, index) => ({
        itemId: product._id.toString(),
        itemType: 'product',
        score: 0.9 - (index * 0.05), // 관리자 추천은 높은 점수
        reason: product.adminRecommendationReason || '관리자 추천 상품',
        algorithm: 'admin_recommended',
        product: product // 실제 상품 정보 포함
      }));

      return {
        recommendations,
        content: {
          layout: 'grid',
          theme: 'light',
          language: 'ko',
          fontSize: 'medium',
          showRecommendations: true,
          showReviews: true
        },
        pricing: {
          discountRate: 0,
          personalizedPricing: false,
          priceRange: { min: 0, max: 1000000 }
        },
        marketing: {
          personalizedOffers: [],
          recommendedPromotions: [],
          crossSellItems: []
        },
        metadata: {
          generatedAt: new Date(),
          algorithm: 'admin_recommended',
          confidence: 0.9,
          fallback: true
        }
      };
    } catch (error) {
      console.error('Admin recommendations error:', error);
      return {
        recommendations: [],
        content: {
          layout: 'grid',
          theme: 'light',
          language: 'ko',
          fontSize: 'medium',
          showRecommendations: true,
          showReviews: true
        },
        pricing: {
          discountRate: 0,
          personalizedPricing: false,
          priceRange: { min: 0, max: 1000000 }
        },
        marketing: {
          personalizedOffers: [],
          recommendedPromotions: [],
          crossSellItems: []
        },
        metadata: {
          generatedAt: new Date(),
          algorithm: 'default',
          confidence: 0.5,
          fallback: true
        }
      };
    }
  }

  // 개인화된 콘텐츠 생성
  private static generatePersonalizedContent(profile: any): any {
    // profile이 null이거나 preferences가 없는 경우 기본값 반환
    if (!profile || !profile.preferences) {
      return {
        layout: 'grid',
        theme: 'light',
        language: 'ko',
        fontSize: 'medium',
        showRecommendations: true,
        showReviews: true
      };
    }
    
    const uiPrefs = profile.preferences.uiPreferences || {};
    
    return {
      layout: uiPrefs.layout,
      theme: uiPrefs.theme,
      language: uiPrefs.language,
      fontSize: uiPrefs.fontSize,
      showRecommendations: uiPrefs.showRecommendations,
      showReviews: uiPrefs.showReviews,
      showPriceHistory: uiPrefs.showPriceHistory
    };
  }

  // 개인화된 가격 생성
  private static generatePersonalizedPricing(profile: any): any {
    const discounts: any[] = [];
    
    // VIP 고객 할인
    if (profile.preferences.purchasePatterns.frequency > 2) {
      discounts.push({
        type: 'percentage',
        value: 10,
        reason: 'VIP 고객 할인'
      });
    }

    // 충성 고객 할인
    if (profile.personalizationScore.overall > 0.8) {
      discounts.push({
        type: 'percentage',
        value: 5,
        reason: '충성 고객 할인'
      });
    }

    return {
      discounts,
      personalizedPrice: undefined // 동적 가격은 별도 구현
    };
  }

  // 개인화된 마케팅 생성
  private static generatePersonalizedMarketing(profile: any): any {
    const campaigns: any[] = [];
    const notifications: any[] = [];

    // 구매 패턴 기반 캠페인
    if (profile.preferences.purchasePatterns.frequency > 1) {
      campaigns.push({
        campaignId: 'frequent_buyer',
        message: '정기 구매 고객을 위한 특별 혜택',
        channel: 'email',
        priority: 1
      });
    }

    // 선호 카테고리 기반 알림
    if (profile.preferences.productCategories.length > 0) {
      const topCategory = profile.preferences.productCategories[0];
      notifications.push({
        type: 'category_update',
        message: `${topCategory.category} 카테고리에 새로운 상품이 추가되었습니다`,
        timing: 'immediate'
      });
    }

    return {
      campaigns,
      notifications
    };
  }

  // 개인화 인사이트 생성
  private static async generatePersonalizationInsights(profile: any): Promise<any[]> {
    const insights: any[] = [];

    // 구매 패턴 인사이트
    if (profile.preferences.purchasePatterns.frequency > 2) {
      insights.push({
        type: 'behavior',
        message: '구매 빈도가 높은 활성 고객입니다. VIP 서비스를 고려해보세요.',
        confidence: 0.9,
        recommendations: [
          'VIP 전용 혜택 제공',
          '우선 고객 지원',
          '독점 상품 접근 권한'
        ]
      });
    }

    // 선호도 변화 인사이트
    const recentCategories = profile.preferences.productCategories      
      .filter((cat: any) => cat.lastUpdated > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    if (recentCategories.length > 0) {
      insights.push({
        type: 'preference',
        message: '최근 새로운 카테고리에 관심을 보이고 있습니다.',
        confidence: 0.7,
        recommendations: [
          '관련 상품 추천 강화',
          '카테고리별 맞춤 마케팅',
          '관심 상품 알림 설정'
        ]
      });
    }

    return insights;
  }

  // 사용자 활동 이력 확인
  private static async checkUserActivity(userId: string): Promise<boolean> {
    try {
      await connectDB();
      
      // 사용자 조회
      const user = await User.findOne({ email: userId });
      if (!user) return false;
      
      // 구매 이력 확인
      const orderCount = await Order.countDocuments({
        userId: user._id,
        status: { $in: ['completed', 'delivered'] }
      });
      
      // 행동 이력 확인
      const behaviorCount = await UserBehavior.countDocuments({
        userId: user._id
      });
      
      // 프로필 생성 후 7일 이상 경과 확인
      const profile = await UserProfile.findOne({ userId });
      if (profile) {
        const daysSinceProfile = (Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceProfile < 7) return false; // 프로필 생성 후 7일 미만이면 신규 사용자로 간주
      }
      
      // 구매 이력이 1개 이상이거나 행동 이력이 10개 이상이면 활동 있는 사용자
      return orderCount > 0 || behaviorCount >= 10;
      
    } catch (error) {
      console.error('User activity check error:', error);
      return false; // 오류 시 신규 사용자로 간주
    }
  }

  // 유틸리티 메서드들
  private static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private static async findSimilarUsers(profile: any): Promise<any[]> {
    // profile이 null이거나 userId가 없는 경우 빈 배열 반환
    if (!profile || !profile.userId) {
      return [];
    }
    
    // 실제로는 더 정교한 유사도 계산 알고리즘 사용
    const allProfiles = await UserProfile.find({ userId: { $ne: profile.userId } });
    
    return allProfiles.map(otherProfile => {
      const similarity = this.calculateUserSimilarity(profile, otherProfile);
      return {
        userId: otherProfile.userId,
        similarity
      };
    }).sort((a, b) => b.similarity - a.similarity).slice(0, 10);
  }

  private static calculateUserSimilarity(profile1: any, profile2: any): number {
    // 간단한 유사도 계산 (실제로는 더 정교한 알고리즘 사용)
    let similarity = 0;
    
    // 카테고리 선호도 유사도
    const categories1 = new Set(profile1.preferences.productCategories.map((c: any) => c.category));
    const categories2 = new Set(profile2.preferences.productCategories.map((c: any) => c.category));
    const categoryIntersection = new Set([...categories1].filter((c: any) => categories2.has(c)));
    const categoryUnion = new Set([...categories1, ...categories2]);
    const categorySimilarity = categoryUnion.size > 0 ? categoryIntersection.size / categoryUnion.size : 0;
    
    similarity += categorySimilarity * 0.4;
    
    // 가격 범위 유사도
    const price1 = profile1.preferences.priceRange.preferred;
    const price2 = profile2.preferences.priceRange.preferred;
    const priceSimilarity = 1 - Math.abs(price1 - price2) / Math.max(price1, price2);
    similarity += priceSimilarity * 0.3;
    
    // 구매 빈도 유사도
    const freq1 = profile1.preferences.purchasePatterns.frequency;
    const freq2 = profile2.preferences.purchasePatterns.frequency;
    const freqSimilarity = 1 - Math.abs(freq1 - freq2) / Math.max(freq1, freq2, 1);
    similarity += freqSimilarity * 0.3;
    
    return Math.min(1, similarity);
  }

  private static deduplicateRecommendations(recommendations: any[]): any[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const key = `${rec.itemId}_${rec.itemType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // 관리자 추천 상품 조회
  private static async getAdminRecommendedProducts(limit: number): Promise<any[]> {
    try {
      await connectDB();
      const Product = (await import('@/models/Product')).default;
      
      const products = await Product.find({
        featuredByAdmin: true,
        status: 'active',
        approvalStatus: 'approved'
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

      return products;
    } catch (error) {
      console.error('Admin recommended products fetch error:', error);
      return [];
    }
  }

  // 더미 데이터 메서드들 (실제로는 데이터베이스에서 조회)
  private static async getProductsByCategory(category: string): Promise<any[]> {
    try {
      await connectDB();
      const Product = (await import('@/models/Product')).default;
      
      const products = await Product.find({
        category: category,
        status: 'active',
        approvalStatus: 'approved'
      })
      .sort({ featured: -1, createdAt: -1 })
      .limit(10)
      .lean();

      return products;
    } catch (error) {
      console.error('Products by category fetch error:', error);
      return [];
    }
  }

  private static async getProductsByBrand(brand: string): Promise<any[]> {
    try {
      await connectDB();
      const Product = (await import('@/models/Product')).default;
      
      const products = await Product.find({
        partnerName: brand,
        status: 'active',
        approvalStatus: 'approved'
      })
      .sort({ featured: -1, createdAt: -1 })
      .limit(10)
      .lean();

      return products;
    } catch (error) {
      console.error('Products by brand fetch error:', error);
      return [];
    }
  }

  private static async getPopularProducts(limit: number): Promise<any[]> {
    try {
      await connectDB();
      const Product = (await import('@/models/Product')).default;
      
      const products = await Product.find({
        status: 'active',
        approvalStatus: 'approved'
      })
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit)
      .lean();

      return products;
    } catch (error) {
      console.error('Popular products fetch error:', error);
      return [];
    }
  }

  private static async getTrendingProducts(limit: number): Promise<any[]> {
    try {
      await connectDB();
      const Product = (await import('@/models/Product')).default;
      
      // 최근 7일 내에 생성된 상품 중 인기 상품
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const products = await Product.find({
        status: 'active',
        approvalStatus: 'approved',
        createdAt: { $gte: sevenDaysAgo }
      })
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit)
      .lean();

      return products;
    } catch (error) {
      console.error('Trending products fetch error:', error);
      return [];
    }
  }
}
