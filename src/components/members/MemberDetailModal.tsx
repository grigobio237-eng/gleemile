import React from 'react';
import { X, UserCircle2, Phone, UserPlus } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

interface MemberSummary {
  id: string;
  name: string;
  gender?: string;
  ageGroup?: string;
  phoneNumber?: string;
  recommender?: string;
  role: string;
  joinedAt?: Timestamp;
}

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberSummary | null;
  roleBadge: React.ReactNode;
}

export function MemberDetailModal({ isOpen, onClose, member, roleBadge }: MemberDetailModalProps) {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-800">회원 상세 정보</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                <UserCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-800 leading-tight">{member.name}</h3>
                <div className="text-sm font-medium text-slate-500 mt-1 flex gap-1">
                  {member.gender && <span>{member.gender === 'male' ? '남성' : member.gender === 'female' ? '여성' : member.gender}</span>}
                  {member.gender && member.ageGroup && <span>•</span>}
                  {member.ageGroup && <span>{member.ageGroup}대</span>}
                </div>
              </div>
            </div>
            {roleBadge}
          </div>
          
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> 연락처</span>
              <span className="text-[15px] font-bold text-slate-700 tracking-wider">
                {member.phoneNumber || '-'}
              </span>
            </div>
            
            {member.recommender && (
              <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><UserPlus className="w-3 h-3" /> 추천인</span>
                <span className="text-[15px] font-bold text-slate-700">
                  {member.recommender}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-xs font-bold text-slate-400 mt-6 pt-4 border-t border-slate-100 flex justify-between px-2">
            <span>가입 일자</span>
            <span>{member.joinedAt?.toDate ? member.joinedAt.toDate().toLocaleDateString('ko-KR') : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
