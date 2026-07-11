'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Moon, Brain, Heart, Users, AlertTriangle, ArrowLeft, Activity } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, collection, getCountFromServer } from 'firebase/firestore';
import { WellnessCheckBlock, wellnessBlockConverter } from '@/types/wellness';

const CONDITION_ITEMS = [
  { 
    key: 'sleep', label: '수면 피로도', icon: Moon, 
    labels: ['충분 (최상)', '보통 이상', '보통', '조금 부족', '많이 부족 (최악)'],
    desc: [
      "어젯밤 수면은 충분했나요?", "지난밤, 푹 주무셨나요?", "오늘 아침, 개운하게 일어나셨나요?", "수면 시간은 부족하지 않았나요?", "밤새 뒤척임 없이 잘 잤나요?",
      "눈을 떴을 때 피곤함이 없었나요?", "어제 하루의 피로가 수면으로 풀렸나요?", "잠자리에 들고 금방 잠드셨나요?", "중간에 깨지 않고 깊게 잤나요?", "오늘 하루를 시작할 에너지가 충전되었나요?",
      "밤사이 충분한 휴식을 취했나요?", "수면의 질에 만족하시나요?", "아침에 일어나는 게 힘들지 않았나요?", "어제보다 수면 컨디션이 좋은가요?", "상쾌한 기분으로 눈을 뜨셨나요?"
    ] 
  },
  { 
    key: 'fatigue', label: '주관적 피로도', icon: Heart, 
    labels: ['매우 활력 (최상)', '활력', '보통', '피곤함', '탈진 (최악)'],
    desc: [
      "오늘 육체적/정신적 피로감은?", "현재 몸이 무겁거나 지치진 않았나요?", "오늘 하루, 견딜 만한 피로도인가요?", "에너지가 얼마나 남아있다고 느끼시나요?", "정신적으로 번아웃이 오진 않았나요?",
      "오늘 몸 상태는 어떤가요?", "체력적으로 무리가 가는 하루였나요?", "현재 컨디션을 한 단어로 표현한다면?", "쉬고 싶다는 생각이 얼마나 자주 드나요?", "오늘 업무를 수행하기에 무리가 없나요?",
      "피로가 누적된 느낌이 드나요?", "활력이 얼마나 채워져 있나요?", "몸과 마음이 가벼운 편인가요?", "스트레스나 피로로 인해 힘들지 않나요?", "오늘 남은 일정을 소화할 체력이 있나요?"
    ] 
  },
  { 
    key: 'stress', label: '대인 관계 스트레스', icon: Users, 
    labels: ['전혀 없음 (최상)', '거의 없음', '보통', '조금 있음', '매우 높음 (최악)'],
    desc: [
      "오늘 모임 내 대인 스트레스는?", "팀원들과의 소통은 원활했나요?", "다른 사람 때문에 감정적으로 힘들진 않았나요?", "오늘 대인 관계로 인한 피로감은 어떤가요?", "팀 내에서 소외감이나 갈등을 느꼈나요?",
      "협업 과정에서 스트레스가 있었나요?", "동료들과의 대화가 즐거웠나요?", "누군가와 부딪히는 일이 있었나요?", "인간관계에서 오는 부담감이 있나요?", "팀 분위기에 만족하고 계신가요?",
      "의사소통 과정에서 답답함을 느꼈나요?", "함께 일하는 사람들과 긍정적인 에너지를 나눴나요?", "타인으로 인한 감정 소모가 컸나요?", "오늘 팀워크는 어땠다고 생각하시나요?", "대인 관계가 업무에 부정적인 영향을 미쳤나요?"
    ] 
  },
  { 
    key: 'tension', label: '인지적 긴장도', icon: Brain, 
    labels: ['완전 이완 (최상)', '이완', '보통', '긴장', '과긴장 (최악)'],
    desc: [
      "현재 과업에 대한 긴장도는?", "오늘 맡은 일에 대해 압박감을 느끼나요?", "마음이 편안하게 이완되어 있나요?", "업무로 인해 머리가 복잡하진 않나요?", "긴장 상태로 하루를 보냈나요?",
      "현재 마음의 여유가 있나요?", "업무 생각에 긴장이 풀리지 않나요?", "집중력을 유지하는 데 스트레스가 있나요?", "완벽하게 해내야 한다는 강박이 있나요?", "오늘 일정에 쫓기는 느낌을 받았나요?",
      "마음속에 걱정이나 불안이 있나요?", "현재 릴렉스된 상태인가요?", "업무 마감으로 인한 초조함이 있나요?", "과업의 난이도가 부담스럽게 느껴지나요?", "편안한 마음으로 일에 임하고 있나요?"
    ] 
  },
];

