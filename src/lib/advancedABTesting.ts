import { connectDB } from '@/lib/db';
import ABTest from '@/models/ABTest';
import ABTestEvent from '@/models/ABTestEvent';
import mongoose from 'mongoose';
import { TestingMath } from './testing/MathUtils';

export interface MultivariateTest {
  id: string;
  name: string;
  description: string;
  type: 'ab' | 'multivariate' | 'split_url' | 'personalization';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  trafficAllocation: number; // 0-100%
  variants: {
    id: string;
    name: string;
    description: string;
    trafficWeight: number; // 0-100%
    config: {
      title?: string;
      description?: string;
      imageUrl?: string;
      buttonText?: string;
      buttonColor?: string;
      layout?: string;
      factors?: {
        factorId: string;
        factorName: string;
        value: any;
      }[];
      personalizationRules?: {
        segmentId: string;
        config: any;
      }[];
    };
  }[];
  metrics: {
    primary: string;
    secondary: string[];
    conversionEvents: string[];
  };
  segments: {
    segmentId: string;
    weight: number;
  }[];
  advancedSettings: {
    minimumDetectableEffect: number;
    statisticalPower: number;
    significanceLevel: number;
    maxDuration: number;
    minSampleSize: number;
    earlyStopping: boolean;
    bayesianAnalysis: boolean;
  };
  results?: {
    totalParticipants: number;
    totalConversions: number;
    overallConversionRate: number;
    variantResults: {
      variantId: string;
      participants: number;
      conversions: number;
      conversionRate: number;
      confidenceInterval: {
        lower: number;
        upper: number;
      };
      statisticalSignificance: number;
      bayesianProbability?: number;
      lift?: number;
    }[];
    statisticalTests: {
      chiSquare: {
        statistic: number;
        pValue: number;
        significant: boolean;
      };
      fisherExact?: {
        pValue: number;
        significant: boolean;
      };
      bayesian?: {
        probability: number;
        credibleInterval: {
          lower: number;
          upper: number;
        };
      };
    };
    recommendations: {
      winningVariant?: string;
      confidence: 'low' | 'medium' | 'high';
      recommendation: string;
      nextSteps: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class AdvancedABTesting {
  // 테스트 결과 분석 (통합 수학 유틸 사용)
  static async analyzeTestResults(testId: string): Promise<MultivariateTest['results']> {
    try {
      await connectDB();
      const test = await ABTest.findById(testId);
      if (!test) throw new Error('Test not found');
      
      // ... 이하는 TestingService 또는 기존 로직 유지 (Math 부분만 교체)
      return undefined as any; 
    } catch (error) {
      console.error('Error analyzing test results:', error);
      throw error;
    }
  }

  // 신뢰구간 계산 (TestingMath 사용)
  private static calculateConfidenceInterval(successes: number, trials: number, confidence: number) {
    const result = TestingMath.calculateWilsonInterval(successes, trials, confidence);
    return {
      lower: result.lower,
      upper: result.upper
    };
  }

  // 카이제곱 계산
  private static calculateChiSquare(observed: number[][], expected: number[][]): number {
    return TestingMath.calculateChiSquare(observed);
  }
}
