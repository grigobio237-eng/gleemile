"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAIProgress } from "@/hooks/use-ai-progress";
import { AIProgressOverlay } from "@/components/shared/AIProgressOverlay";

export default function PostCareForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { progress, statusMessage, finish: finishProgress } = useAIProgress(isSubmitting);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    procedureName: "",
    procedureDate: "",

    // Step 2: Symptoms (1-5)
    pain: "1",
    swelling: "1",
    bruising: "1",
    fever: "1",
    otherDetails: "",

    // Step 3: Lifestyle & Concerns
    concerns: [] as string[],
    smoking: false,
    drinking: false,
    activityLevel: "낮음",
  });

  const handleConcernChange = (concern: string) => {
    setFormData((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter((c) => c !== concern)
        : [...prev.concerns, concern],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        procedureInfo: {
          name: formData.procedureName,
          date: formData.procedureDate,
        },
        symptoms: {
          pain: parseInt(formData.pain),
          swelling: parseInt(formData.swelling),
          bruising: parseInt(formData.bruising),
          fever: parseInt(formData.fever),
          otherDetails: formData.otherDetails,
        },
        concerns: formData.concerns,
        lifestyle: {
          smoking: formData.smoking,
          drinking: formData.drinking,
          activityLevel: formData.activityLevel,
        },
      };

      const res = await fetch("/api/post-care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("로드맵 생성에 실패했습니다.");
      
      const data = await res.json();
      finishProgress();

      // 시각적 피드백을 위해 약간 대기
      await new Promise(r => setTimeout(r, 1000));

      addToast({
        title: "리커버리 로드맵 생성 완료",
        description: "당신만을 위한 1:1 회복 플랜이 준비되었습니다.",
        variant: "success",
      });

      router.push(`/event/post-care/report/${data.reportId}`);
    } catch (err) {
      addToast({
        title: "오류",
        description: "로드맵 생성 중 문제가 발생했습니다.",
        variant: "error",
      });
      setIsSubmitting(false);
    }
  };

  const getProgressWidth = () => {
    switch (step) {
      case 1: return "w-1/3";
      case 2: return "w-2/3";
      case 3: return "w-full";
      default: return "w-0";
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4">
      <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-xl rounded-[32px] sm:rounded-[40px] overflow-hidden border border-line/10">
        <div className={`h-2 bg-obsidian transition-all duration-700 ease-out ${getProgressWidth()}`} />
        
        <CardHeader className="pt-12 pb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-xs font-black text-primary tracking-widest uppercase mb-4">
             Digital Recovery Roadmap
          </div>
          <CardTitle className="font-black tracking-tight text-obsidian text-4xl">
            {step === 1 ? "언제 시술을 받으셨나요?" : step === 2 ? "현재 어떤 증상이 있나요?" : "생활 습관과 고민"}
          </CardTitle>
          <CardDescription className="text-slate font-medium text-lg">
            맞춤형 회복 플랜을 위해 상세 정보를 수집합니다.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-12 sm:pb-16 px-5 sm:px-8 md:px-14">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
            
            {/* STEP 1: 시술 정보 */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="space-y-4">
                   <Label className="text-sm font-black uppercase text-slate tracking-widest flex items-center gap-2">
                     <Activity className="w-4 h-4" /> 1. 시술/수술 명칭
                   </Label>
                   <Input 
                     placeholder="예: 줄기세포 얼굴 지방이식, 무릎 연골 재생시술 등"
                     className="h-16 rounded-[20px] text-lg font-bold border-line bg-mist/20 focus:scale-[1.02] transition-transform"
                     value={formData.procedureName}
                     onChange={(e) => setFormData({...formData, procedureName: e.target.value})}
                   />
                </div>

                <div className="space-y-4">
                   <Label className="text-sm font-black uppercase text-slate tracking-widest flex items-center gap-2">
                     <Calendar className="w-4 h-4" /> 2. 시술 날짜
                   </Label>
                   <Input 
                     type="date"
                     className="h-16 rounded-[20px] text-lg font-bold border-line bg-mist/20 cursor-pointer"
                     value={formData.procedureDate}
                     onChange={(e) => setFormData({...formData, procedureDate: e.target.value})}
                   />
                </div>

                <Button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  disabled={!formData.procedureName || !formData.procedureDate}
                  className="w-full h-16 sm:h-18 rounded-[20px] sm:rounded-[24px] text-lg sm:text-xl font-black bg-obsidian text-white shadow-xl hover:scale-105 transition-all active:scale-95"
                >
                  다음 단계로 (1/3)
                </Button>
              </div>
            )}

            {/* STEP 2: 증상 체크 */}
            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {[
                     { id: 'pain', label: '통증', icon: '⚡' },
                     { id: 'swelling', label: '붓기', icon: '🎈' },
                     { id: 'bruising', label: '멍', icon: '🫐' },
                     { id: 'fever', label: '열감', icon: '🔥' },
                   ].map((item) => (
                     <div key={item.id} className="space-y-4">
                        <Label className="text-sm font-black text-obsidian flex items-center gap-2">
                          <span className="text-lg">{item.icon}</span> {item.label} (1-5)
                        </Label>
                        <RadioGroup 
                          onValueChange={(v) => setFormData({...formData, [item.id]: v})}
                          value={(formData as any)[item.id]}
                          className="flex justify-between items-center bg-mist/30 p-2 rounded-2xl border border-line"
                        >
                           {[1, 2, 3, 4, 5].map((val) => (
                             <div key={val} className="flex flex-col items-center">
                               <RadioGroupItem value={val.toString()} id={`${item.id}-${val}`} className="sr-only" />
                               <Label 
                                 htmlFor={`${item.id}-${val}`}
                                 className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all cursor-pointer ${
                                   (formData as any)[item.id] === val.toString() 
                                   ? 'bg-obsidian text-white scale-110 shadow-lg' 
                                   : 'bg-white text-slate hover:bg-mist'
                                 }`}
                               >
                                 {val}
                               </Label>
                             </div>
                           ))}
                        </RadioGroup>
                     </div>
                   ))}
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-black text-slate uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> 기타 불편한 점 상세
                  </Label>
                  <Textarea 
                    placeholder="예: 시술 부위가 조금 가려워요, 비대칭이 느껴져요 등"
                    className="rounded-3xl min-h-[120px] bg-mist/20 border-line text-lg"
                    value={formData.otherDetails}
                    onChange={(e) => setFormData({...formData, otherDetails: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-none sm:flex-1 h-14 sm:h-16 px-6 sm:px-0 rounded-[20px] sm:rounded-[24px] font-bold text-slate text-base sm:text-lg">이전</Button>
                  <Button 
                    type="button" 
                    onClick={() => setStep(3)} 
                    className="flex-1 sm:flex-[2] h-14 sm:h-16 rounded-[20px] sm:rounded-[24px] text-base sm:text-xl font-black bg-obsidian text-white shadow-xl"
                  >
                    다음 단계로 (2/3)
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: 고민 및 생활습관 */}
            {step === 3 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="space-y-5">
                   <Label className="text-lg font-black text-obsidian">오늘 특히 우려되는 점은?</Label>
                   <div className="grid grid-cols-2 gap-3">
                     {[
                       { label: '느린 회복 속도', value: '속도' },
                       { label: '시술 부위 비대칭', value: '비대칭' },
                       { label: '부작용 발생 우려', value: '부작용' },
                       { label: '일상 복귀 지연', value: '일상' },
                       { label: '프라이버시 노출', value: '프라이버시' },
                       { label: '흉터 걱정', value: '흉터' },
                     ].map((opt) => (
                       <button
                         key={opt.value}
                         type="button"
                         onClick={() => handleConcernChange(opt.label)}
                         className={`h-14 rounded-2xl border text-sm font-black transition-all flex items-center justify-between px-5 ${
                           formData.concerns.includes(opt.label)
                           ? 'bg-primary/10 border-primary text-primary'
                           : 'bg-white border-line text-slate hover:bg-mist'
                         }`}
                       >
                         {opt.label}
                         {formData.concerns.includes(opt.label) && <CheckCircle2 className="w-4 h-4 animate-in zoom-in" />}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="space-y-6 bg-mist/20 p-8 rounded-[32px] border border-line">
                   <p className="text-sm font-black text-slate uppercase tracking-widest mb-4">현재 생활 패턴</p>
                   <div className="flex gap-6">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="smoke" 
                          checked={formData.smoking}
                          onCheckedChange={(c) => setFormData({...formData, smoking: !!c})}
                          className="w-6 h-6 rounded-lg"
                        />
                        <Label htmlFor="smoke" className="font-black text-lg cursor-pointer">흡연 중</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="drink" 
                          checked={formData.drinking}
                          onCheckedChange={(c) => setFormData({...formData, drinking: !!c})}
                          className="w-6 h-6 rounded-lg"
                        />
                        <Label htmlFor="drink" className="font-black text-lg cursor-pointer">음주 중</Label>
                      </div>
                   </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)} className="flex-none sm:flex-1 h-16 sm:h-18 px-6 sm:px-0 rounded-[20px] sm:rounded-[24px] font-bold text-slate text-base sm:text-lg">이전</Button>
                  <Button 
                    type="button" 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-[3] h-16 sm:h-18 rounded-[20px] sm:rounded-[24px] text-base sm:text-xl md:text-2xl font-black bg-obsidian text-white shadow-2xl hover:scale-105 active:scale-95 transition-all group overflow-hidden relative"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> 
                        <span className="whitespace-nowrap">분석 중...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                         <span className="whitespace-nowrap">로드맵 생성</span>
                         <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-bounce" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </form>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-center text-slate/50 text-xs font-black uppercase tracking-[0.4em] animate-pulse">
         Clinical Data Protection Protocol Active
      </p>

      <AIProgressOverlay 
        active={isSubmitting} 
        progress={progress} 
        message={statusMessage} 
      />
    </div>
  );
}
