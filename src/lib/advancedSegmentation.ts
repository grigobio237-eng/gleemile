import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import Product from '@/models/Product';
import CustomerSegment from '@/models/CustomerSegment';
import SegmentMembership from '@/models/SegmentMembership';
import mongoose from 'mongoose';

export interface AdvancedSegmentRule {
  id: string;
  name: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'regex' | 'exists' | 'not_exists';
  value: any;
  value2?: any; // between 연산자용
  timeWindow?: number; // 일 단위
  weight?: number; // 규칙 가중치
}

export interface BehavioralPattern {
  id: string;
  name: string;
  description: string;
  conditions: {
    eventType: string;
    frequency: number; // 최소 발생 횟수
    timeWindow: number; // 일 단위
    conditions?: AdvancedSegmentRule[];
  }[];
  weight: number;
}

export interface RFMAnalysis {
  userId: string;
  recency: number; // 최근 구매일로부터의 일수
  frequency: number; // 구매 빈도
  monetary: number; // 총 구매 금액
  rfmScore: string; // 1-5 점수 (예: 555, 123 등)
  segment: string; // Champions, Loyal Customers, Potential Loyalists 등
}

export interface CustomerLifetimeValue {
  userId: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  customerLifespan: number; // 일 단위
  ltv: number;
  predictedLtv: number;
  segment: string;
}

export interface PersonalizationProfile {
  userId: string;
  preferences: {
    categories: { category: string; score: number; lastUpdated: Date }[];
    brands: { brand: string; score: number; lastUpdated: Date }[];
    priceRange: { min: number; max: number; preferred: number };
    colors: string[];
    sizes: string[];
  };
  behavior: {
    browsingPattern: string[];
    purchasePattern: string[];
    timePattern: { hour: number; frequency: number }[];
    devicePattern: { device: string; frequency: number }[];
  };
  demographics: {
    age?: number;
    gender?: string;
    location?: string;
    income?: string;
  };
  engagement: {
    emailOpenRate: number;
    emailClickRate: number;
    pushOpenRate: number;
    websiteVisitFrequency: number;
    sessionDuration: number;
  };
  lastUpdated: Date;
}

export class AdvancedSegmentation {
  
