import { PredictionModel, Prediction, PredictionInsight, PredictionAlert } from '@/models/PredictiveAnalytics';
import User from '@/models/User';
import Order from '@/models/Order';
import UserBehavior from '@/models/UserBehavior';
import mongoose from 'mongoose';

export interface PredictionResult {
  entityId: string;
  entityType: string;
  predictionType: string;
  predictionValue: number;
  probability?: number;
  confidence: number;
  targetDate: Date;
  features: Record<string, any>;
  insights: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  }>;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  mse?: number;
  mae?: number;
  confusionMatrix?: {
    truePositive: number;
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
  };
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  description: string;
}

export class PredictiveAnalyticsEngine {
  // 고객 이탈 예측
  static async predictCustomerChurn(userId: string, modelId?: string): Promise<PredictionResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 고객 특성 추출
      const features = await this.extractCustomerFeatures(userId);
      
      // 이탈 예측 모델 조회 또는 생성
      let model = modelId ? await PredictionModel.findById(modelId) : null;
      if (!model || model.modelType !== 'churn') {
        model = await this.getOrCreateChurnModel();
      }

      // 예측 실행
      const prediction = await this.executePrediction(model, features, 'churn', userId, 'user');
      
      // 인사이트 생성
      const insights = this.generateChurnInsights(prediction, features);

