import User from '@/models/User';
import Order from '@/models/Order';
import SegmentMembership from '@/models/SegmentMembership';
import CustomerSegment, { ICustomerSegment } from '@/models/CustomerSegment';

export interface SegmentationRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'between' | 'is_null' | 'is_not_null' | 'regex';
  value: any;
  value2?: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface UserData {
  _id: string;
  // 기본 정보
  email: string;
  name: string;
  age?: number;
  gender?: string;
  location?: string;
  language?: string;
  registrationDate: Date;
  lastLoginDate?: Date;
  
  // 구매 정보
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  lastOrderDate?: Date;
  firstOrderDate?: Date;
  
  // 웹사이트 행동
  pageViews: number;
  sessionDuration: number;
  bounceRate: number;
  lastVisitDate?: Date;
  
  // 이메일 행동
  emailOpens: number;
  emailClicks: number;
  lastEmailOpen?: Date;
  lastEmailClick?: Date;
  unsubscribed: boolean;
  
  // 앱 행동
  loginCount: number;
  pushNotificationEnabled: boolean;
  appVersion?: string;
  
  // RFM 점수
  rfmRecency: number;
  rfmFrequency: number;
  rfmMonetary: number;
  rfmScore: string;
  
  // 생명주기 단계
  lifecycleStage: 'new' | 'active' | 'at_risk' | 'churned' | 'loyal';
  
  // 예측 점수
  churnProbability: number;
  purchaseProbability: number;
  lifetimeValue: number;
  nextPurchaseDate?: Date;
}

