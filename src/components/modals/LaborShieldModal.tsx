'use client';

import React from 'react';
import { X, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface LaborShieldModalProps {
  teamId: string;
  onClose: () => void;
}

/**
 * Labor-Shield 모달
 * 기존 /mile/[teamId]/labor-shield 페이지를 모달에서 안내하고 페이지로 이동합니다.
 * (기존 페이지 로직 재활용 — 복잡한 PDF/서명 로직이 있어 iframe 또는 링크 이동 방식 채택)
 */
export default function LaborShieldModal({ teamId, onClose }: LaborShieldModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Labor-Shield</h2>
              <p className="text-xs text-slate-500">전자근로계약서 · 노무 방어</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="닫기">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* 핵심 가치 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-3">노무 리스크 방어</p>
            <div className="space-y-2.5">
              {[
                { icon: '⚖️', text: '근로계약서 미작성 과태료 건당 120만원 완전 방어' },
                { icon: '📱', text: '알바생 카카오톡으로 서명 링크 발송 → 전자서명 완료' },
                { icon: '🧮', text: '주휴수당 자동 계산 (실수 없는 정확한 급여 정산)' },
                { icon: '☁️', text: '계약서 PDF Firebase Storage 영구 보관' },
              ].map(({ icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{icon}</span>
                  <p className="text-sm font-medium text-emerald-700">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 방어 금액 안내 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
            <p className="text-xs font-bold text-slate-400 mb-2">방어하는 잠재 손실</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">근로계약서 미작성</p>
                <p className="text-xl font-black text-amber-400">최대 500만원</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">건당 평균 과태료</p>
                <p className="text-xl font-black text-amber-400">120만원</p>
              </div>
            </div>
          </div>

          {/* 안내 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-slate-700 mb-2">💡 이용 방법</p>
            <ol className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-start gap-2"><span className="font-black text-emerald-500 shrink-0">1.</span> 아래 버튼을 눌러 근로계약서 작성 페이지로 이동</li>
              <li className="flex items-start gap-2"><span className="font-black text-emerald-500 shrink-0">2.</span> 사업주 정보, 근무 조건(시급·근무시간·요일) 입력</li>
              <li className="flex items-start gap-2"><span className="font-black text-emerald-500 shrink-0">3.</span> 알바생 전화번호 입력 → 카톡 서명 링크 발송</li>
              <li className="flex items-start gap-2"><span className="font-black text-emerald-500 shrink-0">4.</span> 서명 완료 → PDF 자동 저장</li>
            </ol>
          </div>
        </div>

        {/* 이동 버튼 */}
        <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0 space-y-3">
          <Link href={`/mile/${teamId}/labor-shield/new`} onClick={onClose}>
            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              전자근로계약서 작성하기
            </button>
          </Link>
          <Link href={`/mile/${teamId}/labor-shield`} onClick={onClose}>
            <button className="w-full py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm">
              <ExternalLink className="w-4 h-4" /> 계약서 목록 보기
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
