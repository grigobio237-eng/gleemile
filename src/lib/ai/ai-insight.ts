import { GeminiAIEngine } from './gemini-engine';

export async function generateUnifiedInsight(input: {
    scans: any[];
    survey?: any;
    preConsultation?: any;
    postCare?: any;
}) {
    const prompt = `당신은 웰니스 케어 플랫폼 'gleemile(Youniqle)'의 수석 회복 네비게이터 AI입니다.
사용자의 다양한 파편화된 데이터를 종합하여, 오늘 하루 유저가 실천해야 할 **초개인화 융합 회복 지침**을 내려주세요.

## 입력된 데이터
1. **스캐너 데이터 (최신 5건)**:
${JSON.stringify(input.scans, null, 2)}

2. **60초 정밀 문진 데이터**:
${JSON.stringify(input.survey, null, 2)}

3. **시술 전 상담 가이드**:
${JSON.stringify(input.preConsultation, null, 2)}

4. **시술 후 회복 로드맵**:
${JSON.stringify(input.postCare, null, 2)}

## 작성 원칙
1. **데이터 융합(Synthesis)**: 스캐너(자세, 영양 등)와 정밀 문진(통증 부위, 생활 습관), 그리고 시술 데이터 간의 연관성을 찾아 하나의 맥락으로 묶어 설명하세요. (예: 문진에서 피로를 호소했고 식단 스캔에서 탄수화물 위주였다면 ➡ "피로의 원인은 탄수화물 편향 식사 때문일 수 있습니다.")
2. **실천 중심**: 유저가 오늘 즉시 수행할 수 있는 구체적이고 작은 습관(Habits) 3가지를 제안하세요.
3. **어조**: 신뢰감 있고, 따뜻하며 격려하는 말투를 사용하세요.

## 출력 형식 (반드시 아래 JSON 형식만 출력하세요)
{
  "title": "지능형 회복 가이드 제목 (예: '승모근 긴장 이완과 단백질 보충')",
  "description": "파편화된 데이터를 결합하여 도출한 심층 분석 및 응원 피드백 (3~4문장)",
  "suggestion": "오늘의 핵심 실천 방안 (1문장)",
  "habits": [
    "구체적인 실천 습관 1",
    "구체적인 실천 습관 2",
    "구체적인 실천 습관 3"
  ]
}
`;

    const systemInstruction = "당신은 건강 상태를 크로스 체크하고 초개인화된 처방을 내리는 웰니스 AI입니다. 반드시 순수 JSON만 반환하세요.";

    try {
        const response = await GeminiAIEngine.generateWithFallback(prompt, systemInstruction);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Failed to parse JSON from AI response");
    } catch (error) {
        console.error("[ai-insight] Failed to generate unified insight:", error);
        // Fallback
        return {
            title: "오늘의 통합 회복 가이드",
            description: "데이터를 기반으로 맞춤형 회복 경로를 분석 중입니다.",
            suggestion: "규칙적인 수분 섭취와 가벼운 스트레칭을 실천해보세요.",
            habits: [
                "미지근한 물 자주 마시기",
                "30분마다 일어나서 가슴 펴기",
                "저녁 8시 이후 스마트폰 멀리하기"
            ]
        };
    }
}
