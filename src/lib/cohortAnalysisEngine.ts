import { CohortDefinition, CohortMember, CohortMetrics } from '@/models/CohortAnalysis';
import User from '@/models/User';
import UserBehavior from '@/models/UserBehavior';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export interface CohortAnalysisResult {
  cohortId: string;
  cohortName: string;
  cohortPeriod: string;
  totalMembers: number;
  metrics: {
    retention: Array<{
      period: number;
      periodType: 'day' | 'week' | 'month';
      activeUsers: number;
      retentionRate: number;
      churnRate: number;
    }>;
    revenue: Array<{
      period: number;
      periodType: 'day' | 'week' | 'month';
      totalRevenue: number;
      averageRevenuePerUser: number;
      cumulativeRevenue: number;
    }>;
    engagement: Array<{
      period: number;
      periodType: 'day' | 'week' | 'month';
      activeUsers: number;
      averageSessions: number;
      averagePageViews: number;
      averageTimeSpent: number;
    }>;
    purchase: Array<{
      period: number;
      periodType: 'day' | 'week' | 'month';
      purchasingUsers: number;
      totalOrders: number;
      averageOrderValue: number;
      repeatPurchaseRate: number;
    }>;
  };
  insights: Array<{
    type: 'retention_insight' | 'revenue_insight' | 'engagement_insight' | 'purchase_insight';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    data: any;
  }>;
}

export interface CohortComparisonResult {
  cohorts: Array<{
    cohortId: string;
    cohortName: string;
    cohortPeriod: string;
    metrics: CohortAnalysisResult['metrics'];
  }>;
  comparison: {
    bestPerformingCohort: string;
    worstPerformingCohort: string;
    averageRetentionRate: number;
    averageRevenuePerUser: number;
    insights: Array<{
      type: 'best_performing' | 'worst_performing' | 'trend' | 'anomaly';
      cohortName: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
      data: any;
    }>;
  };
}

export class CohortAnalysisEngine {
  // 코호트 분석 실행
  static async analyzeCohort(cohortId: string, analysisPeriod: number = 12): Promise<CohortAnalysisResult> {
    try {
      const cohort = await CohortDefinition.findById(cohortId);
      if (!cohort) {
        throw new Error('Cohort not found');
      }

      // 코호트 멤버 생성/업데이트
      await this.generateCohortMembers(cohort);

      // 코호트 멤버 조회
      const members = await CohortMember.find({ cohortId: cohort._id });
      
      if (members.length === 0) {
        throw new Error('No cohort members found');
      }

      // 코호트 기간별 분석
      const cohortPeriods = this.getCohortPeriods(cohort, analysisPeriod);
      const analysisResults: CohortAnalysisResult = {
        cohortId: cohort._id.toString(),
        cohortName: cohort.name,
        cohortPeriod: this.getCohortPeriodString(cohort),
        totalMembers: members.length,
        metrics: {
          retention: [],
          revenue: [],
          engagement: [],
          purchase: []
        },
        insights: []
      };

      // 각 기간별 메트릭 계산
      for (const period of cohortPeriods) {
        // 유지율 분석
        const retentionMetrics = await this.calculateRetentionMetrics(cohort, members, period);
        analysisResults.metrics.retention.push(retentionMetrics);

        // 수익 분석
        const revenueMetrics = await this.calculateRevenueMetrics(cohort, members, period);
        analysisResults.metrics.revenue.push(revenueMetrics);

        // 참여도 분석
        const engagementMetrics = await this.calculateEngagementMetrics(cohort, members, period);
        analysisResults.metrics.engagement.push(engagementMetrics);

        // 구매 분석
        const purchaseMetrics = await this.calculatePurchaseMetrics(cohort, members, period);
        analysisResults.metrics.purchase.push(purchaseMetrics);
      }

      // 인사이트 생성
      analysisResults.insights = await this.generateCohortInsights(analysisResults);

      // 결과 저장
      await this.saveCohortMetrics(cohort, analysisResults);

      return analysisResults;

    } catch (error) {
      console.error('Cohort analysis error:', error);
      throw error;
    }
  }