const BURNOUT_ITEMS = [
  { 
    key: 'vigor', label: '업무 활력 (Vigor)', icon: Activity, 
    labels: ['전혀 (최악)', '거의 아님', '보통', '그런 편', '매우 그렇다 (최상)'],
    desc: [
      "일할 때 에너지가 넘치고 활력이 돕니까?", "업무 중 긍정적인 에너지를 느끼나요?", "일하는 시간이 활기차게 느껴지나요?", "새로운 업무에 도전할 의욕이 있나요?", "일을 시작할 때 기대감이 드나요?",
      "오늘 업무를 힘차게 진행했나요?", "일하면서 살아있음을 느끼나요?", "업무에 쏟을 에너지가 충분한가요?", "피곤함보다 활력이 더 큰 상태인가요?", "일하는 과정에서 보람찬 활기를 얻나요?",
      "오늘 나의 업무 텐션은 어떤가요?", "일을 하면서 지루함보다 생동감을 느끼나요?", "업무에 대한 의욕이 솟아나나요?", "어려운 과제 앞에서도 에너지가 생기나요?", "나의 활력이 팀에 긍정적인 영향을 주나요?"
    ] 
  },
  { 
    key: 'dedication', label: '업무 헌신 (Dedication)', icon: Heart, 
    labels: ['전혀 안 느낌 (최악)', '거의 안 느낌', '보통', '느끼는 편', '강하게 느낌 (최상)'],
    desc: [
      "내 일에 강한 열정과 자부심을 느끼나요?", "현재 하는 일이 의미 있다고 생각하나요?", "내 역할에 대해 자부심이 있나요?", "업무 목표 달성에 열정을 쏟고 있나요?", "나의 일이 중요하다고 느끼나요?",
      "일에 대한 소명 의식이 있나요?", "스스로 자랑스러울 만큼 몰두하고 있나요?", "내가 만든 결과물에 애정을 느끼나요?", "팀의 목표에 진심으로 헌신하고 있나요?", "업무를 통해 성장하고 있다는 자부심이 있나요?",
      "내 일의 가치를 굳게 믿고 있나요?", "어려움이 있어도 포기하지 않을 열정이 있나요?", "나의 헌신이 팀의 성공에 기여한다고 믿나요?", "일 자체에 깊은 애착을 가지고 있나요?", "매 순간 최선을 다해 일하고 있나요?"
    ] 
  },
  { 
    key: 'absorption', label: '업무 몰입 (Absorption)', icon: Brain, 
    labels: ['전혀 없음 (최악)', '거의 없음', '보통', '자주 있음', '항상 있음 (최상)'],
    desc: [
      "일에 푹 빠져서 시간 가는 줄 모를 때가 있나요?", "주변 소음을 잊을 만큼 업무에 집중했나요?", "일하는 동안 딴생각 없이 몰입했나요?", "업무 중에 '벌써 시간이 이렇게 됐나?' 한 적이 있나요?", "일에 깊이 빠져들어 즐거움을 느꼈나요?",
      "집중력이 최고조에 달한 순간이 있었나요?", "하던 일을 멈추기 싫을 만큼 몰입했나요?", "업무 흐름(Flow)을 타는 경험을 했나요?", "오늘 하루, 온전히 일에만 집중할 수 있었나요?", "일하는 동안 다른 걱정거리를 잊었나요?",
      "마치 게임처럼 업무에 몰두했나요?", "몰입으로 인해 피로를 잊은 적이 있나요?", "현재의 과업에 깊이 연결되어 있음을 느끼나요?", "집중이 깨지지 않고 오랫동안 유지됐나요?", "나도 모르게 일에 흠뻑 빠져들었나요?"
    ] 
  },
];

