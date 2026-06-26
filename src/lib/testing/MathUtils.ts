/**
 * A/B 테스트 및 통계 분석을 위한 공통 수학 유틸리티
 */
export class TestingMath {
  /**
   * Z-score 계산
   */
  static calculateZScore(p1: number, p2: number, n1: number, n2: number): number {
    if (n1 === 0 || n2 === 0) return 0;
    const p = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
    if (se === 0) return 0;
    return (p1 - p2) / se;
  }

  /**
   * P-value 계산 (정뮤분포 근사)
   */
  static calculatePValue(zScore: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = zScore >= 0 ? 1 : -1;
    const x = Math.abs(zScore) / Math.sqrt(2);
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 2 * (1 - y) * sign;
  }

  /**
   * Wilson Score Interval (신뢰구간) 계산
   */
  static calculateWilsonInterval(conversions: number, n: number, confidence: number = 0.95) {
    if (n === 0) return { lower: 0, upper: 0 };
    const p = conversions / n;
    const z = confidence === 0.99 ? 2.576 : (confidence === 0.90 ? 1.645 : 1.96);
    
    const center = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
    const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n) / (1 + (z * z) / n);
    
    return {
      lower: Math.max(0, center - margin),
      upper: Math.min(1, center + margin)
    };
  }

  /**
   * 카이제곱(Chi-Square) 통계량 계산
   */
  static calculateChiSquare(observed: number[][]): number {
    const total = observed.reduce((sum, row) => sum + row.reduce((s, c) => s + c, 0), 0);
    if (total === 0) return 0;
    const rowTotals = observed.map(row => row.reduce((s, c) => s + c, 0));
    const colTotals = observed[0].map((_, ci) => observed.reduce((s, r) => s + r[ci], 0));
    
    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
      for (let j = 0; j < observed[i].length; j++) {
        const expected = (rowTotals[i] * colTotals[j]) / total;
        if (expected > 0) {
          chiSquare += Math.pow(observed[i][j] - expected, 2) / expected;
        }
      }
    }
    return chiSquare;
  }

  /**
   * 베이지안 추론을 위한 베타 분포 파라미터 (단순 버전)
   */
  static getBetaParams(conversions: number, participants: number, priorAlpha: number = 1, priorBeta: number = 1) {
    return {
      alpha: priorAlpha + conversions,
      beta: priorBeta + participants - conversions
    };
  }
}