  // 코호트 멤버 생성
  private static async generateCohortMembers(cohort: any): Promise<void> {
    try {
      // 기존 멤버 삭제
      await CohortMember.deleteMany({ cohortId: cohort._id });

      // 사용자 조회 조건 생성
      const userFilter = await this.buildUserFilter(cohort);
      const users = await User.find(userFilter);

      // 각 사용자에 대해 코호트 멤버 생성
      for (const user of users) {
        const cohortDate = await this.getCohortDate(user, cohort);
        if (cohortDate) {
          const cohortPeriod = this.getCohortPeriod(cohortDate, cohort.cohortType);
          
          const member = new CohortMember({
            cohortId: cohort._id,
            userId: user._id,
            cohortDate,
            cohortPeriod,
            userContext: {
              deviceType: user.deviceType || 'desktop',
              browser: this.extractBrowser(user.userAgent || ''),
              country: user.country || 'Unknown',
              trafficSource: user.trafficSource || 'direct',
              userSegment: user.segmentIds?.[0],
              age: user.age,
              gender: user.gender
            },
            metadata: {
              source: user.signupSource || 'direct',
              campaignId: user.campaignId,
              referrer: user.referrer,
              customData: {
                signupDate: user.createdAt,
                lastLogin: user.lastLoginAt
              }
            }
          });

          await member.save();
        }
      }
    } catch (error) {
      console.error('Error generating cohort members:', error);
      throw error;
    }
  }

  // 사용자 필터 생성
  private static async buildUserFilter(cohort: any): Promise<any> {
    const filter: any = {};

    switch (cohort.cohortType) {
      case 'signup':
        if (cohort.criteria.signupDateRange) {
          filter.createdAt = {
            $gte: cohort.criteria.signupDateRange.startDate,
            $lte: cohort.criteria.signupDateRange.endDate
          };
        }
        break;

      case 'first_purchase':
        if (cohort.criteria.firstPurchaseDateRange) {
          // 첫 구매일 기준으로 필터링
          filter.firstPurchaseDate = {
            $gte: cohort.criteria.firstPurchaseDateRange.startDate,
            $lte: cohort.criteria.firstPurchaseDateRange.endDate
          };
        }
        break;

      case 'product_category':
        if (cohort.criteria.productCategories) {
          // 특정 제품 카테고리를 구매한 사용자
          filter.purchasedCategories = { $in: cohort.criteria.productCategories };
        }
        break;

      case 'subscription':
        if (cohort.criteria.subscriptionTypes) {
          filter.subscriptionType = { $in: cohort.criteria.subscriptionTypes };
        }
        break;

      case 'custom':
        // 커스텀 조건 처리
        for (const condition of cohort.criteria.customConditions || []) {
          filter[condition.field] = this.buildCustomCondition(condition);
        }
        break;
    }

    // 추가 필터 적용
    if (cohort.filters.deviceTypes && cohort.filters.deviceTypes.length > 0) {
      filter.deviceType = { $in: cohort.filters.deviceTypes };
    }

    if (cohort.filters.trafficSources && cohort.filters.trafficSources.length > 0) {
      filter.trafficSource = { $in: cohort.filters.trafficSources };
    }

    if (cohort.filters.countries && cohort.filters.countries.length > 0) {
      filter.country = { $in: cohort.filters.countries };
    }

    if (cohort.filters.ageRanges && cohort.filters.ageRanges.length > 0) {
      const ageConditions = cohort.filters.ageRanges.map((range: any) => ({
        age: { $gte: range.min, $lte: range.max }
      }));
      filter.$or = ageConditions;
    }

    return filter;
  }

  // 커스텀 조건 빌드
  private static buildCustomCondition(condition: any): any {
    switch (condition.operator) {
      case 'equals':
        return condition.value;
      case 'not_equals':
        return { $ne: condition.value };
      case 'greater_than':
        return { $gt: condition.value };
      case 'less_than':
        return { $lt: condition.value };
      case 'contains':
        return { $regex: condition.value, $options: 'i' };
      case 'in':
        return { $in: condition.value };
      case 'not_in':
        return { $nin: condition.value };
      default:
        return condition.value;
    }
  }

