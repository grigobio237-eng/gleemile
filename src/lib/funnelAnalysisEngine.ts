import { FunnelAnalysis, FunnelStep, FunnelEvent } from '@/models/FunnelAnalysis';
import UserBehavior from '@/models/UserBehavior';
import User from '@/models/User';

export interface FunnelMetrics {
  totalUsers: number;
  stepConversions: Array<{
    stepId: string;
    stepName: string;
    stepOrder: number;
    users: number;
    conversionRate: number;
    dropOffRate: number;
    avgTimeToStep: number;
    dropOffUsers: number;
  }>;
  overallConversionRate: number;
  totalDropOffRate: number;
  avgTimeToConversion: number;
  insights: Array<{
    type: 'bottleneck' | 'opportunity' | 'anomaly' | 'trend';
    stepId: string;
    stepName: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    data: any;
  }>;
}

export interface FunnelComparison {
  currentPeriod: FunnelMetrics;
  previousPeriod: FunnelMetrics;
  improvements: Array<{
    stepName: string;
    conversionRateChange: number;
    dropOffRateChange: number;
    timeToStepChange: number;
  }>;
  overallImprovement: {
    conversionRateChange: number;
    dropOffRateChange: number;
    timeToConversionChange: number;
  };
}

export class FunnelAnalysisEngine {
  // 퍼널 분석 실행
  static async analyzeFunnel(funnelId: string): Promise<FunnelMetrics> {
    try {
      const funnel = await FunnelAnalysis.findById(funnelId).populate('steps');
      if (!funnel) {
        throw new Error('Funnel not found');
      }

      // 사용자 행동 데이터 수집
      const userEvents = await this.collectUserEvents(funnel);
      
      // 퍼널 메트릭 계산
      const metrics = await this.calculateFunnelMetrics(funnel, userEvents);
      
      // 인사이트 생성
      const insights = await this.generateInsights(funnel, metrics);
      
      // 결과 업데이트
      await FunnelAnalysis.findByIdAndUpdate(funnelId, {
        'metrics.totalUsers': metrics.totalUsers,
        'metrics.stepConversions': metrics.stepConversions,
        'metrics.overallConversionRate': metrics.overallConversionRate,
        'metrics.totalDropOffRate': metrics.totalDropOffRate,
        'metrics.avgTimeToConversion': metrics.avgTimeToConversion,
        'metrics.lastCalculatedAt': new Date(),
        insights
      });

      return metrics;

    } catch (error) {
      console.error('Funnel analysis error:', error);
      throw error;
    }
  }

  // 사용자 이벤트 수집
  private static async collectUserEvents(funnel: any): Promise<any[]> {
    const { timeWindow, filters } = funnel;
    
    // 기본 필터
    const baseFilter: any = {
      timestamp: {
        $gte: timeWindow.startDate,
        $lte: timeWindow.endDate
      }
    };

    // 추가 필터 적용
    if (filters.deviceTypes && filters.deviceTypes.length > 0) {
      baseFilter['context.deviceType'] = { $in: filters.deviceTypes };
    }

    if (filters.trafficSources && filters.trafficSources.length > 0) {
      baseFilter['eventData.utmSource'] = { $in: filters.trafficSources };
    }

    if (filters.countries && filters.countries.length > 0) {
      baseFilter['locationInfo.country'] = { $in: filters.countries };
    }

    // 사용자 행동 데이터 조회
    const behaviors = await UserBehavior.find(baseFilter)
      .sort({ userId: 1, timestamp: 1 });

    // 퍼널 이벤트로 변환
    const funnelEvents = await this.convertToFunnelEvents(funnel, behaviors);

    return funnelEvents;
  }

  // 행동 데이터를 퍼널 이벤트로 변환
  private static async convertToFunnelEvents(funnel: any, behaviors: any[]): Promise<any[]> {
    const funnelEvents: any[] = [];
    const userSessions = new Map<string, any[]>();

    // 사용자별 세션 그룹화
    behaviors.forEach(behavior => {
      const sessionKey = `${behavior.userId}_${behavior.sessionId}`;
      if (!userSessions.has(sessionKey)) {
        userSessions.set(sessionKey, []);
      }
      userSessions.get(sessionKey)!.push(behavior);
    });

    // 각 세션에 대해 퍼널 이벤트 생성
    for (const [sessionKey, sessionBehaviors] of userSessions) {
      const [userId, sessionId] = sessionKey.split('_');
      const userFunnelEvents = await this.processUserSession(
        funnel, 
        userId, 
        sessionId, 
        sessionBehaviors
      );
      funnelEvents.push(...userFunnelEvents);
    }

    return funnelEvents;
  }

