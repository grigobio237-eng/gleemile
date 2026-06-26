import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';

// 고객 세분화 타입
export type CustomerSegment = 
  | 'vip'           // VIP 고객 (매출 상위 5%)
  | 'loyal'         // 충성 고객 (자주 구매)
  | 'regular'       // 일반 고객 (정기 구매)
  | 'new'           // 신규 고객 (최근 가입)
  | 'at_risk'       // 이탈 위험 고객 (구매 중단)
  | 'inactive';     // 비활성 고객 (장기간 미구매)

// 고객 분석 데이터 타입
export interface CustomerAnalytics {
  customerId: string;
  email: string;
  name: string;
  segment: CustomerSegment;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  firstOrderDate: Date | null;
  daysSinceLastOrder: number | null;
  favoriteCategory: string;
  orderFrequency: number; // 월 평균 주문 수
  lifetimeValue: number;
  riskScore: number; // 0-100 (높을수록 이탈 위험)
}

// 고객 분석 클래스
export class CustomerAnalyticsManager {
  // 고객 세분화 분석
  static async analyzeCustomerSegments(): Promise<{
    success: boolean;
    data?: {
      segments: Record<CustomerSegment, CustomerAnalytics[]>;
      summary: {
        totalCustomers: number;
        segmentDistribution: Record<CustomerSegment, number>;
        averageLifetimeValue: number;
        topSpenders: CustomerAnalytics[];
        atRiskCustomers: CustomerAnalytics[];
      };
    };
    message?: string;
  }> {
    try {
      await connectDB();

      // 모든 고객의 주문 데이터 조회
      const customers = await User.find({ role: 'user' });
      const customerAnalytics: CustomerAnalytics[] = [];

      for (const customer of customers) {
        const orders = await Order.find({ userId: customer.email })
          .populate('items.productId', 'category')
          .sort({ createdAt: 1 });

        if (orders.length === 0) continue;

        const analytics = await this.calculateCustomerAnalytics(customer, orders);
        customerAnalytics.push(analytics);
      }

      // 고객 세분화
      const segments = this.segmentCustomers(customerAnalytics);

      // 요약 통계
      const summary = this.calculateSummaryStats(customerAnalytics, segments);

      return {
        success: true,
        data: {
          segments,
          summary
        }
      };

    } catch (error) {
      console.error('고객 세분화 분석 오류:', error);
      return {
        success: false,
        message: '고객 세분화 분석 중 오류가 발생했습니다.'
      };
    }
  }

