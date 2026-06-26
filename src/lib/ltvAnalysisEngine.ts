import { LTVCalculation, LTVSegment, LTVMetrics } from '@/models/LTVAnalysis';
import User from '@/models/User';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export interface LTVAnalysisResult {
  userId: string;
  ltvValue: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  customerLifespan: number;
  totalOrders: number;
  totalRevenue: number;
  customerTier: 'new' | 'regular' | 'vip' | 'churned';
  ltvTier: 'low' | 'medium' | 'high' | 'premium';
  predictedLTV: number;
  churnProbability: number;
  nextPurchasePrediction?: Date;
  insights: Array<{
    type: 'ltv_insight' | 'growth_insight' | 'churn_insight' | 'prediction_insight';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    data: any;
  }>;
}

export interface LTVSegmentAnalysis {
  segmentId: string;
  segmentName: string;
  totalCustomers: number;
  averageLTV: number;
  medianLTV: number;
  totalLTV: number;
  ltvDistribution: Array<{
    tier: 'low' | 'medium' | 'high' | 'premium';
    count: number;
    percentage: number;
    averageLTV: number;
  }>;
  customerTierLTV: Array<{
    tier: 'new' | 'regular' | 'vip' | 'churned';
    count: number;
    averageLTV: number;
    totalLTV: number;
  }>;
  channelLTV: Array<{
    channel: string;
    count: number;
    averageLTV: number;
    totalLTV: number;
    averageCAC?: number;
    ltvCacRatio?: number;
  }>;
  categoryLTV: Array<{
    category: string;
    count: number;
    averageLTV: number;
    totalLTV: number;
  }>;
  ltvGrowth: {
    period: string;
    previousAverageLTV: number;
    currentAverageLTV: number;
    growthRate: number;
    growthAmount: number;
  };
  predictedLTV: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
    confidence: number;
  };
  insights: Array<{
    type: 'ltv_insight' | 'growth_insight' | 'segment_insight' | 'prediction_insight';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    data: any;
  }>;
}

export class LTVAnalysisEngine {
  // 개별 고객 LTV 분석
  static async analyzeCustomerLTV(userId: string): Promise<LTVAnalysisResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 고객의 모든 주문 조회
      const orders = await Order.find({
        userId: userId,
        status: { $in: ['completed', 'delivered'] }
      }).sort({ createdAt: 1 });

      if (orders.length === 0) {
        throw new Error('No orders found for this customer');
      }

      // LTV 계산
      const ltvData = this.calculateCustomerLTV(orders, user);
      
      // 고객 등급 및 LTV 등급 결정
      const customerTier = this.determineCustomerTier(ltvData, orders);
      const ltvTier = this.determineLVTTier(ltvData.ltvValue);
      
      // 예측 LTV 계산
      const predictedLTV = this.predictLTV(ltvData, orders);
      
      // 이탈 확률 계산
      const churnProbability = this.calculateChurnProbability(ltvData, orders);
      
      // 다음 구매 예측
      const nextPurchasePrediction = this.predictNextPurchase(orders);
      
      // 인사이트 생성
      const insights = this.generateCustomerInsights(ltvData, customerTier, ltvTier, churnProbability);

      // LTV 계산 결과 저장
      const ltvCalculation = new LTVCalculation({
        userId: user._id,
        calculationDate: new Date(),
        ltvValue: ltvData.ltvValue,
        averageOrderValue: ltvData.averageOrderValue,
        purchaseFrequency: ltvData.purchaseFrequency,
        customerLifespan: ltvData.customerLifespan,
        totalOrders: ltvData.totalOrders,
        totalRevenue: ltvData.totalRevenue,
        firstPurchaseDate: ltvData.firstPurchaseDate,
        lastPurchaseDate: ltvData.lastPurchaseDate,
        isActive: ltvData.isActive,
        customerTier,
        ltvTier,
        metadata: {
          acquisitionChannel: user.trafficSource || 'direct',
          acquisitionCost: user.acquisitionCost,
          predictedLTV,
          churnProbability,
          nextPurchasePrediction
        }
      });

      await ltvCalculation.save();

