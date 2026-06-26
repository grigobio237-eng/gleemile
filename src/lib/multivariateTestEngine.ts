import mongoose from 'mongoose';
import ABTest from '@/models/ABTest';
import ABTestEvent from '@/models/ABTestEvent';

export interface MultivariateTestConfig {
  testId: string;
  testName: string;
  description: string;
  factors: {
    name: string;
    levels: string[];
    weight: number;
  }[];
  combinations: {
    name: string;
    description: string;
    factors: { [key: string]: string };
    trafficAllocation: number;
  }[];
  primaryMetric: string;
  secondaryMetrics: string[];
  minimumSampleSize: number;
  maxDuration: number;
  significanceLevel: number;
}

export interface MultivariateTestResult {
  testId: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  combinations: {
    name: string;
    description: string;
    participants: number;
    conversions: number;
    conversionRate: number;
    confidenceInterval: { lower: number; upper: number };
    pValue: number;
    isSignificant: boolean;
    factorEffects: { [key: string]: number };
    interactionEffects: { [key: string]: number };
  }[];
  factorAnalysis: {
    factor: string;
    levels: {
      level: string;
      effect: number;
      confidence: number;
      isSignificant: boolean;
    }[];
    overallEffect: number;
    isSignificant: boolean;
  }[];
  interactionAnalysis: {
    factors: string[];
    effect: number;
    confidence: number;
    isSignificant: boolean;
  }[];
  recommendations: {
    bestCombination: string;
    significantFactors: string[];
    nextSteps: string[];
    confidence: number;
  };
}

export class MultivariateTestEngine {
  // 다변량 테스트 생성
  static async createMultivariateTest(config: MultivariateTestConfig): Promise<string> {
    const test = new ABTest({
      name: config.testName,
      description: config.description,
      type: 'multivariate',
      status: 'draft',
      variants: config.combinations.map(combo => ({
        name: combo.name,
        description: combo.description,
        settings: {
          factors: combo.factors,
          trafficAllocation: combo.trafficAllocation
        }
      })),
      settings: {
        primaryMetric: config.primaryMetric,
        secondaryMetrics: config.secondaryMetrics,
        minimumSampleSize: config.minimumSampleSize,
        maxDuration: config.maxDuration,
        significanceLevel: config.significanceLevel,
        factors: config.factors
      },
      createdBy: new mongoose.Types.ObjectId(), // 실제로는 세션에서 가져와야 함
      startDate: new Date(),
      endDate: new Date(Date.now() + config.maxDuration * 24 * 60 * 60 * 1000)
    });

    await test.save();
    return test._id.toString();
  }

  // 다변량 테스트 결과 분석
  static async analyzeMultivariateTest(testId: string): Promise<MultivariateTestResult> {
    const test = await ABTest.findById(testId);
    if (!test || test.type !== 'multivariate') {
      throw new Error('다변량 테스트를 찾을 수 없습니다.');
    }

    // 기본 통계 수집
    const basicStats = await this.getMultivariateStats(testId);
    
    // 요인 분석
    const factorAnalysis = await this.analyzeFactors(testId, basicStats);
    
    // 상호작용 분석
    const interactionAnalysis = await this.analyzeInteractions(testId, basicStats);
    
    // 조합별 결과 계산
    const combinationResults = await this.calculateCombinationResults(testId, basicStats);
    
    // 추천사항 생성
    const recommendations = await this.generateMultivariateRecommendations(
      testId, 
      combinationResults, 
      factorAnalysis, 
      interactionAnalysis
    );

    return {
      testId: test._id.toString(),
      status: test.status,
      startDate: test.startDate,
      endDate: test.endDate,
      combinations: combinationResults,
      factorAnalysis,
      interactionAnalysis,
      recommendations
    };
  }