  // 사용자 세션 처리
  private static async processUserSession(funnel: any, userId: string, sessionId: string, behaviors: any[]): Promise<any[]> {
    const funnelEvents: any[] = [];
    const stepMatches = new Map<string, any>();

    // 각 행동에 대해 퍼널 단계 매칭
    for (const behavior of behaviors) {
      for (const step of funnel.steps) {
        if (await this.matchesStepCondition(behavior, step)) {
          const stepKey = `${userId}_${sessionId}_${step._id}`;
          if (!stepMatches.has(stepKey)) {
            stepMatches.set(stepKey, {
              funnelId: funnel._id,
              userId,
              sessionId,
              stepId: step._id,
              stepName: step.stepName,
              stepOrder: step.stepOrder,
              eventType: behavior.eventType,
              eventData: {
                pageUrl: behavior.context?.pageUrl,
                elementSelector: behavior.behaviorData?.clickPosition ? 'click' : undefined,
                formData: behavior.behaviorData?.formData,
                customData: behavior.eventData,
                timestamp: behavior.timestamp
              },
              userContext: {
                deviceType: behavior.context?.deviceType || 'desktop',
                browser: this.extractBrowser(behavior.context?.userAgent || ''),
                country: behavior.locationInfo?.country || 'Unknown',
                trafficSource: behavior.eventData?.utmSource || 'direct',
                userSegment: behavior.userInfo?.segmentIds?.[0]
              },
              conversionData: {
                isConversion: step.isConversionStep,
                conversionValue: behavior.behaviorData?.value,
                conversionTime: this.calculateTimeToStep(behaviors, behavior.timestamp)
              },
              createdAt: behavior.timestamp
            });
          }
        }
      }
    }

    return Array.from(stepMatches.values());
  }

  // 단계 조건 매칭
  private static async matchesStepCondition(behavior: any, step: any): Promise<boolean> {
    const { conditions } = step;

    switch (step.stepType) {
      case 'page_view':
        return conditions.pageUrl ? 
          behavior.context?.pageUrl?.includes(conditions.pageUrl) : false;
      
      case 'click':
        return conditions.elementSelector ? 
          behavior.behaviorData?.clickPosition : false;
      
      case 'form_submit':
        return conditions.formName ? 
          behavior.behaviorData?.formData?.formName === conditions.formName : false;
      
      case 'purchase':
        return behavior.eventType === 'purchase';
      
      case 'custom':
        return conditions.customEvent ? 
          behavior.eventType === conditions.customEvent : false;
      
      default:
        return false;
    }
  }

