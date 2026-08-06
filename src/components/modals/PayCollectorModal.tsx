'use client';

import React, { useState, useEffect } from 'react';
import {
  X, DollarSign, Plus, Loader2, Send, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import {
  createReceivable, getReceivables, sendReminder, markAsPaid
} from '@/lib/merchant-service';
import type { Receivable } from '@/types/merchant';

interface PayCollectorModalProps {
  teamId: string;
  onClose: () => void;
}

type Tab = 'new' | 'list';

export default function PayCollectorModal({ teamId, onClose }: PayCollectorModalProps) {
  const [tab, setTab] = useState<Tab>('list');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Pay-Collector</h2>
              <p className="text-xs text-slate-500">미수금 · 원비 자동 청구</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="닫기">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-6 pt-4 pb-3 shrink-0">
          {([['list', '미납 현황'], ['new', '청구서 발송']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === id ? 'bg-violet-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {tab === 'new' ? (
            <NewBillTab teamId={teamId} onCreated={() => setTab('list')} />
          ) : (
            <ReceivableListTab teamId={teamId} />
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// 청구서 발송 탭
// ──────────────────────────────────────
function NewBillTab({ teamId, onCreated }: { teamId: string; onCreated: () => void }) {
  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    description: '',
    amount: '',
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!form.clientName || !form.clientPhone || !form.description || !form.amount || !form.dueDate) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      await createReceivable(teamId, {
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        description: form.description,
        amount: Number(form.amount),
        dueDate: new Date(form.dueDate),
      });
      setDone(true);
      setTimeout(onCreated, 1500);
    } catch (e) {
      alert('청구서 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="font-black text-emerald-700 text-lg">청구서가 발송되었습니다!</h3>
        <p className="text-sm text-slate-500 mt-1">미납 현황 탭에서 확인하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
        <p className="text-xs font-bold text-violet-700 mb-1">💜 감정 없는 자동 청구</p>
        <p className="text-xs text-violet-600">정중하고 차분한 청구서가 고객에게 발송됩니다. 미납 시 3일/7일 후 자동 재독촉.</p>
      </div>

      {[
        { key: 'clientName', label: '고객명 / 업체명', placeholder: '예: 홍길동', type: 'text' },
        { key: 'clientPhone', label: '연락처', placeholder: '010-0000-0000', type: 'tel' },
        { key: 'description', label: '청구 내용', placeholder: '예: 3월 영어 수강료', type: 'text' },
        { key: 'amount', label: '청구 금액 (원)', placeholder: '200000', type: 'number' },
        { key: 'dueDate', label: '납부 기한', placeholder: '', type: 'date' },
      ].map(({ key, label, placeholder, type }) => (
        <div key={key}>
          <label className="text-sm font-bold text-slate-700 mb-1.5 block">{label}</label>
          <input
            type={type}
            placeholder={placeholder}
            value={(form as any)[key]}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          />
        </div>
      ))}

      {form.amount && (
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
          <span className="text-sm text-slate-600">청구 금액</span>
          <span className="font-black text-slate-800 text-lg">{Number(form.amount).toLocaleString()}원</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-purple-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        청구서 발송
      </button>
    </div>
  );
}

// ──────────────────────────────────────
// 미납 현황 탭
// ──────────────────────────────────────
function ReceivableListTab({ teamId }: { teamId: string }) {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await getReceivables(teamId);
      setReceivables(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [teamId]);

  const handleReminder = async (id: string) => {
    setActionId(id);
    try {
      await sendReminder(teamId, id);
      await load();
      alert('재독촉 메시지가 발송되었습니다!');
    } catch (e: any) {
      alert(e.message || '오류가 발생했습니다.');
    } finally {
      setActionId(null);
    }
  };

  const handlePaid = async (id: string) => {
    if (!confirm('납부 완료로 처리하시겠습니까?')) return;
    setActionId(id);
    try {
      await markAsPaid(teamId, id);
      setReceivables((prev) => prev.map((r) => r.id === id ? { ...r, status: 'paid', paidAt: new Date() } : r));
    } catch (e) {
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setActionId(null);
    }
  };

  const getDaysOverdue = (dueDate: any): number => {
    const due = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
    const diff = Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>;

  const unpaid = receivables.filter((r) => r.status !== 'paid');
  const paid = receivables.filter((r) => r.status === 'paid');

  if (receivables.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
        <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
        <p className="text-slate-500 font-bold text-sm">미납 건이 없습니다 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* 미납 통계 */}
      {unpaid.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-red-500 mb-1">미납 건수</p>
            <p className="text-3xl font-black text-red-600">{unpaid.length}건</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-rose-500 mb-1">미납 총액</p>
            <p className="text-2xl font-black text-rose-600">
              {(unpaid.reduce((s, r) => s + r.amount, 0) / 10000).toFixed(0)}만원
            </p>
          </div>
        </div>
      )}

      {/* 미납 목록 */}
      {unpaid.map((r) => {
        const daysOverdue = getDaysOverdue(r.dueDate);
        const isLoading = actionId === r.id;

        return (
          <div key={r.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${daysOverdue > 7 ? 'border-red-200' : daysOverdue > 0 ? 'border-amber-200' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-black text-slate-800">{r.clientName}</p>
                <p className="text-xs text-slate-500">{r.description}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-800">{r.amount.toLocaleString()}원</p>
                {daysOverdue > 0 ? (
                  <span className={`text-xs font-bold ${daysOverdue > 7 ? 'text-red-600' : 'text-amber-600'}`}>
                    {daysOverdue}일 경과
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" /> 미납
                  </span>
                )}
              </div>
            </div>

            {r.reminderCount > 0 && (
              <p className="text-xs text-violet-600 mb-2">📨 재독촉 {r.reminderCount}회 발송됨</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleReminder(r.id)}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-violet-100 text-violet-700 font-bold text-xs hover:bg-violet-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                재독촉 발송
              </button>
              <button
                onClick={() => handlePaid(r.id)}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3" /> 납부 완료
              </button>
            </div>
          </div>
        );
      })}

      {/* 납부 완료 목록 */}
      {paid.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">납부 완료</p>
          {paid.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 mb-2">
              <div>
                <p className="text-sm font-bold text-slate-600">{r.clientName}</p>
                <p className="text-xs text-slate-400">{r.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-500">{r.amount.toLocaleString()}원</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
