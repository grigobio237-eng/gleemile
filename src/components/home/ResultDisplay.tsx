'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, ArrowRight, Sparkles, FileText, Clock, ShieldCheck, Brain, Gift, Layout, Lock } from 'lucide-react';
import { useRecovery } from '@/contexts/RecoveryContext';
import { AnalysisResult } from './HeroScanner';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDynamicRoutines, getRhythmTypeInfo } from '@/lib/logic/routines';
import { getKSTDate } from '@/lib/date';

export default function ResultDisplay({ 
  score, 
  answers, 
  userNote, 
  analysisData,
  snapData,
  onEnter, 
  onOpenWebtoon 
}: { 
  score: number; 
  answers: any[]; 
  userNote: string; 
  analysisData: AnalysisResult | null;
  snapData?: { type: 'PHOTO' | 'TEXT'; content: string | File } | null;
  onEnter: () => void; 
  onOpenWebtoon: () => void 
}) {
  const { journey } = useRecovery();
  const [isDesigning, setIsDesigning] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const [completedActions, setCompletedActions] = useState<number[]>([]);

  const handleActionComplete = (idx: number) => {
    if (!completedActions.includes(idx)) {
      setCompletedActions(prev => [...prev, idx]);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }
  };

  // AI 가이드 텍스트의 지저분한 마크다운 기호를 지우고 이쁜 구조로 분할 파싱하는 헬퍼
  const parseFutureDirection = (text: string) => {
    if (!text) return [];
    // 줄바꿈 또는 임의의 구분자로 쪼갬
    const lines = text.split(/\n|\\n/).filter(line => line.trim().length > 0);
    
    return lines.map(line => {
      // **로 둘러싸인 강조 표시 제거 및 트림
      const cleanLine = line.replace(/\*\*/g, '').trim();
      
      let icon = '✨';
      let label = '가이드';
      let content = cleanLine;
      
      if (cleanLine.includes('현재 상황:')) {
        icon = '🚨';
        label = '현재 상황';
        content = cleanLine.replace('현재 상황:', '').trim();
      } else if (cleanLine.includes('권장 행동:')) {
        icon = '💡';
        label = '권장 행동';
        content = cleanLine.replace('권장 행동:', '').trim();
      } else if (cleanLine.includes('대체 루틴:')) {
        icon = '🍵';
        label = '대체 루틴';
        content = cleanLine.replace('대체 루틴:', '').trim();
      }
      
      // 맨 앞 이모티콘 겹침 방지 제거
      content = content.replace(/^[🚨💡🍵✨]*/, '').trim();
      
      return { icon, label, content };
    });
  };

  // Context-aware UI Labels
  const getRoadmapInfo = () => {
    switch (journey) {
      case 'CLINICAL_PRE':
        return {
          badge: "Clinical: Pre-visit",
          title: "성공적인 시술을 위한 Doctor's Note",
          cta: "의료진에게 공유하기",
          nextActionTitle: "의사 상담용 리포트 준비",
          nextActionDesc: "안전하고 효과적인 시술을 위해 상담 시 이 리포트를 함께 보여주세요."
        };
      case 'CLINICAL_POST':
        return {
          badge: "Clinical: Post-visit",
          title: "골든타임 72시간 집중 회복 전술",
          cta: "회복 타임라인 확인하기",
          nextActionTitle: "72시간 세밀 모니터링",
          nextActionDesc: "시술 후 가장 중요한 3일간의 변화를 실시간으로 밀착 관리합니다."
        };
      default:
        return {
          badge: "Recovery Timeline",
          title: "당신만을 위한 회복 타임라인",
          cta: "맞춤 플랜 확인하기",
          nextActionTitle: "일상 루틴 설계 받기",
          nextActionDesc: "실시간 데이터를 분석한 나만의 활력 행동 가이드"
        };
    }
  };

  const info = getRoadmapInfo();

  // 최근에 네비게이터(영업사원)의 QR을 스캔한 유저 = 시술/문진 집중 케어 대상 (기존 추천인 referredBy와 분리)
  const isEventUser = !!(session?.user as any)?.recentNavigator || journey?.startsWith('CLINICAL');

  // Convert raw score (5-25 scale: 5 is worst, 25 is best) to pure 100-point scale
  const recoveryScore = Math.max(0, Math.min(100, (score - 5) * 5));

  // Logic for Rhythm Types (Integrated with Dynamic Engine)
  const { type: rhythmType, description: typeDescription, color: cardColor } = getRhythmTypeInfo(recoveryScore);
  const dailyActions = generateDynamicRoutines(recoveryScore, analysisData);

  const scoreLevel = recoveryScore >= 70 ? '활기 회복 단계' : recoveryScore >= 40 ? '회복 진행 중' : '회복 초기 단계';

  // Holistic Future Projection Logic
  const getFutureProjection = (score: number) => {
    if (score >= 70) return "지금의 좋은 리듬을 7일만 유지하면 번아웃 위험 구간에서 완벽히 탈출할 수 있어요!";
    if (score >= 40) return "회복이 진행되고 있어요. 오늘 하루 1분만 더 휴식하면 다음 주에는 활기찬 단계에 진입합니다.";
    return "주의가 필요해요! 불균형이 지속되면 피로가 누적될 수 있습니다. 오늘 당장 작은 휴식을 시작하세요.";
  };
  const futureMessage = getFutureProjection(recoveryScore);

  useEffect(() => {
    const saveData = async () => {
      // 1. Local Storage (KST-aware)
      const today = getKSTDate();
      localStorage.setItem('recovery_last_check', today);
      localStorage.setItem('recovery_last_score', recoveryScore.toString());

      // 2. Dispatch event to open header
      window.dispatchEvent(new Event('recovery-gate-passed'));

      // 3. Save to DB (Background) - Only if logged in
      if (session?.user?.email) {
        try {
          await fetch('/api/recovery/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: today, // Use YYYY-MM-DD string for consistency
              rawScore: score,
              totalScore: recoveryScore,
              metaphor: rhythmType,
              answers: answers.map(a => ({
                questionId: a.questionId,
                category: a.category,
                score: a.score,
                answer: a.answer,
                detail: a.detail // 상세 약물/식품 정보 포함
              })),
              userNote: userNote,
              snapData: snapData ? {
                type: snapData.type,
                content: snapData.content
              } : undefined
            })
          });
        } catch (e) {
          console.error('Failed to save recovery score to DB', e);
        }
      }
    };
    saveData();
  }, [recoveryScore, score, rhythmType, answers, userNote]);

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <div className={`max-w-md mx-auto min-h-[85vh] flex flex-col justify-center px-4 text-center space-y-6 sm:space-y-12 animate-fade-in pb-20 ${isDesigning ? 'opacity-20 blur-sm pointer-events-none' : ''} transition-all duration-700`}>
        <div className="space-y-3 sm:space-y-4 text-left">
          <div className="flex items-center gap-3 mb-3 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-chapter-accent/10 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-chapter-accent" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-chapter-accent uppercase tracking-widest leading-none mb-1">Rhythm Check Complete</p>
              <h2 className="font-black text-obsidian italic tracking-tighter text-xl sm:text-2xl">리듬체크 완료</h2>
            </div>
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <div className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-chapter-accent/10 text-chapter-accent text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">
              {info.badge}
            </div>
            <h2 className="font-black text-obsidian tracking-tight break-keep text-2xl sm:text-3xl md:text-4xl">{info.title}</h2>
          </div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 sm:p-10 bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl shadow-chapter-accent/5 space-y-6 sm:space-y-8 border-2 border-line relative overflow-hidden text-left"
        >
          <div className={`absolute top-0 left-0 w-full h-3 ${cardColor}`} />
          
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black text-slate uppercase tracking-widest opacity-40 block mb-0.5">Today's Rhythm</span>
              <h3 className="font-black text-obsidian tracking-tighter italic font-serif break-keep leading-tight text-xl sm:text-3xl">
                {rhythmType}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] sm:text-[10px] font-black text-slate/40 uppercase tracking-widest block mb-0.5">Recovery Point</span>
              <div className="font-black text-chapter-accent italic tracking-tighter leading-none text-xl">
                {recoveryScore}
              </div>
            </div>
          </div>

          <p className="text-sm sm:text-lg text-slate font-medium leading-relaxed break-keep">
            {typeDescription}
          </p>

          {session ? (
            <>
              {/* Holistic Future Projection */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 bg-primary/5 rounded-2xl border border-primary/20 text-left mt-4"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-[10px] sm:text-[11px] font-black text-primary uppercase tracking-widest">Future Projection</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-foreground/80 break-keep leading-snug">
                  {futureMessage}
                </p>
              </motion.div>

              {/* AI 프리미엄 밀착 처방전 섹션 */}
              {analysisData?.futureDirection && (
                <div className="space-y-4 pt-6 border-t border-line mt-6">
                  <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" /> Youniqle AI Recovery Report
                  </span>
                  <div className="grid grid-cols-1 gap-3">
                    {parseFutureDirection(analysisData.futureDirection).map((item, idx) => (
                      <div key={idx} className="p-4 sm:p-5 bg-primary/5 rounded-[20px] sm:rounded-3xl border border-primary/10 hover:bg-primary/10 transition-all text-left">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base leading-none">{item.icon}</span>
                          <span className="text-[10px] sm:text-[11px] font-black text-primary uppercase tracking-widest leading-none">{item.label}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-foreground/80 leading-relaxed break-keep pl-5 sm:pl-6">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-line mt-6">
                <span className="text-[9px] sm:text-[10px] font-black text-chapter-accent uppercase tracking-widest block text-left">Today's Micro Therapy</span>
                <div className="grid grid-cols-1 gap-3">
                  {dailyActions.map((action, idx) => {
                    const isCompleted = completedActions.includes(idx);
                    return (
                      <motion.button 
                        key={idx} 
                        whileHover={!isCompleted ? { scale: 1.02 } : {}}
                        whileTap={!isCompleted ? { scale: 0.98 } : {}}
                        onClick={() => handleActionComplete(idx)}
                        className={`relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border text-left transition-all w-full
                          ${isCompleted 
                            ? 'bg-primary/5 border-primary/20 shadow-none' 
                            : 'bg-mist/50 border-line/50 hover:border-primary/40 hover:shadow-md cursor-pointer'
                          }
                        `}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm shrink-0 z-10 transition-colors
                          ${isCompleted ? 'bg-primary text-white' : 'bg-white'}
                        `}>
                          {isCompleted ? <CheckCircle className="w-4.5 h-4.5 text-white animate-in zoom-in" /> : action.icon}
                        </div>
                        <span className={`text-sm font-bold leading-tight break-keep text-left z-10 transition-colors
                          ${isCompleted ? 'text-primary/70 line-through' : 'text-obsidian'}
                        `}>
                          {action.text}
                        </span>
                        
                        {/* Completion Background Animation */}
                        {isCompleted && (
                          <motion.div 
                            initial={{ width: 0, opacity: 0.5 }}
                            animate={{ width: "100%", opacity: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="absolute left-0 top-0 h-full bg-primary/20 pointer-events-none"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8 relative overflow-hidden rounded-2xl border border-dashed border-line bg-slate-50 p-8">
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center text-center p-6">
                  <Lock className="w-8 h-8 text-primary mb-3 opacity-80" />
                  <h4 className="font-black text-obsidian mb-1 text-lg">상세 리포트 잠금</h4>
                  <p className="text-xs font-bold text-foreground/60 break-keep">가입하시면 상세 분석과 맞춤 솔루션을 모두 보실 수 있습니다.</p>
              </div>
              <div className="space-y-4 opacity-30 select-none pointer-events-none filter blur-[2px]">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-primary/40 rounded-full"></div><div className="h-3 bg-slate-300 rounded w-1/4"></div></div>
                  <div className="h-4 bg-slate-300 rounded w-full"></div>
                  <div className="h-4 bg-slate-300 rounded w-5/6"></div>
                  <div className="h-12 bg-primary/10 rounded-xl w-full mt-4"></div>
                  <div className="h-12 bg-primary/10 rounded-xl w-full"></div>
              </div>
            </div>
          )}
        </motion.div>

          <div className="grid grid-cols-1 gap-4">
            {session ? (
              <Button 
                onClick={onEnter} 
                size="lg" 
                className="w-full h-16 md:h-20 rounded-[24px] bg-obsidian text-white text-lg md:text-xl font-black shadow-2xl shadow-obsidian/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>기록 완료하고 대시보드로 이동</span>
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => router.push('/auth/signup')} 
                  size="lg" 
                  className="w-full h-16 md:h-20 rounded-[24px] bg-primary text-white text-lg md:text-xl font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5 md:w-6 md:h-6" />
                  <span>간편 가입하고 리포트 저장하기</span>
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
                <p className="text-xs text-foreground/50 font-medium">가입하시면 상세 7일 패턴 분석과 맞춤 솔루션을 받아보실 수 있습니다.</p>
              </div>
            )}
          </div>
      </div>

    </>
  );
}
