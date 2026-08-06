'use client';

import React, { useState, useEffect } from 'react';
import {
  X, CalendarX2, Users, Plus, Loader2, Copy, CheckCheck,
  Scissors, Clock, Trash2, ChevronRight
} from 'lucide-react';
import {
  createDepositBooking, getMemberships, createMembership, useMembershipSession
} from '@/lib/merchant-service';
import type { NoShowBooking, MembershipCard } from '@/types/merchant';

interface NoShowZeroModalProps {
  teamId: string;
  onClose: () => void;
}

type Tab = 'booking' | 'membership';

export default function NoShowZeroModal({ teamId, onClose }: NoShowZeroModalProps) {
  const [tab, setTab] = useState<Tab>('booking');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <CalendarX2 className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">NoShow-Zero</h2>
              <p className="text-xs text-slate-500">예약금 결제링크 · 회원권 관리</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="닫기">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-6 pt-4 pb-3 shrink-0">
          {([['booking', '예약금 링크 생성'], ['membership', '회원권 관리']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === id ? 'bg-pink-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {tab === 'booking' ? (
            <BookingTab teamId={teamId} />
          ) : (
            <MembershipTab teamId={teamId} />
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// 예약금 링크 생성 탭
// ──────────────────────────────────────
function BookingTab({ teamId }: { teamId: string }) {
  const [form, setForm] = useState({ clientName: '', serviceName: '', depositAmount: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; expiresAt: Date } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!form.clientName || !form.serviceName || !form.depositAmount) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const booking = await createDepositBooking(teamId, {
        clientName: form.clientName,
        serviceName: form.serviceName,
        depositAmount: Number(form.depositAmount),
      });
      setResult({ url: booking.paymentLinkUrl!, expiresAt: booking.expiresAt });
    } catch (e) {
      alert('링크 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.url) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setResult(null);
    setForm({ clientName: '', serviceName: '', depositAmount: '' });
  };

  if (result) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-black text-emerald-800 text-lg">결제 링크가 생성되었습니다!</h3>
          <p className="text-sm text-emerald-600 mt-1">
            유효 시간: <strong>15분</strong> (미결제 시 자동 취소)
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <p className="text-xs font-bold text-slate-500 mb-2">결제 링크 (카카오톡으로 공유하세요)</p>
          <p className="text-sm text-slate-700 break-all font-mono bg-white rounded-xl px-3 py-2 border border-slate-200">
            {result.url}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '복사됨!' : '링크 복사'}
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-3.5 rounded-2xl bg-pink-500 text-white font-bold text-sm hover:bg-pink-600 transition-all"
          >
            새 링크 만들기
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700">
            💡 <strong>[Mock 모드]</strong> 실제 카카오 알림톡 API 연동 시 고객에게 자동 발송됩니다.
            현재는 링크를 복사해 직접 공유해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
        <p className="text-xs font-bold text-pink-700 mb-1">📌 노쇼 방지 예약금 시스템</p>
        <p className="text-xs text-pink-600">고객이 15분 내 결제 링크에서 예약금을 결제하지 않으면 예약이 자동 취소됩니다.</p>
      </div>

      {[
        { key: 'clientName', label: '고객명', placeholder: '예: 김아무개', type: 'text' },
        { key: 'serviceName', label: '시술명', placeholder: '예: 힐링 마사지 60분', type: 'text' },
        { key: 'depositAmount', label: '예약금 (원)', placeholder: '예: 10000', type: 'number' },
      ].map(({ key, label, placeholder, type }) => (
        <div key={key}>
          <label className="text-sm font-bold text-slate-700 mb-1.5 block">{label}</label>
          <input
            type={type}
            placeholder={placeholder}
            value={(form as any)[key]}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/30"
          />
        </div>
      ))}

      {form.depositAmount && (
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
          <span className="text-sm text-slate-600">예약금 청구 금액</span>
          <span className="font-black text-slate-800 text-lg">{Number(form.depositAmount).toLocaleString()}원</span>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
        15분 결제 링크 생성
      </button>
    </div>
  );
}

// ──────────────────────────────────────
// 회원권 관리 탭
// ──────────────────────────────────────
function MembershipTab({ teamId }: { teamId: string }) {
  const [memberships, setMemberships] = useState<MembershipCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [usingId, setUsingId] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ clientName: '', clientPhone: '', serviceName: '', totalSessions: '' });

  const loadMemberships = async () => {
    try {
      const data = await getMemberships(teamId);
      setMemberships(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMemberships(); }, [teamId]);

  const handleAddCard = async () => {
    if (!newCard.clientName || !newCard.serviceName || !newCard.totalSessions) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    try {
      const card = await createMembership(teamId, {
        clientName: newCard.clientName,
        clientPhone: newCard.clientPhone,
        serviceName: newCard.serviceName,
        totalSessions: Number(newCard.totalSessions),
      });
      setMemberships((prev) => [card, ...prev]);
      setNewCard({ clientName: '', clientPhone: '', serviceName: '', totalSessions: '' });
      setShowAddForm(false);
    } catch (e) {
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleUseSession = async (card: MembershipCard) => {
    if (card.remainingSessions <= 0) { alert('잔여 횟수가 없습니다.'); return; }
    setUsingId(card.id);
    try {
      const updated = await useMembershipSession(teamId, card.id, card.clientPhone);
      setMemberships((prev) => prev.map((m) => m.id === card.id ? updated : m));
    } catch (e: any) {
      alert(e.message || '차감 중 오류가 발생했습니다.');
    } finally {
      setUsingId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>;
  }

  return (
    <div className="space-y-4 pt-2">
      {memberships.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold text-sm">등록된 회원권이 없습니다</p>
        </div>
      )}

      {memberships.map((card) => (
        <div key={card.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-black text-slate-800">{card.clientName}</p>
              <p className="text-xs text-slate-500">{card.serviceName}</p>
            </div>
            <div className={`text-xs font-black px-3 py-1.5 rounded-xl ${card.remainingSessions > 0 ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-500'}`}>
              잔여 {card.remainingSessions}회
            </div>
          </div>

          {/* 잔여 횟수 바 */}
          <div className="mb-3">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all"
                style={{ width: `${(card.remainingSessions / card.totalSessions) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-right">{card.usedSessions} / {card.totalSessions}회 사용</p>
          </div>

          <button
            onClick={() => handleUseSession(card)}
            disabled={card.remainingSessions <= 0 || usingId === card.id}
            className="w-full py-2.5 rounded-xl bg-pink-500 text-white font-bold text-sm hover:bg-pink-600 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {usingId === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            시술 완료 (1회 차감 + 잔여 알림)
          </button>
        </div>
      ))}

      {showAddForm && (
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2">
          <p className="text-sm font-black text-pink-700">회원권 등록</p>
          {[
            { key: 'clientName', label: '고객명', placeholder: '예: 김아무개', type: 'text' },
            { key: 'clientPhone', label: '연락처 (알림 발송)', placeholder: '010-0000-0000', type: 'tel' },
            { key: 'serviceName', label: '시술명', placeholder: '예: 전신 마사지', type: 'text' },
            { key: 'totalSessions', label: '총 횟수', placeholder: '10', type: 'number' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-bold text-slate-600 mb-1 block">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(newCard as any)[key]}
                onChange={(e) => setNewCard((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/30"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">취소</button>
            <button onClick={handleAddCard} className="flex-[2] py-2.5 rounded-xl bg-pink-500 text-white font-bold text-sm hover:bg-pink-600">등록</button>
          </div>
        </div>
      )}

      {!showAddForm && (
        <button onClick={() => setShowAddForm(true)} className="w-full py-3 rounded-2xl border-2 border-dashed border-pink-300 text-pink-500 font-bold text-sm hover:bg-pink-50 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> 회원권 등록
        </button>
      )}
    </div>
  );
}