  // 코호트 날짜 가져오기
  private static async getCohortDate(user: any, cohort: any): Promise<Date | null> {
    switch (cohort.cohortType) {
      case 'signup':
        return user.createdAt;

      case 'first_purchase':
        // 첫 구매일 조회
        const firstOrder = await Order.findOne({ userId: user._id })
          .sort({ createdAt: 1 });
        return firstOrder ? firstOrder.createdAt : null;

      case 'product_category':
        // 특정 카테고리 첫 구매일 조회
        const categoryOrder = await Order.findOne({
          userId: user._id,
          'items.category': { $in: cohort.criteria.productCategories }
        }).sort({ createdAt: 1 });
        return categoryOrder ? categoryOrder.createdAt : null;

      case 'subscription':
        return user.subscriptionStartDate || user.createdAt;

      default:
        return user.createdAt;
    }
  }

  // 코호트 기간 문자열 생성
  private static getCohortPeriodString(cohort: any): string {
    switch (cohort.cohortType) {
      case 'signup':
        if (cohort.criteria.signupDateRange) {
          const start = cohort.criteria.signupDateRange.startDate;
          const end = cohort.criteria.signupDateRange.endDate;
          return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')} ~ ${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
        }
        break;
      case 'first_purchase':
        if (cohort.criteria.firstPurchaseDateRange) {
          const start = cohort.criteria.firstPurchaseDateRange.startDate;
          const end = cohort.criteria.firstPurchaseDateRange.endDate;
          return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')} ~ ${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
        }
        break;
    }
    return 'Custom Period';
  }

