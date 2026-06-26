
import { ExecutionContext } from '@/lib/video-workflow/types';

export interface WorkflowStrategy {
    getPrompt(topic: string, context?: ExecutionContext): string;
    parseResponse(response: string): any;
}

export class TrendStrategyRegistry {
    static getStrategy(projectType: string): WorkflowStrategy {
        switch (projectType) {
            case 'product_promo':
                return new ProductPromoTrendStrategy();
            case 'influencer_promo':
                return new InfluencerPromoTrendStrategy();
            case 'influencer_vlog':
                return new InfluencerVlogTrendStrategy();
            case 'influencer_long':
                return new InfluencerLongTrendStrategy();
            default:
                return new DefaultShortformTrendStrategy();
        }
    }
}

class DefaultShortformTrendStrategy implements WorkflowStrategy {
    getPrompt(topic: string): string {
        return `
    주제: "${topic}"
    당신은 소셜 미디어 트렌드 분석가입니다. 위 주제와 관련하여 현재 유튜브 숏츠나 틱톡에서 인기 있는 트렌드를 분석해주세요.
    
    [출력 요구사항]
    JSON 형식으로만 응답해주세요.
    {
      "concepts": ["트렌드 컨셉1", "트렌드 컨셉2", "트렌드 컨셉3"],
      "styling": "추천 촬영 기법 및 비주얼 스타일 (예: 빠른 컷 편집, 1인칭 시점)",
      "hooks": ["후킹 문구1", "후킹 문구2", "후킹 문구3"],
      "analysis": "종합 분석 요약 (한 문장)"
    }
    `;
    }

    parseResponse(response: string) {
        const cleanText = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    }
}

class ProductPromoTrendStrategy extends DefaultShortformTrendStrategy {
    getPrompt(topic: string): string {
        return `
    상품 주제: "${topic}"
    당신은 커머스 전문 트렌드 마케터입니다. 상품 이미지를 활용한 홍보용 숏폼 제작을 위해 다음을 분석하세요.
    1. 상품의 핵심 소구점(USP)과 결합된 트렌드
    2. 구매 욕구를 자극하는 비주얼 스타일
    3. 상품명을 명확히 노출하는 훅 문구
    
    [출력 요구사항]
    JSON 형식으로 응답하세요.
    {
      "concepts": ["상품 언박싱 트렌드", "Before & After 효과", "실생활 사용 루틴"],
      "styling": "깔끔한 스튜디오 조명 느낌, 상품 클로즈업 강조",
      "hooks": ["이거 하나로 삶의 질이 달라집니다", "아직도 ${topic} 없으세요?", "품절 대란템 솔직 리뷰"],
      "analysis": "상품의 디자인과 실용성을 동시에 강조하는 감성적인 접근이 유효합니다."
    }
    `;
    }
}

class InfluencerPromoTrendStrategy extends DefaultShortformTrendStrategy {
    getPrompt(topic: string): string {
        return `
    인플루언서 홍보 주제: "${topic}"
    당신은 인플루언서 마케팅 대행사 전문가입니다. 인플루언서가 특정 상품을 홍보하는 브랜디드 콘텐츠 트렌드를 분석하세요.
    
    [출력 요구사항]
    JSON 응답:
    {
      "concepts": ["인플루언서의 추천 아이템", "제품과 함께하는 하루", "구독자 요청 리뷰"],
      "styling": "내추럴한 필터, 셀피 모드 카메라 워킹",
      "hooks": ["제가 요즘 매일 쓰는 건데요", "여러분이 계속 물어보시던 그 제품!", "역대급 광고 제안이라 안 가져올 수 없었어요"],
      "analysis": "인플루언서와 구독자 사이의 신뢰를 바탕으로 한 진정성 있는 리뷰 트렌드가 강력합니다."
    }
    `;
    }
}

class InfluencerVlogTrendStrategy extends DefaultShortformTrendStrategy {
    getPrompt(topic: string): string {
        return `
    브이로그 주제: "${topic}"
    당신은 유명 브이로그 유튜버의 메인 편집자입니다. 일상적이고 감성적인 브이로그 트렌드를 분석하세요.
    `;
    }
}

class InfluencerLongTrendStrategy extends DefaultShortformTrendStrategy {
    getPrompt(topic: string): string {
        return `
    롱폼 주제: "${topic}"
    당신은 전문 다큐멘터리 및 롱폼 영상 기획자입니다. 10분 이상의 긴 호흡을 가진 전문적인 영상 트렌드를 분석하세요.
    `;
    }
}
