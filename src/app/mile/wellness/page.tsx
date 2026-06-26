'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Moon, Brain, Heart, Users, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const WELLNESS_ITEMS = [
  { key: 'sleep', label: '수면 피로도', icon: Moon, desc: '어젯밤 수면은 충분했나요?', labels: ['충분 (최상)', '보통 이상', '보통', '조금 부족', '많이 부족 (최악)'] },
  { key: 'fatigue', label: '주관적 피로도', icon: Heart, desc: '오늘 육체적/정신적 피로감은?', labels: ['매우 활력 (최상)', '활력', '보통', '피곤함', '탈진 (최악)'] },
  { key: 'stress', label: '대인 관계 스트레스', icon: Users, desc: '오늘 모임 내 대인 스트레스는?', labels: ['전혀 없음 (최상)', '거의 없음', '보통', '조금 있음', '매우 높음 (최악)'] },
  { key: 'tension', label: '인지적 긴장도', icon: Brain, desc: '현재 과업에 대한 긴장도는?', labels: ['완전 이완 (최상)', '이완', '보통', '긴장', '과긴장 (최악)'] },
];

const COLLAB_VOLUMES = [
  { value: 1.0, label: '낮음', emoji: '☕', desc: '개인 작업 위주, 가벼운 소통' },
  { value: 2.0, label: '보통', emoji: '💬', desc: '일반적인 회의 및 협업' },
  { value: 3.0, label: '높음', emoji: '🔥', desc: '마감 직전, 격렬한 토론, 많은 소통' },
];