  // RFM 분석 수행
  static async performRFMAnalysis(userId: string, days: number = 365): Promise<RFMAnalysis> {
    try {
      await connectDB();
      
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      
      // 사용자 주문 데이터 조회
      const orders = await Order.find({
        userId,
        status: { $in: ['completed', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }).sort({ createdAt: -1 });
      
      if (orders.length === 0) {
        return {
          userId,
          recency: 999,
          frequency: 0,
          monetary: 0,
          rfmScore: '111',
          segment: 'Lost Customers'
        };
      }
      
      // Recency 계산 (최근 구매일로부터의 일수)
      const recency = Math.floor((endDate.getTime() - orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Frequency 계산 (구매 빈도)
      const frequency = orders.length;
      
      // Monetary 계산 (총 구매 금액)
      const monetary = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // RFM 점수 계산 (1-5 스케일)
      const rScore = this.calculateRFMScore(recency, 'recency');
      const fScore = this.calculateRFMScore(frequency, 'frequency');
      const mScore = this.calculateRFMScore(monetary, 'monetary');
      
      const rfmScore = `${rScore}${fScore}${mScore}`;
      const segment = this.getRFMSegment(rScore, fScore, mScore);
      
      return {
        userId,
        recency,
        frequency,
        monetary,
        rfmScore,
        segment
      };
      
    } catch (error) {
      console.error('Error performing RFM analysis:', error);
      throw error;
    }
  }
  
  // 고객 생애 가치 분석
  static async calculateCustomerLTV(userId: string): Promise<CustomerLifetimeValue> {
    try {
      await connectDB();
      
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      // 모든 주문 조회
      const orders = await Order.find({
        userId,
        status: { $in: ['completed', 'delivered'] }
      }).sort({ createdAt: 1 });
      
      if (orders.length === 0) {
        return {
          userId,
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          customerLifespan: 0,
          ltv: 0,
          predictedLtv: 0,
          segment: 'New Customer'
        };
      }
      
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalRevenue / totalOrders;
      
      // 고객 생애주기 계산
      const firstOrder = orders[0].createdAt;
      const lastOrder = orders[orders.length - 1].createdAt;
      const customerLifespan = Math.floor((lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24));
      
      // LTV 계산
      const ltv = totalRevenue;
      
      // 예측 LTV 계산 (간단한 선형 예측)
      const monthlyRevenue = totalRevenue / Math.max(customerLifespan / 30, 1);
      const predictedLifespan = 24; // 24개월 예측
      const predictedLtv = monthlyRevenue * predictedLifespan;
      
      // LTV 세그먼트 분류
      const segment = this.getLTVSegment(ltv, predictedLtv);
      
      return {
        userId,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        customerLifespan,
        ltv,
        predictedLtv,
        segment
      };
      
    } catch (error) {
      console.error('Error calculating customer LTV:', error);
      throw error;
    }
  }
  
  // 개인화 프로필 생성
  static async createPersonalizationProfile(userId: string): Promise<PersonalizationProfile> {
    try {
      await connectDB();
      
      // 사용자 주문 데이터 조회
      const orders = await Order.find({
        userId,
        status: { $in: ['completed', 'delivered'] }
      }).populate('items.productId');
      
      // 카테고리 선호도 분석
      const categoryScores = new Map<string, { score: number; lastUpdated: Date }>();
      orders.forEach(order => {
        order.items.forEach((item: any) => {
          if (item.productId && item.productId.category) {
            const category = item.productId.category;
            const current = categoryScores.get(category) || { score: 0, lastUpdated: new Date(0) };
            categoryScores.set(category, {
              score: current.score + item.quantity,
              lastUpdated: order.createdAt > current.lastUpdated ? order.createdAt : current.lastUpdated
            });
          }
        });
      });
      
      // 브랜드 선호도 분석
      const brandScores = new Map<string, { score: number; lastUpdated: Date }>();
      orders.forEach(order => {
        order.items.forEach((item: any) => {
          if (item.productId && item.productId.brand) {
            const brand = item.productId.brand;
            const current = brandScores.get(brand) || { score: 0, lastUpdated: new Date(0) };
            brandScores.set(brand, {
              score: current.score + item.quantity,
              lastUpdated: order.createdAt > current.lastUpdated ? order.createdAt : current.lastUpdated
            });
          }
        });
      });
      
      // 가격대 선호도 분석
      const orderValues = orders.map(order => order.totalAmount);
      const priceRange = {
        min: Math.min(...orderValues),
        max: Math.max(...orderValues),
        preferred: orderValues.reduce((sum, val) => sum + val, 0) / orderValues.length
      };
      
      // 행동 패턴 분석 (실제 구현에서는 더 정교한 분석)
      const browsingPattern = ['electronics', 'clothing', 'books']; // 임시 데이터
      const purchasePattern = ['online', 'mobile']; // 임시 데이터
      const timePattern = Array.from({ length: 24 }, (_, i) => ({ hour: i, frequency: Math.random() * 100 }));
      const devicePattern = [
        { device: 'mobile', frequency: 70 },
        { device: 'desktop', frequency: 30 }
      ];
      
      // 참여도 분석 (실제 구현에서는 실제 데이터 사용)
      const engagement = {
        emailOpenRate: Math.random() * 100,
        emailClickRate: Math.random() * 20,
        pushOpenRate: Math.random() * 30,
        websiteVisitFrequency: Math.random() * 10,
        sessionDuration: Math.random() * 300
      };
      
      return {
        userId,
        preferences: {
          categories: Array.from(categoryScores.entries()).map(([category, data]) => ({
            category,
            score: data.score,
            lastUpdated: data.lastUpdated
          })),
          brands: Array.from(brandScores.entries()).map(([brand, data]) => ({
            brand,
            score: data.score,
            lastUpdated: data.lastUpdated
          })),
          priceRange,
          colors: ['blue', 'black', 'white'], // 임시 데이터
          sizes: ['M', 'L'] // 임시 데이터
        },
        behavior: {
          browsingPattern,
          purchasePattern,
          timePattern,
          devicePattern
        },
        demographics: {
          age: 25, // 임시 데이터
          gender: 'male', // 임시 데이터
          location: 'Seoul', // 임시 데이터
          income: 'middle' // 임시 데이터
        },
        engagement,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('Error creating personalization profile:', error);
      throw error;
    }
  }
  
  // 고급 세그먼트 생성
  static async createAdvancedSegment(
    name: string,
    description: string,
    rules: AdvancedSegmentRule[],
    behavioralPatterns?: BehavioralPattern[]
  ): Promise<string> {
    try {
      await connectDB();
      
      const segment = new CustomerSegment({
        name,
        description,
        rules: {
          basic: rules,
          behavioral: behavioralPatterns || []
        },
        type: 'advanced',
        status: 'active',
        createdBy: 'system', // 실제 구현에서는 현재 사용자 ID
        stats: {
          totalUsers: 0,
          lastUpdated: new Date(),
          updateCount: 0
        }
      });
      
      await segment.save();
      
      // 세그먼트 멤버 계산
      await this.calculateSegmentMembers(segment._id.toString());
      
      return segment._id.toString();
      
    } catch (error) {
      console.error('Error creating advanced segment:', error);
      throw error;
    }
  }
  
  // 세그먼트 멤버 계산
  static async calculateSegmentMembers(segmentId: string): Promise<void> {
    try {
      await connectDB();
      
      const segment = await CustomerSegment.findById(segmentId);
      if (!segment) throw new Error('Segment not found');
      
      // 기존 멤버십 삭제
      await SegmentMembership.deleteMany({ segmentId });
      
      // 모든 사용자 조회
      const users = await User.find({});
      const members: any[] = [];
      
      for (const user of users) {
        if (await this.evaluateUserForSegment(user._id.toString(), segment)) {
          members.push({
            userId: user._id,
            segmentId: segment._id,
            joinedAt: new Date()
          });
        }
      }
      
      // 멤버십 일괄 생성
      if (members.length > 0) {
        await SegmentMembership.insertMany(members);
      }
      
      // 세그먼트 통계 업데이트
      await CustomerSegment.findByIdAndUpdate(segmentId, {
        'stats.totalUsers': members.length,
        'stats.lastUpdated': new Date(),
        $inc: { 'stats.updateCount': 1 }
      });
      
    } catch (error) {
      console.error('Error calculating segment members:', error);
      throw error;
    }
  }
  
  // 사용자 세그먼트 평가
  private static async evaluateUserForSegment(userId: string, segment: any): Promise<boolean> {
    try {
      // 기본 규칙 평가
      for (const rule of segment.rules.basic || []) {
        if (!await this.evaluateRule(userId, rule)) {
          return false;
        }
      }
      
      // 행동 패턴 평가
      for (const pattern of segment.rules.behavioral || []) {
        if (!await this.evaluateBehavioralPattern(userId, pattern)) {
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('Error evaluating user for segment:', error);
      return false;
    }
  }
  
  // 규칙 평가
  private static async evaluateRule(userId: string, rule: AdvancedSegmentRule): Promise<boolean> {
    try {
      // 실제 구현에서는 사용자 데이터를 조회하여 규칙 평가
      // 여기서는 간단한 예시만 제공
      return true;
    } catch (error) {
      console.error('Error evaluating rule:', error);
      return false;
    }
  }
  
  // 행동 패턴 평가
  private static async evaluateBehavioralPattern(userId: string, pattern: BehavioralPattern): Promise<boolean> {
    try {
      // 실제 구현에서는 사용자 행동 데이터를 분석하여 패턴 평가
      // 여기서는 간단한 예시만 제공
      return true;
    } catch (error) {
      console.error('Error evaluating behavioral pattern:', error);
      return false;
    }
  }
  
  // RFM 점수 계산
  private static calculateRFMScore(value: number, type: 'recency' | 'frequency' | 'monetary'): number {
    // 실제 구현에서는 더 정교한 분위수 기반 점수 계산
    if (type === 'recency') {
      if (value <= 30) return 5;
      if (value <= 60) return 4;
      if (value <= 90) return 3;
      if (value <= 180) return 2;
      return 1;
    } else if (type === 'frequency') {
      if (value >= 20) return 5;
      if (value >= 10) return 4;
      if (value >= 5) return 3;
      if (value >= 2) return 2;
      return 1;
    } else { // monetary
      if (value >= 1000000) return 5;
      if (value >= 500000) return 4;
      if (value >= 200000) return 3;
      if (value >= 100000) return 2;
      return 1;
    }
  }
  
  // RFM 세그먼트 분류
  private static getRFMSegment(r: number, f: number, m: number): string {
    if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
    if (r >= 3 && f >= 3 && m >= 4) return 'Loyal Customers';
    if (r >= 4 && f >= 2 && m >= 3) return 'Potential Loyalists';
    if (r >= 4 && f >= 1 && m >= 1) return 'New Customers';
    if (r >= 3 && f >= 2 && m >= 2) return 'Promising';
    if (r >= 2 && f >= 3 && m >= 3) return 'Need Attention';
    if (r >= 2 && f >= 2 && m >= 2) return 'About to Sleep';
    if (r >= 1 && f >= 2 && m >= 2) return 'At Risk';
    if (r >= 1 && f >= 1 && m >= 1) return 'Cannot Lose Them';
    if (r >= 1 && f >= 1 && m >= 1) return 'Hibernating';
    return 'Lost Customers';
  }
  
  // LTV 세그먼트 분류
  private static getLTVSegment(ltv: number, predictedLtv: number): string {
    if (predictedLtv >= 1000000) return 'VIP';
    if (predictedLtv >= 500000) return 'High Value';
    if (predictedLtv >= 200000) return 'Medium Value';
    if (predictedLtv >= 100000) return 'Low Value';
    return 'New Customer';
  }
}