  // 퍼널 메트릭 계산
  private static async calculateFunnelMetrics(funnel: any, userEvents: any[]): Promise<FunnelMetrics> {
    const totalUsers = new Set(userEvents.map(e => e.userId)).size;
    const stepConversions: any[] = [];

    // 각 단계별 메트릭 계산
    for (const step of funnel.steps) {
      const stepEvents = userEvents.filter(e => e.stepId.toString() === step._id.toString());
      const stepUsers = new Set(stepEvents.map(e => e.userId)).size;
      
      // 이전 단계 사용자 수 (첫 번째 단계는 전체 사용자)
      const previousStep = funnel.steps.find((s: any) => s.stepOrder === step.stepOrder - 1);
      const previousStepUsers = previousStep ? 
        new Set(userEvents.filter(e => e.stepId.toString() === previousStep._id.toString()).map(e => e.userId)).size :
        totalUsers;

      const conversionRate = previousStepUsers > 0 ? (stepUsers / previousStepUsers) * 100 : 0;
      const dropOffRate = previousStepUsers > 0 ? ((previousStepUsers - stepUsers) / previousStepUsers) * 100 : 0;
      const dropOffUsers = previousStepUsers - stepUsers;

      // 평균 도달 시간 계산
      const avgTimeToStep = this.calculateAvgTimeToStep(stepEvents);

      stepConversions.push({
        stepId: step._id.toString(),
        stepName: step.stepName,
        stepOrder: step.stepOrder,
        users: stepUsers,
        conversionRate,
        dropOffRate,
        avgTimeToStep,
        dropOffUsers
      });
    }

    // 전체 전환율 계산
    const finalStep = funnel.steps.find((s: any) => s.isConversionStep);
    const finalStepUsers = finalStep ? 
      new Set(userEvents.filter(e => e.stepId.toString() === finalStep._id.toString()).map(e => e.userId)).size : 0;
    const overallConversionRate = totalUsers > 0 ? (finalStepUsers / totalUsers) * 100 : 0;

    // 전체 이탈률 계산
    const totalDropOffRate = 100 - overallConversionRate;

    // 평균 전환 시간 계산
    const avgTimeToConversion = this.calculateAvgTimeToConversion(userEvents, funnel.steps);

    return {
      totalUsers,
      stepConversions,
      overallConversionRate,
      totalDropOffRate,
      avgTimeToConversion,
      insights: []
    };
  }

