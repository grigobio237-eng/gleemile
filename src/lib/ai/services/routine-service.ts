import { GeminiCore } from '../engine/core';
import { DailyCheckInInput, DailyCheckInOutput, NavigatorInput, NavigatorOutput } from '@/lib/ai/types';

export class RoutineService {
    private static questionCache: Record<string, any[]> = {};

    static async generateDailyCheckInQuestion(input: DailyCheckInInput): Promise<DailyCheckInOutput> {
        const prompt = `
당신은 'gleemile(Youniqle)'의 친근하고 세심한 **퍼스널 회복 총무/조장**입니다.
사용자(${input.userName})에게 하루를 시작하는(또는 하루 중) 인사를 건네고, 컨디션을 체크하는 질문을 하나 던져주세요.

## 상황 정보
- 요일/시간: ${input.dayOfWeek} ${input.timeOfDay}
- 최근 컨텍스트: ${input.recentContext || '특이사항 없음'}

## 코칭 원칙
1. **따뜻하고 개인화된 인사**: 요일이나 시간대, 최근 컨텍스트를 반영해 자연스럽게 인사를 건네세요.
2. **핵심 질문 1개**: 사용자가 부담 없이 답할 수 있는 컨디션 체크 질문을 1개만 하세요.
3. **간단한 선택지**: 답변하기 쉽게 3개의 선택지를 함께 제공하세요.

## 응답 형식 (JSON Only)
{
  "greeting": "따뜻한 인사말 (나-전달법, 1~2문장)",
  "question": "핵심 질문 (1문장)",
  "options": [
    { "label": "긍정 답변 (예: 상쾌해요!)", "value": "good", "emoji": "😊" },
    { "label": "중립 답변 (예: 평범해요)", "value": "normal", "emoji": "😐" },
    { "label": "부정 답변 (예: 몸이 무거워요)", "value": "bad", "emoji": "🫠" }
  ]
}`;

        try {
            const text = await GeminiCore.generateWithFallback(prompt);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            throw new Error('Parsing failed');
        } catch (error) {
            console.error('Check-in error:', error);
            return {
                greeting: `${input.userName}님, 안녕하세요!`,
                question: '오늘 몸 상태는 좀 어떠신가요?',
                options: [
                    { label: '가볍고 좋아요', value: 'good', emoji: '💪' },
                    { label: '그저 그래요', value: 'normal', emoji: '😐' },
                    { label: '많이 피곤하네요', value: 'bad', emoji: '💤' }
                ]
            };
        }
    }