export class SegmentationEngine {
  // 사용자 데이터 수집
  static async collectUserData(userId: string): Promise<UserData | null> {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      // 주문 데이터 집계
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const orderCount = orders.length;
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      const lastOrderDate = orders.length > 0 ? orders[0].createdAt : undefined;
      const firstOrderDate = orders.length > 0 ? orders[orders.length - 1].createdAt : undefined;

      // RFM 점수 계산
      const rfmScores = this.calculateRFMScore(orders, user.createdAt);
      
      // 생명주기 단계 계산
      const lifecycleStage = this.calculateLifecycleStage(user, orders);
      
      // 예측 점수 계산 (간단한 휴리스틱)
      const churnProbability = this.calculateChurnProbability(user, orders);
      const purchaseProbability = this.calculatePurchaseProbability(user, orders);
      const lifetimeValue = this.calculateLifetimeValue(user, orders);

      return {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        location: user.location,
        language: user.language,
        registrationDate: user.createdAt,
        lastLoginDate: user.lastLoginDate,
        totalSpent,
        orderCount,
        avgOrderValue,
        lastOrderDate,
        firstOrderDate,
        pageViews: user.pageViews || 0,
        sessionDuration: user.sessionDuration || 0,
        bounceRate: user.bounceRate || 0,
        lastVisitDate: user.lastVisitDate,
        emailOpens: user.emailOpens || 0,
        emailClicks: user.emailClicks || 0,
        lastEmailOpen: user.lastEmailOpen,
        lastEmailClick: user.lastEmailClick,
        unsubscribed: user.unsubscribed || false,
        loginCount: user.loginCount || 0,
        pushNotificationEnabled: user.pushNotificationEnabled || false,
        appVersion: user.appVersion,
        rfmRecency: rfmScores.recency,
        rfmFrequency: rfmScores.frequency,
        rfmMonetary: rfmScores.monetary,
        rfmScore: rfmScores.score,
        lifecycleStage,
        churnProbability,
        purchaseProbability,
        lifetimeValue,
        nextPurchaseDate: this.predictNextPurchaseDate(orders)
      };
    } catch (error) {
      console.error('Error collecting user data:', error);
      return null;
    }
  }

  // RFM 점수 계산
  private static calculateRFMScore(orders: any[], registrationDate: Date): { recency: number; frequency: number; monetary: number; score: string } {
    const now = new Date();
    const daysSinceRegistration = Math.ceil((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Recency (최근성)
    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : registrationDate;
    const daysSinceLastOrder = Math.ceil((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
    const recency = this.scoreToRFM(daysSinceLastOrder, [30, 60, 90, 180], true); // 낮을수록 좋음
    
    // Frequency (빈도)
    const frequency = this.scoreToRFM(orders.length, [1, 3, 5, 10], false); // 높을수록 좋음
    
    // Monetary (금액)
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const monetary = this.scoreToRFM(totalSpent, [10000, 50000, 100000, 300000], false); // 높을수록 좋음
    
    return {
      recency,
      frequency,
      monetary,
      score: `${recency}${frequency}${monetary}`
    };
  }

  // 값을 RFM 점수(1-5)로 변환
  private static scoreToRFM(value: number, thresholds: number[], reverse: boolean = false): number {
    const sortedThresholds = [...thresholds].sort((a, b) => a - b);
    
    for (let i = 0; i < sortedThresholds.length; i++) {
      if (value <= sortedThresholds[i]) {
        return reverse ? 5 - i : i + 1;
      }
    }
    return reverse ? 1 : 5;
  }

  // 생명주기 단계 계산
  private static calculateLifecycleStage(user: any, orders: any[]): 'new' | 'active' | 'at_risk' | 'churned' | 'loyal' {
    const now = new Date();
    const daysSinceRegistration = Math.ceil((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastOrder = orders.length > 0 ? 
      Math.ceil((now.getTime() - orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 
      daysSinceRegistration;
    
    if (daysSinceRegistration <= 30) return 'new';
    if (daysSinceLastOrder > 90) return 'churned';
    if (daysSinceLastOrder > 30) return 'at_risk';
    if (orders.length >= 5) return 'loyal';
    return 'active';
  }

  // 이탈 확률 계산
  private static calculateChurnProbability(user: any, orders: any[]): number {
    const now = new Date();
    const daysSinceLastOrder = orders.length > 0 ? 
      Math.ceil((now.getTime() - orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 
      Math.ceil((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // 간단한 휴리스틱 기반 계산
    let probability = 0;
    
    if (daysSinceLastOrder > 90) probability += 0.8;
    else if (daysSinceLastOrder > 60) probability += 0.5;
    else if (daysSinceLastOrder > 30) probability += 0.2;
    
    if (orders.length === 0) probability += 0.3;
    else if (orders.length === 1) probability += 0.1;
    
    if (user.unsubscribed) probability += 0.4;
    
    return Math.min(probability, 1);
  }

  // 구매 확률 계산
  private static calculatePurchaseProbability(user: any, orders: any[]): number {
    const now = new Date();
    const daysSinceLastOrder = orders.length > 0 ? 
      Math.ceil((now.getTime() - orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 
      Math.ceil((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // 간단한 휴리스틱 기반 계산
    let probability = 0.1; // 기본 확률
    
    if (daysSinceLastOrder <= 7) probability += 0.6;
    else if (daysSinceLastOrder <= 14) probability += 0.4;
    else if (daysSinceLastOrder <= 30) probability += 0.2;
    
    if (orders.length > 0) probability += 0.3;
    if (user.emailOpens > 0) probability += 0.1;
    if (user.emailClicks > 0) probability += 0.2;
    
    return Math.min(probability, 1);
  }

  // 생애 가치 계산
  private static calculateLifetimeValue(user: any, orders: any[]): number {
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
    const avgOrderFrequency = orders.length > 0 ? 
      orders.length / Math.max(1, Math.ceil((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
    
    return avgOrderValue * avgOrderFrequency * 12; // 연간 예상 가치
  }

  // 다음 구매 예측 날짜
  private static predictNextPurchaseDate(orders: any[]): Date | undefined {
    if (orders.length < 2) return undefined;
    
    // 간단한 평균 구매 간격 계산
    const intervals = [];
    for (let i = 0; i < orders.length - 1; i++) {
      const interval = orders[i].createdAt.getTime() - orders[i + 1].createdAt.getTime();
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const lastOrderDate = orders[0].createdAt;
    
    return new Date(lastOrderDate.getTime() + avgInterval);
  }

  // 세그먼트 규칙 평가
  static evaluateRules(userData: UserData, rules: SegmentationRule[]): boolean {
    if (rules.length === 0) return true;
    
    let result = this.evaluateRule(userData, rules[0]);
    
    for (let i = 1; i < rules.length; i++) {
      const ruleResult = this.evaluateRule(userData, rules[i]);
      const logicalOp = rules[i - 1].logicalOperator || 'AND';
      
      if (logicalOp === 'AND') {
        result = result && ruleResult;
      } else {
        result = result || ruleResult;
      }
    }
    
    return result;
  }

  // 단일 규칙 평가
  private static evaluateRule(userData: UserData, rule: SegmentationRule): boolean {
    const fieldValue = this.getFieldValue(userData, rule.field);
    
    switch (rule.operator) {
      case 'equals':
        return fieldValue === rule.value;
      case 'not_equals':
        return fieldValue !== rule.value;
      case 'greater_than':
        return Number(fieldValue) > Number(rule.value);
      case 'less_than':
        return Number(fieldValue) < Number(rule.value);
      case 'greater_equal':
        return Number(fieldValue) >= Number(rule.value);
      case 'less_equal':
        return Number(fieldValue) <= Number(rule.value);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase());
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
      case 'between':
        return Number(fieldValue) >= Number(rule.value) && Number(fieldValue) <= Number(rule.value2);
      case 'is_null':
        return fieldValue === null || fieldValue === undefined;
      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined;
      case 'regex':
        return new RegExp(rule.value).test(String(fieldValue));
      default:
        return false;
    }
  }

  // 필드 값 추출
  private static getFieldValue(userData: UserData, field: string): any {
    const fieldMap: { [key: string]: any } = {
      'age': userData.age,
      'gender': userData.gender,
      'location': userData.location,
      'language': userData.language,
      'totalSpent': userData.totalSpent,
      'orderCount': userData.orderCount,
      'avgOrderValue': userData.avgOrderValue,
      'lastOrderDate': userData.lastOrderDate,
      'firstOrderDate': userData.firstOrderDate,
      'pageViews': userData.pageViews,
      'sessionDuration': userData.sessionDuration,
      'bounceRate': userData.bounceRate,
      'lastVisitDate': userData.lastVisitDate,
      'emailOpens': userData.emailOpens,
      'emailClicks': userData.emailClicks,
      'lastEmailOpen': userData.lastEmailOpen,
      'lastEmailClick': userData.lastEmailClick,
      'unsubscribed': userData.unsubscribed,
      'loginCount': userData.loginCount,
      'pushNotificationEnabled': userData.pushNotificationEnabled,
      'appVersion': userData.appVersion,
      'rfmRecency': userData.rfmRecency,
      'rfmFrequency': userData.rfmFrequency,
      'rfmMonetary': userData.rfmMonetary,
      'rfmScore': userData.rfmScore,
      'lifecycleStage': userData.lifecycleStage,
      'churnProbability': userData.churnProbability,
      'purchaseProbability': userData.purchaseProbability,
      'lifetimeValue': userData.lifetimeValue,
      'nextPurchaseDate': userData.nextPurchaseDate
    };
    
    return fieldMap[field] || null;
  }

  // 세그먼트 계산 및 업데이트
  static async calculateSegment(segmentId: string): Promise<{ totalUsers: number; newUsers: string[]; removedUsers: string[] }> {
    try {
      const segment = await CustomerSegment.findById(segmentId);
      if (!segment) throw new Error('Segment not found');

      // 모든 활성 사용자 조회
      const users = await User.find({ status: 'active' });
      const newUsers: string[] = [];
      const removedUsers: string[] = [];
      
      // 기존 멤버십 조회
      const existingMemberships = await SegmentMembership.find({ 
        segmentId, 
        status: 'active' 
      });
      const existingUserIds = new Set(existingMemberships.map(m => m.userId.toString()));

      // 각 사용자에 대해 세그먼트 규칙 평가
      for (const user of users) {
        const userData = await this.collectUserData(user._id.toString());
        if (!userData) continue;

        const isEligible = this.evaluateRules(userData, segment.rules);
        const userId = user._id.toString();
        const isCurrentlyMember = existingUserIds.has(userId);

        if (isEligible && !isCurrentlyMember) {
          // 새 멤버 추가
          await this.addUserToSegment(userId, segmentId, userData);
          newUsers.push(userId);
        } else if (!isEligible && isCurrentlyMember) {
          // 멤버 제거
          await this.removeUserFromSegment(userId, segmentId);
          removedUsers.push(userId);
        }
      }

      // 세그먼트 통계 업데이트
      const totalUsers = await SegmentMembership.countDocuments({ segmentId, status: 'active' });
      await CustomerSegment.findByIdAndUpdate(segmentId, {
        'stats.totalUsers': totalUsers,
        'stats.lastUpdated': new Date(),
        $inc: { 'stats.updateCount': 1 }
      });

      return { totalUsers, newUsers, removedUsers };
    } catch (error) {
      console.error('Error calculating segment:', error);
      throw error;
    }
  }

  // 사용자를 세그먼트에 추가
  private static async addUserToSegment(userId: string, segmentId: string, userData: UserData): Promise<void> {
    const membership = new SegmentMembership({
      userId,
      segmentId,
      joinedAt: new Date(),
      status: 'active',
      score: this.calculateSegmentScore(userData),
      metadata: {
        userSnapshot: {
          totalSpent: userData.totalSpent,
          orderCount: userData.orderCount,
          avgOrderValue: userData.avgOrderValue,
          lastOrderDate: userData.lastOrderDate,
          registrationDate: userData.registrationDate,
          age: userData.age,
          gender: userData.gender,
          location: userData.location,
          deviceType: 'desktop' // 기본값
        },
        activity: {
          emailOpens: userData.emailOpens,
          emailClicks: userData.emailClicks,
          websiteVisits: 0, // 추후 업데이트
          purchases: userData.orderCount,
          totalSpent: userData.totalSpent,
          lastActivity: new Date()
        },
        characteristics: {
          rfmScore: userData.rfmScore,
          lifecycleStage: userData.lifecycleStage,
          engagementLevel: this.calculateEngagementLevel(userData),
          loyaltyLevel: this.calculateLoyaltyLevel(userData),
          riskLevel: this.calculateRiskLevel(userData)
        }
      }
    });

    await membership.save();
  }

  // 사용자를 세그먼트에서 제거
  private static async removeUserFromSegment(userId: string, segmentId: string): Promise<void> {
    await SegmentMembership.findOneAndUpdate(
      { userId, segmentId },
      { 
        status: 'inactive',
        leftAt: new Date()
      }
    );
  }

  // 세그먼트 적합도 점수 계산
  private static calculateSegmentScore(userData: UserData): number {
    // 간단한 점수 계산 (0-100)
    let score = 50; // 기본 점수
    
    // 구매 활동 기반 점수
    if (userData.orderCount > 0) score += 20;
    if (userData.totalSpent > 100000) score += 20;
    if (userData.avgOrderValue > 50000) score += 10;
    
    // 참여도 기반 점수
    if (userData.emailOpens > 0) score += 5;
    if (userData.emailClicks > 0) score += 5;
    if (userData.pageViews > 10) score += 5;
    
    // 최근성 기반 점수
    if (userData.lastOrderDate) {
      const daysSinceLastOrder = Math.ceil((Date.now() - userData.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastOrder <= 7) score += 10;
      else if (daysSinceLastOrder <= 30) score += 5;
    }
    
    return Math.min(Math.max(score, 0), 100);
  }

  // 참여도 레벨 계산
  private static calculateEngagementLevel(userData: UserData): 'low' | 'medium' | 'high' {
    let score = 0;
    
    if (userData.emailOpens > 0) score += 1;
    if (userData.emailClicks > 0) score += 2;
    if (userData.pageViews > 5) score += 1;
    if (userData.orderCount > 0) score += 2;
    
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  // 충성도 레벨 계산
  private static calculateLoyaltyLevel(userData: UserData): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (userData.totalSpent >= 1000000) return 'platinum';
    if (userData.totalSpent >= 500000) return 'gold';
    if (userData.totalSpent >= 100000) return 'silver';
    return 'bronze';
  }

  // 리스크 레벨 계산
  private static calculateRiskLevel(userData: UserData): 'low' | 'medium' | 'high' {
    if (userData.churnProbability >= 0.7) return 'high';
    if (userData.churnProbability >= 0.3) return 'medium';
    return 'low';
  }
}
