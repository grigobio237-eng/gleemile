'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus, Activity, BarChart3, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MyConditionPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCondition();
  }, []);

  const fetchCondition = async () => {
    try {
      const res = await fetch('/api/mile/wellness?view=my&days=28');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!data || data.checks?.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-[32px] border-none shadow-2xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="text-xl">📊</div>
            <h1 className="text-2xl font-black text-obsidian">아직 데이터가 없습니다</h1>
            <p className="text-slate">웰니스 체크를 먼저 기록해 주세요!</p>
            <Button asChild className="w-full h-12 rounded-2xl font-black bg-green-600 hover:bg-green-700">
              <Link href="/mile/wellness">오늘의 컨디션 체크하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { acwr, stats, todayCheck, checks } = data;

  const getACWRZoneStyle = (zone: string) => {
    const styles: Record<string, string> = {
      undertrained: 'bg-primary-container text-primary border-primary/30',
      optimal: 'bg-green-100 text-green-700 border-green-300',
      caution: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      danger: 'bg-red-100 text-red-700 border-red-300',
    };
    return styles[zone] || styles.optimal;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-orange-500" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-primary" />;
    return <Minus className="w-4 h-4 text-green-500" />;
  };

  // 최근 7일 웰니스 점수 차트 (간단 바 차트)
  const recent7 = checks.slice(0, 7).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        <div>
          <Link href="/mile/mypage" className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1 font-bold">
            <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
          </Link>
        </div>

        {/* 헤더 */}
        <div className="text-center space-y-2">
          <Badge className="bg-green-100 text-green-700 border-none font-bold text-xs px-4 py-1">MY CONDITION</Badge>
          <h1 className="text-3xl font-black text-obsidian">나의 컨디션</h1>
          <p className="text-slate text-sm">28일 데이터 기반 분석</p>
        </div>

        {/* 오늘의 웰니스 요약 */}
        <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate">오늘의 웰니스</span>
              {todayCheck ? (
                <Badge className="bg-green-100 text-green-700 border-none font-bold">✅ 체크 완료</Badge>
              ) : (
                <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 rounded-xl h-8 text-xs">
                  <Link href="/mile/wellness">체크하기 →</Link>
                </Button>
              )}
            </div>
            {todayCheck ? (
              <>
                <div className="overflow-x-auto pb-2 custom-scrollbar">
                  <div className="grid grid-cols-5 gap-2 text-center min-w-[300px]">
                  {[
                    { label: '수면 부족', value: todayCheck.sleep, emoji: '🌙' },
                    { label: '주관 피로', value: todayCheck.fatigue, emoji: '⚡' },
                    { label: '대인 스트레스', value: todayCheck.stress, emoji: '🧠' },
                    { label: '긴장도', value: todayCheck.tension, emoji: '🔥' },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <span className="text-lg">{item.emoji}</span>
                      <div className={`text-xl font-black ${
                        item.value >= 4 ? 'text-red-600' : item.value >= 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>{item.value}</div>
                      <p className="text-[10px] text-slate">{item.label}</p>
                    </div>
                  ))}
                  </div>
                </div>

                {todayCheck.notes && Object.values(todayCheck.notes).some(v => v) && (
                  <div className="bg-surface/60 rounded-2xl border border-line p-4 mt-4 space-y-2.5">
                    <p className="text-[11px] font-bold text-foreground/70">📝 오늘의 한 줄 메모</p>
                    <div className="space-y-1.5">
                      {Object.entries(todayCheck.notes).map(([key, val]) => {
                        if (!val) return null;
                        const labels: Record<string, string> = {
                          sleep: '수면 부족',
                          fatigue: '주관적 피로',
                          stress: '대인 스트레스',
                          tension: '긴장도'
                        };
                        return (
                          <div key={key} className="text-xs bg-white py-1.5 px-3 rounded-xl border border-line flex items-center gap-2">
                            <span className="font-extrabold text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-lg flex-shrink-0">
                              {labels[key] || key}
                            </span>
                            <span className="font-bold text-obsidian line-clamp-1">{val as string}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-slate text-sm py-4">아직 오늘의 체크가 없습니다</p>
            )}
          </CardContent>
        </Card>

        {/* ACWR 카드 */}
        {acwr && (
          <Card className={`rounded-2xl border-2 shadow-xl ${getACWRZoneStyle(acwr.zone)}`}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  <span className="font-bold">ACWR (부하 비율)</span>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(acwr.trend)}
                  <span className="text-xs font-bold">{acwr.trend === 'increasing' ? '증가 추세' : acwr.trend === 'decreasing' ? '감소 추세' : '안정적'}</span>
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="font-black text-xl">{acwr.acwr}</div>
                <Badge className="bg-white/50 border-none font-bold">{acwr.zoneLabel}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center bg-white/30 rounded-xl p-3">
                  <p className="text-xs font-bold opacity-70">급성 부하 (ACL)</p>
                  <p className="text-lg font-black">{acwr.acuteLoad} AU</p>
                </div>
                <div className="text-center bg-white/30 rounded-xl p-3">
                  <p className="text-xs font-bold opacity-70">만성 부하 (CCL)</p>
                  <p className="text-lg font-black">{acwr.chronicLoad} AU</p>
                </div>
              </div>
              {acwr.zone === 'danger' && (
                <div className="flex items-center gap-2 bg-red-200 rounded-xl p-3 text-sm font-bold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  번아웃 위험이 매우 높습니다. 리더와 1on1 면담을 권장합니다.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 최근 7일 웰니스 추이 */}
        <Card className="rounded-2xl border-none shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span className="font-bold text-obsidian">최근 7일 웰니스 추이</span>
            </div>
            <div className="flex items-end gap-2 h-32 pt-2">
              {recent7.map((check: any, i: number) => {
                const height = (check.wellnessScore / 5) * 100;
                const color = check.wellnessScore >= 4 ? 'bg-green-500 shadow-md shadow-green-100' : check.wellnessScore >= 3 ? 'bg-yellow-400 shadow-md shadow-yellow-100' : 'bg-red-500 shadow-md shadow-red-100';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                    <span className="text-[10px] font-black text-obsidian">{check.wellnessScore}</span>
                    <div className="w-full relative h-20 flex items-end px-0.5">
                      <div className={`w-full rounded-t-xl ${color} transition-all duration-500 ease-out`} style={{ height: `${height}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-slate">{check.date.slice(5)}</span>
                  </div>
                );
              })}
              {recent7.length === 0 && (
                <div className="w-full text-center text-slate text-sm py-8">데이터가 부족합니다</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 통계 요약 */}
        <Card className="rounded-2xl border-none shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-green-600">{stats.totalDays}</p>
                <p className="text-xs text-slate font-bold">기록 일수</p>
              </div>
              <div>
                <p className="text-2xl font-black text-primary">{stats.avgWellness}</p>
                <p className="text-xs text-slate font-bold">평균 웰니스</p>
              </div>
              <div>
                <p className="text-2xl font-black text-secondary">{stats.avgLoad}</p>
                <p className="text-xs text-slate font-bold">평균 부하</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
