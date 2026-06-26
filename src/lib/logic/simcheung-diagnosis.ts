
/**
 * 심층 심리 리듬체크 (Deep Diagnosis) 채점 로직
 * Based on IPIP-NEO-60 Commercial Edition Design
 */

import { FullDiagnosisQuestion, FULL_DIAGNOSIS_QUESTIONS } from '@/lib/data/full-diagnosis-questions';

export interface StartDiagnosisRequest {
    answers: Record<number, number>; // { questionId: score (1-5) }
    questions: FullDiagnosisQuestion[]; // Updated to use the new type
    gender?: 'M' | 'F';
    age?: number;
}

// Removing local DiagnosisQuestion interface in favor of imported one

export interface DiagnosisResult {
    rawScores: {
        domains: Record<string, number>;
        facets: Record<string, number>; // "N1", "E2" etc.
    };
    tScores: {
        domains: Record<string, number>;
        facets: Record<string, number>;
    };
    validity: {
        isValid: boolean;
        flags: string[]; // "LongString", "IRV_High", "IRV_Low", "TooManyMissing"
    };
    metadata: {
        missingCount: number;
        imputedCount: number;
    };
}

// 상수 정의
const DOMAINS = ['N', 'E', 'O', 'A', 'C'];
const FACETS_PER_DOMAIN = 6;
const MAX_SCORE = 5;
const MIN_SCORE = 1;

// 규준 (Norms) - 임시: IPIP 미국 성인 평균/표준편차
const DEFAULT_NORMS: Record<string, { mean: number; sd: number }> = {
    // Domains (Sum of 6 facets * 2 items = 12 items -> range 12-60)
    N: { mean: 30, sd: 8 },
    E: { mean: 35, sd: 7 },
    O: { mean: 38, sd: 6 },
    A: { mean: 38, sd: 6 },
    C: { mean: 36, sd: 7 },
    // Facets (Sum of 2 items -> range 2-10) will be defaulted if not specific
    defaultFacet: { mean: 6.5, sd: 2.0 }
};

export class SimcheungDiagnosisEngine {

    /**
     * 리듬체크 실행 메인 함수
     */
    static calculateResults(data: StartDiagnosisRequest): DiagnosisResult {
        const { answers, questions } = data;
        const validity = this.checkValidity(Object.values(answers));

        // 1. 전처리 & 결측치 보정 (Imputation)
        const totalQuestions = questions.length;
        const answeredCount = Object.keys(answers).length;
        const missingCount = totalQuestions - answeredCount;
        const responseRate = answeredCount / totalQuestions;

        if (responseRate < 0.9) {
            return {
                rawScores: { domains: {}, facets: {} },
                tScores: { domains: {}, facets: {} },
                validity: {
                    isValid: false,
                    flags: [...validity.flags, 'TooManyMissing']
                },
                metadata: { missingCount, imputedCount: 0 }
            };
        }

        // 결측치 보정 로직 (Person-Mean Imputation)
        const processedAnswers = { ...answers };
        let imputedCount = 0;

        if (missingCount > 0) {
            DOMAINS.forEach(domain => {
                const domainQIds = questions.filter(q => q.domainChar === domain).map(q => q.id);
                const userDomainScores = domainQIds
                    .map(id => processedAnswers[id])
                    .filter(val => val !== undefined && val !== null);

                if (userDomainScores.length > 0) {
                    const domainMean = Math.round(userDomainScores.reduce((a, b) => a + b, 0) / userDomainScores.length);

                    domainQIds.forEach(id => {
                        if (processedAnswers[id] === undefined) {
                            processedAnswers[id] = domainMean;
                            imputedCount++;
                        }
                    });
                }
            });
        }

        // 2. 점수 계산 (Reverse Scoring 포함)
        const facetRawScores: Record<string, number> = {};
        const domainRawScores: Record<string, number> = {};

        // Initialize scores
        DOMAINS.forEach(d => {
            domainRawScores[d] = 0;
            for (let f = 1; f <= FACETS_PER_DOMAIN; f++) {
                facetRawScores[`${d}${f}`] = 0;
            }
        });

        questions.forEach(q => {
            const rawVal = processedAnswers[q.id];
            // Reverse Scoring: Key '-' means reverse (1->5, 5->1)
            const finalVal = (q.key === '-') ? (6 - rawVal) : rawVal;

            const facetKey = `${q.domainChar}${q.facetIndex}`;

            // Accumulate
            facetRawScores[facetKey] = (facetRawScores[facetKey] || 0) + finalVal;
            domainRawScores[q.domainChar] = (domainRawScores[q.domainChar] || 0) + finalVal;
        });

        // 3. T-Score 변환
        const tScores = this.convertToTScores(domainRawScores, facetRawScores);

        // 4. Validity Final Check
        if (Object.keys(validity.flags).length > 0) {
            // 이미 Invalid Flag가 있으면 isValid false
        }

        return {
            rawScores: {
                domains: domainRawScores,
                facets: facetRawScores
            },
            tScores,
            validity,
            metadata: {
                missingCount,
                imputedCount
            }
        };
    }