  // 코호트 기간 가져오기
  private static getCohortPeriod(cohortDate: Date, cohortType: string): string {
    const year = cohortDate.getFullYear();
    const month = String(cohortDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // 분석 기간 생성
  private static getCohortPeriods(cohort: any, analysisPeriod: number): Array<{ period: number; periodType: 'day' | 'week' | 'month' }> {
    const periods = [];
    for (let i = 0; i < analysisPeriod; i++) {
      periods.push({
        period: i + 1,
        periodType: 'month' as 'day' | 'week' | 'month'
      });
    }
    return periods;
  }

  // 유지율 메트릭 계산
  private static async calculateRetentionMetrics(
    cohort: any,
    members: any[],
    period: { period: number; periodType: 'day' | 'week' | 'month' }
  ): Promise<any> {
    const memberIds = members.map(m => m.userId);
    const cohortDate = members[0]?.cohortDate;
    
    if (!cohortDate) {
      return {
        period: period.period,
        periodType: period.periodType,
        activeUsers: 0,
        retentionRate: 0,
        churnRate: 100
      };
    }

    // 기간 계산
    const periodStart = this.addPeriodToDate(cohortDate, period.period, period.periodType);
    const periodEnd = this.addPeriodToDate(periodStart, 1, period.periodType);

    // 해당 기간에 활동한 사용자 수
    const activeUsers = await UserBehavior.countDocuments({
      userId: { $in: memberIds },
      timestamp: {
        $gte: periodStart,
        $lt: periodEnd
      }
    });

    const retentionRate = members.length > 0 ? (activeUsers / members.length) * 100 : 0;
    const churnRate = 100 - retentionRate;

    return {
      period: period.period,
      periodType: period.periodType,
      activeUsers,
      retentionRate,
      churnRate
    };
  }

  // 수익 메트릭 계산
  private static async calculateRevenueMetrics(
    cohort: any,
    members: any[],
    period: { period: number; periodType: 'day' | 'week' | 'month' }
  ): Promise<any> {
    const memberIds = members.map(m => m.userId);
    const cohortDate = members[0]?.cohortDate;
    
    if (!cohortDate) {
      return {
        period: period.period,
        periodType: period.periodType,
        totalRevenue: 0,
        averageRevenuePerUser: 0,
        cumulativeRevenue: 0
      };
    }

    // 기간 계산
    const periodStart = this.addPeriodToDate(cohortDate, period.period, period.periodType);
    const periodEnd = this.addPeriodToDate(periodStart, 1, period.periodType);

    // 해당 기간의 주문 조회
    const orders = await Order.find({
      userId: { $in: memberIds },
      createdAt: {
        $gte: periodStart,
        $lt: periodEnd
      },
      status: { $in: ['completed', 'delivered'] }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageRevenuePerUser = members.length > 0 ? totalRevenue / members.length : 0;

    // 누적 수익 계산
    const cumulativeOrders = await Order.find({
      userId: { $in: memberIds },
      createdAt: {
        $gte: cohortDate,
        $lt: periodEnd
      },
      status: { $in: ['completed', 'delivered'] }
    });

    const cumulativeRevenue = cumulativeOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      period: period.period,
      periodType: period.periodType,
      totalRevenue,
      averageRevenuePerUser,
      cumulativeRevenue
    };
  }

  // 참여도 메트릭 계산
  private static async calculateEngagementMetrics(
    cohort: any,
    members: any[],
    period: { period: number; periodType: 'day' | 'week' | 'month' }
  ): Promise<any> {
    const memberIds = members.map(m => m.userId);
    const cohortDate = members[0]?.cohortDate;
    
    if (!cohortDate) {
      return {
        period: period.period,
        periodType: period.periodType,
        activeUsers: 0,
        averageSessions: 0,
        averagePageViews: 0,
        averageTimeSpent: 0
      };
    }

    // 기간 계산
    const periodStart = this.addPeriodToDate(cohortDate, period.period, period.periodType);
    const periodEnd = this.addPeriodToDate(periodStart, 1, period.periodType);

    // 해당 기간의 사용자 행동 조회
    const behaviors = await UserBehavior.find({
      userId: { $in: memberIds },
      timestamp: {
        $gte: periodStart,
        $lt: periodEnd
      }
    });

    const activeUsers = new Set(behaviors.map(b => b.userId.toString())).size;
    
    // 세션별 통계
    const sessionStats = this.calculateSessionStats(behaviors);
    
    return {
      period: period.period,
      periodType: period.periodType,
      activeUsers,
      averageSessions: sessionStats.averageSessions,
      averagePageViews: sessionStats.averagePageViews,
      averageTimeSpent: sessionStats.averageTimeSpent
    };
  }

  // 구매 메트릭 계산
  private static async calculatePurchaseMetrics(
    cohort: any,
    members: any[],
    period: { period: number; periodType: 'day' | 'week' | 'month' }
  ): Promise<any> {
    const memberIds = members.map(m => m.userId);
    const cohortDate = members[0]?.cohortDate;
    
    if (!cohortDate) {
      return {
        period: period.period,
        periodType: period.periodType,
        purchasingUsers: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        repeatPurchaseRate: 0
      };
    }

    // 기간 계산
    const periodStart = this.addPeriodToDate(cohortDate, period.period, period.periodType);
    const periodEnd = this.addPeriodToDate(periodStart, 1, period.periodType);

    // 해당 기간의 주문 조회
    const orders = await Order.find({
      userId: { $in: memberIds },
      createdAt: {
        $gte: periodStart,
        $lt: periodEnd
      },
      status: { $in: ['completed', 'delivered'] }
    });

    const purchasingUsers = new Set(orders.map(o => o.userId.toString())).size;
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / totalOrders : 0;

    // 재구매율 계산 (이전 기간에 구매한 사용자 중 현재 기간에도 구매한 비율)
    const previousPeriodStart = this.addPeriodToDate(cohortDate, period.period - 1, period.periodType);
    const previousOrders = await Order.find({
      userId: { $in: memberIds },
      createdAt: {
        $gte: previousPeriodStart,
        $lt: periodStart
      },
      status: { $in: ['completed', 'delivered'] }
    });

    const previousPurchasingUsersSet = new Set(previousOrders.map(o => o.userId.toString()));
    const repeatPurchasingUsers = new Set(
      orders.filter(o => previousPurchasingUsersSet.has(o.userId.toString())).map(o => o.userId.toString())
    ).size;

    const repeatPurchaseRate = previousPurchasingUsersSet.size > 0 ? (repeatPurchasingUsers / previousPurchasingUsersSet.size) * 100 : 0;

    return {
      period: period.period,
      periodType: period.periodType,
      purchasingUsers,
      totalOrders,
      averageOrderValue,
      repeatPurchaseRate
    };
  }

  // 세션 통계 계산
  private static calculateSessionStats(behaviors: any[]): any {
    const sessionMap = new Map<string, any[]>();
    
    behaviors.forEach(behavior => {
      const sessionKey = `${behavior.userId}_${behavior.sessionId}`;
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, []);
      }
      sessionMap.get(sessionKey)!.push(behavior);
    });

    const sessions = Array.from(sessionMap.values());
    const averageSessions = sessions.length / new Set(behaviors.map(b => b.userId)).size;
    
    const averagePageViews = sessions.reduce((sum, session) => {
      const pageViews = session.filter(b => b.eventType === 'page_view').length;
      return sum + pageViews;
    }, 0) / sessions.length;

    const averageTimeSpent = sessions.reduce((sum, session) => {
      if (session.length < 2) return sum;
      const timeSpent = (session[session.length - 1].timestamp.getTime() - session[0].timestamp.getTime()) / 1000 / 60; // 분
      return sum + timeSpent;
    }, 0) / sessions.length;

    return {
      averageSessions,
      averagePageViews,
      averageTimeSpent
    };
  }

  // 날짜에 기간 추가
  private static addPeriodToDate(date: Date, period: number, periodType: 'day' | 'week' | 'month'): Date {
    const result = new Date(date);
    
    switch (periodType) {
      case 'day':
        result.setDate(result.getDate() + period);
        break;
      case 'week':
        result.setDate(result.getDate() + (period * 7));
        break;
      case 'month':
        result.setMonth(result.getMonth() + period);
        break;
    }
    
    return result;
  }

  // 브라우저 추출
  private static extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // 코호트 인사이트 생성
  private static async generateCohortInsights(analysis: CohortAnalysisResult): Promise<any[]> {
    const insights: any[] = [];

    // 유지율 인사이트
    const retentionInsights = this.generateRetentionInsights(analysis);
    insights.push(...retentionInsights);

    // 수익 인사이트
    const revenueInsights = this.generateRevenueInsights(analysis);
    insights.push(...revenueInsights);

    // 참여도 인사이트
    const engagementInsights = this.generateEngagementInsights(analysis);
    insights.push(...engagementInsights);

    // 구매 인사이트
    const purchaseInsights = this.generatePurchaseInsights(analysis);
    insights.push(...purchaseInsights);

    return insights;
  }

  // 유지율 인사이트 생성
  private static generateRetentionInsights(analysis: CohortAnalysisResult): any[] {
    const insights: any[] = [];
    const { retention } = analysis.metrics;

    if (retention.length === 0) return insights;

    // 첫 달 유지율 분석
    const firstMonthRetention = retention.find(r => r.period === 1);
    if (firstMonthRetention) {
      if (firstMonthRetention.retentionRate < 30) {
        insights.push({
          type: 'retention_insight',
          message: `첫 달 유지율이 ${firstMonthRetention.retentionRate.toFixed(1)}%로 매우 낮습니다.`,
          severity: 'critical',
          recommendations: [
            '온보딩 프로세스 개선',
            '첫 구매 인센티브 제공',
            '사용자 피드백 수집 및 개선',
            '이메일 마케팅 강화'
          ],
          data: { retentionRate: firstMonthRetention.retentionRate }
        });
      } else if (firstMonthRetention.retentionRate > 70) {
        insights.push({
          type: 'retention_insight',
          message: `첫 달 유지율이 ${firstMonthRetention.retentionRate.toFixed(1)}%로 우수합니다.`,
          severity: 'low',
          recommendations: [
            '성공 요인 분석 및 다른 코호트에 적용',
            '고객 만족도 조사 실시',
            '추천 프로그램 도입'
          ],
          data: { retentionRate: firstMonthRetention.retentionRate }
        });
      }
    }

    // 유지율 하락 패턴 분석
    const retentionDecline = this.analyzeRetentionDecline(retention);
    if (retentionDecline.severity !== 'low') {
      insights.push({
        type: 'retention_insight',
        message: `유지율이 ${retentionDecline.period}개월부터 급격히 하락하기 시작합니다.`,
        severity: retentionDecline.severity,
        recommendations: [
          '해당 시점의 사용자 경험 개선',
          '리텐션 마케팅 캠페인 실행',
          '고객 지원 강화',
          '제품 업데이트 및 개선'
        ],
        data: retentionDecline
      });
    }

    return insights;
  }

  // 수익 인사이트 생성
  private static generateRevenueInsights(analysis: CohortAnalysisResult): any[] {
    const insights: any[] = [];
    const { revenue } = analysis.metrics;

    if (revenue.length === 0) return insights;

    // ARPU 분석
    const averageARPU = revenue.reduce((sum, r) => sum + r.averageRevenuePerUser, 0) / revenue.length;
    if (averageARPU < 10) {
      insights.push({
        type: 'revenue_insight',
        message: `평균 사용자당 수익(ARPU)이 ${averageARPU.toFixed(2)}원으로 낮습니다.`,
        severity: 'high',
        recommendations: [
          '제품 가격 최적화',
          '고가 제품 추천 강화',
          '번들 상품 마케팅',
          '프리미엄 서비스 도입'
        ],
        data: { averageARPU }
      });
    }

    // 수익 성장 패턴 분석
    const revenueGrowth = this.analyzeRevenueGrowth(revenue);
    if (revenueGrowth.isGrowing) {
      insights.push({
        type: 'revenue_insight',
        message: `수익이 지속적으로 성장하고 있습니다. (${revenueGrowth.growthRate.toFixed(1)}% 증가)`,
        severity: 'low',
        recommendations: [
          '성공 요인 분석 및 확산',
          '마케팅 투자 확대',
          '제품 라인 확장'
        ],
        data: revenueGrowth
      });
    }

    return insights;
  }

  // 참여도 인사이트 생성
  private static generateEngagementInsights(analysis: CohortAnalysisResult): any[] {
    const insights: any[] = [];
    const { engagement } = analysis.metrics;

    if (engagement.length === 0) return insights;

    // 평균 세션 수 분석
    const averageSessions = engagement.reduce((sum, e) => sum + e.averageSessions, 0) / engagement.length;
    if (averageSessions < 2) {
      insights.push({
        type: 'engagement_insight',
        message: `평균 세션 수가 ${averageSessions.toFixed(1)}회로 낮습니다.`,
        severity: 'medium',
        recommendations: [
          '앱 푸시 알림 강화',
          '이메일 마케팅 최적화',
          '콘텐츠 품질 개선',
          '개인화 추천 시스템 강화'
        ],
        data: { averageSessions }
      });
    }

    return insights;
  }

  // 구매 인사이트 생성
  private static generatePurchaseInsights(analysis: CohortAnalysisResult): any[] {
    const insights: any[] = [];
    const { purchase } = analysis.metrics;

    if (purchase.length === 0) return insights;

    // 재구매율 분석
    const averageRepeatRate = purchase.reduce((sum, p) => sum + p.repeatPurchaseRate, 0) / purchase.length;
    if (averageRepeatRate < 20) {
      insights.push({
        type: 'purchase_insight',
        message: `재구매율이 ${averageRepeatRate.toFixed(1)}%로 낮습니다.`,
        severity: 'high',
        recommendations: [
          '고객 충성도 프로그램 도입',
          '재구매 인센티브 제공',
          '제품 품질 개선',
          '고객 서비스 강화'
        ],
        data: { averageRepeatRate }
      });
    }

    return insights;
  }

  // 유지율 하락 패턴 분석
  private static analyzeRetentionDecline(retention: any[]): any {
    if (retention.length < 3) return { severity: 'low' };

    let maxDecline = 0;
    let declinePeriod = 0;

    for (let i = 1; i < retention.length; i++) {
      const decline = retention[i - 1].retentionRate - retention[i].retentionRate;
      if (decline > maxDecline) {
        maxDecline = decline;
        declinePeriod = retention[i].period;
      }
    }

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (maxDecline > 30) severity = 'critical';
    else if (maxDecline > 20) severity = 'high';
    else if (maxDecline > 10) severity = 'medium';

    return {
      period: declinePeriod,
      maxDecline,
      severity
    };
  }

  // 수익 성장 패턴 분석
  private static analyzeRevenueGrowth(revenue: any[]): any {
    if (revenue.length < 2) return { isGrowing: false, growthRate: 0 };

    const firstRevenue = revenue[0].totalRevenue;
    const lastRevenue = revenue[revenue.length - 1].totalRevenue;
    const growthRate = firstRevenue > 0 ? ((lastRevenue - firstRevenue) / firstRevenue) * 100 : 0;

    return {
      isGrowing: growthRate > 10,
      growthRate
    };
  }

  // 코호트 메트릭 저장
  private static async saveCohortMetrics(cohort: any, analysis: CohortAnalysisResult): Promise<void> {
    try {
      const cohortMetrics = new CohortMetrics({
        cohortId: cohort._id,
        cohortPeriod: analysis.cohortPeriod,
        cohortDate: new Date(),
        totalMembers: analysis.totalMembers,
        metrics: analysis.metrics,
        timeRange: {
          startDate: new Date(),
          endDate: new Date()
        }
      });

      await cohortMetrics.save();
    } catch (error) {
      console.error('Error saving cohort metrics:', error);
    }
  }

  // 코호트 비교 분석
  static async compareCohorts(cohortIds: string[]): Promise<CohortComparisonResult> {
    try {
      const cohortAnalyses = await Promise.all(
        cohortIds.map(id => this.analyzeCohort(id))
      );

      const comparison = this.generateComparisonInsights(cohortAnalyses);

      return {
        cohorts: cohortAnalyses.map(analysis => ({
          cohortId: analysis.cohortId,
          cohortName: analysis.cohortName,
          cohortPeriod: analysis.cohortPeriod,
          metrics: analysis.metrics
        })),
        comparison
      };

    } catch (error) {
      console.error('Cohort comparison error:', error);
      throw error;
    }
  }

  // 비교 인사이트 생성
  private static generateComparisonInsights(analyses: CohortAnalysisResult[]): any {
    const insights: any[] = [];
    
    // 최고/최저 성과 코호트 찾기
    const retentionRates = analyses.map(a => a.metrics.retention[0]?.retentionRate || 0);
    const bestIndex = retentionRates.indexOf(Math.max(...retentionRates));
    const worstIndex = retentionRates.indexOf(Math.min(...retentionRates));

    insights.push({
      type: 'best_performing',
      cohortName: analyses[bestIndex].cohortName,
      message: `${analyses[bestIndex].cohortName}이 가장 높은 유지율을 보입니다.`,
      severity: 'low',
      recommendations: ['성공 요인 분석 및 다른 코호트에 적용'],
      data: { retentionRate: retentionRates[bestIndex] }
    });

    insights.push({
      type: 'worst_performing',
      cohortName: analyses[worstIndex].cohortName,
      message: `${analyses[worstIndex].cohortName}의 유지율이 가장 낮습니다.`,
      severity: 'high',
      recommendations: ['개선 방안 수립 및 실행'],
      data: { retentionRate: retentionRates[worstIndex] }
    });

    return {
      bestPerformingCohort: analyses[bestIndex].cohortName,
      worstPerformingCohort: analyses[worstIndex].cohortName,
      averageRetentionRate: retentionRates.reduce((sum, rate) => sum + rate, 0) / retentionRates.length,
      averageRevenuePerUser: 0, // 계산 로직 추가 필요
      insights
    };
  }
}
