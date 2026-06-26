
import { WorkflowTemplate } from '@/lib/video-workflow/types';

export const SHORTFORM_TEMPLATE: WorkflowTemplate = {
    type: 'shortform',
    name: '일반 숏폼',
    description: '트렌드 분석을 기반으로 한 일반적인 숏폼 영상 생성',
    steps: [
        { id: 'trend', title: '기획 (Trend)', description: '주제 기반 트렌드 분석 및 기획', nodeType: 'trend' },
        { id: 'script', title: '대본 (Script)', description: 'AI 대본 생성', nodeType: 'script' },
        { id: 'audio', title: '오디오 (Audio)', description: '성우 음성 생성', nodeType: 'asset' },
        { id: 'image', title: '이미지 (Image)', description: '장면별 이미지 생성', nodeType: 'asset' },
        { id: 'video', title: '영상 (Video)', description: 'AI 영상 변환', nodeType: 'video' },
        { id: 'synthesis', title: '완성 (Final)', description: '최종 영상 합성 및 확인', nodeType: 'synthesis' }
    ]
};

export const PRODUCT_PROMO_TEMPLATE: WorkflowTemplate = {
    type: 'product_promo',
    name: '상품 홍보 숏폼',
    description: '제품과 모델 이미지를 활용한 전문적인 상품 홍보 영상',
    steps: [
        { id: 'product_asset', title: '상품 확인', description: '업로드된 상품 이미지 확인', nodeType: 'manual' },
        { id: 'model_asset', title: '모델 확인', description: '업로드된 모델/배경 이미지 확인', nodeType: 'manual' },
        { id: 'trend', title: '기획 (Trend)', description: '상품 소구점 및 트렌드 분석', nodeType: 'trend' },
        { id: 'script', title: '대본 (Script)', description: '상품 중심의 마케팅 대본 생성', nodeType: 'script' },
        { id: 'audio', title: '오디오 (Audio)', description: '고품질 성우 음성 생성', nodeType: 'asset' },
        { id: 'image', title: '이미지 (Image)', description: '장면별 이미지 생성 및 최적화', nodeType: 'asset' },
        { id: 'video', title: '영상 (Video)', description: '상품 강조 AI 영상 변환', nodeType: 'video' },
        { id: 'synthesis', title: '완성 (Final)', description: '최종 홍보 영상 합성 및 확인', nodeType: 'synthesis' }
    ]
};

// Placeholder for future types
export const INFLUENCER_PROMO_TEMPLATE: WorkflowTemplate = {
    type: 'influencer_promo',
    name: '인플루언서 상품 홍보',
    description: '인플루언서 스타일의 자연스러운 상품 리뷰 및 홍보',
    steps: SHORTFORM_TEMPLATE.steps // Initial copy, will be customized
};

export const INFLUENCER_VLOG_TEMPLATE: WorkflowTemplate = {
    type: 'influencer_vlog',
    name: '인플루언서 브이로그',
    description: '일상적인 느낌의 브이로그 형식 영상',
    steps: SHORTFORM_TEMPLATE.steps
};

export const INFLUENCER_LONG_TEMPLATE: WorkflowTemplate = {
    type: 'influencer_long',
    name: '인플루언서 롱폼',
    description: '긴 호흡의 상세한 정보 제공 및 스토리텔링 영상',
    steps: SHORTFORM_TEMPLATE.steps
};

export const WORKFLOW_REGISTRY: Record<string, WorkflowTemplate> = {
    'shortform': SHORTFORM_TEMPLATE,
    'product_promo': PRODUCT_PROMO_TEMPLATE,
    'influencer_promo': INFLUENCER_PROMO_TEMPLATE,
    'influencer_vlog': INFLUENCER_VLOG_TEMPLATE,
    'influencer_long': INFLUENCER_LONG_TEMPLATE
};

export function getTemplate(type: string): WorkflowTemplate {
    return WORKFLOW_REGISTRY[type] || SHORTFORM_TEMPLATE;
}
