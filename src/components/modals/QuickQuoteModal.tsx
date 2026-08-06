'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Camera, FileText, Send, Plus, Trash2,
  Loader2, Copy, CheckCheck, Image as ImageIcon, ChevronRight
} from 'lucide-react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { createQuote, sendQuoteToClient, getQuotes } from '@/lib/merchant-service';
import type { Quote, QuoteItem } from '@/types/merchant';

interface QuickQuoteModalProps {
  teamId: string;
  onClose: () => void;
}

type Tab = 'new' | 'history';
type Step = 'photos' | 'items' | 'confirm';

const PRESET_ITEMS = [
  { name: '출장비', unitPrice: 30000 },
  { name: '공임비', unitPrice: 50000 },
  { name: '부품비 (소)', unitPrice: 15000 },
  { name: '부품비 (중)', unitPrice: 35000 },
  { name: '부품비 (대)', unitPrice: 80000 },
  { name: '철거비', unitPrice: 20000 },
  { name: '도장비', unitPrice: 40000 },
  { name: '설치비', unitPrice: 60000 },
];

export default function QuickQuoteModal({ teamId, onClose }: QuickQuoteModalProps) {
  const [tab, setTab] = useState<Tab>('new');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Quick-Quote</h2>
              <p className="text-xs text-slate-500">1분 사진 견적서 · AS 방어</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="닫기">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-6 pt-4 pb-3 shrink-0">
          {([['new', '새 견적서 작성'], ['history', '견적 내역']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === id ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {tab === 'new' ? (
            <NewQuoteFlow teamId={teamId} />
          ) : (
            <QuoteHistory teamId={teamId} />
          )}
        </div>
      </div>
    </div>
  );
}

function NewQuoteFlow({ teamId }: { teamId: string }) {
  const [step, setStep] = useState<Step>('photos');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);       // base64 URLs
  const [photoUploading, setPhotoUploading] = useState(false);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [alimtalkSuccess, setAlimtalkSuccess] = useState<boolean | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const totalAmount = items.reduce((s, i) => s + i.total, 0);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPhotoUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
        const storageRef = ref(storage, `teams/${teamId}/quotes/before_${Date.now()}.jpg`);
        await uploadString(storageRef, dataUrl, 'data_url');
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }
      setPhotos((prev) => [...prev, ...uploadedUrls]);
    } catch (e) {
      alert('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const addPresetItem = (preset: { name: string; unitPrice: number }) => {
    const existing = items.find((i) => i.name === preset.name);
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.name === preset.name
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        )
      );
    } else {
      setItems((prev) => [...prev, {
        id: `item_${Date.now()}`,
        name: preset.name,
        unitPrice: preset.unitPrice,
        quantity: 1,
        total: preset.unitPrice,
      }]);
    }
  };

  const handleSubmit = async () => {
    if (!clientName || !clientPhone) { alert('고객명과 연락처를 입력해 주세요.'); return; }
    if (items.length === 0) { alert('항목을 하나 이상 추가해 주세요.'); return; }
    setSubmitting(true);
    try {
      const quote = await createQuote(teamId, {
        clientName, clientPhone, siteAddress,
        items, beforePhotoUrls: photos,
      });
      const result = await sendQuoteToClient(teamId, quote.id);
      setShareUrl(result.shareUrl);
      setAlimtalkSuccess(result.alimtalkSuccess);
      
      if (!result.alimtalkSuccess) {
        alert('알림톡 발송에 실패했습니다. 아래 링크를 직접 공유해 주세요.');
      }
    } catch (e) {
      alert('견적서 생성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (shareUrl) {
    return (
      <div className="animate-in fade-in space-y-4 pt-2">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
          <CheckCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-black text-emerald-800">견적서 발송 완료!</h3>
          <p className="text-xs text-emerald-600 mt-1">고객에게 견적 링크를 공유하세요.</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-xs font-bold text-slate-500 mb-2">견적서 링크</p>
          <p className="text-sm text-slate-700 break-all font-mono">{shareUrl}</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? '복사됨!' : '링크 복사'}
        </button>

        {!alimtalkSuccess && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-700">
              ⚠️ <strong>알림톡 자동 발송 실패:</strong> 고객에게 견적 링크를 직접 전달해 주세요.
            </p>
          </div>
        )}

        {alimtalkSuccess && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              💡 고객에게 카카오 알림톡이 발송되었습니다.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step: 사진 촬영
  if (step === 'photos') {
    return (
      <div className="space-y-4 pt-2">
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs font-bold text-blue-700 mb-1">📸 Step 1: 현장 사진 촬영</p>
          <p className="text-xs text-blue-600">작업 전(Before) 사진을 업로드하세요. AS 분쟁 방어에 활용됩니다.</p>
        </div>
        {[
          { key: 'clientName', label: '고객명', placeholder: '예: 박사장님', type: 'text', value: clientName, set: setClientName },
          { key: 'clientPhone', label: '연락처', placeholder: '010-0000-0000', type: 'tel', value: clientPhone, set: setClientPhone },
          { key: 'siteAddress', label: '현장 주소 (선택)', placeholder: '예: 서울시 강남구...', type: 'text', value: siteAddress, set: setSiteAddress },
        ].map(({ key, label, placeholder, type, value, set }) => (
          <div key={key}>
            <label className="text-sm font-bold text-slate-700 mb-1.5 block">{label}</label>
            <input type={type} placeholder={placeholder} value={value} onChange={(e) => set(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
          </div>
        ))}

        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">현장 사진 (Before)</label>
          <label className="w-full flex flex-col items-center justify-center gap-2 py-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
            {photoUploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : <Camera className="w-6 h-6 text-slate-400" />}
            <span className="text-sm font-bold text-slate-500">{photoUploading ? '업로드 중...' : '사진 선택 (다중 가능)'}</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={photoUploading} />
          </label>
          {photos.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                  <img src={url} alt={`before_${i}`} className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setStep('items')} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2">
          다음: 항목 선택 <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Step: 항목 선택
  return (
    <div className="space-y-4 pt-2">
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-xs font-bold text-blue-700">🔧 Step 2: 부품 / 공임 선택</p>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">빠른 선택</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_ITEMS.map((preset) => (
            <button key={preset.name} onClick={() => addPresetItem(preset)}
              className="flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="font-bold text-slate-700">{preset.name}</span>
              <span className="text-xs text-slate-500">{preset.unitPrice.toLocaleString()}원</span>
            </button>
          ))}
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-700">선택된 항목</p>
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">{item.unitPrice.toLocaleString()}원 × {item.quantity}개</p>
              </div>
              <p className="font-black text-slate-800 text-sm">{item.total.toLocaleString()}원</p>
              <button onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <span className="font-black text-blue-700">합계</span>
            <span className="font-black text-blue-700 text-lg">{totalAmount.toLocaleString()}원</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setStep('photos')} className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm">이전</button>
        <button onClick={handleSubmit} disabled={submitting || items.length === 0}
          className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          견적서 생성 및 발송
        </button>
      </div>
    </div>
  );
}

function QuoteHistory({ teamId }: { teamId: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuotes(teamId).then(setQuotes).catch(console.error).finally(() => setLoading(false));
  }, [teamId]);

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    draft: { label: '초안', color: 'bg-slate-100 text-slate-600' },
    sent: { label: '발송됨', color: 'bg-blue-100 text-blue-700' },
    approved: { label: '승인됨', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: '거절됨', color: 'bg-red-100 text-red-600' },
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
  if (quotes.length === 0) return (
    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-bold text-sm">작성된 견적서가 없습니다</p>
    </div>
  );

  return (
    <div className="space-y-3 pt-2">
      {quotes.map((q) => {
        const s = STATUS_LABEL[q.status] || STATUS_LABEL.draft;
        return (
          <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-black text-slate-800">{q.clientName}</p>
                <p className="text-xs text-slate-500">{q.siteAddress || '주소 없음'}</p>
              </div>
              <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${s.color}`}>{s.label}</div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">항목 {q.items.length}개 · 사진 {q.beforePhotoUrls.length}장</p>
              <p className="font-black text-slate-800">{q.totalAmount.toLocaleString()}원</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
