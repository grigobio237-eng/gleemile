import mongoose from 'mongoose';
import ABTest from '@/models/ABTest';
import { TestingService } from './testing/TestingService';
import { TestingMath } from './testing/MathUtils';

export interface AdvancedTestStats {
  testId: string;
  testName: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  variants: {
    name: string;
    description: string;
    participants: number;
    conversions: number;
    conversionRate: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    pValue: number;
    isSignificant: boolean;
    expectedLoss: number;
    risk: 'low' | 'medium' | 'high';
  }[];
  overallStats: {
    totalParticipants: number;
    totalConversions: number;
    overallConversionRate: number;
    statisticalPower: number;
    minimumDetectableEffect: number;
    testDuration: number;
    estimatedCompletionTime?: Date;
  };
  recommendations: {
    action: string;
    reason: string;
    confidence: number;
    expectedImpact: number;
  };
  bayesianStats: {
    probabilityOfBeingBest: number[];
    expectedLoss: number[];
    credibleInterval: {
      lower: number;
      upper: number;
    }[];
  };
}

export class ABTestAdvancedStats {
  /**
   * 실시간 통계 계산 (통합 서비스 이용)
   */
  static async calculateAdvancedStats(testId: string): Promise<AdvancedTestStats> {
    const test = await ABTest.findById(testId);
    if (!test) throw new Error('A/B 테스트를 찾을 수 없습니다.');

    // 통합 서비스를 통한 데이터 집계
    const aggregatedData = await TestingService.getAggregateStats(testId);
    
    // 고급 지표 계산
    const variantStats = test.variants.map((variant: any) => {
      const stats = aggregatedData.find(s => s.variantName === variant.name) || {
        participantCount: 0,
        conversions: 0
      };

      const participants = stats.participantCount;
      const conversions = stats.conversions;
      const conversionRate = participants > 0 ? (conversions / participants) : 0;

      // 공통 수학 유틸리티 사용
      const confidenceInterval = TestingMath.calculateWilsonInterval(conversions, participants, 0.95);
      
      return {
        name: variant.name,
        description: variant.description || '',
        participants,
        conversions,
        conversionRate: Math.round(conversionRate * 10000) / 100,
        confidenceInterval: {
          lower: confidenceInterval.lower * 100,
          upper: confidenceInterval.upper * 100
        },
        pValue: 0.1, // 단순화: 실제 구현시에는 Chi-Square P-Value 연동
        isSignificant: false,
        expectedLoss: 0,
        risk: participants < 100 ? 'high' : 'low'
      };
    });

    const totalParticipants = variantStats.reduce((sum: number, v: any) => sum + v.participants, 0);
    const totalConversions = variantStats.reduce((sum: number, v: any) => sum + v.conversions, 0);
    const overallConversionRate = totalParticipants > 0 ? (totalConversions / totalParticipants) * 100 : 0;

    return {
      testId: test._id.toString(),
      testName: test.name,
      status: test.status,
      startDate: test.startDate,
      endDate: test.endDate,
      variants: variantStats as any,
      overallStats: {
        totalParticipants,
        totalConversions,
        overallConversionRate: Math.round(overallConversionRate * 100) / 100,
        statisticalPower: 0,
        minimumDetectableEffect: 0,
        testDuration: 0,
      },
      recommendations: {
        action: 'continue',
        reason: '데이터 수집 중입니다.',
        confidence: 0.5,
        expectedImpact: 0
      },
      bayesianStats: {
        probabilityOfBeingBest: [],
        expectedLoss: [],
        credibleInterval: []
      }
    };
  }

  /**
   * 실시간 이벤트 처리
   */
  static async processRealtimeEvent(testId: string, eventType: any, variantName: string, userId: string) {
    try {
      await TestingService.recordEvent({
        testId,
        userId,
        variantName,
        eventType,
      });

      const stats = await this.calculateAdvancedStats(testId);
      return { success: true, stats };
    } catch (error) {
      console.error('Real-time event processing error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 테스트 자동 종료 검사
   */
  static async checkAutoTermination(testId: string): Promise<boolean> {
    const stats = await this.calculateAdvancedStats(testId);
    if (stats.status === 'running' && stats.overallStats.totalParticipants > 1000) {
      // 예시 기준: 참여자 1000명 이상 시 검토 (실제로는 유의성 기반)
      return true;
    }
    return false;
  }
}
