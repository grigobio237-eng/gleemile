'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Store, Shield, CalendarX2, FileText, DollarSign, Scale, ChevronRight, Star, Loader2, Plus } from 'lucide-react';
import { getMerchantProfile } from '@/lib/merchant-service';
import type { MerchantProfile, MerchantModuleId, MerchantIndustry } from '@/types/merchant';
import { INDUSTRY_META } from '@/types/merchant';
import { normalizeRole, isManagerOrHigher } from '@/types/role';

// Lazy load modals (코드 스플리팅)
const SetSelectionModal = lazy(() => import('@/components/modals/SetSelectionModal'));
const LaborShieldModal = lazy(() => import('@/components/modals/LaborShieldModal'));
const NoShowZeroModal = lazy(() => import('@/components/modals/NoShowZeroModal'));
const QuickQuoteModal = lazy(() => import('@/components/modals/QuickQuoteModal'));
const PayCollectorModal = lazy(() => import('@/components/modals/PayCollectorModal'));
const MarginGuardModal = lazy(() => import('@/components/modals/MarginGuardModal'));

interface SmallBizBlockProps {
  teamId: string;
  role: string;
  userId?: string;
}

type OpenModal = 'set-select' | MerchantModuleId | null;

const MODULE_META: Record<MerchantModuleId, { label: string; description: string; icon: React.ReactNode; color: string; bg: string }> = {
  'labor-shield': {
    label: 'Labor-Shield',
    description: '전자근로계약서 · 노무 방어',
    icon: <Shield className="w-5 h-5" />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  'noshow-zero': {
    label: 'NoShow-Zero',
    description: '예약금 · 노쇼 방지 · 회원권',
    icon: <CalendarX2 className="w-5 h-5" />,
    color: 'text-pink-600',
    bg: 'bg-pink-100',
  },
  'quick-quote': {
    label: 'Quick-Quote',
    description: '1분 사진 견적서 · AS 방어',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  'pay-collector': {
    label: 'Pay-Collector',
    description: '미수금 · 원비 자동 청구',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'text-violet-600',
    bg: 'bg-violet-100',
  },
  'margin-guard': {
    label: 'Margin-Guard',
    description: '실질 마진율 · BEP 계산기',
    icon: <Scale className="w-5 h-5" />,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
};

export default function SmallBizBlock({ teamId, role }: SmallBizBlockProps) {
  const isManager = isManagerOrHigher(normalizeRole(role));
  const [profile, setProfile] = useState<MerchantProfile | null | undefined>(undefined); // undefined = 로딩 중
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  useEffect(() => {
    getMerchantProfile(teamId)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [teamId]);

  const handleActivated = (industry: MerchantIndustry) => {
    setOpenModal(null);
    // profile 재로드
    getMerchantProfile(teamId).then(setProfile);
  };

  const industryMeta = profile ? INDUSTRY_META.find((m) => m.id === profile.industry) : null;

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-4 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-base">소상공인 도구</h3>
              <p className="text-slate-400 text-xs">Gleemile for Business</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/30">
            <Star className="w-3 h-3 fill-emerald-400" />
            무료
          </div>
        </div>

        <div className="p-5">
          {/* 로딩 */}
          {profile === undefined && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          )}

          {/* 미활성화 상태 */}
          {profile === null && (
            <div className="text-center py-6">
              <p className="text-sm text-slate-600 font-medium mb-1">업종별 맞춤 도구 세트</p>
              <p className="text-xs text-slate-400 mb-5">
                노무·노쇼·견적·미수금·마진 관리 — 업종에 딱 맞는 도구만 제공합니다.
              </p>
              {isManager ? (
                <button
                  onClick={() => setOpenModal('set-select')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  <Plus className="w-4 h-4" /> 업종 선택하고 무료 시작
                </button>
              ) : (
                <p className="text-xs text-slate-400">관리자에게 소상공인 도구 활성화를 요청해 주세요.</p>
              )}
            </div>
          )}

          {/* 활성화된 상태 */}
          {profile && (
            <div className="space-y-3">
              {/* 업종 배지 */}
              {industryMeta && (
                <div className="flex items-center gap-2 mb-4 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                  <span className="text-xl">{industryMeta.emoji}</span>
                  <div>
                    <p className="text-sm font-black text-slate-700">{industryMeta.label} 플랜</p>
                    <p className="text-xs text-slate-400">{industryMeta.description}</p>
                  </div>
                  <div className="ml-auto text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    무료 ✓
                  </div>
                </div>
              )}

              {/* 활성 모듈 카드 */}
              {profile.activeModules.map((moduleId) => {
                const meta = MODULE_META[moduleId];
                if (!meta) return null;

                return (
                  <button
                    key={moduleId}
                    onClick={() => setOpenModal(moduleId)}
                    className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-2xl transition-all hover:shadow-md group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-black text-slate-800">{meta.label}</p>
                      <p className="text-xs text-slate-500">{meta.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}

              {/* 변경 버튼 (관리자만) */}
              {isManager && (
                <button
                  onClick={() => setOpenModal('set-select')}
                  className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                >
                  업종 변경
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 모달 렌더링 */}
      <Suspense fallback={null}>
        {openModal === 'set-select' && (
          <SetSelectionModal teamId={teamId} onClose={() => setOpenModal(null)} onActivated={handleActivated} />
        )}
        {openModal === 'labor-shield' && (
          <LaborShieldModal teamId={teamId} onClose={() => setOpenModal(null)} />
        )}
        {openModal === 'noshow-zero' && (
          <NoShowZeroModal teamId={teamId} onClose={() => setOpenModal(null)} />
        )}
        {openModal === 'quick-quote' && (
          <QuickQuoteModal teamId={teamId} onClose={() => setOpenModal(null)} />
        )}
        {openModal === 'pay-collector' && (
          <PayCollectorModal teamId={teamId} onClose={() => setOpenModal(null)} />
        )}
        {openModal === 'margin-guard' && (
          <MarginGuardModal teamId={teamId} onClose={() => setOpenModal(null)} />
        )}
      </Suspense>
    </>
  );
}
