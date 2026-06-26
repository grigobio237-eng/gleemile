import { TestingMath } from './testing/MathUtils';

export interface TestVariant {
  name: string;
  sampleSize: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  avgOrderValue?: number;
}

export interface TestResults {
  variants: Array<{
    variantName: string;
    sampleSize: number;
    conversions: number;
    conversionRate: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    pValue: number;
    isSignificant: boolean;
    lift: number;
    revenue?: number;
    avgOrderValue?: number;
  }>;
  overallConversionRate: number;
  statisticalSignificance: boolean;
  winner?: string;
  recommendation?: string;
  testDuration: number;
}

export class ABTestStatsCalculator {
  // Z-score 계산
  static calculateZScore(p1: number, p2: number, n1: number, n2: number): number {
    return TestingMath.calculateZScore(p1, p2, n1, n2);
  }

  // P-value 계산
  static calculatePValue(zScore: number): number {
    return TestingMath.calculatePValue(zScore);
  }

  // 신뢰구간 계산
  static calculateConfidenceInterval(
    conversions: number, 
    sampleSize: number, 
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number } {
    return TestingMath.calculateWilsonInterval(conversions, sampleSize, confidenceLevel);
  }

  // 테스트 결과 계산 (기존 비즈니스 로직 유지)
  static calculateTestResults(
    variants: TestVariant[],
    significanceLevel: number = 0.05,
    confidenceLevel: number = 0.95,
    testDuration: number = 0
  ): TestResults {
    if (variants.length < 2) {
      throw new Error('최소 2개의 변형이 필요합니다.');
    }

    const control = variants[0];
    const results: TestResults = {
      variants: [],
      overallConversionRate: 0,
      statisticalSignificance: false,
      testDuration
    };

    const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0);
    const totalSampleSize = variants.reduce((sum, v) => sum + v.sampleSize, 0);
    results.overallConversionRate = totalConversions / totalSampleSize;

    for (const variant of variants) {
      const confidenceInterval = this.calculateConfidenceInterval(
        variant.conversions,
        variant.sampleSize,
        confidenceLevel
      );

      let pValue = 1;
      let isSignificant = false;
      let lift = 0;

      if (variant !== control) {
        pValue = this.calculatePValue(
          this.calculateZScore(
            variant.conversionRate,
            control.conversionRate,
            variant.sampleSize,
            control.sampleSize
          )
        );
        isSignificant = pValue < significanceLevel;
        lift = ((variant.conversionRate - control.conversionRate) / control.conversionRate) * 100;
      }

      results.variants.push({
        variantName: variant.name,
        sampleSize: variant.sampleSize,
        conversions: variant.conversions,
        conversionRate: variant.conversionRate,
        confidenceInterval,
        pValue,
        isSignificant,
        lift,
        revenue: variant.revenue,
        avgOrderValue: variant.avgOrderValue
      });
    }

    results.statisticalSignificance = results.variants.some(v => v.isSignificant);

    if (results.statisticalSignificance) {
      const significantVariants = results.variants.filter(v => v.isSignificant);
      const winner = significantVariants.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );
      results.winner = winner.variantName;
    }

    results.recommendation = this.generateRecommendation(results);
    return results;
  }

  private static generateRecommendation(results: TestResults): string {
    if (!results.statisticalSignificance) {
      return '통계적으로 유의한 차이가 없습니다. 더 많은 데이터를 수집하거나 테스트를 계속 진행하세요.';
    }

    if (results.winner) {
      const winner = results.variants.find(v => v.variantName === results.winner);
      if (winner) {
        return `"${winner.variantName}" 변형이 ${winner.lift.toFixed(1)}% 개선되었습니다. 이 변형을 적용하는 것을 권장합니다.`;
      }
    }
    return '테스트 결과를 분석하여 최적의 변형을 선택하세요.';
  }
}















