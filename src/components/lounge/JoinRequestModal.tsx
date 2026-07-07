import React, { useState } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string | null;
  userId: string | undefined;
  onSuccess: (teamId: string) => void;
}

export function JoinRequestModal({ isOpen, onClose, teamId, userId, onSuccess }: JoinRequestModalProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'none'>('none');
  const [ageGroup, setAgeGroup] = useState('30');
  const [recommender, setRecommender] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMyInfo, setLoadingMyInfo] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  if (!isOpen || !teamId || !userId) return null;

  const handleLoadMyInfo = async () => {
    if (!userId) return;
    setLoadingMyInfo(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.name) setName(data.name);
        if (data.gender) setGender(data.gender);
        if (data.ageGroup) setAgeGroup(data.ageGroup);
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
        if (data.recommender) setRecommender(data.recommender);
        if (data.image) setAvatar(data.image);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMyInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) {
      alert('이름과 전화번호를 입력해주세요.');
      return;
    }
    if (!consent) {
      alert('개인정보 제3자 제공에 동의하셔야 가입 신청이 가능합니다.');
      return;
    }

    setLoading(true);
    try {
      const requestRef = doc(db, `teams/${teamId}/join_requests`, userId);
      const existing = await getDoc(requestRef);

      if (existing.exists()) {
        alert('이미 가입 신청이 접수된 클럽입니다.');
        onSuccess(teamId); // Update status in parent anyway
        onClose();
        return;
      }

      await setDoc(requestRef, {
        id: userId,
        name: name.trim(),
        avatar: avatar,
        phoneNumber: phoneNumber.trim(),
        gender,
        ageGroup,
        recommender: recommender.trim(),
        introduction: introduction.trim(),
        status: 'pending',
        appliedAt: serverTimestamp(),
      });
      
      onSuccess(teamId);
      onClose();
    } catch (err) {
      console.error('[JoinRequestModal] Error:', err);
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-800">모임 가입 신청서</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLoadMyInfo}
              disabled={loadingMyInfo}
              className="rounded-full text-xs font-bold"
            >
              {loadingMyInfo ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              내 정보 불러오기
            </Button>
            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="join-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">이름 <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="실명을 입력해주세요" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">전화번호 <span className="text-rose-500">*</span></label>
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                required
                placeholder="010-0000-0000" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">성별</label>
                <div className="flex gap-2">
                  {['male', 'female', 'none'].map((g) => (
                    <Button
                      type="button"
                      key={g}
                      variant={gender === g ? "default" : "outline"}
                      onClick={() => setGender(g as any)}
                      className={`flex-1 h-11 rounded-xl font-bold ${gender === g ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {g === 'male' ? '남성' : g === 'female' ? '여성' : '선택안함'}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">연령대</label>
                <div className="px-2 pb-2">
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="10"
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full accent-emerald-500"
                  />
                  <div className="text-center mt-2 text-sm font-bold text-emerald-600">
                    {ageGroup === '60' ? '60대 이상' : `${ageGroup}대`}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">가입 소개자 (선택)</label>
              <input 
                type="text" 
                value={recommender}
                onChange={e => setRecommender(e.target.value)}
                placeholder="가입을 권유한 분의 이름을 적어주세요" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">간단한 자기소개 (선택)</label>
              <textarea 
                value={introduction}
                onChange={e => setIntroduction(e.target.value)}
                placeholder="모임원들에게 간단한 인사를 남겨주세요." 
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium resize-none"
              />
            </div>

            {/* 제3자 제공 동의 */}
            <div className="mt-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <div className="pt-0.5">
                <input 
                  type="checkbox" 
                  id="consent" 
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="consent" className="text-sm font-bold text-slate-800 cursor-pointer block">
                  [필수] 개인정보 제3자 제공 동의
                </label>
                <div className="mt-2 space-y-1 text-xs font-medium text-slate-500 leading-relaxed">
                  <p className="flex gap-2"><span className="text-slate-400 shrink-0 w-[60px]">제공받는자</span> <span className="text-slate-700">해당 모임 관리자(방장 및 운영진)</span></p>
                  <p className="flex gap-2"><span className="text-slate-400 shrink-0 w-[60px]">제공목적</span> <span className="text-slate-700">가입 심사 및 모임 활동 연락</span></p>
                  <p className="flex gap-2"><span className="text-slate-400 shrink-0 w-[60px]">제공항목</span> <span className="text-slate-700">이름, 전화번호, 성별, 연령대 등 입력 정보</span></p>
                  <p className="flex gap-2"><span className="text-slate-400 shrink-0 w-[60px]">보유기간</span> <span className="text-slate-700">모임 탈퇴 시 또는 가입 거절 시 즉시 파기</span></p>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-xl h-12 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100">
            취소
          </Button>
          <Button 
            form="join-form"
            type="submit" 
            disabled={loading || !consent || !name.trim() || !phoneNumber.trim()}
            className="flex-1 rounded-xl h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '가입 신청하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
