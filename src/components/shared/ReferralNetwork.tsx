'use client';

import React, { useState, useEffect } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Loader2, Users, ChevronRight, UserCircle } from 'lucide-react';
import ReferralTreeItem from '@/components/ui/ReferralTreeItem';

interface ReferralUser {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  avatar?: string;
  grade: string;
  contribution: number;
  level: number;
}

interface ReferralData {
  user?: any;
  referrer?: any;
  level1: ReferralUser[];
  level2: ReferralUser[];
}

interface ReferralNetworkProps {
  userId?: string; // 어드민용 특정 유저 ID
  mode: 'accordion' | 'tree';
}

export default function ReferralNetwork({ userId, mode }: ReferralNetworkProps) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = userId 
        ? `/api/admin/users/${userId}/referral-tree` 
        : '/api/me/referral-tree';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch referral tree:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-foreground/70">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-sm">조직도 데이터를 분석 중입니다...</p>
      </div>
    );
  }

  if (!data || (data.level1.length === 0)) {
    return (
      <div className="text-center py-12 bg-surface rounded-2xl border-2 border-dashed border-line">
        <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
        <p className="text-foreground/70 text-sm">초대한 회원이 아직 없습니다.</p>
      </div>
    );
  }

  // 데이터 계층화 (L2를 L1 하위로 매핑)
  const tree = data.level1.map(l1 => ({
    ...l1,
    children: data.level2.filter(l2 => l2.referredBy === l1.referralCode)
  }));

  // --- 1. 아코디언 모드 (마이페이지용) ---
  if (mode === 'accordion') {
    return (
      <Accordion type="multiple" className="space-y-3">
        {tree.map(l1 => (
          <AccordionItem key={l1.id} value={l1.id} className="border-none shadow-none">
            <div className="relative group">
              <AccordionTrigger className="hover:no-underline p-0 py-1">
                <div className="w-full">
                  <ReferralTreeItem {...l1} />
                </div>
              </AccordionTrigger>
              {l1.children.length > 0 && (
                <AccordionContent className="pt-2 pl-6 pb-2 border-l-2 border-indigo-50 ml-5 space-y-2">
                  {l1.children.map(l2 => (
                    <ReferralTreeItem key={l2.id} {...l2} />
                  ))}
                </AccordionContent>
              )}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  // --- 2. 트리 모드 (관리자용 - 옵션 A: 수직 탐색기 형태) ---
  return (
    <div className="space-y-6">
      {/* Level 0: 내 추천인 정보 (관리자 페이지에서 페이지 주인의 상위) */}
      {data.referrer && (
        <div className="mb-8">
          <h4 className="text-xs font-bold text-foreground/70 mb-3 uppercase tracking-wider flex items-center gap-1">
            <ChevronRight className="h-3 w-3" /> 소개한 사람 (Referrer)
          </h4>
          <div className="bg-surface/50 p-4 rounded-xl border border-dashed border-line flex items-center gap-3">
            <UserCircle className="h-6 w-6 text-gray-300" />
            <div>
               <p className="text-sm font-bold text-obsidian">{data.referrer.name}</p>
               <p className="text-[10px] text-foreground/70">{data.referrer.email}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-bold text-indigo-400 mb-3 uppercase tracking-wider flex items-center gap-1">
          <ChevronRight className="h-3 w-3" /> 초대 계보 (Referral Tree)
        </h4>
        
        <div className="space-y-4">
          {tree.map(l1 => (
            <div key={l1.id}>
              {/* Level 1 Node */}
              <div className="relative">
                <ReferralTreeItem {...l1} />
                {l1.children.length > 0 && (
                  <div className="absolute left-5 top-full h-4 w-px bg-secondary-container" />
                )}
              </div>

              {/* Level 2 Nodes */}
              {l1.children.length > 0 && (
                <div className="mt-4 pl-8 border-l-2 border-indigo-50 ml-5 space-y-3 relative">
                  {l1.children.map((l2, idx) => (
                    <div key={l2.id} className="relative">
                      {/* Connecting Line for L2 */}
                      <div className="absolute -left-3 top-6 w-3 h-px bg-indigo-50" />
                      <ReferralTreeItem {...l2} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