    static async generateDailyRoutines(input: {
        score: number;
        slotName: string;
        slotCode: string;
    }): Promise<any> {
        const isDaily = input.slotCode === 'DAILY';
        const prompt = isDaily 
            ? `사용자의 회복 점수(${input.score})를 바탕으로 오늘 하루 동안 실천하면 좋은 '생활 습관 미션' 3가지를 추천해주세요. 
               이는 홈페이지 도구 사용이 아닌, 실제 오프라인 생활(물 마시기, 산책 등) 위주여야 합니다.
               [응답 형식 (JSON)]
               {
                 "slot": "DAILY",
                 "title": "오늘의 회복 미션",
                 "tasks": [
                   { "id": "d1", "title": "미션 제목", "desc": "설명", "icon": "이모지" },
                   ... (3개)
                 ]
               }`
            : `사용자의 회복 점수(${input.score})와 시간대(${input.slotName})에 맞는 3가지 회복 루틴을 추천해주세요.
               [응답 형식 (JSON)]
               {
                 "slot": "${input.slotCode}",
                 "title": "${input.slotName} 회복 루틴",
                 "tasks": [
                   { "id": "t1", "title": "태스크 제목", "desc": "설명", "icon": "이모지" },
                   ... (3개)
                 ]
               }`;

        try {
            const response = await GeminiCore.generateWithFallback(prompt, "AI 루틴 큐레이터 모드", 0.7);
            const startIdx = response.indexOf('{');
            const endIdx = response.lastIndexOf('}');
            
            if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
                const jsonStr = response.substring(startIdx, endIdx + 1);
                try {
                    return JSON.parse(jsonStr);
                } catch (parseError) {
                    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
                    if (jsonMatch) return JSON.parse(jsonMatch[0]);
                }
            }
            throw new Error("Invalid JSON");
        } catch (error) {
            console.error("Daily Routines error:", error);
            return {
                slot: input.slotCode,
                title: `${input.slotName} 회복 루틴`,
                tasks: [
                    { id: "f1", title: "가벼운 스트레칭", desc: "몸을 깨우는 동작", icon: "Zap" },
                    { id: "f2", title: "미온수 마시기", desc: "수분 보충", icon: "Droplet" },
                    { id: "f3", title: "심호흡 5회", desc: "안정 찾기", icon: "Wind" }
                ]
            };
        }
    }

    static async generateNavigatorAdvice(input: NavigatorInput): Promise<NavigatorOutput> {
        const prompt = `
당신은 gleemile(Youniqle)의 수석 리커버리 네비게이터입니다.
사용자의 오늘의 회복 점수를 분석하여 개인화된 어드바이스를 제공하세요.

[오늘의 점수]
- 신체: ${input.scores.physical}, 멘탈: ${input.scores.mental}, 생활: ${input.scores.lifestyle}, 수면: ${input.scores.sleep}
- 어제 점수: ${input.yesterdayScore || '정보 없음'}

[응답 형식 (JSON)]
{
  "comment": "오늘의 한 줄 코멘트",
  "actionItem": "오늘 실천할 구체적인 행동 팁",
  "recoveryScore": 0,
  "tomorrowForecast": {
    "status": "맑음|흐림|주의",
    "description": "내일의 회복 상태 예측 설명 (1~2문장)",
    "energyLevel": 70
  }
}`;
        try {
            const response = await GeminiCore.generateWithFallback(prompt, "AI 네비게이터 모드", 0.7);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                // tomorrowForecast가 문자열이면 객체로 변환
                if (typeof parsed.tomorrowForecast === 'string') {
                    parsed.tomorrowForecast = {
                        status: '안정',
                        description: parsed.tomorrowForecast,
                        energyLevel: parsed.recoveryScore || 70
                    };
                }
                // 필수 필드 누락 방어
                if (parsed.tomorrowForecast && !parsed.tomorrowForecast.status) parsed.tomorrowForecast.status = '안정';
                if (parsed.tomorrowForecast && !parsed.tomorrowForecast.description) parsed.tomorrowForecast.description = '내일의 회복 흐름을 지켜보겠습니다.';
                if (parsed.tomorrowForecast && parsed.tomorrowForecast.energyLevel == null) parsed.tomorrowForecast.energyLevel = parsed.recoveryScore || 70;
                return parsed;
            }
            throw new Error("Parsing failed");
        } catch (error) {
            return {
                comment: "오늘 하루도 당신의 회복을 응원합니다.",
                actionItem: "가벼운 스트레칭으로 몸을 깨워보세요.",
                recoveryScore: 70,
                tomorrowForecast: {
                    status: "안정",
                    description: "꾸준한 리듬 유지가 회복의 핵심입니다.",
                    energyLevel: 70
                }
            };
        }
    }

    static async paraphrasePrecisionQuestions(
        baseQuestions: any[],
        dayOfWeek: string,
        theme: string
    ): Promise<any[]> {
        const cacheKey = `${dayOfWeek}_${theme}`;
        if (this.questionCache[cacheKey]) return this.questionCache[cacheKey];

        const prompt = `
당신은 gleemile(Youniqle)의 전문 회복 네비게이터입니다.
제공된 ${baseQuestions.length}개의 정밀 리듬체크 문항을 [${dayOfWeek}: ${theme}] 테마에 맞춰 재구성하세요.
JSON 배열만 반환하세요.`;

        try {
            const response = await GeminiCore.generateWithFallback(prompt, "AI 리커버리 네비게이터 모드", 0.7);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const paraphrased = JSON.parse(jsonMatch[0]);
                this.questionCache[cacheKey] = paraphrased;
                return paraphrased;
            }
        } catch (error) {
            console.error("Paraphrasing failed:", error);
        }
        return baseQuestions;
    }

    static async analyzeRecoveryTrend(input: { 
        userName: string; 
        scores: any[]; 
        communityInsights?: {
            avgScore: number;
            percentile: number;
        }
    }): Promise<any> {
        const communityContext = input.communityInsights 
            ? `\n## 사회적 증거 (Social Proof) 데이터
- gleemile 전체 유저 평균 점수: ${input.communityInsights.avgScore}
- 사용자의 현재 위치: 상위 ${input.communityInsights.percentile}% (수치가 낮을수록 우수)
- 위 정보를 분석 결과에 자연스럽게 녹여내어 사용자가 자부심을 느끼거나 분발하도록 동기를 부여하세요.`
            : "";

        const prompt = `
당신은 gleemile(Youniqle)의 수석 데이터 사이언티스트이자 회복 총무/조장입니다.
사용자의 주간 회복 데이터를 분석하여 종합 리포트를 작성하세요.

## 사용자 데이터
- 이름: ${input.userName}
- 주간 기록: ${JSON.stringify(input.scores)}
${communityContext}

## 분석 가이드
1. **Trend Analysis**: 한 주 동안의 회복 점수 변화 추이를 전문적으로 분석하세요.
2. **Personalized Insight**: 단순히 수치 나열이 아닌, 사용자의 상태를 비유(metaphor)와 연결해 깊이 있게 통찰하세요.
3. **Actionable Advice**: 다음 주에 실천할 수 있는 가장 효과적인 회복 행동 3가지를 제안하세요.

## 응답 형식 (JSON Only)
{
  "summary": "전체 요약 (1~2문장)",
  "status": "회복 상승|안정 유지|주의 필요",
  "percentileFeedback": "백분위 기반의 칭찬 또는 격려 문구 (communityInsights가 있을 때만 작성)",
  "insight": "심층 분석 내용 (3~4문장)",
  "recommendations": ["추천 행동 1", "추천 행동 2", "추천 행동 3"]
}`;
        try {
            const response = await GeminiCore.generateWithFallback(prompt, "AI 데이터 분석가 모드", 0.6);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (error) {
            return { 
                summary: "데이터 분석 중입니다.", 
                status: "안정", 
                recommendations: ["규칙적인 생활 유지"], 
                insight: "조금씩 나아지는 모습이 보입니다." 
            };
        }
    }

    static async generateDailyQuestions(
        theme: string,
        keywords: string,
        journey: string,
        medicalCategory: string | null,
        treatmentType: string | null,
        userTier: string,
        context: any,
        medicationHistory?: string
    ): Promise<any[]> {
        const categoryMap: Record<string, string> = {
            'PLASTIC': '성형외과',
            'ORTHOPEDIC': '정형외과',
            'INTERNAL': '내과',
            'DENTAL': '치과',
            'ORIENTAL': '한의원',
            'GENERAL': '일반',
            'none': '일반',
            'null': '일반'
        };

        const treatmentMap: Record<string, string> = {
            'PROCEDURE': '시술',
            'SURGERY': '수술',
            'none': '관리',
            'null': '관리'
        };

        const displayCategory = categoryMap[medicalCategory || ''] || medicalCategory || '일반';
        const displayTreatment = treatmentMap[treatmentType || ''] || treatmentType || '관리';

        const prompt = `
당신은 'gleemile(Youniqle)'의 수석 리커버리 총무/조장입니다. 사용자를 위한 **'60초 리듬체크'** 문항 5개를 생성해주세요.

## 분석 컨텍스트
- 테마: ${theme}
- 주요 키워드: ${keywords}
- 현재 여정: ${journey}
- 시술 정보: ${displayCategory} / ${displayTreatment}
- 유저 등급: ${userTier}
- 약물 이력: ${medicationHistory || '없음'}

## 브랜드 안전성 지침 (CRITICAL)
- **'gleemile' 브랜드명은 어떠한 시술/수술 명칭과도 결합될 수 없습니다.** (예: 'gleemile 시술', 'gleemile 수술', 'gleemile 관리' 등은 절대 금지!)
- gleemile(Youniqle)은 회복/웰니스 플랫폼이지 의료 기관이 아닙니다. 
- 따라서 질문 생성 시 'gleemile 시술 후...' 가 아니라, '성형외과 시술 후...', '정형외과 수술 후...' 와 같이 사용자가 실제로 진행한 의료 시술 종류를 명확한 주체로 삼아 질문을 다듬어주세요.

## 문항 구성 원칙
1. **정확히 5개의 문항**을 생성하세요.
2. 각 문항은 **리커버리(회복), 에너지, 컨디션, 심리적 안정, 신체적 불편감**을 골고루 다루어야 합니다.
3. **[척도 호응 호환성 보장 - CRITICAL]** 답변이 "그렇다 / 그렇지 않다" (동의 여부)이므로, 개방형 질문("어떠신가요?", "어느 정도인가요?")은 절대 생성하지 마십시오. 대신 사용자가 자신의 상태에 즉각 동의하거나 비동의할 수 있도록 **"오늘 나의 전반적인 에너지 수준은 아주 좋은 편이다.", "오늘 하루 신체 컨디션에 특별히 통증이나 불편한 부분이 느껴지지 않는다."와 같은 명확한 평서문 주장(Affirmation Statement) 형태로만 질문을 작성하십시오.**
4. 질문은 신뢰감 있고 부드러운 톤앤매너를 유지하세요. (예: "~하는 편이다", "~하게 느껴진다")
5. 답변 방식은 5점 척도(Likert)를 기본으로 합니다.

## 응답 형식 (JSON Array Only)
[
  {
    "id": "q1",
    "category": "Physical",
    "text": "질문 내용",
    "options": [
      { "label": "전혀 그렇지 않다", "score": 1 },
      { "label": "그렇지 않다", "score": 2 },
      { "label": "보통이다", "score": 3 },
      { "label": "그렇다", "score": 4 },
      { "label": "매우 그렇다", "score": 5 }
    ]
  },
  ... (총 5개)
]`;

        try {
            const response = await GeminiCore.generateWithFallback(prompt, "60초 리듬체크 생성 모드", 0.8);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error("Invalid JSON in AI response");
        } catch (error) {
            console.error("Failed to generate daily questions:", error);
            // Fallback: 5 simple statements aligned with Likert scale
            return [
                { id: "f1", category: "Physical", text: "오늘 나의 전반적인 신체 컨디션과 에너지는 아주 좋은 편이다.", options: [] },
                { id: "f2", category: "Mindset", text: "오늘 하루를 시작할 때 내 마음은 아주 편안하고 여유로웠다.", options: [] },
                { id: "f3", category: "Emotional", text: "최근에 스트레스나 일상적인 피로감이 거의 느껴지지 않는다.", options: [] },
                { id: "f4", category: "Social", text: "요즘 주변 사람들과 이야기하고 소통할 때 큰 즐거움을 느낀다.", options: [] },
                { id: "f5", category: "Physical", text: "신체적으로 특별히 통증이나 뻐근하게 굳은 부위가 없다.", options: [] }
            ];
        }
    }
}