    /**
     * 응답 신뢰성 검증 (Careless Responding Detection)
     */
    private static checkValidity(responseValues: number[]): { isValid: boolean; flags: string[] } {
        const flags: string[] = [];

        // 1. LongString Index (연속 동일 응답)
        let maxLongString = 0;
        let currentLongString = 1;
        for (let i = 1; i < responseValues.length; i++) {
            if (responseValues[i] === responseValues[i - 1]) {
                currentLongString++;
            } else {
                maxLongString = Math.max(maxLongString, currentLongString);
                currentLongString = 1;
            }
        }
        maxLongString = Math.max(maxLongString, currentLongString);

        // 60문항 기준 임계값: 10이상 (엄격), 6이상 (주의)
        // 여기서는 10 이상이면 Invalid 처리
        if (maxLongString >= 10) {
            flags.push('LongString');
        }

        // 2. IRV (개인 내 반응 분산) - 너무 낮으면(모두 같은 답) 또는 너무 높으면(극단적) 문제
        if (responseValues.length > 0) {
            const mean = responseValues.reduce((a, b) => a + b, 0) / responseValues.length;
            const variance = responseValues.reduce((a, b) => a + (b - mean) ** 2, 0) / responseValues.length;
            const stdDev = Math.sqrt(variance);

            if (stdDev < 0.5) flags.push('IRV_Low'); // 거의 다 같은 답
            // if (stdDev > 2.0) flags.push('IRV_High'); // 극단 값만 선택 (주로 1, 5만 찍음) - 상황에 따라 다름
        }

        return {
            isValid: flags.length === 0,
            flags
        };
    }

    /**
     * T-Score 표준화
     * T = 50 + (10 * (Raw - Mean) / SD)
     */
    private static convertToTScores(
        domainRaw: Record<string, number>,
        facetRaw: Record<string, number>
    ): { domains: Record<string, number>; facets: Record<string, number> } {
        const tDomains: Record<string, number> = {};
        const tFacets: Record<string, number> = {};

        // Domains
        Object.keys(domainRaw).forEach(d => {
            const norm = DEFAULT_NORMS[d] || { mean: 36, sd: 7 }; // Fallback
            const z = (domainRaw[d] - norm.mean) / norm.sd;
            let t = 50 + (10 * z);
            // Clipping 20~80 for UX
            t = Math.max(20, Math.min(80, t));
            tDomains[d] = Math.round(t * 10) / 10; // 소수점 첫째자리
        });

        // Facets
        Object.keys(facetRaw).forEach(f => {
            const norm = DEFAULT_NORMS['defaultFacet']; // 실제로는 각 Facet별 규준 필요
            const z = (facetRaw[f] - norm.mean) / norm.sd;
            let t = 50 + (10 * z);
            t = Math.max(20, Math.min(80, t));
            tFacets[f] = Math.round(t * 10) / 10;
        });

        return { domains: tDomains, facets: tFacets };
    }

    /**
     * 무료 리듬체크 (24문항) 결과 계산
     */
    static calculateFreeDiagnosis(answers: Record<string, number>, questions: any[]): FreeDiagnosisResult {
        const scores: Record<string, number> = {
            Mindset: 0,
            Emotional: 0,
            Social: 0,
            Physical: 0
        };

        // 1. Calculate Raw Scores
        questions.forEach(q => {
            const rawVal = answers[q.id];
            if (rawVal) {
                const finalVal = q.isReverse ? (6 - rawVal) : rawVal;
                if (scores[q.category] !== undefined) {
                    scores[q.category] += finalVal;
                }
            }
        });

        // 2. Convert to 100-point scale
        // Each category has 6 questions. Min 6, Max 30.
        // We want 0-100 scale? Or just percentage of max?
        // Formula: (Score / 30) * 100
        const convertedScores: Record<string, number> = {};
        let lowestCategory = 'Mindset';
        let lowestScore = 100;

        Object.keys(scores).forEach(cat => {
            const raw = scores[cat];
            const converted = Math.round((raw / 30) * 100);
            convertedScores[cat] = converted;

            if (converted < lowestScore) {
                lowestScore = converted;
                lowestCategory = cat;
            }
        });

        return {
            rawScores: scores,
            convertedScores,
            lowestCategory,
            totalScore: Math.round(Object.values(convertedScores).reduce((a, b) => a + b, 0) / 4)
        };
    }

    /**
     * Standardize Scores for Diamond Graph (Physical, Mental, Sleep, Lifestyle)
     */
    static mapFreeToStandard(freeResult: FreeDiagnosisResult): { physical: number; mental: number; sleep: number; lifestyle: number } {
        const s = freeResult.convertedScores;
        // Logic must match /api/diagnosis/save/route.ts
        return {
            physical: s.Physical || 0,
            mental: Math.round(((s.Mindset || 0) + (s.Emotional || 0)) / 2),
            lifestyle: s.Social || 0,
            sleep: s.Physical || 0 // Fallback if no specific sleep score in Free
        };
    }

    static mapPaidToStandard(tScores: { domains: Record<string, number> }): { physical: number; mental: number; sleep: number; lifestyle: number } {
        const t = tScores?.domains || {};
        // Logic must match /api/diagnosis/save/route.ts
        return {
            physical: t.E || 50, // Extraversion -> Activity
            mental: t.N ? (100 - t.N) : 50, // Low Neuroticism -> High Mental Stability
            lifestyle: t.C || 50, // Conscientiousness -> Regular Lifestyle
            sleep: t.N ? (100 - t.N) : 50 // Anxiety affects sleep
        };
    }
}

export interface FreeDiagnosisResult {
    rawScores: Record<string, number>;
    convertedScores: Record<string, number>; // 0-100
    lowestCategory: string; // For recommendation
    totalScore: number;
}
