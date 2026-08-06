'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, Star } from 'lucide-react';
import { INDUSTRY_META, PLAN_ORIGINAL_PRICE, type MerchantIndustry, type IndustryMeta } from '@/types/merchant';
import { activateMerchantProfile } from '@/lib/merchant-service';

interface SetSelectionModalProps {
  teamId: string;
  onClose: () => void;
  onActivated: (industry: MerchantIndustry) => void;
}

export default function SetSelectionModal({ teamId, onClose, onActivated }: SetSelectionModalProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<MerchantIndustry | null>(null);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [loading, setLoading] = useState(false);

  const selectedMeta = INDUSTRY_META.find((m) => m.id === selectedIndustry);

  const handleActivate = async () => {
    if (!selectedIndustry) return;
    setLoading(true);
    try {
      await activateMerchantProfile(teamId, selectedIndustry);
      onActivated(selectedIndustry);
    } catch (e) {
      console.error(e);
      alert('활성화 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">

        {/* 헤더 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between z-10 rounded-t-3xl">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-black px-3 py-1 rounded-full mb-2 border border-emerald-200">
              <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
              무료 프로모션 적용 중 · 평생 0원
            </div>
            <h2 className="text-xl font-black text-slate-800">업종을 선택해 주세요</h2>
            <p className="text-sm text-slate-500 mt-1">업종에 맞는 도구 세트가 자동으로 세팅됩니다.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0 ml-2"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {step === 'select' && (
            <>
              {INDUSTRY_META.map((meta) => (
                <button
                  key={meta.id}
                  onClick={() => setSelectedIndustry(meta.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                    selectedIndustry === meta.id
                      ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-800 text-base">{meta.label}</span>
                        <span className="text-xs text-slate-400">{meta.description}</span>
                      </div>
                      <p className="text-xs text-rose-600 font-medium mt-1">📌 {meta.painPoint}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-600">Labor-Shield</span>
                        <span className="text-slate-300 text-xs">+</span>
                        <span className="text-xs font-bold text-emerald-700">{meta.moduleLabel}</span>
                      </div>
                    </div>
                    {selectedIndustry === meta.id && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}

              <button
                disabled={!selectedIndustry}
                onClick={() => setStep('confirm')}
                className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-base shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-teal-700"
              >
                {selectedIndustry ? `${INDUSTRY_META.find(m => m.id === selectedIndustry)?.label} 도구 세트 선택` : '업종을 선택해 주세요'}
              </button>
            </>
          )}

          {step === 'confirm' && selectedMeta && (
            <ConfirmStep
              meta={selectedMeta}
              onBack={() => setStep('select')}
              onConfirm={handleActivate}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmStep({
  meta,
  onBack,
  onConfirm,
  loading,
}: {
  meta: IndustryMeta;
  onBack: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const originalPrice = PLAN_ORIGINAL_PRICE[meta.plan];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* 선택 요약 */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">선택한 도구 세트</p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{meta.emoji}</span>
          <div>
            <p className="font-black text-slate-800 text-lg">{meta.label} 플랜</p>
            <p className="text-xs text-slate-500">{meta.description}</p>
          </div>
        </div>
        <div className="space-y-2">
          {['Labor-Shield (전자근로계약서·노무)', meta.moduleLabel].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-sm font-bold text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 가격 */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200 mb-5 text-center">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">무료 프로모션 적용</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl text-slate-400 line-through font-bold">
            월 {originalPrice.toLocaleString()}원
          </span>
          <span className="text-4xl font-black text-emerald-600">0원</span>
        </div>
        <p className="text-xs text-emerald-600 font-medium mt-2">🎉 지금 바로 시작하면 평생 무료 혜택!</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
        >
          다시 선택
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          지금 무료로 시작하기
        </button>
      </div>
    </div>
  );
}
