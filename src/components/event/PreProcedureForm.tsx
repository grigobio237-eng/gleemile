"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Loader2, Search, Stethoscope, Activity, Heart, ShieldCheck, Sparkles, Smile, Leaf, Target, HeartPulse, Coffee, Gem } from "lucide-react";
import { useRecovery } from "@/contexts/RecoveryContext";
import { motion, AnimatePresence } from "framer-motion";

export default function PreProcedureForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const { medicalCategory, setMedicalCategory } = useRecovery();
  
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isNewAction = searchParams?.get('action') === 'new';
  
  const [step, setStep] = useState(isNewAction ? 0 : (medicalCategory ? 1 : 0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [symptomText, setSymptomText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState("");

  useEffect(() => {
    const checkAutoAnalyze = async () => {
      const sp = new URLSearchParams(window.location.search);
      const isNew = sp.get('action') === 'new';

      if (isNew) {
        setStep(0);
        setMedicalCategory(null);
        setIsAutoAnalyzing(true);
        try {
          const res = await fetch('/api/user/status?minimal=true');
          const data = await res.json();
          let contextSymptom = "";
          if (data.insights?.posture?.description) {
             contextSymptom = data.insights.posture.description;
          } else if (data.score?.label) {
             contextSymptom = `현재 회복 상태는 ${data.score.label} 단계이며, 종합적인 컨디션 체크가 필요합니다.`;
          }
          if (contextSymptom) {
            setAiRecommendation(contextSymptom);
          }
        } catch (err) {
          console.error("Auto Analysis Failed:", err);
        } finally {
          setIsAutoAnalyzing(false);
        }
      }
    };
    checkAutoAnalyze();
  }, []);

  const handleCategorySelect = async (category: any) => {
    setIsAnalyzing(true);
    setSymptomText(""); 
    try {
      setMedicalCategory(category);
      setStep(1);
    } catch (error) {
      console.error('Error:', error);
      setMedicalCategory(category);
      setStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeSymptom = async () => {
    if (!symptomText.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-symptom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptom: symptomText })
      });
      const data = await response.json();
      if (data.category) {
        setMedicalCategory(data.category);
        setFormData(prev => ({ ...prev, symptom: symptomText }));
        setStep(1);
      }
    } catch (error) {
      console.error('AI Auto Analysis Error:', error);
      setMedicalCategory('GENERAL');
      setStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [formData, setFormData] = useState({
    symptom: "",
    duration: "",
    vasScore: 5,
    branchQ1: "",
    branchA1: "",
    branchQ2: "",
    branchA2: "",
    hasPastSurgery: false,
    pastSurgeryDetails: "",
    isTakingMedication: false,
    medicationDetails: "",
    hasAllergies: false,
    allergyDetails: "",
    dailyImpact: "",
    conditionDrops: "",
    preferredTreatment: "",
    concerns: [] as string[],
    hasCompanion: false,
    companionDetails: "",
    specialRequest: "",
    premiumBudget: "",
  });

  const getBranchQuestions = (category: string | null) => {
    switch(category) {
      case 'ORIENTAL':
      case 'INTERNAL':
        return {
          q1: "집중 개선하고 싶은 전신 증상은?",
          q1Hint: "예: 만성 피로, 면역력 저하",
          q2: "과거 면역/수액 치료 등 프리미엄 케어 경험은?",
        };
      case 'ORTHOPEDIC':
        return {
          q1: "가장 아픈 부위와 악화되는 상황은?",
          q1Hint: "예: 계단 오를 때 무릎 통증",
          q2: "모임 손상입니까, 만성 통증입니까?",
        };
      case 'PLASTIC':
      case 'DENTAL':
        return {
          q1: "과거 관련 부위 수술/시술 경험 시기는?",
          q1Hint: "예: 2년 전 재수술",
          q2: "이번 방문의 가장 중요한 기대 결과는?",
          q2Hint: "예: 빠른 회복, 확실한 변화"
        };
      default:
        return {
          q1: "가장 불편하신 부위/증상 상세 설명",
          q1Hint: "예: 아침에 일어날 때 특히 불편합니다.",
          q2: "이번 방문의 주요 기대 목표는?",
        };
    }
  };

  const branchQuestions = getBranchQuestions(medicalCategory);

  const handleConcernChange = (value: string) => {
    setFormData(prev => {
      const exists = prev.concerns.includes(value);
      if (exists) {
        return { ...prev, concerns: prev.concerns.filter(c => c !== value) };
      } else {
        return { ...prev, concerns: [...prev.concerns, value] };
      }
    });
  };

  const submitConsultation = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        medicalCategory: medicalCategory,
        chiefComplaint: {
          symptom: formData.symptom,
          duration: formData.duration,
          vasScore: formData.vasScore,
        },
        dynamicAnswers: {
          q1: branchQuestions.q1,
          a1: formData.branchA1,
          q2: branchQuestions.q2,
          a2: formData.branchA2,
        },
        medicalHistory: {
          pastSurgery: { has: formData.hasPastSurgery, details: formData.pastSurgeryDetails },
          currentMedication: { taking: formData.isTakingMedication, details: formData.medicationDetails },
          allergies: { has: formData.hasAllergies, details: formData.allergyDetails },
        },
        lifestyle: {
          dailyImpact: formData.dailyImpact,
          conditionDrops: formData.conditionDrops,
        },
        expectation: {
          preferredTreatment: formData.preferredTreatment,
          concerns: formData.concerns,
        },
        visitPlan: {
          companion: { has: formData.hasCompanion, details: formData.companionDetails },
          specialRequest: formData.specialRequest,
        },
        investment: {
          premiumBudget: formData.premiumBudget,
        }
      };

      const response = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Submission failed');
      const data = await response.json();
      
      addToast({ title: "제출 완료", description: "리포트가 생성되었습니다." });
      router.push(`/event/consultation/report/${data.consultationId}`);
    } catch (err) {
      addToast({ title: "오류", description: "제출 중 문제가 발생했습니다.", variant: "error" });
      setIsSubmitting(false);
    }
  };

  const getProgressWidth = () => {
    switch (step) {
      case 0: return "w-0";
      case 1: return "w-[16%]";
      case 2: return "w-[33%]";
      case 3: return "w-[50%]";
      case 4: return "w-[66%]";
      case 5: return "w-[83%]";
      case 6: return "w-full";
      default: return "w-0";
    }
  };

  return (
    <div className="max-w-md mx-auto py-2 px-2 bg-mist min-h-screen">
      <Card className="border border-line shadow-sm bg-white rounded-3xl overflow-hidden mb-6">
        <div className={`h-1.5 bg-primary transition-all duration-500 ${getProgressWidth()}`} />
        
        {/* STEP 0: Category / Symptom Input */}
        {step === 0 ? (
          <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2 mt-4">
              <div className="inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-1">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Intelligent Trigger</span>
              </div>
              <h2 className="font-black tracking-tight italic text-obsidian text-xl">
                현재 <span className="text-primary">어떤 고민</span>이 있으신가요?
              </h2>
              <p className="text-xs text-text-secondary font-medium">증상을 쓰시거나 분야를 선택해주세요.</p>
            </div>

            <div className="relative group">
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-3"
                  >
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <p className="text-xs font-bold text-primary">맞춤 문진표 설계 중...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative bg-mist border border-line group-focus-within:border-primary rounded-2xl p-1.5 flex items-center gap-2 transition-all">
                <Search className="w-5 h-5 text-text-secondary ml-2" />
                <Input 
                  placeholder="예: 어깨 통증 / 피로감"
                  className="border-none bg-transparent h-10 text-sm focus-visible:ring-0 placeholder:text-text-secondary/50 px-1"
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && analyzeSymptom()}
                  disabled={isAnalyzing}
                />
                <Button 
                  onClick={analyzeSymptom}
                  disabled={isAnalyzing || !symptomText.trim()}
                  className="h-10 px-4 rounded-xl bg-obsidian text-white font-bold text-xs"
                >
                  분석
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] text-center opacity-60">직접 분야 선택</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'PLASTIC', label: '성형/피부', icon: <Heart className="w-4 h-4 text-pink-500" />, bg: 'bg-pink-50' },
                  { id: 'ORIENTAL', label: '한방 회복', icon: <Leaf className="w-4 h-4 text-secondary" />, bg: 'bg-emerald-50' },
                  { id: 'DENTAL', label: '치과', icon: <Smile className="w-4 h-4 text-primary" />, bg: 'bg-amber-50' },
                  { id: 'ORTHOPEDIC', label: '정형/재활', icon: <Activity className="w-4 h-4 text-primary" />, bg: 'bg-blue-50' },
                  { id: 'INTERNAL', label: '내과/검진', icon: <Stethoscope className="w-4 h-4 text-secondary" />, bg: 'bg-indigo-50' },
                  { id: 'GENERAL', label: '일반 상담', icon: <ShieldCheck className="w-4 h-4 text-foreground/70" />, bg: 'bg-surface' },
                ].map((cat) => (
                  <button 
                    key={cat.id} onClick={() => handleCategorySelect(cat.id as any)}
                    className="flex flex-col items-center justify-center p-3 bg-white border border-line rounded-2xl hover:border-primary active:scale-95 transition-all text-center shadow-sm"
                  >
                    <div className={`w-8 h-8 ${cat.bg} rounded-xl flex items-center justify-center mb-1.5`}>{cat.icon}</div>
                    <h4 className="font-bold text-[10px] text-obsidian whitespace-nowrap">{cat.label}</h4>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <CardHeader className="pt-4 pb-2 px-4 flex flex-row items-center justify-between border-b border-line/50">
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1 < 0 ? 0 : step - 1)} className="text-xs font-bold text-slate p-0 hover:bg-transparent hover:text-primary">
                 ← 뒤로
              </Button>
              <span className="text-[10px] font-black bg-mist text-slate px-2 py-0.5 rounded-full">{step} / 6</span>
            </CardHeader>

            <CardContent className="p-4">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                
                {/* STEP 1: Chief Complaint */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <h3 className="text-lg font-black text-obsidian flex items-center gap-1.5"><Activity className="w-4 h-4 text-primary" />내원 목적 및 증상</h3>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-obsidian">가장 불편한 증상</Label>
                      <Textarea placeholder="무릎이 아파서 걷기 힘들어요" className="rounded-xl min-h-[60px] text-sm bg-mist border-none"
                        value={formData.symptom} onChange={(e) => setFormData({...formData, symptom: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-obsidian">증상 지속 기간</Label>
                      <RadioGroup onValueChange={(v) => setFormData({...formData, duration: v})} value={formData.duration} className="grid grid-cols-2 gap-2">
                        {[
                          { id: "dur-1", label: "며칠 이내", value: "며칠 이내" }, { id: "dur-2", label: "몇 주 전", value: "몇 주 전" },
                          { id: "dur-3", label: "몇 달 전", value: "수개월" }, { id: "dur-4", label: "만성적", value: "만성" },
                        ].map((opt) => (
                          <Label key={opt.id} htmlFor={opt.id} className={`flex items-center space-x-2 p-2.5 border rounded-xl cursor-pointer ${formData.duration === opt.value ? 'bg-primary/10 border-primary text-primary' : 'border-line text-slate bg-white'}`}>
                            <RadioGroupItem value={opt.value} id={opt.id} className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{opt.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2 bg-mist p-3 rounded-xl border border-line">
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-xs font-bold text-obsidian">통증 지수 (VAS)</Label>
                        <span className="text-primary font-black text-sm">{formData.vasScore}점</span>
                      </div>
                      <input type="range" min="1" max="10" value={formData.vasScore} onChange={(e) => setFormData({...formData, vasScore: parseInt(e.target.value)})}
                        className="w-full accent-primary h-1.5 bg-white rounded-lg appearance-none" />
                    </div>

                    <Button onClick={() => setStep(2)} disabled={!formData.symptom || !formData.duration} className="w-full h-11 rounded-xl text-sm font-bold bg-obsidian text-white">다음</Button>
                  </div>
                )}

                {/* STEP 2: Specialized Branch */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <h3 className="text-lg font-black text-obsidian flex items-center gap-1.5"><Target className="w-4 h-4 text-primary" />과별 심층 문진</h3>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-obsidian line-clamp-2">Q. {branchQuestions.q1}</Label>
                      <Textarea placeholder={branchQuestions.q1Hint} className="rounded-xl min-h-[60px] text-sm bg-mist border-none"
                        value={formData.branchA1} onChange={(e) => setFormData({...formData, branchA1: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-obsidian line-clamp-2">Q. {branchQuestions.q2}</Label>
                      <Textarea placeholder={branchQuestions.q2Hint} className="rounded-xl min-h-[60px] text-sm bg-mist border-none"
                        value={formData.branchA2} onChange={(e) => setFormData({...formData, branchA2: e.target.value})} />
                    </div>

                    <Button onClick={() => setStep(3)} disabled={!formData.branchA1 || !formData.branchA2} className="w-full h-11 rounded-xl text-sm font-bold bg-obsidian text-white">다음</Button>
                  </div>
                )}

                {/* STEP 3: Medical History */}
                {step === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <h3 className="text-lg font-black text-obsidian flex items-center gap-1.5"><HeartPulse className="w-4 h-4 text-primary" />건강 정보 / 병력</h3>

                    {[
                      { label: "수술/기저질환 이력", field: "hasPastSurgery", details: "pastSurgeryDetails", placeholder: "어떤 수술/질환인가요?" },
                      { label: "현재 복용 약물", field: "isTakingMedication", details: "medicationDetails", placeholder: "어떤 약을 드시나요?" },
                      { label: "알레르기 (필수)", field: "hasAllergies", details: "allergyDetails", placeholder: "약물/음식 알레르기", isAlert: true }
                    ].map((item: any, idx) => (
                      <div key={idx} className="space-y-2 bg-mist p-3 rounded-xl">
                        <Label className={`text-xs font-bold ${item.isAlert ? 'text-red-600' : 'text-obsidian'}`}>{item.label}</Label>
                        <RadioGroup onValueChange={(v) => setFormData({...formData, [item.field]: v === 'true'})} value={(formData as any)[item.field] ? 'true' : 'false'} className="grid grid-cols-2 gap-2">
                          <Label className={`flex items-center justify-center py-2 border rounded-lg cursor-pointer text-xs font-bold ${(formData as any)[item.field] ? 'bg-primary text-white border-primary' : 'bg-white text-slate border-line'}`}>
                            <RadioGroupItem value="true" className="sr-only" /> 네
                          </Label>
                          <Label className={`flex items-center justify-center py-2 border rounded-lg cursor-pointer text-xs font-bold ${!(formData as any)[item.field] ? 'bg-white text-obsidian border-primary' : 'bg-white text-slate border-line'}`}>
                            <RadioGroupItem value="false" className="sr-only" /> 아니오
                          </Label>
                        </RadioGroup>
                        {(formData as any)[item.field] && (
                          <Input placeholder={item.placeholder} className={`h-9 text-xs mt-2 bg-white ${item.isAlert ? 'border-red-200' : 'border-line'}`}
                            value={(formData as any)[item.details]} onChange={(e) => setFormData({...formData, [item.details]: e.target.value})} />
                        )}
                      </div>
                    ))}

                    <Button onClick={() => setStep(4)} 
                      disabled={(formData.hasPastSurgery && !formData.pastSurgeryDetails) || (formData.isTakingMedication && !formData.medicationDetails) || (formData.hasAllergies && !formData.allergyDetails)}
                      className="w-full h-11 rounded-xl text-sm font-bold bg-obsidian text-white">다음</Button>
                  </div>
                )}

                {/* STEP 4: Lifestyle */}
                {step === 4 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <h3 className="text-lg font-black text-obsidian flex items-center gap-1.5"><Coffee className="w-4 h-4 text-primary" />라이프스타일</h3>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-obsidian">일상생활 지장 정도</Label>
                      <RadioGroup onValueChange={(v) => setFormData({...formData, dailyImpact: v})} value={formData.dailyImpact} className="grid gap-2">
                        {[
                          { id: "im-1", label: "경미함 (일상 문제없음)", value: "경미함" },
                          { id: "im-2", label: "보통 (다소 불편)", value: "보통" },
                          { id: "im-3", label: "심각함 (업무/수면 지장)", value: "심각함" },
                        ].map((opt) => (
                          <Label key={opt.id} className={`flex items-center p-3 border rounded-xl cursor-pointer ${formData.dailyImpact === opt.value ? 'bg-primary/10 border-primary text-primary' : 'bg-mist border-line text-slate'}`}>
                            <RadioGroupItem value={opt.value} className="w-4 h-4 mr-2" />
                            <span className="text-xs font-bold">{opt.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-obsidian">최근 컨디션 저하 요소</Label>
                      <Input placeholder="스트레스, 수면부족 등" className="h-10 text-xs bg-mist border-line"
                        value={formData.conditionDrops} onChange={(e) => setFormData({...formData, conditionDrops: e.target.value})} />
                    </div>

                    <Button onClick={() => setStep(5)} disabled={!formData.dailyImpact || !formData.conditionDrops} className="w-full h-11 rounded-xl text-sm font-bold bg-obsidian text-white">다음</Button>
                  </div>
                )}

                {/* STEP 5: Expectations */}
                {step === 5 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <h3 className="text-lg font-black text-obsidian flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" />치료 기대치</h3>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-obsidian">선호 치료 방향</Label>
                      <RadioGroup onValueChange={(v) => setFormData({...formData, preferredTreatment: v})} value={formData.preferredTreatment} className="grid gap-2">
                        {[
                          { id: "tr-1", label: "빠른 증상 완화 중심", value: "빠른 증상 완화" },
                          { id: "tr-2", label: "시간이 걸려도 근본 원인 해결", value: "근본적 해결" },
                        ].map((opt) => (
                          <Label key={opt.id} className={`flex items-center p-3 border rounded-xl cursor-pointer ${formData.preferredTreatment === opt.value ? 'bg-primary/10 border-primary text-primary' : 'bg-mist border-line text-slate'}`}>
                            <RadioGroupItem value={opt.value} className="w-4 h-4 mr-2" />
                            <span className="text-xs font-bold">{opt.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-obsidian">우려되는 점 (다중선택)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "c-1", label: "부작용", value: "부작용" }, { id: "c-2", label: "치료기간", value: "치료기간" },
                          { id: "c-3", label: "업무복귀", value: "업무복귀" }, { id: "c-4", label: "통증", value: "통증" },
                        ].map((opt) => (
                          <Label key={opt.id} className={`flex items-center p-2.5 border rounded-xl cursor-pointer ${formData.concerns.includes(opt.value) ? 'bg-primary/10 border-primary text-primary' : 'bg-mist border-line text-slate'}`}>
                            <Checkbox id={opt.id} checked={formData.concerns.includes(opt.value)} onCheckedChange={() => handleConcernChange(opt.value)} className="w-3.5 h-3.5 mr-2 border-slate" />
                            <span className="text-xs font-bold">{opt.label}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    <Button onClick={() => setStep(6)} disabled={!formData.preferredTreatment || formData.concerns.length === 0} className="w-full h-11 rounded-xl text-sm font-bold bg-obsidian text-white">다음</Button>
                  </div>
                )}

                {/* STEP 6: Visit & Premium Budget */}
                {step === 6 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <h3 className="text-lg font-black text-obsidian flex items-center gap-1.5"><Gem className="w-4 h-4 text-primary" />VIP 방문 설계</h3>

                    <div className="space-y-2 bg-mist p-3 rounded-xl border border-line">
                      <Label className="text-xs font-bold text-obsidian">동행자 여부</Label>
                      <RadioGroup onValueChange={(v) => setFormData({...formData, hasCompanion: v === 'true'})} value={formData.hasCompanion ? 'true' : 'false'} className="grid grid-cols-2 gap-2">
                        <Label className={`flex items-center justify-center py-2 border rounded-lg cursor-pointer text-xs font-bold ${formData.hasCompanion ? 'bg-primary text-white border-primary' : 'bg-white text-slate border-line'}`}>
                          <RadioGroupItem value="true" className="sr-only" /> 네
                        </Label>
                        <Label className={`flex items-center justify-center py-2 border rounded-lg cursor-pointer text-xs font-bold ${!formData.hasCompanion ? 'bg-white text-obsidian border-primary' : 'bg-white text-slate border-line'}`}>
                          <RadioGroupItem value="false" className="sr-only" /> 혼자 방문
                        </Label>
                      </RadioGroup>
                      {formData.hasCompanion && (
                        <Input placeholder="가족 동행, 휠체어 등" className="h-9 text-xs mt-2 bg-white border-line"
                          value={formData.companionDetails} onChange={(e) => setFormData({...formData, companionDetails: e.target.value})} />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-obsidian">진료실 특별 요청</Label>
                      <Textarea placeholder="프라이버시 동선, 예민함 등" className="rounded-xl min-h-[60px] text-xs bg-mist border-line"
                        value={formData.specialRequest} onChange={(e) => setFormData({...formData, specialRequest: e.target.value})} />
                    </div>

                    <div className="space-y-3 bg-obsidian p-4 rounded-2xl text-white shadow-lg">
                      <Label className="text-sm font-black text-primary block">프리미엄 예산 규모</Label>
                      <RadioGroup onValueChange={(v) => setFormData({...formData, premiumBudget: v})} value={formData.premiumBudget} className="grid gap-2">
                        {[
                          { id: "b-1", title: "ESSENCE (360만~)", value: "ESSENCE" },
                          { id: "b-2", title: "SIGNATURE (690만~)", value: "SIGNATURE" },
                          { id: "b-3", title: "MIRACLE (990만~)", value: "MIRACLE" },
                          { id: "b-4", title: "상담 후 추천", value: "COUNSELING" },
                        ].map((opt) => (
                          <Label key={opt.id} className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer ${formData.premiumBudget === opt.value ? 'bg-primary border-primary text-white' : 'bg-white/10 border-white/20 text-white/70'}`}>
                            <span className="text-xs font-bold">{opt.title}</span>
                            <RadioGroupItem value={opt.value} className="w-3.5 h-3.5 border-white" />
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <Button onClick={submitConsultation} disabled={isSubmitting || !formData.premiumBudget} className="w-full h-12 rounded-xl text-sm font-black bg-primary text-white shadow-md">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "결과 리포트 생성"}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