  // 다변량 통계 수집
  private static async getMultivariateStats(testId: string) {
    const events = await ABTestEvent.aggregate([
      { $match: { testId: new mongoose.Types.ObjectId(testId) } },
      {
        $group: {
          _id: '$variantName',
          participants: { $addToSet: '$userId' },
          conversions: {
            $sum: {
              $cond: [
                { $eq: ['$eventType', 'conversion'] },
                1,
                0
              ]
            }
          },
          views: {
            $sum: {
              $cond: [
                { $eq: ['$eventType', 'view'] },
                1,
                0
              ]
            }
          },
          clicks: {
            $sum: {
              $cond: [
                { $eq: ['$eventType', 'click'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    return events;
  }

  // 요인 분석
  private static async analyzeFactors(testId: string, basicStats: any[]) {
    const test = await ABTest.findById(testId);
    const factors = test?.settings?.factors || [];
    
    const factorAnalysis = factors.map((factor: any) => {
      const levelEffects = factor.levels.map((level: string) => {
        // 해당 레벨을 포함하는 조합들의 성과 계산
        const relevantCombinations = basicStats.filter(stat => {
          const combination = test?.variants.find((v: any) => v.name === stat._id);
          return combination?.settings?.factors?.[factor.name] === level;
        });

        const totalParticipants = relevantCombinations.reduce((sum, c) => sum + c.participants.length, 0);
        const totalConversions = relevantCombinations.reduce((sum, c) => sum + c.conversions, 0);
        const conversionRate = totalParticipants > 0 ? totalConversions / totalParticipants : 0;

        // 전체 평균과 비교하여 효과 계산
        const overallParticipants = basicStats.reduce((sum, c) => sum + c.participants.length, 0);
        const overallConversions = basicStats.reduce((sum, c) => sum + c.conversions, 0);
        const overallRate = overallParticipants > 0 ? overallConversions / overallParticipants : 0;

        const effect = conversionRate - overallRate;
        const confidence = this.calculateConfidence(totalParticipants, totalConversions);
        const isSignificant = Math.abs(effect) > 0.05 && confidence > 0.95; // 임계값 설정

        return {
          level,
          effect: Math.round(effect * 10000) / 100,
          confidence: Math.round(confidence * 100) / 100,
          isSignificant
        };
      });

      // 전체 요인 효과 계산
      const overallEffect = levelEffects.reduce((sum: number, level: any) => sum + Math.abs(level.effect), 0) / levelEffects.length;
      const isSignificant = levelEffects.some((level: any) => level.isSignificant);

      return {
        factor: factor.name,
        levels: levelEffects,
        overallEffect: Math.round(overallEffect * 100) / 100,
        isSignificant
      };
    });

    return factorAnalysis;
  }

  // 상호작용 분석
  private static async analyzeInteractions(testId: string, basicStats: any[]) {
    const test = await ABTest.findById(testId);
    const factors = test?.settings?.factors || [];
    
    const interactions = [];
    
    // 2요인 상호작용 분석
    for (let i = 0; i < factors.length; i++) {
      for (let j = i + 1; j < factors.length; j++) {
        const factor1 = factors[i];
        const factor2 = factors[j];
        
        const interactionEffect = await this.calculateInteractionEffect(
          testId, 
          factor1.name, 
          factor2.name, 
          basicStats
        );
        
        interactions.push({
          factors: [factor1.name, factor2.name],
          effect: Math.round(interactionEffect.effect * 100) / 100,
          confidence: Math.round(interactionEffect.confidence * 100) / 100,
          isSignificant: interactionEffect.isSignificant
        });
      }
    }

    return interactions;
  }

  // 상호작용 효과 계산
  private static async calculateInteractionEffect(
    testId: string, 
    factor1: string, 
    factor2: string, 
    basicStats: any[]
  ): Promise<{ effect: number; confidence: number; isSignificant: boolean }> {
    // 간단한 상호작용 효과 계산
    // 실제로는 더 복잡한 ANOVA 분석이 필요
    
    const test = await ABTest.findById(testId);
    const combinations = test?.variants || [];
    
    // 각 요인 조합별 성과 계산
    const factor1Levels = [...new Set(combinations.map((c: any) => c.settings?.factors?.[factor1]).filter(Boolean))];
    const factor2Levels = [...new Set(combinations.map((c: any) => c.settings?.factors?.[factor2]).filter(Boolean))];
    
    let interactionSum = 0;
    let interactionCount = 0;
    
    for (const level1 of factor1Levels) {
      for (const level2 of factor2Levels) {
        const combination = combinations.find((c: any) => 
          c.settings?.factors?.[factor1] === level1 && 
          c.settings?.factors?.[factor2] === level2
        );
        
        if (combination) {
          const stat = basicStats.find(s => s._id === combination.name);
          if (stat) {
            const rate = stat.participants.length > 0 ? stat.conversions / stat.participants.length : 0;
            interactionSum += rate;
            interactionCount++;
          }
        }
      }
    }
    
    const averageRate = interactionCount > 0 ? interactionSum / interactionCount : 0;
    const effect = averageRate * 0.1; // 간단한 효과 계산
    const confidence = 0.8; // 간단한 신뢰도 계산
    const isSignificant = Math.abs(effect) > 0.02 && confidence > 0.8;
    
    return { effect, confidence, isSignificant };
  }

  // 조합별 결과 계산
  private static async calculateCombinationResults(testId: string, basicStats: any[]): Promise<any[]> {
    const test = await ABTest.findById(testId);
    const combinations = test?.variants || [];
    
    return Promise.all(combinations.map(async (combination: any) => {
      const stat = basicStats.find(s => s._id === combination.name) || {
        participants: [],
        conversions: 0
      };

      const participants = stat.participants.length;
      const conversions = stat.conversions;
      const conversionRate = participants > 0 ? (conversions / participants) * 100 : 0;

      // 신뢰구간 계산
      const confidenceInterval = this.calculateWilsonScoreInterval(conversions, participants, 0.95);
      
      // P-value 계산
      const pValue = this.calculatePValue(basicStats, combination.name);
      
      // 통계적 유의성
      const isSignificant = pValue < 0.05;
      
      // 요인별 효과 계산
      const factorEffects: { [key: string]: number } = {};
      const factors = test?.settings?.factors || [];
      
      for (const factor of factors) {
        const level = combination.settings?.factors?.[factor.name];
        if (level) {
          factorEffects[factor.name] = await this.calculateFactorLevelEffect(
            testId, 
            factor.name, 
            level, 
            basicStats
          );
        }
      }
      
      // 상호작용 효과 계산
      const interactionEffects: { [key: string]: number } = {};
      for (let i = 0; i < factors.length; i++) {
        for (let j = i + 1; j < factors.length; j++) {
          const key = `${factors[i].name}_${factors[j].name}`;
          const interactionEffect = await this.calculateInteractionEffect(
            testId,
            factors[i].name,
            factors[j].name,
            basicStats
          );
          interactionEffects[key] = interactionEffect.effect;
        }
      }

      return {
        name: combination.name,
        description: combination.description,
        participants,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        confidenceInterval,
        pValue: Math.round(pValue * 10000) / 10000,
        isSignificant,
        factorEffects,
        interactionEffects
      };
    }));
  }

  // 요인 레벨 효과 계산
  private static async calculateFactorLevelEffect(
    testId: string, 
    factorName: string, 
    level: string, 
    basicStats: any[]
  ): Promise<number> {
    // 해당 레벨을 포함하는 조합들의 평균 성과
    const test = await ABTest.findById(testId);
    const relevantCombinations = test?.variants?.filter((v: any) => 
      v.settings?.factors?.[factorName] === level
    ) || [];
    
    const relevantStats = basicStats.filter(stat => 
      relevantCombinations.some((c: any) => c.name === stat._id)
    );
    
    const totalParticipants = relevantStats.reduce((sum, s) => sum + s.participants.length, 0);
    const totalConversions = relevantStats.reduce((sum, s) => sum + s.conversions, 0);
    const rate = totalParticipants > 0 ? totalConversions / totalParticipants : 0;
    
    // 전체 평균과 비교
    const overallParticipants = basicStats.reduce((sum, s) => sum + s.participants.length, 0);
    const overallConversions = basicStats.reduce((sum, s) => sum + s.conversions, 0);
    const overallRate = overallParticipants > 0 ? overallConversions / overallParticipants : 0;
    
    return Math.round((rate - overallRate) * 10000) / 100;
  }

  // Wilson Score Interval 계산
  private static calculateWilsonScoreInterval(conversions: number, participants: number, confidence: number): { lower: number; upper: number } {
    if (participants === 0) {
      return { lower: 0, upper: 0 };
    }

    const p = conversions / participants;
    const n = participants;
    const z = confidence === 0.95 ? 1.96 : 2.576;
    
    const center = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
    const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n) / (1 + (z * z) / n);
    
    return {
      lower: Math.max(0, (center - margin) * 100),
      upper: Math.min(100, (center + margin) * 100)
    };
  }

  // P-value 계산
  private static calculatePValue(basicStats: any[], combinationName: string): number {
    if (basicStats.length < 2) return 1;
    
    const combination = basicStats.find(s => s._id === combinationName);
    if (!combination) return 1;
    
    const totalConversions = basicStats.reduce((sum, s) => sum + s.conversions, 0);
    const totalParticipants = basicStats.reduce((sum, s) => sum + s.participants.length, 0);
    
    if (totalParticipants === 0) return 1;
    
    const expectedRate = totalConversions / totalParticipants;
    const observed = combination.conversions;
    const expected = combination.participants.length * expectedRate;
    
    if (expected === 0) return 1;
    
    const chiSquare = Math.pow(observed - expected, 2) / expected;
    const pValue = this.chiSquarePValue(chiSquare, 1);
    
    return pValue;
  }

  // Chi-square P-value 근사
  private static chiSquarePValue(chiSquare: number, df: number): number {
    if (df === 1) {
      return chiSquare > 3.84 ? 0.05 : chiSquare > 6.63 ? 0.01 : 0.1;
    }
    return chiSquare > 5.99 ? 0.05 : chiSquare > 9.21 ? 0.01 : 0.1;
  }

  // 신뢰도 계산
  private static calculateConfidence(participants: number, conversions: number): number {
    if (participants === 0) return 0;
    
    const rate = conversions / participants;
    const standardError = Math.sqrt((rate * (1 - rate)) / participants);
    const confidence = Math.min(0.99, Math.max(0.1, 1 - standardError * 2));
    
    return confidence;
  }

  // 다변량 추천사항 생성
  private static async generateMultivariateRecommendations(
    testId: string,
    combinationResults: any[],
    factorAnalysis: any[],
    interactionAnalysis: any[]
  ): Promise<{ bestCombination: string; significantFactors: string[]; nextSteps: string[]; confidence: number }> {
    
    // 최고 조합 찾기
    const bestCombination = combinationResults.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    
    // 유의한 요인들 찾기
    const significantFactors = factorAnalysis
      .filter(factor => factor.isSignificant)
      .map(factor => factor.factor);
    
    // 유의한 상호작용들 찾기
    const significantInteractions = interactionAnalysis
      .filter(interaction => interaction.isSignificant)
      .map(interaction => interaction.factors.join(' × '));
    
    // 다음 단계 결정
    const nextSteps = [];
    
    if (bestCombination.isSignificant) {
      nextSteps.push(`'${bestCombination.name}' 조합을 구현하세요.`);
    } else {
      nextSteps.push('더 많은 데이터를 수집하거나 테스트를 연장하세요.');
    }
    
    if (significantFactors.length > 0) {
      nextSteps.push(`유의한 요인들: ${significantFactors.join(', ')}`);
    }
    
    if (significantInteractions.length > 0) {
      nextSteps.push(`유의한 상호작용들: ${significantInteractions.join(', ')}`);
    }
    
    if (combinationResults.every(c => !c.isSignificant)) {
      nextSteps.push('모든 조합이 통계적으로 유의하지 않습니다. 요인을 재검토하세요.');
    }
    
    // 신뢰도 계산
    const confidence = bestCombination.isSignificant ? 
      Math.min(0.95, bestCombination.conversionRate / 100) : 
      0.5;

    return {
      bestCombination: bestCombination.name,
      significantFactors,
      nextSteps,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  // 다변량 테스트 최적화
  static async optimizeMultivariateTest(testId: string): Promise<{ optimized: boolean; changes: string[] }> {
    const result = await this.analyzeMultivariateTest(testId);
    const changes = [];
    
    // 최적화 제안
    if (result.recommendations.significantFactors.length > 0) {
      changes.push(`유의한 요인들에 집중하여 새로운 테스트를 설계하세요: ${result.recommendations.significantFactors.join(', ')}`);
    }
    
    if (result.interactionAnalysis.some(i => i.isSignificant)) {
      changes.push('유의한 상호작용을 고려하여 조합을 재설계하세요.');
    }
    
    if (result.combinations.every(c => !c.isSignificant)) {
      changes.push('모든 조합이 유의하지 않습니다. 요인 레벨을 조정하거나 새로운 요인을 추가하세요.');
    }
    
    return {
      optimized: changes.length > 0,
      changes
    };
  }
}
