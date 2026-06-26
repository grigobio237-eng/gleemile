'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Info, ShieldCheck, Crown, CreditCard, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const passData = [
  {
    id: 'black',
    name: 'BLACK PASS',
    position: 'VIP 고객을 위한 프라이빗 운영형 패스',
    price: '99,000원',
    period: '3개월',
    target: ['고액 이용 고객', '가족 단위 고객', 'VIP 성향 고객', '시간 절약과 우선권을 중시하는 고객'],
    whyBuy: '시간이 더 중요하고 선택 피로를 줄이고 싶고 프라이빗하게 관리받고 싶은 고객에게 적합',
    benefits: [
      {
        category: '가입 즉시 지급',
        items: ['멤버십 권한 3개월 인정', '네비게이터 리워드 지급', '프리미엄 개인 회복 설계 리포트 상시 제공']
      },
      {
        category: '기간 중 반복 혜택',
        items: ['제휴 범위 내 최상위 회원 전용 우대', '우선 예약 최상위 배정', '전담 응대 라인', '프리미엄 체크 리포트 상시 제공', '집중 관리 프로그램 우선 배정']
      },
      {
        category: '프라이빗 권리',
        items: ['특별 행사 초청', '고급 프로그램 우선 접근권']
      }
    ],
    theme: 'border-obsidian bg-obsidian text-mist',
    accent: 'text-chapter-accent',
    icon: <Crown className="w-5 h-5" />
  }
];

const PassOperationGuide = () => {
  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      {/* Intro Message */}
      <div className="max-w-3xl">
        <h2 className="text-2xl font-black text-obsidian mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-chapter-accent" />
          네비게이터 패스 운영 정책 가이드
        </h2>
        <p className="text-slate/60 font-medium leading-relaxed">
          gleemile의 패스는 단순한 시술 혜택이 아닌, 고객의 <span className="text-obsidian font-bold">리커버리 운영권</span>을 설계하는 핵심 상품입니다. 
          등급별 타겟과 혜택을 숙지하여 최적의 회복 경로를 제안하세요.
        </p>
      </div>

      {/* Pass Cards */}
      <div className="flex justify-center">
        <div className="w-full max-w-lg">
          {passData.map((pass, idx) => (
            <motion.div
              key={pass.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex flex-col rounded-[32px] border p-8 shadow-sm h-full relative group ${pass.theme}`}
            >
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-xl border ${pass.id === 'black' ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-line'}`}>
                    {pass.icon}
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter">{pass.name}</h3>
                </div>
                <div className={`text-sm font-bold opacity-80 mb-6 min-h-[40px]`}>{pass.position}</div>
                
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black">{pass.price}</span>
                  <span className="text-sm font-bold opacity-60">/ {pass.period}</span>
                </div>
              </div>

              {/* Target & Why Buy */}
              <div className="space-y-6 mb-8 flex-1">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Target Customers
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {pass.target.map(t => (
                      <Badge key={t} variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-bold border-white/20 text-white/80`}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Why buy this?
                  </h4>
                  <p className="text-sm font-medium leading-relaxed opacity-90">{pass.whyBuy}</p>
                </div>
              </div>

              {/* Benefits List */}
              <div className="space-y-6 mt-auto">
                {pass.benefits.map((group) => (
                  <div key={group.category}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3">{group.category}</h4>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li key={item} className="flex gap-2 text-xs font-medium leading-relaxed">
                          <Check className={`w-3.5 h-3.5 shrink-0 ${pass.accent}`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Comparison Bottom Alert */}
      <div className="bg-chapter-accent/5 border border-chapter-accent/20 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-chapter-accent">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-obsidian mb-1 text-xl">패스 운영 시 유의사항</h4>
            <p className="text-sm text-slate font-medium">모든 패스는 명시된 유효기간 동안 <span className="text-obsidian font-bold">데이터 기반의 핵심 관리 서비스</span>가 상시 유지되어야 합니다.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="text-[10px] font-black px-4 py-2 rounded-full border-chapter-accent/30 text-chapter-accent bg-white shadow-sm">
            시술권이 아닌 운영권
          </Badge>
          <Badge variant="outline" className="text-[10px] font-black px-4 py-2 rounded-full border-chapter-accent/30 text-chapter-accent bg-white shadow-sm">
            체계적 회복 관리
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default PassOperationGuide;
