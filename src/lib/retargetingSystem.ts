import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { AdvancedMarketingAutomation, MarketingEvent } from '@/lib/advancedMarketingAutomation';
import { AdvancedSegmentation } from '@/lib/advancedSegmentation';
import mongoose from 'mongoose';

export interface ChurnPrediction {
  userId: string;
  churnProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    factor: string;
    impact: number; // -1 to 1
    description: string;
  }[];
  recommendedActions: string[];
  lastActivity: Date;
  daysSinceLastActivity: number;
  predictedChurnDate?: Date;
}

export interface RetargetingCampaign {
  id: string;
  name: string;
  description: string;
  type: 'abandoned_cart' | 'browsing_retargeting' | 'purchase_retargeting' | 'churn_prevention' | 'win_back' | 'upsell' | 'cross_sell';
  status: 'active' | 'paused' | 'completed' | 'draft';
  targetSegments: string[];
  triggers: {
    eventType: string;
    conditions: {
      field: string;
      operator: string;
      value: any;
    }[];
    timeWindow: number; // 시간 단위
  }[];
  content: {
    email: {
      subject: string;
      template: string;
      personalization: any;
    };
    push: {
      title: string;
      message: string;
      imageUrl?: string;
    };
    sms: {
      message: string;
    };
    inApp: {
      title: string;
      message: string;
      actionButton: string;
      actionUrl: string;
    };
  };
  schedule: {
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    maxSends: number;
    cooldownPeriod: number; // 시간 단위
    timeRestrictions?: {
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
    };
  };
  personalization: {
    useUserData: boolean;
    useBehaviorData: boolean;
    usePurchaseHistory: boolean;
    useBrowsingHistory: boolean;
    customFields: { [key: string]: any };
  };
  analytics: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalConverted: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenue: number;
    roi: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WinBackCampaign {
  id: string;
  name: string;
  description: string;
  targetSegments: string[];
  churnThreshold: number; // 일 단위
  offers: {
    type: 'discount' | 'free_shipping' | 'gift' | 'exclusive_access';
    value: number;
    description: string;
    conditions?: any;
  }[];
  touchpoints: {
    channel: 'email' | 'push' | 'sms' | 'in_app';
    delay: number; // 시간 단위
    content: any;
  }[];
  successMetrics: {
    reEngagementRate: number;
    purchaseRate: number;
    revenue: number;
  };
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface BehavioralTrigger {
  id: string;
  name: string;
  description: string;
  eventType: string;
  conditions: {
    field: string;
    operator: string;
    value: any;
    timeWindow?: number;
  }[];
  actions: {
    campaignId: string;
    delay: number; // 분 단위
    priority: number;
  }[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export class RetargetingSystem {
  
  // 이탈 고객 예측
  static async predictChurn(userId: string): Promise<ChurnPrediction> {
    try {
      await connectDB();
      
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      // 사용자 활동 데이터 조회
      const lastOrder = await Order.findOne({ userId }).sort({ createdAt: -1 });
      const orderCount = await Order.countDocuments({ userId });
      const totalSpent = await Order.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      
      const lastActivity = lastOrder?.createdAt || user.createdAt;
      const daysSinceLastActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      // 이탈 위험도 계산
      const factors = this.calculateChurnFactors(user, lastOrder, orderCount, totalSpent[0]?.total || 0, daysSinceLastActivity);
      const churnProbability = this.calculateChurnProbability(factors);
      const riskLevel = this.getRiskLevel(churnProbability);
      
      // 추천 액션 생성
      const recommendedActions = this.getRecommendedActions(riskLevel, factors);
      
      // 예상 이탈 날짜 계산
      const predictedChurnDate = this.predictChurnDate(churnProbability, lastActivity);
      
      return {
        userId,
        churnProbability,
        riskLevel,
        factors,
        recommendedActions,
        lastActivity,
        daysSinceLastActivity,
        predictedChurnDate
      };
      
    } catch (error) {
      console.error('Error predicting churn:', error);
      throw error;
    }
  }
  
  // 리타겟팅 캠페인 생성
  static async createRetargetingCampaign(campaignData: Omit<RetargetingCampaign, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Promise<string> {
    try {
      await connectDB();
      
      const campaign = new (mongoose.model('RetargetingCampaign') || mongoose.model('RetargetingCampaign', new mongoose.Schema({})))({
        ...campaignData,
        analytics: {
          totalSent: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalConverted: 0,
          openRate: 0,
          clickRate: 0,
          conversionRate: 0,
          revenue: 0,
          roi: 0
        }
      });
      
      await campaign.save();
      return campaign._id.toString();
      
    } catch (error) {
      console.error('Error creating retargeting campaign:', error);
      throw error;
    }
  }
  
  // 위백 캠페인 생성
  static async createWinBackCampaign(campaignData: Omit<WinBackCampaign, 'id' | 'createdAt' | 'updatedAt' | 'successMetrics'>): Promise<string> {
    try {
      await connectDB();
      
      const campaign = new (mongoose.model('WinBackCampaign') || mongoose.model('WinBackCampaign', new mongoose.Schema({})))({
        ...campaignData,
        successMetrics: {
          reEngagementRate: 0,
          purchaseRate: 0,
          revenue: 0
        }
      });
      
      await campaign.save();
      return campaign._id.toString();
      
    } catch (error) {
      console.error('Error creating win-back campaign:', error);
      throw error;
    }
  }
  
  // 행동 트리거 생성
  static async createBehavioralTrigger(triggerData: Omit<BehavioralTrigger, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      await connectDB();
      
      const trigger = new (mongoose.model('BehavioralTrigger') || mongoose.model('BehavioralTrigger', new mongoose.Schema({})))(triggerData);
      await trigger.save();
      return trigger._id.toString();
      
    } catch (error) {
      console.error('Error creating behavioral trigger:', error);
      throw error;
    }
  }
  
  // 장바구니 이탈 고객 감지 및 처리
  static async handleAbandonedCart(userId: string, cartData: any): Promise<void> {
    try {
      await connectDB();
      
      // 장바구니 이탈 이벤트 생성
      const event: MarketingEvent = {
        userId,
        eventType: 'abandon_cart' as const,
        timestamp: new Date(),
        metadata: {
          cartValue: cartData.totalValue || 0,
          itemCount: cartData.items?.length || 0,
          items: cartData.items || [],
          lastActivity: cartData.lastActivity || new Date()
        }
      };
      
      // 마케팅 자동화 엔진에 이벤트 전달
      await AdvancedMarketingAutomation.addEvent(event);
      
    } catch (error) {
      console.error('Error handling abandoned cart:', error);
    }
  }
  
  // 브라우징 리타겟팅 처리
  static async handleBrowsingRetargeting(userId: string, browsingData: any): Promise<void> {
    try {
      await connectDB();
      
      // 브라우징 이벤트 생성
      const event = {
        userId,
        eventType: 'page_view' as const,
        timestamp: new Date(),
        metadata: {
          pageUrl: browsingData.pageUrl,
          productId: browsingData.productId,
          categoryId: browsingData.categoryId,
          timeSpent: browsingData.timeSpent,
          deviceType: browsingData.deviceType
        }
      };
      
      // 마케팅 자동화 엔진에 이벤트 전달
      await AdvancedMarketingAutomation.addEvent(event);
      
    } catch (error) {
      console.error('Error handling browsing retargeting:', error);
    }
  }
  
  // 이탈 고객 재참여 캠페인 실행
  static async executeWinBackCampaign(campaignId: string): Promise<void> {
    try {
      await connectDB();
      
      const campaign = await mongoose.model('WinBackCampaign').findById(campaignId);
      if (!campaign || campaign.status !== 'active') return;
      
      // 이탈 고객 세그먼트 조회
      const churnedUsers = await this.getChurnedUsers(campaign.churnThreshold);
      
      for (const user of churnedUsers) {
        // 개인화된 오퍼 생성
        const personalizedOffer = await this.createPersonalizedOffer(user, campaign.offers);
        
        // 터치포인트 실행
        for (const touchpoint of campaign.touchpoints) {
          await this.executeTouchpoint(user, touchpoint, personalizedOffer);
        }
      }
      
    } catch (error) {
      console.error('Error executing win-back campaign:', error);
    }
  }
  
  // 개인화된 추천 생성
  static async generatePersonalizedRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    try {
      await connectDB();
      
      // 사용자 개인화 프로필 조회
      const profile = await AdvancedSegmentation.createPersonalizationProfile(userId);
      
      // 사용자 주문 이력 조회
      const orders = await Order.find({ userId }).populate('items.productId');
      
      // 추천 알고리즘 적용
      const recommendations = await this.applyRecommendationAlgorithm(profile, orders, limit);
      
      return recommendations;
      
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return [];
    }
  }
  
  // 캠페인 성과 분석
  static async analyzeCampaignPerformance(campaignId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      await connectDB();
      
      // 캠페인 이벤트 조회
      const events = await mongoose.model('CampaignEvent').find({
        campaignId,
        timestamp: { $gte: startDate, $lte: endDate }
      });
      
      // 성과 지표 계산
      const metrics = this.calculateCampaignMetrics(events);
      
      return metrics;
      
    } catch (error) {
      console.error('Error analyzing campaign performance:', error);
      throw error;
    }
  }
  
  // 유틸리티 메서드들
  private static calculateChurnFactors(user: any, lastOrder: any, orderCount: number, totalSpent: number, daysSinceLastActivity: number): any[] {
    const factors = [];
    
    // 활동 빈도
    if (daysSinceLastActivity > 30) {
      factors.push({
        factor: 'inactivity',
        impact: 0.8,
        description: `마지막 활동으로부터 ${daysSinceLastActivity}일 경과`
      });
    }
    
    // 구매 빈도
    if (orderCount < 2) {
      factors.push({
        factor: 'low_purchase_frequency',
        impact: 0.6,
        description: '구매 빈도가 낮음'
      });
    }
    
    // 구매 금액
    if (totalSpent < 50000) {
      factors.push({
        factor: 'low_spending',
        impact: 0.4,
        description: '구매 금액이 낮음'
      });
    }
    
    // 계정 상태
    if (user.status === 'inactive') {
      factors.push({
        factor: 'inactive_account',
        impact: 0.9,
        description: '비활성 계정'
      });
    }
    
    return factors;
  }
  
  private static calculateChurnProbability(factors: any[]): number {
    if (factors.length === 0) return 0.1;
    
    const totalImpact = factors.reduce((sum, factor) => sum + factor.impact, 0);
    return Math.min(0.95, totalImpact / factors.length);
  }
  
  private static getRiskLevel(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 0.8) return 'critical';
    if (probability >= 0.6) return 'high';
    if (probability >= 0.3) return 'medium';
    return 'low';
  }
  
  private static getRecommendedActions(riskLevel: string, factors: any[]): string[] {
    const actions = [];
    
    switch (riskLevel) {
      case 'critical':
        actions.push('즉시 위백 캠페인 실행');
        actions.push('개인화된 할인 쿠폰 발송');
        actions.push('고객 서비스 연락');
        break;
      case 'high':
        actions.push('리타겟팅 캠페인 실행');
        actions.push('관심 상품 추천 이메일 발송');
        break;
      case 'medium':
        actions.push('뉴스레터 발송');
        actions.push('새로운 상품 소개');
        break;
      case 'low':
        actions.push('정기 뉴스레터 유지');
        break;
    }
    
    return actions;
  }
  
  private static predictChurnDate(probability: number, lastActivity: Date): Date {
    const daysToChurn = Math.round(30 * (1 - probability));
    return new Date(lastActivity.getTime() + daysToChurn * 24 * 60 * 60 * 1000);
  }
  
  private static async getChurnedUsers(churnThreshold: number): Promise<any[]> {
    // 실제 구현에서는 이탈 고객 조회 로직
    return [];
  }
  
  private static async createPersonalizedOffer(user: any, offers: any[]): Promise<any> {
    // 실제 구현에서는 개인화된 오퍼 생성 로직
    return offers[0];
  }
  
  private static async executeTouchpoint(user: any, touchpoint: any, offer: any): Promise<void> {
    // 실제 구현에서는 터치포인트 실행 로직
  }
  
  private static async applyRecommendationAlgorithm(profile: any, orders: any[], limit: number): Promise<any[]> {
    // 실제 구현에서는 추천 알고리즘 적용
    return [];
  }
  
  private static calculateCampaignMetrics(events: any[]): any {
    // 실제 구현에서는 캠페인 성과 지표 계산
    return {
      totalSent: events.length,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      revenue: 0
    };
  }
}
