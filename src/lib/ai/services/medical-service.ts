import { GeminiCore } from '../engine/core';
import { DiagnosisInput, DiagnosisOutput, MedicalInterviewGuideOutput, PostCareRoadmapOutput } from '@/lib/ai/types';

export class MedicalService {
    static async generateDiagnosisSolution(input: DiagnosisInput): Promise<DiagnosisOutput> {
        const userName = input.userInfo?.name || '회원';
        const scoreSummary = `
        - 사용자 이름: ${userName}
        - 신체 활력: ${input.scores.physical}, 멘탈 안정: ${input.scores.mental}, 생활 규칙성: ${input.scores.lifestyle}, 수면 품질: ${input.scores.sleep}
        - Big 5 T점수: ${JSON.stringify(input.tScores || {})}
        `;

        const prompt = `
        당신은 대한민국 최고의 통합 의학 전문가이자 gleemile(YOUNIQLE)의 수석 리커버리 디렉터입니다. 
        사용자의 심층 리듬체크 결과(${scoreSummary})를 정밀 분석하여 맞춤형 회복 솔루션을 제공해주세요.

        [응답 지침]
        1. 모든 응답은 반드시 지정된 JSON 형식으로만 출력하세요.
        2. 'audioScript'는 사용자의 성격과 점수 결과를 바탕으로 원장님이 직접 들려주는 듯한 따뜻하고 전문적인 위로와 조언을 담아 4~5문장으로 작성하세요.
        3. 'analysis'는 전체적인 상태를 한 문장으로 정의하세요.

        [JSON Schema]
        {
          "analysis": "문자열",
          "exercise": "문자열 (추천 운동)",
          "nutrition": "문자열 (추천 영양)",
          "mindset": "문자열 (추천 마인드셋)",
          "sleep": "문자열 (추천 수면법)",
          "productConcept": {
            "name": "문자열 (추천 제품명)",
            "reason": "문자열 (추천 이유)",
            "ingredients": ["성분1", "성분2"]
          },
          "audioScript": "사용자에게 들려줄 음성 가이드 텍스트 (공백 포함 200자 내외)"
        }
        `;

        try {
            const text = await GeminiCore.generateWithFallback(prompt, "gleemile 수석 리커버리 디렉터 모드", 0.7);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                // 필드 누락 방지 보완
                return {
                    analysis: parsed.analysis || "밸런스 유지를 권장합니다.",
                    exercise: parsed.exercise || "가벼운 산책",
                    nutrition: parsed.nutrition || "수분 섭취 늘리기",
                    mindset: parsed.mindset || "5분 명상",
                    sleep: parsed.sleep || "취침 전 스마트폰 자제",
                    productConcept: parsed.productConcept || { name: "베이직 밸런스", reason: "기초 형성", ingredients: ["비타민"] },
                    audioScript: parsed.audioScript || `${userName}님, 현재 상태를 바탕으로 맞춤 회복 플랜을 준비했습니다. 규칙적인 생활이 가장 중요합니다.`
                };
            }
            throw new Error('Parsing failed');
        } catch (error) {
            console.error('Gemini Solution Generation Failed:', error);
            return {
                analysis: "밸런스 유지를 권장합니다.",
                exercise: "가벼운 산책",
                nutrition: "수분 섭취 늘리기",
                mindset: "5분 명상",
                sleep: "취침 전 스마트폰 자제",
                productConcept: { name: "베이직 밸런스", reason: "기초 형성", ingredients: ["비타민"] },
                audioScript: `${userName}님, 분석 결과 전반적인 에너지 밸런스 조절이 필요해 보입니다. gleemile이 제안하는 루틴을 따라보세요.`
            };
        }
    }

    static async generateMedicalInterviewGuide(data: any): Promise<MedicalInterviewGuideOutput> {
        const prompt = `gleemile 수석 코디네이터로서 다음 사전 문진 데이터를 정밀 분석하여 면담 가이드를 작성하세요. 
데이터: ${JSON.stringify(data)}

[응답 형식: 반드시 아래 JSON 형식만 반환하세요]
{
  "analysis": "사용자의 증상과 상태에 대한 종합적인 분석 코멘트 (2~3문장)",
  "mustAskQuestions": [
    { "question": "환자가 의사에게 꼭 물어봐야 할 질문", "rationale": "이 질문을 해야 하는 의학적/안전상 이유" }
  ],
  "hospitalTips": ["진료/상담 시 유의사항이나 팁 1", "팁 2"]
}`;
        try {
            const text = await GeminiCore.generateWithFallback(prompt, "gleemile 수석 코디네이터 모드", 0.7);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            throw new Error('Parsing failed');
        } catch (error) {
            console.error('generateMedicalInterviewGuide error:', error);
            return {
                analysis: "환자분의 문진 데이터를 바탕으로 필수 면담 항목을 정리했습니다.",
                mustAskQuestions: [
                  { question: "현재 증상에 대한 가장 효과적인 치료 방법은 무엇인가요?", rationale: "정확한 치료 방향 설정" },
                  { question: "과거 병력이 이번 치료에 미칠 수 있는 영향이 있나요?", rationale: "안전한 치료 계획 수립" }
                ],
                hospitalTips: ["사소한 병력이라도 꼭 말씀해 주세요.", "의료진의 질문에 최대한 구체적으로 답변해 주시면 큰 도움이 됩니다."]
            };
        }
    }

    static async generatePostCareRoadmap(data: any): Promise<PostCareRoadmapOutput> {
        const prompt = `gleemile 수석 리커버리 전문가로서 시술 후 로드맵을 작성하세요. 데이터: ${JSON.stringify(data)}`;
        try {
            const text = await GeminiCore.generateWithFallback(prompt, "gleemile 리커버리 전문가 모드", 0.7);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            throw new Error('Parsing failed');
        } catch (error) {
            return {
                statusAnalysis: "표준 가이드를 제공합니다.", isEmergency: false, recoveryPhase: "초기 집중 관리기",
                timeline: [{ period: "초기", goal: "붓기 억제", instructions: ["냉찜질"] }],
                expertAdvice: ["특이사항 발생 시 병원 연락"]
            };
        }
    }

    static async analyzeSymptom(symptom: string): Promise<{ category: string; reason: string }> {
        const prompt = `증상("${symptom}")에 가장 적합한 gleemile 진료 분야(ORTHOPEDIC, INTERNAL, PLASTIC, ORIENTAL, DENTAL, GENERAL)를 추천하세요. 
        - ORTHOPEDIC: 정형/재활 (통증, 관절)
        - INTERNAL: 내과/검진 (질환, 건강검진)
        - PLASTIC: 성형/피부 (미용, 시술)
        - ORIENTAL: 한방 진료 (보약, 침, 체질)
        - DENTAL: 치과 (치아, 잇몸)
        - GENERAL: 일반 (그 외 기본 증상)
        응답은 JSON {category: "코드", reason: "이유"} 형식으로 하세요.`;
        try {
            const text = await GeminiCore.generateWithFallback(prompt);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (error) {}
        return { category: 'GENERAL', reason: '일반 상담 연결' };
    }

    static async generateRecoveryAdvice(input: any): Promise<string> {
        const prompt = `환자의 실시간 데이터 분석 리포트를 작성하세요. 데이터: ${JSON.stringify(input)}`;
        return await GeminiCore.generateWithFallback(prompt, "AI 회복 어드바이저 모드", 0.6);
    }

    static async generateDynamicQuestions(symptom: string, category: string): Promise<any> {
        const symptomText = symptom ? `증상("${symptom}")과 ` : '';
        const prompt = `
        사용자의 ${symptomText}진료 분야("${category}")를 바탕으로 최적화된 gleemile(YOUNIQLE) 맞춤형 문진 질문 세트를 생성하세요.
        gleemile의 톤앤매너(프리미엄, 전문적, 따뜻함)를 유지하세요.
        
        [매우 중요: 분야별 용어 변환]
        내과, 한방, 치과 등에서는 '시술 후 일상 복귀' 같은 성형외과적 표현을 피하고, '집중 치료 기간', '내원 희망 주기' 등으로 적절히 용어를 변환하여 라벨(downtimeLabel 등)을 작성하세요.
        downtimeOptions의 value는 무조건 "1일", "3일", "7일", "14일 이상"을 유지하되, label만 분야에 맞게 바꾸세요.

        [응답 형식: JSON]
        {
          "steps": {
            "step1": {
              "title": "문자열",
              "sub": "문자열",
              "label": "문자열 (주요 변화/기대치 관련 질문)",
              "options": [
                { "label": "옵션1", "value": "자연스러운 변화" },
                { "label": "옵션2", "value": "세련된 변화" },
                { "label": "옵션3", "value": "드라마틱한 변화" }
              ],
              "downtimeLabel": "문자열 (기간/복귀/회복 주기에 대한 라벨)",
              "downtimeSub": "문자열 (서브 설명)",
              "downtimeOptions": [
                { "label": "문자열 (예: 바로 복귀/당일 치료)", "value": "1일" },
                { "label": "문자열 (예: 단기 휴식/단기 치료)", "value": "3일" },
                { "label": "문자열 (예: 충분한 회복/중기 치료)", "value": "7일" },
                { "label": "문자열 (예: 완벽한 복구/장기 치료)", "value": "14일 이상" }
              ],
              "eventLabel": "문자열 (일정 관련)",
              "eventSub": "문자열",
              "eventPlaceholder": "문자열"
            },
            "step2": {
              "title": "문자열",
              "sub": "문자열",
              "label": "문자열 (과거 치료/수술 경험 관련)",
              "subLabel": "문자열",
              "placeholder": "문자열",
              "medicationLabel": "문자열 (복용 약품 확인 라벨)",
              "medicationSub": "문자열 (약품 확인 서브 설명)",
              "healthIssueLabel": "문자열 (최근 건강 상태 확인 라벨)",
              "healthIssueSub": "문자열 (건강 상태 서브 설명)"
            },
            "step3": {
              "title": "문자열",
              "sub": "문자열",
              "label": "문자열 (우려 사항 관련)",
              "options": [
                { "id": "a-pain", "label": "통증/불편함", "value": "통증" },
                { "id": "a-swelling", "label": "부기/일상지장", "value": "붓기/멍" },
                { "id": "a-scar", "label": "치료 효과/결과", "value": "효과걱정" },
                { "id": "a-privacy", "label": "프라이버시 노출", "value": "프라이버시" }
              ]
            },
            "step4": {
              "title": "문자열",
              "sub": "문자열",
              "label": "문자열 (동행/편의 관련)",
              "placeholder": "문자열",
              "transportLabel": "문자열"
            },
            "step5": {
              "title": "문자열",
              "sub": "문자열",
              "label": "문자열 (투자/예산/다짐 관련)",
              "type": "budget 또는 text",
              "placeholder": "문자열"
            }
          }
        }
        `;

        try {
            const text = await GeminiCore.generateWithFallback(prompt, "gleemile 문진 설계 전문가 모드", 0.7);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Failed to generate dynamic questions:', error);
        }
        return null;
    }
}
