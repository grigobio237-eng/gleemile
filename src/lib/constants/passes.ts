import { MousePointer2, Star, Crown, RefreshCcw, Leaf, Zap } from 'lucide-react';
import React from 'react';

export const PASS_SPECS: Record<string, any> = {
  reset: {
    id: 'reset',
    name: 'RESET PASS',
    title: '[RESET] 일일 컨디션을 가볍게 스캔하고 관리하기',
    subtitle: '"회복의 첫걸음, 베이직 가이드"',
    intro: 'gleemile의 혁신적인 AI 라이프 스캐너를 통해 매일 당신의 컨디션을 체크하고, 기본적인 회복 가이드를 경험해 보세요.',
    price: '0',
    period: '무료체험',
    position: '기초 리듬체크 및 리포트 체험',
    recommendations: [
      'gleemile의 회복 리듬체크 시스템이 궁금하신 분',
      '현재 나의 컨디션을 수치화해서 확인하고 싶으신 분',
      '작은 루틴부터 가볍게 시작하고 싶으신 분'
    ],
    keyBenefits: [
      { id: 1, title: '일 5회 AI 라이프 스냅', desc: '얼굴, 음식, 환경 등을 스캔하여 매일 5번까지 무료로 컨디션을 분석할 수 있습니다.' },
      { id: 2, title: '베이직 회복 리포트', desc: '오늘의 데이터를 바탕으로 한 기초적인 상태 브리핑을 제공합니다.' },
      { id: 3, title: '사운드 테라피 (일부)', desc: '기본적인 휴식을 돕는 자연음과 백색소음 트랙을 제한적으로 이용할 수 있습니다.' }
    ],
    theme: 'bg-white',
    accent: 'text-slate',
    buttonColor: 'bg-slate hover:bg-slate/90'
  },
  reborn: {
    id: 'reborn',
    name: 'REBORN PASS',
    title: '[REBORN] 나만의 완벽한 회복 리듬 찾기',
    subtitle: '"무제한 스캔과 주간 심층 데이터 OS"',
    intro: '횟수 제한 없는 AI 스캐너와 주간 단위의 심층 데이터 분석을 통해 당신만의 완벽한 회복 흐름을 완성하세요.',
    price: '9,900',
    period: '월',
    position: '무제한 라이프 스냅 및 주간 패턴 분석',
    recommendations: [
      '제한 없이 하루의 모든 순간을 기록하고 싶으신 분',
      '주간 단위의 AI 심층 리포트로 정교한 관리를 원하시는 분',
      '프리미엄 회복 콘텐츠(사운드/명상)를 무제한 이용하고 싶으신 분'
    ],
    keyBenefits: [
      { id: 1, title: '무제한 AI 라이프 스냅', desc: '횟수 제한 없이 하루의 모든 순간을 기록하고 컨디션을 분석할 수 있습니다.' },
      { id: 2, title: '7-Day 누적 패턴 분석', desc: '단편적인 기록을 넘어 지난 7일간의 데이터 맥락을 연결하는 주간 심층 리포트를 제공합니다.' },
      { id: 3, title: '사운드 테라피 전체 라이브러리', desc: '숙면, 집중력 향상, 심신 이완에 최적화된 모든 프리미엄 사운드 트랙을 제한 없이 즐길 수 있습니다.' }
    ],
    theme: 'bg-emerald-50/50',
    accent: 'text-emerald-600',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700'
  },
  restart: {
    id: 'restart',
    name: 'RESTART PASS',
    title: '[RESTART] 가장 깊이 있는 나를 만나는 시간',
    subtitle: '"심층 기질 분석과 전문가 1:1 맞춤형 솔루션"',
    intro: '전문가 수준의 기질 분석과 1:1 맞춤형 솔루션을 통해 당신의 잠재력을 극대화하고 나에게 꼭 맞는 최적의 선택 기준을 정립하세요.',
    price: '29,800',
    period: '월',
    position: '심층 기질 분석 및 전문가 1:1 커스텀 솔루션',
    recommendations: [
      '시술이나 수술 후, 데이터 기반의 정밀한 사후 관리가 필요하신 분',
      'AI 분석을 넘어 전문가의 심층적인 해석과 피드백이 필요하신 분',
      '나의 기질과 성향에 완벽히 맞춤화된 명상 가이드를 원하시는 분'
    ],
    keyBenefits: [
      { id: 1, title: '심층 기질 분석 (30 facets)', desc: '표면적인 컨디션 분석을 넘어, 타고난 기질과 성향을 30개의 세부 항목으로 심층 분석합니다.' },
      { id: 2, title: 'AI 보이스 맞춤 명상', desc: '현재의 감정 상태와 스트레스 레벨에 맞춰 AI가 실시간으로 생성하는 나만의 명상 오디오를 제공합니다.' },
      { id: 3, title: '전문가 1:1 커스텀 솔루션', desc: '축적된 데이터를 기반으로 건강, 심리, 라이프스타일 전문가가 직접 구성한 1:1 맞춤형 피드백을 제공합니다.' }
    ],
    theme: 'bg-amber-50/50',
    accent: 'text-amber-600',
  }
};