  // 개별 고객 분석 데이터 계산
  static async calculateCustomerAnalytics(customer: any, orders: any[]): Promise<CustomerAnalytics> {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalSpent / totalOrders;
    
    const firstOrderDate = orders[0]?.createdAt;
    const lastOrderDate = orders[orders.length - 1]?.createdAt;
    const daysSinceLastOrder = lastOrderDate 
      ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // 선호 카테고리 계산
    const categoryCount: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const category = item.productId?.category || 'unknown';
        categoryCount[category] = (categoryCount[category] || 0) + item.quantity;
      });
    });
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'unknown'
    );

    // 주문 빈도 계산 (월 평균)
    const monthsSinceFirstOrder = firstOrderDate 
      ? Math.max(1, Math.floor((Date.now() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24 * 30)))
      : 1;
    const orderFrequency = totalOrders / monthsSinceFirstOrder;

    // 이탈 위험 점수 계산 (0-100)
    const riskScore = this.calculateRiskScore({
      daysSinceLastOrder,
      orderFrequency,
      totalOrders,
      averageOrderValue
    });

    return {
      customerId: customer._id.toString(),
      email: customer.email,
      name: customer.name || 'Unknown',
      segment: 'regular', // 기본값, 나중에 세분화에서 업데이트
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
      firstOrderDate,
      daysSinceLastOrder,
      favoriteCategory,
      orderFrequency,
      lifetimeValue: totalSpent,
      riskScore
    };
  }

  // 고객 세분화
  static segmentCustomers(customers: CustomerAnalytics[]): Record<CustomerSegment, CustomerAnalytics[]> {
    const segments: Record<CustomerSegment, CustomerAnalytics[]> = {
      vip: [],
      loyal: [],
      regular: [],
      new: [],
      at_risk: [],
      inactive: []
    };

    // 총 고객 수
    const totalCustomers = customers.length;
    
    // VIP 고객 (매출 상위 5%)
    const vipThreshold = Math.ceil(totalCustomers * 0.05);
    const vipCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, vipThreshold);
    vipCustomers.forEach(customer => {
      customer.segment = 'vip';
      segments.vip.push(customer);
    });

    // 나머지 고객들 세분화
    const remainingCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(vipThreshold);

    remainingCustomers.forEach(customer => {
      // 신규 고객 (가입 후 30일 이내)
      const daysSinceFirstOrder = customer.firstOrderDate 
        ? Math.floor((Date.now() - new Date(customer.firstOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      if (daysSinceFirstOrder <= 30) {
        customer.segment = 'new';
        segments.new.push(customer);
        return;
      }

      // 이탈 위험 고객 (위험 점수 70 이상)
      if (customer.riskScore >= 70) {
        customer.segment = 'at_risk';
        segments.at_risk.push(customer);
        return;
      }

      // 비활성 고객 (90일 이상 미구매)
      if (customer.daysSinceLastOrder && customer.daysSinceLastOrder >= 90) {
        customer.segment = 'inactive';
        segments.inactive.push(customer);
        return;
      }

      // 충성 고객 (월 평균 2회 이상 주문)
      if (customer.orderFrequency >= 2) {
        customer.segment = 'loyal';
        segments.loyal.push(customer);
        return;
      }

      // 일반 고객
      customer.segment = 'regular';
      segments.regular.push(customer);
    });

    return segments;
  }

  // 이탈 위험 점수 계산
  static calculateRiskScore(params: {
    daysSinceLastOrder: number | null;
    orderFrequency: number;
    totalOrders: number;
    averageOrderValue: number;
  }): number {
    let score = 0;

    // 마지막 주문 후 경과 일수 (40점)
    if (params.daysSinceLastOrder !== null) {
      if (params.daysSinceLastOrder >= 90) score += 40;
      else if (params.daysSinceLastOrder >= 60) score += 30;
      else if (params.daysSinceLastOrder >= 30) score += 20;
      else if (params.daysSinceLastOrder >= 14) score += 10;
    }

    // 주문 빈도 (30점)
    if (params.orderFrequency < 0.5) score += 30;
    else if (params.orderFrequency < 1) score += 20;
    else if (params.orderFrequency < 2) score += 10;

    // 총 주문 수 (20점)
    if (params.totalOrders < 2) score += 20;
    else if (params.totalOrders < 5) score += 10;

    // 평균 주문액 (10점)
    if (params.averageOrderValue < 50000) score += 10;
    else if (params.averageOrderValue < 100000) score += 5;

    return Math.min(100, score);
  }

  // 요약 통계 계산
  static calculateSummaryStats(
    customers: CustomerAnalytics[], 
    segments: Record<CustomerSegment, CustomerAnalytics[]>
  ) {
    const totalCustomers = customers.length;
    const segmentDistribution: Record<CustomerSegment, number> = {
      vip: segments.vip.length,
      loyal: segments.loyal.length,
      regular: segments.regular.length,
      new: segments.new.length,
      at_risk: segments.at_risk.length,
      inactive: segments.inactive.length
    };

    const averageLifetimeValue = customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / customers.length 
      : 0;

    const topSpenders = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const atRiskCustomers = segments.at_risk
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return {
      totalCustomers,
      segmentDistribution,
      averageLifetimeValue,
      topSpenders,
      atRiskCustomers
    };
  }

  // 고객별 상세 분석
  static async getCustomerDetail(customerId: string): Promise<{
    success: boolean;
    data?: {
      customer: CustomerAnalytics;
      orderHistory: any[];
      categoryPreferences: Record<string, number>;
      monthlySpending: Array<{ month: string; amount: number }>;
      recommendations: string[];
    };
    message?: string;
  }> {
    try {
      await connectDB();

      const customer = await User.findById(customerId);
      if (!customer) {
        return { success: false, message: '고객을 찾을 수 없습니다.' };
      }

      const orders = await Order.find({ userId: customer.email })
        .populate('items.productId', 'name category price')
        .sort({ createdAt: -1 });

      const analytics = await this.calculateCustomerAnalytics(customer, orders);

      // 카테고리 선호도 분석
      const categoryPreferences: Record<string, number> = {};
      orders.forEach(order => {
        order.items.forEach((item: any) => {
          const category = item.productId?.category || 'unknown';
          categoryPreferences[category] = (categoryPreferences[category] || 0) + item.quantity;
        });
      });

      // 월별 지출 분석
      const monthlySpending: Record<string, number> = {};
      orders.forEach(order => {
        const month = new Date(order.createdAt).toISOString().slice(0, 7); // YYYY-MM
        monthlySpending[month] = (monthlySpending[month] || 0) + order.totalAmount;
      });

      const monthlySpendingArray = Object.entries(monthlySpending)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // 추천사항 생성
      const recommendations = this.generateRecommendations(analytics, categoryPreferences);

      return {
        success: true,
        data: {
          customer: analytics,
          orderHistory: orders.slice(0, 10), // 최근 10개 주문
          categoryPreferences,
          monthlySpending: monthlySpendingArray,
          recommendations
        }
      };

    } catch (error) {
      console.error('고객 상세 분석 오류:', error);
      return {
        success: false,
        message: '고객 상세 분석 중 오류가 발생했습니다.'
      };
    }
  }

  // 추천사항 생성
  static generateRecommendations(analytics: CustomerAnalytics, categoryPreferences: Record<string, number>): string[] {
    const recommendations: string[] = [];

    // 이탈 위험 고객
    if (analytics.riskScore >= 70) {
      recommendations.push('이탈 위험 고객입니다. 할인 쿠폰이나 특별 혜택을 제공하세요.');
    }

    // VIP 고객
    if (analytics.segment === 'vip') {
      recommendations.push('VIP 고객입니다. 프리미엄 서비스나 개인화된 혜택을 제공하세요.');
    }

    // 주문 빈도가 낮은 경우
    if (analytics.orderFrequency < 1) {
      recommendations.push('주문 빈도가 낮습니다. 정기 구독 서비스나 리마케팅을 고려하세요.');
    }

    // 선호 카테고리 기반 추천
    const topCategory = Object.keys(categoryPreferences).reduce((a, b) => 
      categoryPreferences[a] > categoryPreferences[b] ? a : b, 'unknown'
    );
    if (topCategory !== 'unknown') {
      recommendations.push(`${topCategory} 카테고리를 선호합니다. 관련 상품을 추천하세요.`);
    }

    // 평균 주문액이 낮은 경우
    if (analytics.averageOrderValue < 50000) {
      recommendations.push('평균 주문액이 낮습니다. 상품 번들링이나 업셀링을 고려하세요.');
    }

    return recommendations;
  }
}