const COLLAB_VOLUMES = [
  { value: 1.0, label: '낮음', emoji: '☕', desc: '개인 작업 위주, 가벼운 소통' },
  { value: 2.0, label: '보통', emoji: '💬', desc: '일반적인 회의 및 협업' },
  { value: 3.0, label: '높음', emoji: '🔥', desc: '마감 직전, 격렬한 토론, 많은 소통' },
];

export default function WellnessCheckPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string || 'default-team';

  const [values, setValues] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [collaborationVolume, setCollaborationVolume] = useState<number | null>(null);
  const [injuryNote, setInjuryNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [todayCheck, setTodayCheck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [dailyIndex, setDailyIndex] = useState(0);

  // 날짜 기반 하드코딩된 useEffect 제거

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/api/auth/signin';
      return;
    }
    if (status !== 'authenticated' || !session?.user?.id) return;

    const userId = session.user.id;
    const memberDocPath = `team_members/${teamId}_${userId}`;
    const todayStr = new Date().toLocaleDateString('en-CA');

    const wellnessRef = doc(db, memberDocPath, 'wellnessCheckData', todayStr).withConverter(wellnessBlockConverter);

    // 사용자의 총 기록 횟수를 기반으로 인덱스 설정
    const fetchUserHistoryCount = async () => {
      try {
        const wellnessColRef = collection(db, memberDocPath, 'wellnessCheckData');
        const snapshot = await getCountFromServer(wellnessColRef);
        const count = snapshot.data().count;
        setDailyIndex(count % 15);
      } catch (e) {
        console.error("Failed to fetch user history count", e);
        setDailyIndex(0); // 에러 시 기본값
      }
    };
    fetchUserHistoryCount();

    const unsubscribe = onSnapshot(wellnessRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as WellnessCheckBlock;
        setTodayCheck(data);
        setValues({
          sleep: data.sleep,
          fatigue: data.fatigue,
          stress: data.stress,
          tension: data.tension,
          vigor: (data as any).vigor || 0,
          dedication: (data as any).dedication || 0,
          absorption: (data as any).absorption || 0,
        });
        setNotes(data.notes || {});
        setCollaborationVolume(data.collaborationVolume);
      } else {
        setTodayCheck(null);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [status, session]);

  const allConditionFilled = CONDITION_ITEMS.every((item) => values[item.key]);
  const allBurnoutFilled = BURNOUT_ITEMS.every((item) => values[item.key]);
  const collabFilled = collaborationVolume !== null;
  const allFilled = allConditionFilled && allBurnoutFilled && collabFilled;

  const handleSubmit = async () => {
    if (!allFilled || !session?.user?.id) return;
    setSubmitting(true);
    try {
      const userId = session.user.id;
      const memberDocPath = `team_members/${teamId}_${userId}`;
      const todayStr = new Date().toLocaleDateString('en-CA');

      const mentalStrainIndex = Number(((values.sleep + values.fatigue + values.stress + values.tension) / 4).toFixed(2));
      const dailyCognitiveLoad = Number((collaborationVolume! * mentalStrainIndex).toFixed(2));

      const burnoutIndex = Number(((values.vigor + values.dedication + values.absorption) / 3).toFixed(2));

      const blockData: any = {
        id: todayStr,
        type: 'WELLNESS_CHECK',
        userId,
        teamId,
        date: todayStr,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sleep: values.sleep,
        fatigue: values.fatigue,
        stress: values.stress,
        tension: values.tension,
        vigor: values.vigor,
        dedication: values.dedication,
        absorption: values.absorption,
        mentalStrainIndex,
        burnoutIndex,
        collaborationVolume: collaborationVolume!,
        dailyCognitiveLoad,
        notes,
        source: 'quick'
      };

      const wellnessRef = doc(db, memberDocPath, 'wellnessCheckData', todayStr).withConverter(wellnessBlockConverter);
      await setDoc(wellnessRef, blockData, { merge: true });

      // Update team member summary for leaderboard and UI state
      const summaryRef = doc(db, `teams/${teamId}/member_summaries`, userId);
      const recoveryScore = Math.max(0, Math.round(100 - (mentalStrainIndex * 20))); // Simple recovery score logic
      await setDoc(summaryRef, {
        checkedIn: true,
        mentalStrainIndex,
        recoveryScore,
        name: session.user.name || 'Unknown',
        avatar: session.user.image || null,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      setResult({ mentalStrainIndex, dailyCognitiveLoad, burnoutIndex });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getConditionColor = (score: number) => {
    if (score <= 2) return 'text-green-600 bg-green-500 hover:bg-green-600';
    if (score <= 3) return 'text-yellow-600 bg-yellow-400 hover:bg-yellow-500';
    return 'text-red-600 bg-red-500 hover:bg-red-600';
  };

  const getBurnoutColor = (score: number) => {
    // 번아웃 문항은 점수가 높을수록 좋음 (5: 항상 활력)
    if (score >= 4) return 'text-green-600 bg-green-500 hover:bg-green-600';
    if (score >= 3) return 'text-yellow-600 bg-yellow-400 hover:bg-yellow-500';
    return 'text-red-600 bg-red-500 hover:bg-red-600';
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-slate font-bold">기록을 불러오는 중...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // 제출 완료 화면 또는 당일 이미 기록한 경우
  if ((submitted && result) || todayCheck) {
    const strain = result ? result.mentalStrainIndex : todayCheck.mentalStrainIndex;
    const burnout = result ? result.burnoutIndex : todayCheck.burnoutIndex;
    const cognitiveLoad = result ? result.dailyCognitiveLoad : todayCheck.dailyCognitiveLoad;

    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 font-sans selection:bg-emerald-200">
        <Card className="max-w-md w-full rounded-[32px] border-none shadow-2xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-obsidian">오늘의 펄스 체크인 완료!</h1>
            
            <div className="flex gap-4 justify-center">
              <div>
                <div className={`text-xl font-black ${strain <= 2 ? 'text-green-600' : strain <= 3 ? 'text-yellow-600' : 'text-red-600'}`}>{strain}</div>
                <p className="text-xs text-slate">정신적 피로 지수</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div>
                <div className={`text-xl font-black ${burnout >= 4 ? 'text-green-600' : burnout >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>{burnout || '-'}</div>
                <p className="text-xs text-slate">업무 몰입/활력 지수</p>
              </div>
            </div>

            {cognitiveLoad && (
              <Badge className="bg-primary-container text-primary border-none font-bold text-sm px-4 py-2 mt-4">
                <Brain className="w-4 h-4 mr-1" /> 일간 인지 부하 (DCL): {cognitiveLoad} AU
              </Badge>
            )}
            <div className="flex flex-col gap-3 pt-4">
              <Button asChild className="w-full h-12 rounded-2xl font-black bg-green-600 hover:bg-green-700">
                <Link href={`/mile/${teamId}/my-condition`}>📊 내 컨디션 분석 보기</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 rounded-2xl font-bold">
                <Link href={`/mile/${teamId}/dashboard`}>🏡 대시보드로 돌아가기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 pb-24 font-sans selection:bg-emerald-200">
      <div className="max-w-lg w-full mx-auto space-y-8 pt-4 md:pt-24">
        <div>
          <Link href={`/mile/${teamId}/dashboard`} className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1 font-bold">
            <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
          </Link>
        </div>

        {/* 헤더 */}
        <div className="text-center space-y-2">
          <Badge className="bg-green-100 text-green-700 border-none font-bold text-xs px-4 py-1">TEAM PULSE CHECK-IN</Badge>
          <h1 className="text-3xl font-black text-obsidian">오늘의 펄스 체크인</h1>
          <p className="text-slate text-sm">정신적 피로 지수와 업무 몰입도를 기록하세요</p>
        </div>

        {/* 1. 데일리 컨디션 항목 */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-obsidian flex items-center gap-2">
            <Moon className="w-5 h-5 text-slate-500" /> 1. 데일리 컨디션
          </h2>
          {CONDITION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} className="rounded-2xl border-none shadow-lg w-full overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-obsidian">{item.label}</span>
                    {values[item.key] && (
                      <Badge className={`ml-auto ${values[item.key] <= 2 ? 'text-green-600' : values[item.key] <= 3 ? 'text-yellow-600' : 'text-red-600'} bg-transparent border-none font-black text-lg`}>
                        {values[item.key]}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate">{item.desc[dailyIndex] || item.desc[0]}</p>
                  <div className="overflow-x-auto pb-2 custom-scrollbar w-full">
                    <div className="flex gap-2 min-w-max">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => setValues({ ...values, [item.key]: score })}
                          className={`flex-1 min-w-[64px] py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 2. 주간 번아웃 자가진단 항목 */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-black text-obsidian flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-500" /> 2. 업무 몰입 및 번아웃 (UWES)
          </h2>
          {BURNOUT_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} className="rounded-2xl border-none shadow-lg w-full overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-obsidian">{item.label}</span>
                    {values[item.key] && (
                      <Badge className={`ml-auto ${values[item.key] >= 4 ? 'text-green-600' : values[item.key] >= 3 ? 'text-yellow-600' : 'text-red-600'} bg-transparent border-none font-black text-lg`}>
                        {values[item.key]}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate">{item.desc[dailyIndex] || item.desc[0]}</p>
                  <div className="overflow-x-auto pb-2 custom-scrollbar w-full">
                    <div className="flex gap-2 min-w-max">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => setValues({ ...values, [item.key]: score })}
                          className={`flex-1 min-w-[64px] py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            values[item.key] === score
                              ? score >= 4
                                ? 'bg-green-500 text-white shadow-lg scale-105'
                                : score >= 3
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
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 협업 부량 (Volume) */}
        <Card className="rounded-2xl border-none shadow-lg">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-bold text-obsidian">오늘 하루 소통 및 업무량 (Volume)</span>
              <Badge className="ml-auto bg-red-50 text-red-600 border-none text-[10px] font-black">필수사항</Badge>
            </div>

            <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100/60 space-y-1.5 text-left">
              <p className="text-[11px] font-extrabold text-primary flex items-center gap-1">
                💡 왜 필수인가요? (인지 부하 측정)
              </p>
              <div className="space-y-1 text-[10px] text-slate font-bold leading-relaxed">
                <p>• 위에서 응답하신 <b>'정신적 피로도'</b>와 여기서 응답하는 <b>'오늘 하루 투입한 소통 및 업무 시간'</b>을 곱해서 팀원들의 번아웃 위험도(Cognitive ACWR)를 분석하고 배려를 유도하는 데 쓰입니다.</p>
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
            ) : !allConditionFilled || !allBurnoutFilled ? (
              `응답 항목을 모두 선택해 주세요 (${Object.keys(values).length}/7)`
            ) : (
              '💬 오늘의 협업 정도를 입력해 주세요'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
