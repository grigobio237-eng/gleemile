
import { ExecutionContext } from '@/lib/video-workflow/types';

export interface ScriptStrategy {
    getPrompt(trendContext: any, projectType: string, productName?: string): string;
    parseResponse(response: string): any;
}

const COMMON_JSON_FORMAT = `
[출력 형식 (JSON)]
{
  "title": "영상 제목",
  "mainCharacter": "주인공 외양 묘사 (모든 장면의 일관성을 위해 구체적으로)",
  "recommendedVoice": {
      "gender": "FEMALE | MALE",
      "tone": "밝음 | 진중함 | 차분함 | 활기참",
      "reason": "성우 추천 이유 (1문장)"
  },
  "scenes": [
    {
      "id": 1,
      "visualPrompt": "장면 시각적 묘사 (이미지 생성용 상세 영어 프롬프트)",
      "audioScript": "내레이션 텍스트 (구어체)",
      "duration": 5
    }
  ]
}
**주의: 반드시 JSON 형식으로만 응답하고 다른 설명이나 텍스트를 붙이지 마세요.**`;

export class ScriptStrategyRegistry {
    static getStrategy(projectType: string): ScriptStrategy {
        switch (projectType) {
            case 'product_promo':
                return new ProductPromoScriptStrategy();
            case 'influencer_promo':
                return new InfluencerPromoScriptStrategy();
            case 'influencer_vlog':
                return new InfluencerVlogScriptStrategy();
            case 'influencer_long':
                return new InfluencerLongScriptStrategy();
            default:
                return new DefaultShortformScriptStrategy();
        }
    }
}

class DefaultShortformScriptStrategy implements ScriptStrategy {
    getPrompt(trendContext: any, projectType: string, productName?: string): string {
        const productInfo = productName ? `[상품 정보]\n- 상품명: ${productName}\n` : "";
        return `
    당신은 숏폼 전문 시나리오 작가이자 AI 이미지 프롬프트 엔지니어입니다.
    다음 트렌드 분석 결과를 바탕으로 조회수를 폭발시킬 수 있는 감각적인 영상을 기획해주세요.

    ${productInfo}
    [트렌드 정보]
    ${JSON.stringify(trendContext)}

    [작성 가이드 - 일관성 필수]
    - **상품명 사용**: 대본(audioScript) 내에서 상품을 언급할 때는 반드시 실제 이름인 "${productName || '해당 상품'}"을 사용하세요. 절대 [상품명]과 같은 플레이스홀더를 쓰지 마세요.
    - **캐릭터 설정**: 영상 전체를 관통하는 '주인공'을 하나 설정하고, 모든 장면의 시각적 묘사(Visual Prompt)에 해당 주인공의 외양 묘사를 반드시 포함하세요.
    - **톤앤매너**: 한국적인 배경과 소품을 명시하세요.
    - **장면 구성**: 총 6~10개의 장면으로 구성하되, 스토리의 흐름에 따라 최적의 개수를 선택하세요.
    - **영상 호흡**: 장면별 길이(duration)를 리듬감 있게 조절하세요 (빠른 전환은 2-3초, 강조가 필요한 장면은 5-8초).
    - 내레이션은 구어체로 짧고 강렬하게 작성하세요.
    
    ${COMMON_JSON_FORMAT}
    `;
    }

    parseResponse(response: string) {
        // Find JSON block using regex to be more robust against extra text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }
        return JSON.parse(jsonMatch[0]);
    }
}

class ProductPromoScriptStrategy extends DefaultShortformScriptStrategy {
    getPrompt(trendContext: any, projectType: string, productName?: string): string {
        const productInfo = productName ? `[상품 정보]\n- 상품명: ${productName}\n` : "";
        return `
    당신은 글로벌 커머스 광고 호스트/개설자입니다. 상품 이미지를 활용한 고품격 홍보 영상을 기획하세요.
    
    ${productInfo}
    [트렌드 정보]
    ${JSON.stringify(trendContext)}

    [작성 가이드]
    - **상품명 사용**: 대본(audioScript) 내에서 상품을 언급할 때는 반드시 실제 이름인 "${productName || '해당 상품'}"을 사용하세요. 소비자의 신뢰감을 높이기 위해 자연스럽게 녹여내세요. 절대 [상품명]과 같은 플레이스홀더를 쓰지 마세요.
    - **Scene 1**: 반드시 '상품(Product)' 자체가 강조되어야 합니다. (약 3-4초)
    - **Scene 2**: 반드시 '모델(Model)'이 상품을 사용하는 모습이 나와야 합니다. (약 4-5초)
    - **장면 구성**: 총 6~10개의 장면으로 구성하되, 상품의 특장점을 효과적으로 보여줄 수 있는 최적의 개수를 선택하세요.
    - **영상 호흡**: 
        - 긴박한 정보 전달이나 임팩트가 필요한 순간은 2-3초의 숏테이크를 활용하세요.
        - 상품의 디테일이나 감성적인 연출이 필요한 구간은 5-8초의 롱테이크로 시선을 머물게 하세요.
    - 내레이션은 쇼호스트처럼 활기차고 설득력 있어야 합니다.
    - 시각적 묘사(Visual Prompt)는 하이엔드 광고 영상처럼 영문으로 상세히 작성하세요.

    ${COMMON_JSON_FORMAT}
    `;
    }
}

class InfluencerPromoScriptStrategy extends DefaultShortformScriptStrategy {
    getPrompt(trendContext: any): string {
        return `
    당신은 인기 인플루언서의 콘텐츠 매니저입니다. 인플루언서가 제품을 자연스럽게 소개하는 5장면 영상을 기획하세요.
    `;
    }
}

class InfluencerVlogScriptStrategy extends DefaultShortformScriptStrategy {
    getPrompt(trendContext: any): string {
        return `
    당신은 감성 브이로그 작가입니다. 일상의 소소한 행복을 담은 5장면 영상을 기획하세요.
    `;
    }
}

class InfluencerLongScriptStrategy extends DefaultShortformScriptStrategy {
    getPrompt(trendContext: any): string {
        return `
    당신은 전문 다큐멘터리 작가입니다. 깊이 있는 지식 전달을 위한 10장면 이상의 롱폼 대본을 작성하세요.
    `;
    }
}
