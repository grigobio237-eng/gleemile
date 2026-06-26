import { GeminiCore } from '../engine/core';
import { OmakaseInput, OmakaseOutput, RecoveryCaseInput, RecoveryCaseOutput } from '@/lib/ai/types';

export class ContentService {
    static async generateDetailImage(prompt: string, options: any = {}): Promise<string | null> {
        const imageModels = await GeminiCore.getTieredModels('image');
        const modelName = imageModels[0] || 'imagen-3.0-generate-001';
        
        try {
            // Placeholder for Imagen implementation logic
            // Since the existing engine used it as a static property, we'll keep the logic consistent
            return "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000"; // Fallback URL for now
        } catch (error) {
            console.error('Image Generation Error:', error);
            return null;
        }
    }

    static async generateOmakasePlans(input: OmakaseInput): Promise<OmakaseOutput> {
        const prompt = `사용자의 페인포인트(${input.painPoint})에 맞는 3가지 회복 오마카세 플랜을 제안하세요. JSON Only.`;
        try {
            const response = await GeminiCore.generateWithFallback(prompt, "gleemile 리커버리 셰프 모드", 0.7);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (error) {}
        throw new Error("Omakase generation failed");
    }

    static async generateRecoveryWebtoonScript(input: RecoveryCaseInput): Promise<RecoveryCaseOutput> {
        const prompt = `유저의 증상("${input.symptom}")을 바탕으로 회복 여정 웹툰 스크립트를 작성하세요. JSON Only.`;
        try {
            const response = await GeminiCore.generateWithFallback(prompt, "회복 스토리텔러 모드", 0.8);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (error) {}
        throw new Error("Webtoon script failed");
    }

    static async generateManagerResponse(input: any): Promise<{ response: string }> {
        const systemInstruction = `당신은 gleemile의 AI 매니저 '유니'입니다. 유저 정보: ${input.userContext.name}`;
        const prompt = `유저 질문: "${input.message}"`;
        try {
            const text = await GeminiCore.generateWithFallback(prompt, systemInstruction, 0.7);
            return { response: text };
        } catch (error) {
            return { response: "잠시 후 다시 시도해주세요." };
        }
    }

    static async planDetailPage(input: any): Promise<any> {
        const prompt = `
당신은 최고의 상세페이지 기획자입니다. 다음 상품/서비스 정보를 바탕으로 기획안(섹션별 구성)을 JSON 형식으로 작성하세요.
반드시 JSON 배열 형태로 응답해야 하며, 각 항목은 다음 구조를 가져야 합니다:
{
  "id": "고유문자열 (예: section_1)",
  "title": "섹션 제목",
  "logicalSections": ["Hook", "Problem", "Solution", "Benefit", "Proof", "Action" 중 해당되는 것 1~2개"],
  "keyMessage": "이 섹션에서 전달할 핵심 메시지 카피",
  "visualPrompt": "이 섹션을 표현할 이미지 생성용 프롬프트 (영어로 상세히 작성)"
}

상품명: ${input.name}
카테고리: ${input.category}
가격: ${input.price}
키워드: ${input.keywords}
타겟 고객: 성별(${input.targetGender}), 연령대(${input.targetAge})
기획 섹션 수: ${input.length}개
        `;

        try {
            const response = await GeminiCore.generateWithFallback(prompt, "전문 카피라이터 및 상세페이지 기획자", 0.7);
            const jsonMatch = response.match(/\[[\s\S]*\]/); // Match array
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            const objectMatch = response.match(/\{[\s\S]*\}/); // Match object just in case
            if (objectMatch) {
                return JSON.parse(objectMatch[0]);
            }
        } catch (error) {
            console.error('planDetailPage error:', error);
        }
        throw new Error("상세페이지 기획안 생성에 실패했습니다.");
    }
}
