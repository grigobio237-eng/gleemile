'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Crown, ArrowLeft, CheckCircle2, Users, Calendar,
  CreditCard, Zap, Star
} from 'lucide-react';
import Link from 'next/link';

const PLAN_FEATURES: Record<string, { icon: string; features: string[] }> = {
  basic: { icon: '🥉', features: ['팀원/스터디원 20명 관리', '웰니스 체크', '신호등 대시보드', '공지사항 관리'] },
  pro: { icon: '🥈', features: ['팀원/스터디원 40명 관리', '베이직 전체', 'ACWR 분석', 'AI 주간 리포트', '청강생/외부 자문 연동'] },
  premium: { icon: '🥇', features: ['팀원/스터디원 100명 관리', '프로 전체', '다중 팀 관리', '영양 분석', '전용 상담'] },
};

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const params = useParams();
  const teamId = params?.teamId as string || 'default-team';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    // TODO: [Firebase-Migration] 임시 Stub 처리
    try {
      setData({ hasSubscription: false });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async (plan: string) => {
    setActionLoading(plan);
    // TODO: [Firebase-Migration] 임시 Stub 처리
    setTimeout(() => {
      alert('파이어베이스 마이그레이션이 진행 중입니다.');
      setActionLoading(null);
    }, 500);
  };

  const handlePayment = async (plan: string) => {
    setActionLoading('payment');
    // TODO: [Firebase-Migration] 임시 Stub 처리
    setTimeout(() => {
      alert('파이어베이스 마이그레이션 완료 후 결제가 가능합니다.');
      setActionLoading(null);
    }, 500);
  };

  const handleCancel = async () => {
    if (!confirm('구독을 취소하시겠습니까?')) return;
    setActionLoading('cancel');
    // TODO: [Firebase-Migration] 임시 Stub 처리
    setTimeout(() => {
      setActionLoading(null);
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      trial: { label: '무료 체험', className: 'bg-primary-container text-primary' },
      active: { label: '활성', className: 'bg-green-100 text-green-700' },
      expired: { label: '만료', className: 'bg-gray-100 text-obsidian' },
      cancelled: { label: '취소됨', className: 'bg-red-100 text-red-700' },
    };
    const s = map[status] || { label: status, className: 'bg-gray-100' };
    return <Badge className={`${s.className} border-none font-bold`}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 pb-24 font-sans selection:bg-emerald-200">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        <div>
          <Link href={`/mile/${teamId}/dashboard`} className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1">
            <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
          </Link>
          <h1 className="text-2xl font-black text-obsidian flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" /> 구독 관리
          </h1>
          {data?.team && <p className="text-sm text-slate mt-1">{data.team.name}</p>}
        </div>

        {/* 현재 구독 상태 */}
        {data?.hasSubscription && data.subscription && (
          <Card className="rounded-2xl border-2 border-green-300 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{PLAN_FEATURES[data.subscription.plan]?.icon}</span>
                  <h3 className="font-black text-obsidian text-lg">{data.subscription.planLabel} 플랜</h3>
                </div>
                {getStatusBadge(data.subscription.status)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-black text-obsidian">{data.subscription.currentPlayers}/{data.subscription.maxPlayers}</p>
                  <p className="text-xs text-slate">팀원/스터디원 현원</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-sm font-black text-obsidian">
                    {data.subscription.status === 'trial' && data.subscription.trialEndsAt
                      ? new Date(data.subscription.trialEndsAt).toLocaleDateString('ko-KR')
                      : new Date(data.subscription.endDate).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-xs text-slate">
                    {data.subscription.status === 'trial' ? '체험 종료일' : '다음 결제일'}
                  </p>
                </div>
              </div>

              {data.subscription.status === 'trial' && (
                <div className="bg-blue-50 border border-primary/30 rounded-xl p-3 text-center mb-4">
                  <p className="text-sm font-bold text-primary">🎉 14일 무료 체험 중</p>
                  <p className="text-xs text-primary mt-1">체험 기간 종료 전 정기결제를 등록해 주세요</p>
                </div>
              )}

              {data.subscription.status === 'trial' || data.subscription.status === 'expired' ? (
                <Button
                  className="w-full rounded-xl bg-obsidian text-white hover:bg-gray-800 h-12 text-lg font-black"
                  onClick={() => handlePayment(data.subscription.plan)}
                  disabled={actionLoading === 'payment'}
                >
                  {actionLoading === 'payment' ? <Loader2 className="w-5 h-5 animate-spin" /> : '정기결제 시작하기'}
                </Button>
              ) : null}

              <Button
                variant="outline"
                className="w-full rounded-xl text-red-500 hover:bg-red-50 border-red-200"
                onClick={handleCancel}
                disabled={actionLoading === 'cancel'}
              >
                {actionLoading === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : '구독 취소'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 플랜 선택 */}
        {!data?.hasSubscription && (
          <>
            <div className="text-center space-y-2">
              <h2 className="font-black text-obsidian text-xl">플랜을 선택하세요</h2>
              <p className="text-sm text-slate">모든 플랜 14일 무료 체험 가능</p>
            </div>

            {data?.plans && Object.entries(data.plans).map(([key, plan]: [string, any]) => {
              const features = PLAN_FEATURES[key];
              const isPopular = key === 'pro';
              return (
                <Card key={key} className={`rounded-2xl border-none shadow-xl relative ${isPopular ? 'ring-2 ring-green-400' : ''}`}>
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white border-none font-bold px-4">
                      <Star className="w-3 h-3 mr-1" /> 인기
                    </Badge>
                  )}
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{features?.icon}</span>
                        <h3 className="font-black text-obsidian text-lg">{plan.label}</h3>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-obsidian text-xl">₩{plan.price.toLocaleString()}</p>
                        <p className="text-xs text-slate">/월</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {features?.features.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-slate">{f}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleStartTrial(key)}
                      disabled={actionLoading === key}
                      className={`w-full h-12 rounded-2xl font-black ${
                        isPopular ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-900'
                      }`}
                    >
                      {actionLoading === key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" /> 14일 무료 시작
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