  // 평균 단계 도달 시간 계산
  private static calculateAvgTimeToStep(stepEvents: any[]): number {
    if (stepEvents.length === 0) return 0;

    const times = stepEvents.map(e => e.conversionData?.conversionTime || 0);
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  // 평균 전환 시간 계산
  private static calculateAvgTimeToConversion(userEvents: any[], steps: any[]): number {
    const conversionEvents = userEvents.filter(e => e.conversionData?.isConversion);
    if (conversionEvents.length === 0) return 0;

    const times = conversionEvents.map(e => e.conversionData?.conversionTime || 0);
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  // 단계 도달 시간 계산
  private static calculateTimeToStep(behaviors: any[], currentTimestamp: Date): number {
    if (behaviors.length === 0) return 0;

    const firstBehavior = behaviors[0];
    return (currentTimestamp.getTime() - firstBehavior.timestamp.getTime()) / 1000 / 60; // 분 단위
  }

  // 브라우저 추출
  private static extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // 인사이트 생성
  private static async generateInsights(funnel: any, metrics: FunnelMetrics): Promise<any[]> {
    const insights: any[] = [];

    // 병목 지점 분석
    const bottlenecks = this.identifyBottlenecks(metrics);
    insights.push(...bottlenecks);

    // 기회 분석
    const opportunities = this.identifyOpportunities(metrics);
    insights.push(...opportunities);

    // 이상치 분석
    const anomalies = this.identifyAnomalies(metrics);
    insights.push(...anomalies);

    return insights;
  }

  // 병목 지점 식별
  private static identifyBottlenecks(metrics: FunnelMetrics): any[] {
    const insights: any[] = [];
    const { stepConversions } = metrics;

    for (let i = 0; i < stepConversions.length - 1; i++) {
      const currentStep = stepConversions[i];
      const nextStep = stepConversions[i + 1];
      
      const dropOffRate = currentStep.dropOffRate;
      
      if (dropOffRate > 50) {
        insights.push({
          type: 'bottleneck',
          stepId: currentStep.stepId,
          stepName: currentStep.stepName,
          message: `${currentStep.stepName}에서 ${dropOffRate.toFixed(1)}%의 사용자가 이탈했습니다.`,
          severity: dropOffRate > 70 ? 'critical' : dropOffRate > 60 ? 'high' : 'medium',
          recommendations: [
            '페이지 로딩 속도 최적화',
            '사용자 인터페이스 개선',
            '명확한 행동 유도 버튼 추가',
            'A/B 테스트를 통한 최적화'
          ],
          data: {
            dropOffRate,
            dropOffUsers: currentStep.dropOffUsers,
            conversionRate: currentStep.conversionRate
          }
        });
      }
    }

    return insights;
  }

  // 기회 식별
  private static identifyOpportunities(metrics: FunnelMetrics): any[] {
    const insights: any[] = [];
    const { stepConversions } = metrics;

    // 높은 전환율을 보이는 단계 찾기
    const highConversionSteps = stepConversions.filter(step => step.conversionRate > 80);
    
    for (const step of highConversionSteps) {
      insights.push({
        type: 'opportunity',
        stepId: step.stepId,
        stepName: step.stepName,
        message: `${step.stepName}에서 ${step.conversionRate.toFixed(1)}%의 높은 전환율을 보입니다.`,
        severity: 'low',
        recommendations: [
          '이 단계의 성공 요소를 다른 단계에 적용',
          '사용자 피드백 수집으로 성공 요인 분석',
          '유사한 패턴의 단계 최적화'
        ],
        data: {
          conversionRate: step.conversionRate,
          users: step.users
        }
      });
    }

    return insights;
  }

  // 이상치 식별
  private static identifyAnomalies(metrics: FunnelMetrics): any[] {
    const insights: any[] = [];
    const { stepConversions } = metrics;

    // 평균 대비 크게 다른 전환율 찾기
    const avgConversionRate = stepConversions.reduce((sum, step) => sum + step.conversionRate, 0) / stepConversions.length;
    
    for (const step of stepConversions) {
      const deviation = Math.abs(step.conversionRate - avgConversionRate);
      
      if (deviation > avgConversionRate * 0.5) { // 평균의 50% 이상 차이
        insights.push({
          type: 'anomaly',
          stepId: step.stepId,
          stepName: step.stepName,
          message: `${step.stepName}에서 평균 대비 ${deviation.toFixed(1)}%p 차이를 보입니다.`,
          severity: deviation > avgConversionRate ? 'high' : 'medium',
          recommendations: [
            '데이터 정확성 검증',
            '외부 요인 분석 (마케팅 캠페인, 이벤트 등)',
            '추가 분석을 통한 원인 파악'
          ],
          data: {
            conversionRate: step.conversionRate,
            avgConversionRate,
            deviation
          }
        });
      }
    }

    return insights;
  }

  // 퍼널 비교 분석
  static async compareFunnels(funnelId: string, comparisonPeriod: { startDate: Date; endDate: Date }): Promise<FunnelComparison> {
    try {
      const funnel = await FunnelAnalysis.findById(funnelId);
      if (!funnel) {
        throw new Error('Funnel not found');
      }

      // 현재 기간 분석
      const currentMetrics = await this.analyzeFunnel(funnelId);

      // 비교 기간 분석
      const comparisonFunnel = { ...funnel.toObject() };
      comparisonFunnel.timeWindow = comparisonPeriod;
      const tempFunnel = new FunnelAnalysis(comparisonFunnel);
      const previousMetrics = await this.analyzeFunnel(tempFunnel._id.toString());

      // 개선사항 계산
      const improvements = this.calculateImprovements(currentMetrics, previousMetrics);
      const overallImprovement = this.calculateOverallImprovement(currentMetrics, previousMetrics);

      return {
        currentPeriod: currentMetrics,
        previousPeriod: previousMetrics,
        improvements,
        overallImprovement
      };

    } catch (error) {
      console.error('Funnel comparison error:', error);
      throw error;
    }
  }

  // 개선사항 계산
  private static calculateImprovements(current: FunnelMetrics, previous: FunnelMetrics): any[] {
    const improvements: any[] = [];

    for (let i = 0; i < current.stepConversions.length; i++) {
      const currentStep = current.stepConversions[i];
      const previousStep = previous.stepConversions[i];

      if (previousStep) {
        improvements.push({
          stepName: currentStep.stepName,
          conversionRateChange: currentStep.conversionRate - previousStep.conversionRate,
          dropOffRateChange: currentStep.dropOffRate - previousStep.dropOffRate,
          timeToStepChange: currentStep.avgTimeToStep - previousStep.avgTimeToStep
        });
      }
    }

    return improvements;
  }

  // 전체 개선사항 계산
  private static calculateOverallImprovement(current: FunnelMetrics, previous: FunnelMetrics): any {
    return {
      conversionRateChange: current.overallConversionRate - previous.overallConversionRate,
      dropOffRateChange: current.totalDropOffRate - previous.totalDropOffRate,
      timeToConversionChange: current.avgTimeToConversion - previous.avgTimeToConversion
    };
  }
}















