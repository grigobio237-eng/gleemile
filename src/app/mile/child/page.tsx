'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Heart, ArrowLeft, UserPlus, CheckCircle2,
  BarChart3, Link as LinkIcon, Utensils, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ChildDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkResult, setLinkResult] = useState<string | null>(null);

  useEffect(() => {
    fetchChildData();
  }, []);

  const fetchChildData = async () => {
    try {
      const res = await fetch('/api/mile/guardian?days=14');
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

  const handleLink = async () => {
    if (!linkEmail) return;
    setLinking(true);
    setLinkResult(null);
    try {
      const res = await fetch('/api/mile/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link', childEmail: linkEmail }),
      });
      const result = await res.json();
      if (res.ok) {
        setLinkResult(`✅ ${result.message}`);
        await fetchChildData();
      } else {
        setLinkResult(`❌ ${result.error}`);
      }
    } catch (e) {
      setLinkResult('❌ 연결에 실패했습니다');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  // 자녀 미연결 상태
  if (!data?.linked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-background p-4 pb-24">
        <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
          <Link href="/mile/mypage" className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
          </Link>
 
          <Card className="rounded-[32px] border-none shadow-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                <UserPlus className="w-10 h-10 text-pink-500" />
              </div>
              <h1 className="text-2xl font-black text-obsidian">자녀 계정 연결</h1>
              <p className="text-slate text-sm">자녀의 가입 이메일을 입력하면 컨디션 데이터를 열람할 수 있습니다.</p>
 
              <div className="space-y-3">
                <input
                  type="email"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  placeholder="자녀의 이메일 주소"
                  className="w-full h-12 px-4 rounded-2xl border border-line text-sm"
                />
                <Button
                  onClick={handleLink}
                  disabled={!linkEmail || linking}
                  className="w-full h-12 rounded-2xl font-black bg-pink-500 hover:bg-pink-600"
                >
                  {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                    <LinkIcon className="w-4 h-4 mr-2" /> 연결하기
                  </>}
                </Button>
                {linkResult && (
                  <p className={`text-sm font-bold ${linkResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {linkResult}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 자녀 연결 완료 — 데이터 열람
  const { child, todayCheck, checks, stats, todayMeals } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        <div>
          <Link href="/mile/mypage" className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1">
            <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
          </Link>
          <Badge className="bg-pink-100 text-pink-700 border-none font-bold text-xs ml-2">GUARDIAN VIEW</Badge>
          <h1 className="text-2xl font-black text-obsidian mt-1">
            {child.name}의 컨디션
          </h1>
          <p className="text-sm text-slate mt-1">
            {child.position && `${child.position}`}{child.playerNumber ? ` #${child.playerNumber}` : ''}
          </p>
        </div>

        {/* 오늘의 상태 */}
        <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-pink-400 to-rose-500" />
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate">오늘의 컨디션</span>
              {todayCheck ? (
                <Badge className="bg-green-100 text-green-700 border-none font-bold">✅ 체크 완료</Badge>
              ) : (
                <Badge className="bg-gray-100 text-foreground/70 border-none">아직 미체크</Badge>
              )}
            </div>
            {todayCheck ? (
              <div className="text-center space-y-3">
                <div className={`text-xl font-black ${
                  todayCheck.mentalStrainIndex >= 4 ? 'text-red-600' :
                  todayCheck.mentalStrainIndex >= 3 ? 'text-yellow-600' : 'text-green-600'
                }`}>{todayCheck.mentalStrainIndex}</div>
                <p className="text-sm text-slate">정신적 피로 지수 (1~5)</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: '수면', value: todayCheck.sleep, emoji: '🌙' },
                    { label: '피로', value: todayCheck.fatigue, emoji: '⚡' },
                    { label: '스트레스', value: todayCheck.stress, emoji: '🧠' },
                    { label: '긴장', value: todayCheck.tension, emoji: '🔥' },
                  ].map((item) => (
                    <div key={item.label} className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      item.value >= 4 ? 'bg-red-100 text-red-700' :
                      item.value >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      <span>{item.emoji}</span>
                      <p className="text-lg font-black">{item.value}</p>
                      <p className="text-[10px]">{item.label}</p>
                    </div>
                  ))}
                </div>

                {todayCheck.notes && Object.values(todayCheck.notes).some(v => v) && (
                  <div className="bg-surface/60 rounded-2xl border border-line p-4 mt-4 space-y-2.5 text-left">
                    <p className="text-[11px] font-bold text-foreground/70">📝 자녀의 오늘 한 줄 메모</p>
                    <div className="space-y-1.5">
                      {Object.entries(todayCheck.notes).map(([key, val]) => {
                        if (!val) return null;
                        const labels: Record<string, string> = {
                          sleep: '수면 부족',
                          fatigue: '주관적 피로',
                          stress: '대인 스트레스',
                          tension: '인지적 긴장도'
                        };
                        return (
                          <div key={key} className="text-xs bg-white py-1.5 px-3 rounded-xl border border-line flex items-center gap-2">
                            <span className="font-extrabold text-[10px] text-pink-600 bg-pink-50 px-2 py-0.5 rounded-lg flex-shrink-0">
                              {labels[key] || key}
                            </span>
                            <span className="font-bold text-obsidian line-clamp-1">{val as string}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate text-sm py-6">자녀가 아직 오늘의 체크를 하지 않았습니다</p>
            )}
          </CardContent>
        </Card>

        {/* 통계 */}
        <Card className="rounded-2xl border-none shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-pink-600">{stats.totalDays}</p>
                <p className="text-xs text-slate font-bold">기록 일수</p>
              </div>
              <div>
                <p className="text-2xl font-black text-primary">{stats.avgWellness}</p>
                <p className="text-xs text-slate font-bold">평균 웰니스</p>
              </div>
              <div>
                <p className={`text-2xl font-black ${stats.checkedToday ? 'text-green-600' : 'text-foreground/70'}`}>
                  {stats.checkedToday ? '✅' : '⬜'}
                </p>
                <p className="text-xs text-slate font-bold">오늘 체크</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🥗 gleemile 푸드 스캐너 영양 분석 스냅 */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate uppercase flex items-center gap-1.5 px-1">
            <Utensils className="w-4 h-4 text-rose-500" /> 자녀의 오늘 영양 분석
          </h3>
          {todayMeals && todayMeals.length > 0 ? (
            <div className="space-y-3.5">
              {todayMeals.map((meal: any, idx: number) => (
                <Card key={idx} className="rounded-[28px] border-none shadow-xl bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-400/10 to-rose-400/10 px-5 py-3 border-b border-rose-50 flex items-center justify-between">
                    <span className="text-xs font-black text-rose-600 flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5" /> 영양 스냅 #{todayMeals.length - idx}
                    </span>
                    <span className="text-[10px] font-black text-foreground/70">
                      {new Date(meal.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex gap-4">
                      {meal.imageUrl && (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-line shadow-sm bg-surface">
                          <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={meal.imageUrl} alt="식사 사진" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-obsidian text-sm truncate">
                            {meal.summary ? meal.summary.split(' [')[0] : '오늘의 든든한 식사'}
                          </h4>
                          <Badge className="bg-rose-50 text-rose-600 border-none font-black text-xs shrink-0 ml-1">
                            점수: {meal.score}점
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-slate/80 leading-relaxed">
                          {meal.summary || '식단 정보 분석 완료'}
                        </p>
                      </div>
                    </div>
                    
                    {/* 제미나이 영양 가이드 및 방향성 피드백 */}
                    {meal.metrics?.futureDirection && (
                      <div className="p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100/50 space-y-1">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> gleemile 영양 피드백
                        </p>
                        <p className="text-xs font-bold text-obsidian leading-relaxed">
                          {meal.metrics.futureDirection}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-none shadow-lg bg-white/60">
              <CardContent className="p-6 text-center space-y-2 py-8">
                <span className="text-3xl">🥗</span>
                <h4 className="font-bold text-obsidian text-sm">오늘 업로드된 식단 없음</h4>
                <p className="text-xs text-slate opacity-75 leading-relaxed">
                  자녀가 아직 gleemile 푸드 스캐너로 식사 사진을 분석하지 않았습니다.<br />
                  식단을 촬영하면 여기에 실시간 영양 리포트가 표시됩니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 최근 기록 */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate uppercase flex items-center gap-1 px-1">
            <BarChart3 className="w-4 h-4" /> 최근 14일 기록
          </h3>
          {checks.length === 0 ? (
            <Card className="rounded-2xl border-none shadow-lg">
              <CardContent className="p-8 text-center text-slate">기록이 없습니다</CardContent>
            </Card>
          ) : (
            <div className="flex items-end gap-1.5 h-28 bg-white rounded-2xl shadow-lg p-4">
              {checks.slice(0, 14).reverse().map((check: any, i: number) => {
                const height = (check.wellnessScore / 5) * 100;
                const color = check.wellnessScore >= 4 ? 'bg-green-400' : check.wellnessScore >= 3 ? 'bg-yellow-400' : 'bg-red-400';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[8px] font-bold text-obsidian">{check.wellnessScore}</span>
                    <div className={`w-full rounded-t-md ${color}`} style={{ height: `${height}%` }} />
                    <span className="text-[7px] text-slate">{check.date.slice(8)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