export default function WellnessCheckPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [values, setValues] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [collaborationVolume, setCollaborationVolume] = useState<number | null>(null);
  const [injuryNote, setInjuryNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [todayCheck, setTodayCheck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTodayCheck();
    } else if (status === 'unauthenticated') {
      window.location.href = '/api/auth/signin';
    }
  }, [status]);

  const fetchTodayCheck = async () => {
    try {
      const res = await fetch('/api/mile/wellness?view=my&days=1');
      if (res.ok) {
        const data = await res.json();
        if (data.todayCheck) {
          setTodayCheck(data.todayCheck);
          setValues({
            sleep: data.todayCheck.sleep,
            fatigue: data.todayCheck.fatigue,
            stress: data.todayCheck.stress,
            tension: data.todayCheck.tension,
          });
          if (data.todayCheck.notes) {
            setNotes(data.todayCheck.notes);
          }
          if (data.todayCheck.collaborationVolume) {
            setCollaborationVolume(data.todayCheck.collaborationVolume);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const allWellnessFilled = WELLNESS_ITEMS.every((item) => values[item.key]);
  const collabFilled = collaborationVolume !== null;
  const allFilled = allWellnessFilled && collabFilled;

  const handleSubmit = async () => {
    if (!allFilled) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/mile/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          notes,
          collaborationVolume,
          injuryNote: injuryNote || undefined,
          source: 'quick',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.check);
        setSubmitted(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    // 1-5 중 1이 좋은 상태
    if (score <= 2) return 'text-green-600';
    if (score <= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <p className="text-slate font-bold">기록을 불러오는 중...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // 제출 완료 화면
  if (submitted && result) {
    const strain = result.mentalStrainIndex;
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-[32px] border-none shadow-2xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-obsidian">무드 체크인 완료!</h1>
            <div className={`text-xl font-black ${getScoreColor(strain)}`}>{strain}</div>
            <p className="text-slate">오늘의 정신적 피로 지수 (1에 가까울수록 좋음)</p>
            {result.dailyCognitiveLoad && (
              <Badge className="bg-primary-container text-primary border-none font-bold text-sm px-4 py-2 mt-2">
                <Brain className="w-4 h-4 mr-1" /> 일간 인지 부하 (DCL): {result.dailyCognitiveLoad} AU
              </Badge>
            )}
            <div className="flex flex-col gap-3 pt-4">
              <Button asChild className="w-full h-12 rounded-2xl font-black bg-green-600 hover:bg-green-700">
                <Link href="/mile/my-condition">📊 내 컨디션 분석 보기</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 rounded-2xl font-bold">
                <Link href="/mile/mypage">🏡 홈으로 가기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        <div>
          <Link href="/mile/mypage" className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1 font-bold">
            <ArrowLeft className="w-4 h-4" /> 홈으로
          </Link>
        </div>

        {/* 헤더 */}
        <div className="text-center space-y-2">
          <Badge className="bg-green-100 text-green-700 border-none font-bold text-xs px-4 py-1">DAILY MOOD CHECK-IN</Badge>
          <h1 className="text-3xl font-black text-obsidian">오늘의 무드 체크인</h1>
          <p className="text-slate text-sm">정신적 피로 지수와 협업량을 기록하세요</p>
          {todayCheck && (
            <Badge className="bg-yellow-100 text-yellow-700 border-none text-xs mt-2">⚠️ 이미 기록됨 — 수정 모드</Badge>
          )}
        </div>

        {/* 웰니스 항목 */}
        {WELLNESS_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} className="rounded-2xl border-none shadow-lg">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-obsidian">{item.label}</span>
                  {values[item.key] && (
                    <Badge className={`ml-auto ${getScoreColor(values[item.key])} bg-transparent border-none font-black text-lg`}>
                      {values[item.key]}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate">{item.desc}</p>
                <div className="overflow-x-auto pb-2 custom-scrollbar">
                  <div className="flex gap-2 min-w-[340px]">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setValues({ ...values, [item.key]: score })}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          values[item.key] === score
                            ? score <= 2
                              ? 'bg-green-500 text-white shadow-lg scale-105'
                              : score <= 3
                              ? 'bg-yellow-400 text-white shadow-lg scale-105'
                              : 'bg-red-500 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-obsidian hover:bg-gray-200'
                        }`}
                      >
                        {item.labels[score - 1]}
                      </button>
                    ))}
                  </div>
                </div>

                {values[item.key] && (
                  <div className="transition-all duration-300 ease-out overflow-hidden max-h-28 opacity-100 mt-3">
                    <div className="flex flex-col gap-1 p-2 bg-surface/50 rounded-xl border border-line/60 focus-within:border-green-300 focus-within:bg-green-50/10">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-slate flex items-center gap-1">
                          📝 특이사항 (선택)
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={60}
                        value={notes[item.key] || ''}
                        onChange={(e) => setNotes({ ...notes, [item.key]: e.target.value })}
                        placeholder={`이유나 특이사항이 있다면 적어주세요`}
                        className="bg-white h-9 px-3 rounded-lg border border-line/50 text-[11px] font-bold focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* 협업 부량 (Volume) */}
        <Card className="rounded-2xl border-none shadow-lg">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-bold text-obsidian">협업 부량 인자 (Volume)</span>
              <Badge className="ml-auto bg-red-50 text-red-600 border-none text-[10px] font-black">필수사항</Badge>
            </div>

            <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100/60 space-y-1.5 text-left">
              <p className="text-[11px] font-extrabold text-primary flex items-center gap-1">
                💡 Cognitive ACWR 가이드
              </p>
              <div className="space-y-1 text-[10px] text-slate font-bold leading-relaxed">
                <p>• 오늘 모임과 관련해 소비된 소통 빈도, 모임 시간, 과업 수량을 종합하여 선택해 주세요.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate">오늘의 협업 정도 <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {COLLAB_VOLUMES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setCollaborationVolume(type.value)}
                    className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                      collaborationVolume === type.value
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-gray-100 text-obsidian hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-lg">{type.emoji}</span>
                    <span className="text-sm font-bold">{type.label}</span>
                    <span className={`text-[9px] ${collaborationVolume === type.value ? 'text-white/80' : 'text-slate'}`}>{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> 기타 메모 (선택)
              </label>
              <textarea
                value={injuryNote}
                onChange={(e) => setInjuryNote(e.target.value)}
                placeholder="조직 소외감, 이탈 징후, 개인적 어려움 등 리더에게 알리고 싶은 내용을 편하게 적어주세요."
                className="w-full h-16 px-3 py-2 rounded-xl border border-line text-sm resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="mt-8 mb-4">
          <Button
            onClick={handleSubmit}
            disabled={!allFilled || submitting}
            className="w-full h-14 rounded-2xl font-black text-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 shadow-xl"
          >
            {submitting ? (
              <><Loader2 className="animate-spin mr-2 w-5 h-5" /> 기록 중...</>
            ) : allFilled ? (
              '✅ 오늘의 무드 체크인 제출'
            ) : !allWellnessFilled ? (
              `정서 항목을 모두 선택해 주세요 (${Object.keys(values).length}/4)`
            ) : (
              '💬 오늘의 협업 정도를 입력해 주세요'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
