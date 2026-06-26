import { IPIP60_QUESTIONS, IPIP60Question, IPIP60Domain } from '@/lib/data/ipip60-questions';

export interface IPIP60Result {
    rawScores: Record<string, number>; // Facet & Domain raw scores
    tScores: Record<string, number>;   // Facet & Domain T-scores
    percentiles: Record<string, number>;
    validity: {
        longString: number;
        irv: number;
        isValid: boolean;
        flags: string[];
    };
    interpretations: string[];
}

// Simplified Norms for initial implementation (Mean, SD)
// In production, these should be based on real normalization data.
const NORMS: Record<string, { mean: number; sd: number }> = {
    // Domain Defaults (12 items)
    'N': { mean: 32.5, sd: 9.2 },
    'E': { mean: 38.2, sd: 8.5 },
    'O': { mean: 39.1, sd: 7.8 },
    'A': { mean: 41.5, sd: 7.2 },
    'C': { mean: 40.8, sd: 8.1 },
    // Facet Default (2 items) - Fallback
    'facet_default': { mean: 6.4, sd: 1.9 }
};

export class IPIP60Engine {
    /**
     * Calculate comprehensive result from 60 responses
     * @param responses Map of questionId (1-60) to response (1-5)
     */
    static calculate(responses: Record<number, number>): IPIP60Result {
        const processedScores: Record<number, number> = {};
        const rawScores: Record<string, number> = {};
        const responseList: number[] = [];

        // 1. Process Raw Scores & Reverse Keying
        IPIP60_QUESTIONS.forEach(q => {
            const resp = responses[q.id] || 3; // Default to neutral if missing
            responseList.push(resp);
            const score = q.isReverse ? (6 - resp) : resp;
            processedScores[q.id] = score;

            // Add to Facet
            rawScores[q.facetCode] = (rawScores[q.facetCode] || 0) + score;
            // Add to Domain
            rawScores[q.domain] = (rawScores[q.domain] || 0) + score;
        });

        // 2. Validity Checks
        const longString = this.calculateLongString(responseList);
        const irv = this.calculateIRV(responseList);
        const flags: string[] = [];
        if (longString >= 10) flags.push('EXTREME_CONSISTENCY_DETECTION');
        if (irv < 0.3) flags.push('LOW_VARIABILITY_DETECTION');

        // 3. Standardize (T-Score & Percentile)
        const tScores: Record<string, number> = {};
        const percentiles: Record<string, number> = {};

        // Process Domains
        (['N', 'E', 'O', 'A', 'C'] as IPIP60Domain[]).forEach(d => {
            const raw = rawScores[d];
            const norm = NORMS[d];
            const t = this.rawToT(raw, norm.mean, norm.sd);
            tScores[d] = t;
            percentiles[d] = this.tToPercentile(t);
        });

        // Process Facets (Approximation)
        Object.keys(rawScores).forEach(key => {
            if (key.length > 1) { // Facet codes are like N1, E3
                const raw = rawScores[key];
                const norm = NORMS['facet_default'];
                const t = this.rawToT(raw, norm.mean, norm.sd);
                tScores[key] = t;
                percentiles[key] = this.tToPercentile(t);
            }
        });

        // 4. Generate Interpretations (Combinatorial)
        const interpretations = this.generateInterpretations(tScores);

        return {
            rawScores,
            tScores,
            percentiles,
            validity: {
                longString,
                irv,
                isValid: flags.length === 0,
                flags
            },
            interpretations
        };
    }

    private static rawToT(raw: number, mean: number, sd: number): number {
        const t = 50 + (10 * (raw - mean) / sd);
        return Math.round(t * 10) / 10; // 1 decimal place
    }

    private static tToPercentile(t: number): number {
        const z = (t - 50) / 10;
        // Approximation of Normal CDF
        const p = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
        return Math.round(p * 100);
    }

    // Error function approximation
    private static erf(x: number): number {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = (x < 0) ? -1 : 1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    private static calculateLongString(responses: number[]): number {
        let maxLen = 0;
        let currentLen = 1;
        for (let i = 1; i < responses.length; i++) {
            if (responses[i] === responses[i - 1]) {
                currentLen++;
            } else {
                maxLen = Math.max(maxLen, currentLen);
                currentLen = 1;
            }
        }
        return Math.max(maxLen, currentLen);
    }

    private static calculateIRV(responses: number[]): number {
        const mean = responses.reduce((a, b) => a + b, 0) / responses.length;
        const variance = responses.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / responses.length;
        return Math.sqrt(variance);
    }

    private static generateInterpretations(t: Record<string, number>): string[] {
        const texts: string[] = [];

        // Example: C x N Combination (Stability & Exec)
        if (t.C > 60 && t.N > 60) {
            texts.push("비교적 불안감이 높은 완벽주의자 성향을 보입니다. 성과는 훌륭하지만 쉽게 지칠 수 있습니다.");
        } else if (t.C > 60 && t.N < 40) {
            texts.push("강력한 실행력과 정서적 안정감을 동시에 갖춘 리더 타입입니다.");
        }

        // Example: E x A (Social Style)
        if (t.E > 60 && t.A < 40) {
            texts.push("목표 지향적이며 경쟁적인 사교가 스타일입니다. 결과 중심적인 리더십을 발휘합니다.");
        } else if (t.E > 60 && t.A > 60) {
            texts.push("풍부한 공감력을 바탕으로 한 부드러운 사교가 타입입니다.");
        }

        // Catch low points
        const domains: IPIP60Domain[] = ['N', 'E', 'O', 'A', 'C'];
        const lowest = domains.reduce((a, b) => t[a] < t[b] ? a : b);
        if (t[lowest] < 40) {
            texts.push(`${lowest} 요인이 상대적으로 낮게 나타났습니다. 해당 영역의 회복을 위한 구체적인 솔루션이 권장됩니다.`);
        }

        return texts;
    }
}