      return {
        userId: user._id.toString(),
        ltvValue: ltvData.ltvValue,
        averageOrderValue: ltvData.averageOrderValue,
        purchaseFrequency: ltvData.purchaseFrequency,
        customerLifespan: ltvData.customerLifespan,
        totalOrders: ltvData.totalOrders,
        totalRevenue: ltvData.totalRevenue,
        customerTier,
        ltvTier,
        predictedLTV,
        churnProbability,
        nextPurchasePrediction,
        insights
      };

    } catch (error) {
      console.error('Customer LTV analysis error:', error);
      throw error;
    }
  }

  // 고객 LTV 계산
  private static calculateCustomerLTV(orders: any[], user: any): any {
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const firstPurchaseDate = orders[0].createdAt;
    const lastPurchaseDate = orders[orders.length - 1].createdAt;
    
    // 고객 생애 기간 계산 (월 단위)
    const customerLifespan = this.calculateCustomerLifespan(firstPurchaseDate, lastPurchaseDate);
    
    // 구매 빈도 계산 (월 단위)
    const purchaseFrequency = customerLifespan > 0 ? totalOrders / customerLifespan : 0;
    
    // LTV 계산 (월 평균 수익 × 예상 생애 기간)
    const monthlyRevenue = customerLifespan > 0 ? totalRevenue / customerLifespan : 0;
    const expectedLifespan = this.predictCustomerLifespan(purchaseFrequency, totalOrders);
    const ltvValue = monthlyRevenue * expectedLifespan;
    
    // 활성 고객 여부 (마지막 구매가 3개월 이내)
    const monthsSinceLastPurchase = this.calculateMonthsBetween(lastPurchaseDate, new Date());
    const isActive = monthsSinceLastPurchase <= 3;

    return {
      ltvValue,
      averageOrderValue,
      purchaseFrequency,
      customerLifespan,
      totalOrders,
      totalRevenue,
      firstPurchaseDate,
      lastPurchaseDate,
      isActive
    };
  }

  // 고객 생애 기간 계산
  private static calculateCustomerLifespan(firstPurchase: Date, lastPurchase: Date): number {
    const monthsBetween = this.calculateMonthsBetween(firstPurchase, lastPurchase);
    return Math.max(1, monthsBetween); // 최소 1개월
  }

  // 두 날짜 간의 개월 수 계산
  private static calculateMonthsBetween(date1: Date, date2: Date): number {
    const yearDiff = date2.getFullYear() - date1.getFullYear();
    const monthDiff = date2.getMonth() - date1.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  // 예상 고객 생애 기간 예측
  private static predictCustomerLifespan(purchaseFrequency: number, totalOrders: number): number {
    // 구매 빈도가 높을수록, 주문 수가 많을수록 생애 기간이 길다고 가정
    if (purchaseFrequency >= 2) return 24; // 월 2회 이상 구매 시 2년
    if (purchaseFrequency >= 1) return 18; // 월 1회 구매 시 1.5년
    if (purchaseFrequency >= 0.5) return 12; // 2개월에 1회 구매 시 1년
    if (totalOrders >= 5) return 12; // 5회 이상 주문 시 1년
    if (totalOrders >= 3) return 8; // 3회 이상 주문 시 8개월
    return 6; // 기본 6개월
  }

  // 고객 등급 결정
  private static determineCustomerTier(ltvData: any, orders: any[]): 'new' | 'regular' | 'vip' | 'churned' {
    const { totalOrders, isActive, customerLifespan } = ltvData;
    
    if (!isActive) return 'churned';
    if (totalOrders >= 10 || ltvData.ltvValue >= 1000000) return 'vip';
    if (totalOrders >= 3 || customerLifespan >= 6) return 'regular';
    return 'new';
  }

  // LTV 등급 결정
  private static determineLVTTier(ltvValue: number): 'low' | 'medium' | 'high' | 'premium' {
    if (ltvValue >= 500000) return 'premium';
    if (ltvValue >= 200000) return 'high';
    if (ltvValue >= 100000) return 'medium';
    return 'low';
  }

  // LTV 예측
  private static predictLTV(ltvData: any, orders: any[]): number {
    const { purchaseFrequency, averageOrderValue, customerLifespan } = ltvData;
    
    // 현재 패턴을 기반으로 향후 12개월 예측
    const predictedMonthlyRevenue = purchaseFrequency * averageOrderValue;
    const predictedLifespan = Math.max(12, customerLifespan + 6); // 최소 12개월, 현재 생애 + 6개월
    
    return predictedMonthlyRevenue * predictedLifespan;
  }

  // 이탈 확률 계산
  private static calculateChurnProbability(ltvData: any, orders: any[]): number {
    const { isActive, customerLifespan, purchaseFrequency } = ltvData;
    
    if (!isActive) return 1.0; // 이미 이탈한 고객
    
    // 마지막 구매로부터의 시간
    const monthsSinceLastPurchase = this.calculateMonthsBetween(ltvData.lastPurchaseDate, new Date());
    
    // 이탈 확률 계산 (구매 빈도가 낮을수록, 마지막 구매가 오래될수록 높음)
    let churnProbability = 0;
    
    if (monthsSinceLastPurchase >= 6) churnProbability += 0.4;
    else if (monthsSinceLastPurchase >= 3) churnProbability += 0.2;
    
    if (purchaseFrequency < 0.5) churnProbability += 0.3;
    else if (purchaseFrequency < 1) churnProbability += 0.1;
    
    if (customerLifespan < 3) churnProbability += 0.2;
    
    return Math.min(1.0, churnProbability);
  }

  // 다음 구매 예측
  private static predictNextPurchase(orders: any[]): Date | undefined {
    if (orders.length < 2) return undefined;
    
    // 구매 간격 계산
    const intervals = [];
    for (let i = 1; i < orders.length; i++) {
      const interval = this.calculateMonthsBetween(orders[i - 1].createdAt, orders[i].createdAt);
      intervals.push(interval);
    }
    
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const lastPurchase = orders[orders.length - 1].createdAt;
    
    const nextPurchase = new Date(lastPurchase);
    nextPurchase.setMonth(nextPurchase.getMonth() + Math.round(averageInterval));
    
    return nextPurchase;
  }

  // 고객 인사이트 생성
  private static generateCustomerInsights(ltvData: any, customerTier: string, ltvTier: string, churnProbability: number): any[] {
    const insights: any[] = [];

    // LTV 인사이트
    if (ltvTier === 'premium') {
      insights.push({
        type: 'ltv_insight',
        message: '프리미엄 고객입니다. 특별 관리가 필요합니다.',
        severity: 'low',
        recommendations: [
          'VIP 서비스 제공',
          '맞춤형 제품 추천',
          '우선 고객 지원',
          '독점 혜택 제공'
        ],
        data: { ltvTier, ltvValue: ltvData.ltvValue }
      });
    } else if (ltvTier === 'low') {
      insights.push({
        type: 'ltv_insight',
        message: 'LTV가 낮습니다. 고객 가치 향상이 필요합니다.',
        severity: 'high',
        recommendations: [
          '구매 빈도 증가 유도',
          '평균 주문 금액 향상',
          '고가 제품 추천',
          '번들 상품 마케팅'
        ],
        data: { ltvTier, ltvValue: ltvData.ltvValue }
      });
    }

    // 이탈 위험 인사이트
    if (churnProbability > 0.7) {
      insights.push({
        type: 'churn_insight',
        message: '이탈 위험이 높습니다. 즉시 고객 유지 조치가 필요합니다.',
        severity: 'critical',
        recommendations: [
          '개인화된 할인 혜택 제공',
          '고객 만족도 조사',
          '고객 서비스 강화',
          '리텐션 마케팅 캠페인'
        ],
        data: { churnProbability }
      });
    } else if (churnProbability > 0.4) {
      insights.push({
        type: 'churn_insight',
        message: '이탈 위험이 중간 수준입니다. 주의가 필요합니다.',
        severity: 'medium',
        recommendations: [
          '정기적 고객 소통',
          '관심 제품 추천',
          '고객 피드백 수집'
        ],
        data: { churnProbability }
      });
    }

    // 성장 기회 인사이트
    if (customerTier === 'new' && ltvData.totalOrders >= 2) {
      insights.push({
        type: 'growth_insight',
        message: '신규 고객이지만 구매 패턴이 좋습니다. 성장 잠재력이 높습니다.',
        severity: 'low',
        recommendations: [
          '추가 구매 유도',
          '브랜드 충성도 구축',
          '추천 프로그램 안내'
        ],
        data: { customerTier, totalOrders: ltvData.totalOrders }
      });
    }

    return insights;
  }

  // 세그먼트 LTV 분석
  static async analyzeSegmentLTV(segmentId: string): Promise<LTVSegmentAnalysis> {
    try {
      const segment = await LTVSegment.findById(segmentId);
      if (!segment) {
        throw new Error('Segment not found');
      }

      // 세그먼트 조건에 맞는 고객들의 LTV 계산 조회
      const ltvCalculations = await this.getSegmentLTVCalculations(segment);
      
      if (ltvCalculations.length === 0) {
        throw new Error('No customers found in this segment');
      }

      // 세그먼트 메트릭 계산
      const metrics = this.calculateSegmentMetrics(ltvCalculations);
      
      // LTV 분포 계산
      const ltvDistribution = this.calculateLTVDistribution(ltvCalculations);
      
      // 고객 등급별 LTV 계산
      const customerTierLTV = this.calculateCustomerTierLTV(ltvCalculations);
      
      // 획득 채널별 LTV 계산
      const channelLTV = this.calculateChannelLTV(ltvCalculations);
      
      // 제품 카테고리별 LTV 계산
      const categoryLTV = await this.calculateCategoryLTV(ltvCalculations);
      
      // LTV 성장률 계산
      const ltvGrowth = await this.calculateLTVGrowth(segmentId, metrics.averageLTV);
      
      // 예측 LTV 계산
      const predictedLTV = this.calculatePredictedLTV(ltvCalculations);
      
      // 인사이트 생성
      const insights = this.generateSegmentInsights(metrics, ltvDistribution, customerTierLTV, channelLTV);

      // 결과 저장
      const ltvMetrics = new LTVMetrics({
        segmentId: segment._id,
        calculationDate: new Date(),
        timeRange: {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1년 전
          endDate: new Date()
        },
        metrics: {
          ...metrics,
          ltvDistribution,
          customerTierLTV,
          channelLTV,
          categoryLTV,
          ltvGrowth,
          predictedLTV
        },
        insights,
        metadata: {
          calculatedBy: new mongoose.Types.ObjectId(), // 관리자 ID
          calculationMethod: 'historical',
          dataQuality: 'high'
        }
      });

      await ltvMetrics.save();

      return {
        segmentId: segment._id.toString(),
        segmentName: segment.name,
        totalCustomers: metrics.totalCustomers,
        averageLTV: metrics.averageLTV,
        medianLTV: metrics.medianLTV,
        totalLTV: metrics.totalLTV,
        ltvDistribution,
        customerTierLTV,
        channelLTV,
        categoryLTV,
        ltvGrowth,
        predictedLTV,
        insights
      };

    } catch (error) {
      console.error('Segment LTV analysis error:', error);
      throw error;
    }
  }

  // 세그먼트 LTV 계산 조회
  private static async getSegmentLTVCalculations(segment: any): Promise<any[]> {
    // 세그먼트 조건에 맞는 LTV 계산 조회
    const filter: any = {};
    
    if (segment.criteria.ltvRange) {
      filter.ltvValue = {
        $gte: segment.criteria.ltvRange.min,
        $lte: segment.criteria.ltvRange.max
      };
    }
    
    if (segment.criteria.customerTier && segment.criteria.customerTier.length > 0) {
      filter.customerTier = { $in: segment.criteria.customerTier };
    }
    
    if (segment.criteria.ltvTier && segment.criteria.ltvTier.length > 0) {
      filter.ltvTier = { $in: segment.criteria.ltvTier };
    }
    
    if (segment.criteria.acquisitionChannel && segment.criteria.acquisitionChannel.length > 0) {
      filter['metadata.acquisitionChannel'] = { $in: segment.criteria.acquisitionChannel };
    }
    
    if (segment.criteria.purchaseFrequency) {
      filter.purchaseFrequency = {
        $gte: segment.criteria.purchaseFrequency.min,
        $lte: segment.criteria.purchaseFrequency.max
      };
    }
    
    if (segment.criteria.customerLifespan) {
      filter.customerLifespan = {
        $gte: segment.criteria.customerLifespan.min,
        $lte: segment.criteria.customerLifespan.max
      };
    }
    
    if (segment.criteria.totalOrders) {
      filter.totalOrders = {
        $gte: segment.criteria.totalOrders.min,
        $lte: segment.criteria.totalOrders.max
      };
    }

    return await LTVCalculation.find(filter);
  }

  // 세그먼트 메트릭 계산
  private static calculateSegmentMetrics(ltvCalculations: any[]): any {
    const totalCustomers = ltvCalculations.length;
    const ltvValues = ltvCalculations.map(calc => calc.ltvValue);
    
    const averageLTV = ltvValues.reduce((sum, ltv) => sum + ltv, 0) / totalCustomers;
    const medianLTV = this.calculateMedian(ltvValues);
    const totalLTV = ltvValues.reduce((sum, ltv) => sum + ltv, 0);

    return {
      totalCustomers,
      averageLTV,
      medianLTV,
      totalLTV
    };
  }

  // 중간값 계산
  private static calculateMedian(values: number[]): number {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  // LTV 분포 계산
  private static calculateLTVDistribution(ltvCalculations: any[]): any[] {
    const tiers = ['low', 'medium', 'high', 'premium'];
    const distribution = tiers.map(tier => {
      const tierCalculations = ltvCalculations.filter(calc => calc.ltvTier === tier);
      const count = tierCalculations.length;
      const percentage = (count / ltvCalculations.length) * 100;
      const averageLTV = count > 0 ? 
        tierCalculations.reduce((sum, calc) => sum + calc.ltvValue, 0) / count : 0;
      
      return {
        tier,
        count,
        percentage,
        averageLTV
      };
    });

    return distribution;
  }

  // 고객 등급별 LTV 계산
  private static calculateCustomerTierLTV(ltvCalculations: any[]): any[] {
    const tiers = ['new', 'regular', 'vip', 'churned'];
    const tierLTV = tiers.map(tier => {
      const tierCalculations = ltvCalculations.filter(calc => calc.customerTier === tier);
      const count = tierCalculations.length;
      const averageLTV = count > 0 ? 
        tierCalculations.reduce((sum, calc) => sum + calc.ltvValue, 0) / count : 0;
      const totalLTV = tierCalculations.reduce((sum, calc) => sum + calc.ltvValue, 0);
      
      return {
        tier,
        count,
        averageLTV,
        totalLTV
      };
    });

    return tierLTV;
  }

  // 획득 채널별 LTV 계산
  private static calculateChannelLTV(ltvCalculations: any[]): any[] {
    const channelMap = new Map<string, any[]>();
    
    ltvCalculations.forEach(calc => {
      const channel = calc.metadata.acquisitionChannel;
      if (!channelMap.has(channel)) {
        channelMap.set(channel, []);
      }
      channelMap.get(channel)!.push(calc);
    });

    const channelLTV = Array.from(channelMap.entries()).map(([channel, calculations]) => {
      const count = calculations.length;
      const averageLTV = calculations.reduce((sum, calc) => sum + calc.ltvValue, 0) / count;
      const totalLTV = calculations.reduce((sum, calc) => sum + calc.ltvValue, 0);
      const averageCAC = calculations.reduce((sum, calc) => sum + (calc.metadata.acquisitionCost || 0), 0) / count;
      const ltvCacRatio = averageCAC > 0 ? averageLTV / averageCAC : 0;

      return {
        channel,
        count,
        averageLTV,
        totalLTV,
        averageCAC,
        ltvCacRatio
      };
    });

    return channelLTV;
  }

  // 제품 카테고리별 LTV 계산
  private static async calculateCategoryLTV(ltvCalculations: any[]): Promise<any[]> {
    const userIds = ltvCalculations.map(calc => calc.userId);
    
    // 각 고객의 제품 카테고리별 구매 내역 조회
    const orders = await Order.find({
      userId: { $in: userIds },
      status: { $in: ['completed', 'delivered'] }
    });

    const categoryMap = new Map<string, { users: Set<string>, revenue: number }>();
    
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const category = item.category || '기타';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { users: new Set(), revenue: 0 });
        }
        categoryMap.get(category)!.users.add(order.userId.toString());
        categoryMap.get(category)!.revenue += item.price * item.quantity;
      });
    });

    const categoryLTV = Array.from(categoryMap.entries()).map(([category, data]) => {
      const count = data.users.size;
      const totalLTV = data.revenue;
      const averageLTV = count > 0 ? totalLTV / count : 0;

      return {
        category,
        count,
        averageLTV,
        totalLTV
      };
    });

    return categoryLTV;
  }

  // LTV 성장률 계산
  private static async calculateLTVGrowth(segmentId: string, currentAverageLTV: number): Promise<any> {
    // 이전 기간의 평균 LTV 조회
    const previousMetrics = await LTVMetrics.findOne({
      segmentId: segmentId,
      calculationDate: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30일 전
    }).sort({ calculationDate: -1 });

    const previousAverageLTV = previousMetrics ? previousMetrics.metrics.averageLTV : currentAverageLTV;
    const growthRate = previousAverageLTV > 0 ? ((currentAverageLTV - previousAverageLTV) / previousAverageLTV) * 100 : 0;
    const growthAmount = currentAverageLTV - previousAverageLTV;

    return {
      period: 'monthly',
      previousAverageLTV,
      currentAverageLTV,
      growthRate,
      growthAmount
    };
  }

  // 예측 LTV 계산
  private static calculatePredictedLTV(ltvCalculations: any[]): any {
    const predictedLTVs = ltvCalculations.map(calc => calc.metadata.predictedLTV || calc.ltvValue);
    const nextMonth = predictedLTVs.reduce((sum, ltv) => sum + ltv, 0) / predictedLTVs.length;
    const nextQuarter = nextMonth * 1.1; // 10% 증가 가정
    const nextYear = nextMonth * 1.3; // 30% 증가 가정
    
    // 신뢰도 계산 (데이터 품질 기반)
    const confidence = this.calculatePredictionConfidence(ltvCalculations);

    return {
      nextMonth,
      nextQuarter,
      nextYear,
      confidence
    };
  }

  // 예측 신뢰도 계산
  private static calculatePredictionConfidence(ltvCalculations: any[]): number {
    const totalCustomers = ltvCalculations.length;
    const activeCustomers = ltvCalculations.filter(calc => calc.isActive).length;
    const avgOrders = ltvCalculations.reduce((sum, calc) => sum + calc.totalOrders, 0) / totalCustomers;
    
    // 활성 고객 비율과 평균 주문 수를 기반으로 신뢰도 계산
    const activeRatio = activeCustomers / totalCustomers;
    const orderConfidence = Math.min(1, avgOrders / 5); // 5회 이상 주문 시 최대 신뢰도
    
    return (activeRatio * 0.6 + orderConfidence * 0.4);
  }

  // 세그먼트 인사이트 생성
  private static generateSegmentInsights(metrics: any, ltvDistribution: any[], customerTierLTV: any[], channelLTV: any[]): any[] {
    const insights: any[] = [];

    // LTV 분포 인사이트
    const premiumRatio = ltvDistribution.find(d => d.tier === 'premium')?.percentage || 0;
    if (premiumRatio > 20) {
      insights.push({
        type: 'ltv_insight',
        message: `프리미엄 고객 비율이 ${premiumRatio.toFixed(1)}%로 높습니다. 우수한 고객 품질을 보입니다.`,
        severity: 'low',
        recommendations: [
          '프리미엄 고객 유지 전략 강화',
          'VIP 서비스 확대',
          '고가 제품 라인 확장'
        ],
        data: { premiumRatio }
      });
    } else if (premiumRatio < 5) {
      insights.push({
        type: 'ltv_insight',
        message: `프리미엄 고객 비율이 ${premiumRatio.toFixed(1)}%로 낮습니다. 고객 가치 향상이 필요합니다.`,
        severity: 'high',
        recommendations: [
          '고가 제품 마케팅 강화',
          '업셀링 전략 수립',
          '고객 교육 및 상담 서비스 제공'
        ],
        data: { premiumRatio }
      });
    }

    // 채널별 LTV 인사이트
    const bestChannel = channelLTV.reduce((best, channel) => 
      channel.averageLTV > best.averageLTV ? channel : best
    );
    
    if (bestChannel.ltvCacRatio && bestChannel.ltvCacRatio > 3) {
      insights.push({
        type: 'segment_insight',
        message: `${bestChannel.channel} 채널의 LTV/CAC 비율이 ${bestChannel.ltvCacRatio.toFixed(1)}로 우수합니다.`,
        severity: 'low',
        recommendations: [
          '해당 채널 마케팅 투자 확대',
          '성공 요인 분석 및 다른 채널에 적용',
          '채널별 맞춤 전략 수립'
        ],
        data: { channel: bestChannel.channel, ltvCacRatio: bestChannel.ltvCacRatio }
      });
    }

    return insights;
  }
}