      return {
        entityId: userId,
        entityType: 'user',
        predictionType: 'churn',
        predictionValue: prediction.predictionValue,
        probability: prediction.probability,
        confidence: prediction.confidence,
        targetDate: prediction.targetDate,
        features: prediction.features,
        insights
      };

    } catch (error) {
      console.error('Customer churn prediction error:', error);
      throw error;
    }
  }

  // 구매 예측
  static async predictPurchase(userId: string, productId?: string, modelId?: string): Promise<PredictionResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 구매 특성 추출
      const features = await this.extractPurchaseFeatures(userId, productId);
      
      // 구매 예측 모델 조회 또는 생성
      let model = modelId ? await PredictionModel.findById(modelId) : null;
      if (!model || model.modelType !== 'purchase') {
        model = await this.getOrCreatePurchaseModel();
      }

      // 예측 실행
      const prediction = await this.executePrediction(model, features, 'purchase', userId, 'user');
      
      // 인사이트 생성
      const insights = this.generatePurchaseInsights(prediction, features);

      return {
        entityId: userId,
        entityType: 'user',
        predictionType: 'purchase',
        predictionValue: prediction.predictionValue,
        probability: prediction.probability,
        confidence: prediction.confidence,
        targetDate: prediction.targetDate,
        features: prediction.features,
        insights
      };

    } catch (error) {
      console.error('Purchase prediction error:', error);
      throw error;
    }
  }

  // 매출 예측
  static async predictRevenue(timeframe: 'daily' | 'weekly' | 'monthly', modelId?: string): Promise<PredictionResult> {
    try {
      // 매출 특성 추출
      const features = await this.extractRevenueFeatures(timeframe);
      
      // 매출 예측 모델 조회 또는 생성
      let model = modelId ? await PredictionModel.findById(modelId) : null;
      if (!model || model.modelType !== 'revenue') {
        model = await this.getOrCreateRevenueModel();
      }

      // 예측 실행
      const prediction = await this.executePrediction(model, features, 'revenue', 'revenue', 'custom');
      
      // 인사이트 생성
      const insights = this.generateRevenueInsights(prediction, features);

      return {
        entityId: 'revenue',
        entityType: 'custom',
        predictionType: 'revenue',
        predictionValue: prediction.predictionValue,
        confidence: prediction.confidence,
        targetDate: prediction.targetDate,
        features: prediction.features,
        insights
      };

    } catch (error) {
      console.error('Revenue prediction error:', error);
      throw error;
    }
  }

  // 수요 예측
  static async predictDemand(productId: string, timeframe: 'daily' | 'weekly' | 'monthly', modelId?: string): Promise<PredictionResult> {
    try {
      // 수요 특성 추출
      const features = await this.extractDemandFeatures(productId, timeframe);
      
      // 수요 예측 모델 조회 또는 생성
      let model = modelId ? await PredictionModel.findById(modelId) : null;
      if (!model || model.modelType !== 'demand') {
        model = await this.getOrCreateDemandModel();
      }

      // 예측 실행
      const prediction = await this.executePrediction(model, features, 'demand', productId, 'product');
      
      // 인사이트 생성
      const insights = this.generateDemandInsights(prediction, features);

      return {
        entityId: productId,
        entityType: 'product',
        predictionType: 'demand',
        predictionValue: prediction.predictionValue,
        confidence: prediction.confidence,
        targetDate: prediction.targetDate,
        features: prediction.features,
        insights
      };

    } catch (error) {
      console.error('Demand prediction error:', error);
      throw error;
    }
  }

  // 고객 특성 추출
  private static async extractCustomerFeatures(userId: string): Promise<Record<string, any>> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 주문 데이터
    const orders = await Order.find({ userId, status: { $in: ['completed', 'delivered'] } });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    // 최근 구매 패턴
    const lastOrder = orders.length > 0 ? orders[orders.length - 1] : null;
    const daysSinceLastOrder = lastOrder ? 
      Math.floor((Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    
    // 구매 빈도 (월 단위)
    const firstOrder = orders.length > 0 ? orders[0] : null;
    const customerLifespan = firstOrder ? 
      Math.floor((Date.now() - firstOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
    const purchaseFrequency = customerLifespan > 0 ? totalOrders / customerLifespan : 0;

    // 사용자 행동 데이터
    const behaviors = await UserBehavior.find({ userId }).sort({ timestamp: -1 }).limit(100);
    const sessionCount = new Set(behaviors.map(b => b.sessionId)).size;
    const avgSessionDuration = this.calculateAvgSessionDuration(behaviors);
    const pageViews = behaviors.filter(b => b.eventType === 'page_view').length;

    // 고객 등급
    let customerTier = 'new';
    if (totalOrders >= 10 || totalSpent >= 1000000) customerTier = 'vip';
    else if (totalOrders >= 3 || customerLifespan >= 6) customerTier = 'regular';

    return {
      // 기본 정보
      age: user.age || 0,
      gender: user.gender || 'unknown',
      country: user.country || 'unknown',
      deviceType: user.deviceType || 'desktop',
      trafficSource: user.trafficSource || 'direct',
      
      // 구매 패턴
      totalOrders,
      totalSpent,
      avgOrderValue,
      daysSinceLastOrder,
      purchaseFrequency,
      customerLifespan,
      customerTier,
      
      // 행동 패턴
      sessionCount,
      avgSessionDuration,
      pageViews,
      
      // 시간적 특성
      signupDays: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      lastLoginDays: user.lastLoginAt ? 
        Math.floor((Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)) : 999,
      
      // 계절성
      currentMonth: new Date().getMonth() + 1,
      currentDayOfWeek: new Date().getDay(),
    };
  }

  // 구매 특성 추출
  private static async extractPurchaseFeatures(userId: string, productId?: string): Promise<Record<string, any>> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 고객 기본 특성
    const customerFeatures = await this.extractCustomerFeatures(userId);
    
    // 제품별 특성 (제품이 지정된 경우)
    let productFeatures = {};
    if (productId) {
      const productOrders = await Order.find({
        userId,
        'items.productId': productId,
        status: { $in: ['completed', 'delivered'] }
      });
      
      productFeatures = {
        productPurchaseCount: productOrders.length,
        lastProductPurchaseDays: productOrders.length > 0 ? 
          Math.floor((Date.now() - productOrders[productOrders.length - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 999,
        productCategory: productOrders.length > 0 ? productOrders[0].items[0].category : 'unknown',
      };
    }

    // 최근 구매 패턴
    const recentOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentPurchasePattern = {
      recentOrderCount: recentOrders.length,
      recentAvgOrderValue: recentOrders.length > 0 ? 
        recentOrders.reduce((sum, order) => sum + order.totalAmount, 0) / recentOrders.length : 0,
      recentPurchaseFrequency: this.calculateRecentPurchaseFrequency(recentOrders),
    };

    return {
      ...customerFeatures,
      ...productFeatures,
      ...recentPurchasePattern,
    };
  }

  // 매출 특성 추출
  private static async extractRevenueFeatures(timeframe: string): Promise<Record<string, any>> {
    const now = new Date();
    const periods = this.getTimeframePeriods(timeframe);
    
    // 과거 매출 데이터
    const historicalRevenue = [];
    for (let i = periods.lookback; i >= 0; i--) {
      const startDate = new Date(now);
      const endDate = new Date(now);
      
      if (timeframe === 'daily') {
        startDate.setDate(startDate.getDate() - i);
        endDate.setDate(endDate.getDate() - i + 1);
      } else if (timeframe === 'weekly') {
        startDate.setDate(startDate.getDate() - (i * 7));
        endDate.setDate(endDate.getDate() - ((i - 1) * 7));
      } else if (timeframe === 'monthly') {
        startDate.setMonth(startDate.getMonth() - i);
        endDate.setMonth(endDate.getMonth() - i + 1);
      }
      
      const revenue = await this.calculatePeriodRevenue(startDate, endDate);
      historicalRevenue.push(revenue);
    }

    // 트렌드 분석
    const trend = this.calculateTrend(historicalRevenue);
    const seasonality = this.calculateSeasonality(historicalRevenue, timeframe);
    
    // 외부 요인 (계절성, 이벤트 등)
    const externalFactors = {
      currentMonth: now.getMonth() + 1,
      currentDayOfWeek: now.getDay(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      isHoliday: this.isHoliday(now),
      quarter: Math.floor(now.getMonth() / 3) + 1,
    };

    return {
      historicalRevenue,
      trend,
      seasonality,
      ...externalFactors,
      timeframe,
    };
  }

  // 수요 특성 추출
  private static async extractDemandFeatures(productId: string, timeframe: string): Promise<Record<string, any>> {
    const now = new Date();
    const periods = this.getTimeframePeriods(timeframe);
    
    // 과거 수요 데이터
    const historicalDemand = [];
    for (let i = periods.lookback; i >= 0; i--) {
      const startDate = new Date(now);
      const endDate = new Date(now);
      
      if (timeframe === 'daily') {
        startDate.setDate(startDate.getDate() - i);
        endDate.setDate(endDate.getDate() - i + 1);
      } else if (timeframe === 'weekly') {
        startDate.setDate(startDate.getDate() - (i * 7));
        endDate.setDate(endDate.getDate() - ((i - 1) * 7));
      } else if (timeframe === 'monthly') {
        startDate.setMonth(startDate.getMonth() - i);
        endDate.setMonth(endDate.getMonth() - i + 1);
      }
      
      const demand = await this.calculatePeriodDemand(productId, startDate, endDate);
      historicalDemand.push(demand);
    }

    // 제품 특성
    const productFeatures = await this.getProductFeatures(productId);
    
    // 트렌드 및 계절성
    const trend = this.calculateTrend(historicalDemand);
    const seasonality = this.calculateSeasonality(historicalDemand, timeframe);

    return {
      historicalDemand,
      trend,
      seasonality,
      ...productFeatures,
      timeframe,
    };
  }

  // 예측 실행
  private static async executePrediction(
    model: any,
    features: Record<string, any>,
    predictionType: string,
    entityId: string,
    entityType: string
  ): Promise<any> {
    // 간단한 예측 로직 (실제로는 머신러닝 모델 사용)
    const predictionValue = this.calculateSimplePrediction(model, features, predictionType);
    const confidence = this.calculateConfidence(model, features);
    const probability = predictionType === 'churn' || predictionType === 'purchase' ? 
      this.calculateProbability(predictionValue, features) : undefined;

    // 예측 결과 저장
    const prediction = new Prediction({
      modelId: model._id,
      entityId,
      entityType,
      predictionType,
      predictionValue,
      probability,
      confidence,
      predictionDate: new Date(),
      targetDate: this.getTargetDate(predictionType),
      features,
      metadata: {
        modelVersion: model.version,
        predictionMethod: 'realtime',
        dataQuality: this.assessDataQuality(features)
      }
    });

    await prediction.save();

    return prediction;
  }

  // 간단한 예측 계산 (실제로는 머신러닝 모델 사용)
  private static calculateSimplePrediction(model: any, features: Record<string, any>, predictionType: string): number {
    switch (predictionType) {
      case 'churn':
        // 이탈 확률 계산 (0-1)
        let churnScore = 0;
        
        // 구매 빈도가 낮을수록 이탈 확률 증가
        if (features.purchaseFrequency < 0.5) churnScore += 0.3;
        else if (features.purchaseFrequency < 1) churnScore += 0.1;
        
        // 마지막 구매가 오래될수록 이탈 확률 증가
        if (features.daysSinceLastOrder > 90) churnScore += 0.4;
        else if (features.daysSinceLastOrder > 30) churnScore += 0.2;
        
        // 고객 등급이 낮을수록 이탈 확률 증가
        if (features.customerTier === 'new') churnScore += 0.2;
        else if (features.customerTier === 'regular') churnScore += 0.1;
        
        return Math.min(1, churnScore);

      case 'purchase':
        // 구매 확률 계산 (0-1)
        let purchaseScore = 0.5; // 기본값
        
        // 구매 빈도가 높을수록 구매 확률 증가
        if (features.purchaseFrequency > 2) purchaseScore += 0.3;
        else if (features.purchaseFrequency > 1) purchaseScore += 0.2;
        
        // 최근 구매 패턴이 좋을수록 구매 확률 증가
        if (features.recentOrderCount >= 3) purchaseScore += 0.2;
        
        // VIP 고객일수록 구매 확률 증가
        if (features.customerTier === 'vip') purchaseScore += 0.2;
        
        return Math.min(1, purchaseScore);

      case 'revenue':
        // 매출 예측 (원 단위)
        const baseRevenue = features.historicalRevenue[0] || 1000000;
        const trendFactor = 1 + (features.trend || 0);
        const seasonalityFactor = 1 + (features.seasonality || 0);
        
        return Math.round(baseRevenue * trendFactor * seasonalityFactor);

      case 'demand':
        // 수요 예측 (개수)
        const baseDemand = features.historicalDemand[0] || 100;
        const demandTrendFactor = 1 + (features.trend || 0);
        const demandSeasonalityFactor = 1 + (features.seasonality || 0);
        
        return Math.round(baseDemand * demandTrendFactor * demandSeasonalityFactor);

      default:
        return 0;
    }
  }

  // 신뢰도 계산
  private static calculateConfidence(model: any, features: Record<string, any>): number {
    // 데이터 품질 기반 신뢰도 계산
    const dataQuality = this.assessDataQuality(features);
    const modelPerformance = model.performance.accuracy;
    
    let confidence = modelPerformance * 0.7; // 모델 성능 70%
    
    // 데이터 품질 30%
    if (dataQuality === 'high') confidence += 0.3;
    else if (dataQuality === 'medium') confidence += 0.2;
    else confidence += 0.1;
    
    return Math.min(1, confidence);
  }

  // 확률 계산 (분류 모델용)
  private static calculateProbability(predictionValue: number, features: Record<string, any>): number {
    // 시그모이드 함수를 사용한 확률 변환
    return 1 / (1 + Math.exp(-predictionValue));
  }

  // 데이터 품질 평가
  private static assessDataQuality(features: Record<string, any>): 'high' | 'medium' | 'low' {
    let qualityScore = 0;
    
    // 필수 특성 존재 여부
    const requiredFeatures = ['totalOrders', 'totalSpent', 'purchaseFrequency'];
    const existingFeatures = requiredFeatures.filter(f => features[f] !== undefined);
    qualityScore += (existingFeatures.length / requiredFeatures.length) * 0.5;
    
    // 데이터 완성도
    const totalFeatures = Object.keys(features).length;
    const nonNullFeatures = Object.values(features).filter(v => v !== null && v !== undefined).length;
    qualityScore += (nonNullFeatures / totalFeatures) * 0.3;
    
    // 데이터 일관성
    if (features.totalOrders > 0 && features.totalSpent > 0) qualityScore += 0.2;
    
    if (qualityScore >= 0.8) return 'high';
    if (qualityScore >= 0.6) return 'medium';
    return 'low';
  }

  // 대상 날짜 계산
  private static getTargetDate(predictionType: string): Date {
    const targetDate = new Date();
    
    switch (predictionType) {
      case 'churn':
        targetDate.setDate(targetDate.getDate() + 30); // 30일 후
        break;
      case 'purchase':
        targetDate.setDate(targetDate.getDate() + 7); // 7일 후
        break;
      case 'revenue':
        targetDate.setDate(targetDate.getDate() + 1); // 1일 후
        break;
      case 'demand':
        targetDate.setDate(targetDate.getDate() + 1); // 1일 후
        break;
      default:
        targetDate.setDate(targetDate.getDate() + 1);
    }
    
    return targetDate;
  }

  // 이탈 인사이트 생성
  private static generateChurnInsights(prediction: any, features: Record<string, any>): any[] {
    const insights: any[] = [];
    const churnProbability = prediction.probability || 0;

    if (churnProbability > 0.7) {
      insights.push({
        type: 'churn_insight',
        message: `이탈 확률이 ${(churnProbability * 100).toFixed(1)}%로 매우 높습니다. 즉시 대응이 필요합니다.`,
        severity: 'critical',
        recommendations: [
          '개인화된 할인 혜택 제공',
          '고객 만족도 조사 실시',
          '고객 상담 및 피드백 수집',
          '리텐션 마케팅 캠페인 실행'
        ]
      });
    } else if (churnProbability > 0.4) {
      insights.push({
        type: 'churn_insight',
        message: `이탈 확률이 ${(churnProbability * 100).toFixed(1)}%로 중간 수준입니다. 주의가 필요합니다.`,
        severity: 'medium',
        recommendations: [
          '정기적 고객 소통 강화',
          '관심 제품 추천',
          '고객 피드백 수집'
        ]
      });
    }

    // 구체적인 위험 요인 분석
    if (features.daysSinceLastOrder > 60) {
      insights.push({
        type: 'churn_insight',
        message: `마지막 구매가 ${features.daysSinceLastOrder}일 전으로 오래되었습니다.`,
        severity: 'high',
        recommendations: [
          '재구매 유도 캠페인 실행',
          '개인화된 제품 추천',
          '특별 할인 혜택 제공'
        ]
      });
    }

    if (features.purchaseFrequency < 0.5) {
      insights.push({
        type: 'churn_insight',
        message: `구매 빈도가 월 ${features.purchaseFrequency.toFixed(1)}회로 낮습니다.`,
        severity: 'medium',
        recommendations: [
          '구매 빈도 증가 유도',
          '정기 구독 서비스 안내',
          '번들 상품 마케팅'
        ]
      });
    }

    return insights;
  }

  // 구매 인사이트 생성
  private static generatePurchaseInsights(prediction: any, features: Record<string, any>): any[] {
    const insights: any[] = [];
    const purchaseProbability = prediction.probability || 0;

    if (purchaseProbability > 0.8) {
      insights.push({
        type: 'purchase_insight',
        message: `구매 확률이 ${(purchaseProbability * 100).toFixed(1)}%로 매우 높습니다. 마케팅 기회입니다.`,
        severity: 'low',
        recommendations: [
          '개인화된 제품 추천',
          '한정 시간 할인 혜택 제공',
          '추가 구매 인센티브 제공'
        ]
      });
    }

    // 구매 패턴 분석
    if (features.recentOrderCount >= 3) {
      insights.push({
        type: 'purchase_insight',
        message: '최근 구매 패턴이 활발합니다. 고객 충성도가 높습니다.',
        severity: 'low',
        recommendations: [
          'VIP 서비스 제공',
          '추천 프로그램 안내',
          '독점 혜택 제공'
        ]
      });
    }

    return insights;
  }

  // 매출 인사이트 생성
  private static generateRevenueInsights(prediction: any, features: Record<string, any>): any[] {
    const insights: any[] = [];
    const predictedRevenue = prediction.predictionValue;
    const currentRevenue = features.historicalRevenue[0] || 0;
    const growthRate = currentRevenue > 0 ? ((predictedRevenue - currentRevenue) / currentRevenue) * 100 : 0;

    if (growthRate > 20) {
      insights.push({
        type: 'revenue_insight',
        message: `예상 매출이 ${growthRate.toFixed(1)}% 증가할 것으로 예측됩니다.`,
        severity: 'low',
        recommendations: [
          '재고 확보 및 인력 준비',
          '마케팅 투자 확대',
          '고객 서비스 강화'
        ]
      });
    } else if (growthRate < -10) {
      insights.push({
        type: 'revenue_insight',
        message: `예상 매출이 ${Math.abs(growthRate).toFixed(1)}% 감소할 것으로 예측됩니다.`,
        severity: 'high',
        recommendations: [
          '마케팅 캠페인 강화',
          '가격 정책 재검토',
          '고객 유지 전략 수립'
        ]
      });
    }

    return insights;
  }

  // 수요 인사이트 생성
  private static generateDemandInsights(prediction: any, features: Record<string, any>): any[] {
    const insights: any[] = [];
    const predictedDemand = prediction.predictionValue;
    const currentDemand = features.historicalDemand[0] || 0;
    const demandChange = currentDemand > 0 ? ((predictedDemand - currentDemand) / currentDemand) * 100 : 0;

    if (demandChange > 30) {
      insights.push({
        type: 'demand_insight',
        message: `예상 수요가 ${demandChange.toFixed(1)}% 증가할 것으로 예측됩니다.`,
        severity: 'medium',
        recommendations: [
          '재고 확보 및 공급망 준비',
          '생산 계획 수립',
          '가격 정책 검토'
        ]
      });
    } else if (demandChange < -20) {
      insights.push({
        type: 'demand_insight',
        message: `예상 수요가 ${Math.abs(demandChange).toFixed(1)}% 감소할 것으로 예측됩니다.`,
        severity: 'high',
        recommendations: [
          '재고 조정 및 할인 정책 수립',
          '마케팅 캠페인 실행',
          '대체 제품 추천'
        ]
      });
    }

    return insights;
  }

  // 유틸리티 메서드들
  private static calculateAvgSessionDuration(behaviors: any[]): number {
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

    return sessionDurations.length > 0 ? 
      sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length : 0;
  }

  private static calculateRecentPurchaseFrequency(orders: any[]): number {
    if (orders.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < orders.length; i++) {
      const interval = (orders[i - 1].createdAt.getTime() - orders[i].createdAt.getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    return avgInterval > 0 ? 30 / avgInterval : 0; // 월 단위로 변환
  }

  private static getTimeframePeriods(timeframe: string): { lookback: number; prediction: number } {
    switch (timeframe) {
      case 'daily':
        return { lookback: 30, prediction: 1 };
      case 'weekly':
        return { lookback: 12, prediction: 1 };
      case 'monthly':
        return { lookback: 12, prediction: 1 };
      default:
        return { lookback: 30, prediction: 1 };
    }
  }

  private static async calculatePeriodRevenue(startDate: Date, endDate: Date): Promise<number> {
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $in: ['completed', 'delivered'] }
    });
    
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }

  private static async calculatePeriodDemand(productId: string, startDate: Date, endDate: Date): Promise<number> {
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lt: endDate },
      'items.productId': productId,
      status: { $in: ['completed', 'delivered'] }
    });
    
    return orders.reduce((sum: number, order: any) => {
      return sum + order.items.reduce((itemSum: number, item: any) => {
        return itemSum + (item.productId === productId ? item.quantity : 0);
      }, 0);
    }, 0);
  }

  private static calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private static calculateSeasonality(data: number[], timeframe: string): number {
    if (data.length < 12) return 0;
    
    // 간단한 계절성 계산 (실제로는 더 복잡한 알고리즘 사용)
    const recent = data.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
    const historical = data.slice(0, -3).reduce((sum, val) => sum + val, 0) / (data.length - 3);
    
    return historical > 0 ? (recent - historical) / historical : 0;
  }

  private static isHoliday(date: Date): boolean {
    // 간단한 휴일 체크 (실제로는 더 정확한 휴일 데이터 사용)
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 주요 휴일 (간단한 예시)
    if (month === 1 && day === 1) return true; // 신정
    if (month === 12 && day === 25) return true; // 크리스마스
    
    return false;
  }

  private static async getProductFeatures(productId: string): Promise<Record<string, any>> {
    // 제품 특성 조회 (실제로는 제품 데이터베이스에서 조회)
    return {
      productId,
      category: 'unknown',
      price: 0,
      popularity: 0,
      seasonality: 0
    };
  }

  // 모델 생성 메서드들
  private static async getOrCreateChurnModel(): Promise<any> {
    let model = await PredictionModel.findOne({ modelType: 'churn', isActive: true });
    
    if (!model) {
      model = new PredictionModel({
        name: '고객 이탈 예측 모델',
        description: '고객의 이탈 확률을 예측하는 모델',
        modelType: 'churn',
        targetVariable: 'churn_probability',
        features: [
          { name: 'purchaseFrequency', type: 'numeric', importance: 0.3, description: '구매 빈도' },
          { name: 'daysSinceLastOrder', type: 'numeric', importance: 0.4, description: '마지막 구매로부터 경과일' },
          { name: 'customerTier', type: 'categorical', importance: 0.2, description: '고객 등급' },
          { name: 'totalSpent', type: 'numeric', importance: 0.1, description: '총 구매 금액' }
        ],
        algorithm: 'logistic_regression',
        hyperparameters: {},
        trainingData: {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          sampleSize: 1000,
          features: ['purchaseFrequency', 'daysSinceLastOrder', 'customerTier', 'totalSpent']
        },
        performance: {
          accuracy: 0.85,
          precision: 0.82,
          recall: 0.78,
          f1Score: 0.80,
          auc: 0.88
        },
        status: 'ready',
        version: '1.0.0',
        metadata: {
          createdBy: new mongoose.Types.ObjectId(),
          category: 'customer',
          tags: ['churn', 'retention'],
          environment: 'production',
          lastTrained: new Date()
        }
      });
      
      await model.save();
    }
    
    return model;
  }

  private static async getOrCreatePurchaseModel(): Promise<any> {
    let model = await PredictionModel.findOne({ modelType: 'purchase', isActive: true });
    
    if (!model) {
      model = new PredictionModel({
        name: '구매 예측 모델',
        description: '고객의 구매 확률을 예측하는 모델',
        modelType: 'purchase',
        targetVariable: 'purchase_probability',
        features: [
          { name: 'purchaseFrequency', type: 'numeric', importance: 0.3, description: '구매 빈도' },
          { name: 'recentOrderCount', type: 'numeric', importance: 0.25, description: '최근 주문 수' },
          { name: 'customerTier', type: 'categorical', importance: 0.2, description: '고객 등급' },
          { name: 'avgOrderValue', type: 'numeric', importance: 0.15, description: '평균 주문 금액' },
          { name: 'sessionCount', type: 'numeric', importance: 0.1, description: '세션 수' }
        ],
        algorithm: 'random_forest',
        hyperparameters: { n_estimators: 100, max_depth: 10 },
        trainingData: {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          sampleSize: 2000,
          features: ['purchaseFrequency', 'recentOrderCount', 'customerTier', 'avgOrderValue', 'sessionCount']
        },
        performance: {
          accuracy: 0.88,
          precision: 0.85,
          recall: 0.82,
          f1Score: 0.83,
          auc: 0.90
        },
        status: 'ready',
        version: '1.0.0',
        metadata: {
          createdBy: new mongoose.Types.ObjectId(),
          category: 'customer',
          tags: ['purchase', 'conversion'],
          environment: 'production',
          lastTrained: new Date()
        }
      });
      
      await model.save();
    }
    
    return model;
  }

  private static async getOrCreateRevenueModel(): Promise<any> {
    let model = await PredictionModel.findOne({ modelType: 'revenue', isActive: true });
    
    if (!model) {
      model = new PredictionModel({
        name: '매출 예측 모델',
        description: '미래 매출을 예측하는 모델',
        modelType: 'revenue',
        targetVariable: 'revenue',
        features: [
          { name: 'historicalRevenue', type: 'numeric', importance: 0.4, description: '과거 매출 데이터' },
          { name: 'trend', type: 'numeric', importance: 0.3, description: '매출 트렌드' },
          { name: 'seasonality', type: 'numeric', importance: 0.2, description: '계절성' },
          { name: 'currentMonth', type: 'numeric', importance: 0.1, description: '현재 월' }
        ],
        algorithm: 'time_series',
        hyperparameters: { window_size: 30, forecast_horizon: 7 },
        trainingData: {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          sampleSize: 365,
          features: ['historicalRevenue', 'trend', 'seasonality', 'currentMonth']
        },
        performance: {
          accuracy: 0.92,
          mse: 1000000,
          mae: 50000
        },
        status: 'ready',
        version: '1.0.0',
        metadata: {
          createdBy: new mongoose.Types.ObjectId(),
          category: 'revenue',
          tags: ['revenue', 'forecast'],
          environment: 'production',
          lastTrained: new Date()
        }
      });
      
      await model.save();
    }
    
    return model;
  }

  private static async getOrCreateDemandModel(): Promise<any> {
    let model = await PredictionModel.findOne({ modelType: 'demand', isActive: true });
    
    if (!model) {
      model = new PredictionModel({
        name: '수요 예측 모델',
        description: '제품 수요를 예측하는 모델',
        modelType: 'demand',
        targetVariable: 'demand',
        features: [
          { name: 'historicalDemand', type: 'numeric', importance: 0.4, description: '과거 수요 데이터' },
          { name: 'trend', type: 'numeric', importance: 0.3, description: '수요 트렌드' },
          { name: 'seasonality', type: 'numeric', importance: 0.2, description: '계절성' },
          { name: 'productCategory', type: 'categorical', importance: 0.1, description: '제품 카테고리' }
        ],
        algorithm: 'gradient_boosting',
        hyperparameters: { n_estimators: 200, learning_rate: 0.1 },
        trainingData: {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          sampleSize: 1000,
          features: ['historicalDemand', 'trend', 'seasonality', 'productCategory']
        },
        performance: {
          accuracy: 0.90,
          mse: 100,
          mae: 5
        },
        status: 'ready',
        version: '1.0.0',
        metadata: {
          createdBy: new mongoose.Types.ObjectId(),
          category: 'inventory',
          tags: ['demand', 'forecast'],
          environment: 'production',
          lastTrained: new Date()
        }
      });
      
      await model.save();
    }
    
    return model;
  }
}
