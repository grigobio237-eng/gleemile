'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Activity, Sparkles, ArrowRight } from 'lucide-react';
import { useRecovery } from '@/contexts/RecoveryContext';
import { Question } from '@/types/diagnosis';

export default function DiagnosisForm({ questions, onComplete }: { questions: Question[]; onComplete: (score: number, answers: any[], userNote: string) => void }) {
  const { journey, treatmentType } = useRecovery();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any[]>(new Array(questions.length).fill(null));
  const [userNote, setUserNote] = useState('');

  const getHeaderInfo = () => {
    switch (journey) {
      case 'CLINICAL_PRE':
        return {
          title: "어제와 다른 오늘을 발견하는 시간",
          sub: "60초의 리듬체크로 당신의 오늘을 기록합니다"
        };
      case 'CLINICAL_POST':
        return {
          title: "조금씩 쌓이는 회복의 신호를 읽습니다",
          sub: "작은 기록들이 모여 당신만의 회복 지도가 됩니다"
        };
      default:
        return {
          title: "당신의 오늘을 조용히 비추어봅니다",
          sub: "지금 느껴지는 그대로를 남겨주세요"
        };
    }
  };

  const header = getHeaderInfo();

  const handleOptionSelect = (score: number, label: string) => {
    const currentQ = questions[step];
    const newAnswers = [...answers];
    newAnswers[step] = {
      questionId: currentQ.id,
      category: currentQ.category,
      score: score,
      answer: label,
      detail: answers[step]?.detail || ''
    };
    setAnswers(newAnswers);
    // Auto-advance after a short delay for better flow
    setTimeout(() => {
      if (step < questions.length - 1) setStep(step + 1);
    }, 400);
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      const totalScore = answers.reduce((acc, curr) => acc + (curr?.score || 0), 0);
      const finalAnswers = answers.filter(a => a !== null);
      onComplete(totalScore, finalAnswers, userNote);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-background">
        <div className="animate-pulse text-foreground/40 font-bold">질문을 불러오는 중입니다...</div>
      </div>
    );
  }

  const currentQ = questions[step];
  const currentAnswer = answers[step];
  const progress = ((step + 1) / questions.length) * 100;
  const isLastStep = step === questions.length - 1;

  const isMedicineQuestion = currentQ.category === '약물' || currentQ.text.includes('복용') || currentQ.text.includes('약');

  return (
    <div className="w-full max-w-xl mx-auto min-h-[70vh] md:min-h-[85vh] flex flex-col justify-between px-5 pt-4 pb-6 md:px-8 md:py-20 bg-background text-foreground rounded-5xl shadow-2xl">
      <div className="flex-1 flex flex-col justify-start md:justify-center">
        {/* Header Section */}
        <div className="mb-4 md:mb-16 text-center space-y-2 md:space-y-4">
          <h1 className="font-bold tracking-tight leading-tight break-keep text-xl md:text-4xl">{header.title}</h1>
          <p className="text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-[0.3em]">{header.sub}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 md:mb-16 px-2 md:px-4">
          <div className="flex justify-between items-end mb-2 md:mb-5">
            <span className="text-[10px] md:text-[11px] font-bold text-foreground/20 uppercase tracking-[0.3em]">
              STEP {step + 1} / {questions.length}
            </span>
            <span className="font-bold text-primary tabular-nums tracking-tighter text-2xl md:text-4xl">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-surface/50 h-2 md:h-3 rounded-full overflow-hidden p-0.5 md:p-1 shadow-inner border border-white/20">
            <motion.div
              className="bg-primary h-full rounded-full shadow-lg shadow-primary/20"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "circOut" }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 md:space-y-12"
          >
            <div className="space-y-2 md:space-y-6">
              <div className="inline-flex items-center gap-2 md:gap-3 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-surface/50 border border-white/20 shadow-sm">
                <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                <span className="text-[10px] md:text-[11px] font-bold text-foreground/40 uppercase tracking-[0.2em]">{currentQ.category}</span>
              </div>
              <h2 className="text-lg md:text-3xl font-bold text-foreground leading-tight tracking-tight break-keep">
                {currentQ.text}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-2 md:gap-4">
              {currentQ.options.map((opt, idx) => {
                const isSelected = currentAnswer?.answer === opt.label;
                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(opt.score, opt.label)}
                    className={`w-full p-3.5 md:p-8 text-left rounded-full transition-all relative overflow-hidden group shadow-lg
                      ${isSelected
                        ? 'bg-primary text-white shadow-primary/30 border-none'
                        : 'bg-surface/40 border border-white/20 hover:border-primary/30 text-foreground/70'
                      }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className={`text-base md:text-xl font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>{opt.label}</span>
                      <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected ? 'bg-white border-white' : 'border-primary/10'}
                      `}>
                        {isSelected && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Details Input */}
            {isMedicineQuestion && currentAnswer && !currentAnswer.answer.includes('없음') && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 md:space-y-4 pt-4 md:pt-6"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-reward-gold" />
                  <span className="text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-[0.2em]">추가 정보가 필요해요</span>
                </div>
                <textarea
                  value={currentAnswer.detail || ''}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[step] = { ...currentAnswer, detail: e.target.value };
                    setAnswers(newAnswers);
                  }}
                  placeholder="구체적인 내용을 들려주세요 (예: 약 이름 등)"
                  className="w-full p-4 md:p-8 bg-surface/50 border border-white/20 rounded-3xl md:rounded-4xl focus:border-primary outline-none min-h-[100px] md:min-h-[140px] resize-none text-base md:text-lg font-medium shadow-inner placeholder:text-foreground/20"
                />
              </motion.div>
            )}

            {isLastStep && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-4 md:pt-12 border-t border-white/10 space-y-3 md:space-y-6"
              >
                <label className="block text-[10px] md:text-xs font-bold text-foreground/20 uppercase tracking-[0.2em]">
                  Personal Note (Optional)
                </label>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="오늘의 소중한 한 줄을 남겨주세요."
                  className="w-full p-4 md:p-8 bg-surface/30 border border-white/10 rounded-3xl md:rounded-4xl focus:border-primary outline-none min-h-[100px] md:min-h-[140px] resize-none text-base md:text-lg font-medium shadow-inner placeholder:text-foreground/20"
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 md:gap-6 mt-4 md:mt-16">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={step === 0}
          className="w-14 md:w-24 h-14 md:h-20 rounded-full border-white/20 text-foreground/30 hover:bg-surface/50 hover:text-primary transition-all"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </Button>
        <Button
          onClick={handleNext}
          disabled={!currentAnswer}
          className="flex-1 h-14 md:h-20 text-base md:text-xl rounded-full font-bold transition-all shadow-2xl shadow-primary/20 bg-primary text-white hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 md:gap-4"
        >
          {isLastStep ? '리듬카드 완성하기' : '다음으로'}
          <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
      </div>
    </div>
  );
}
