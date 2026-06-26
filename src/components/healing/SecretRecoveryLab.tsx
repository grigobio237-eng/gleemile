'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  ScrollText, 
  Activity,
  BrainCircuit,
  Lock,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Step = 'MAIN' | 'FORM' | 'RESULT' | 'SUBMITTED';

export default function SecretRecoveryLab() {
    const [step, setStep] = useState<Step>('MAIN');
    const [formStep, setFormStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        goal: '',
        stress: '50',
        sleep: '6',
        budget: '',
        history: ''
    });

    const youniqlePlans = {
        analysis: "데이터 분석 결과, 귀하의 현재 상태는 '누적 번아웃 주의' 단계입니다. 신속한 에너지 복원과 미세 순환 정체 해소가 시급하며, 이를 위해 최적화된 하이엔드 프로토콜 3가지를 제안합니다.",
        plans: {
            planA: {
                planId: 'A01',
                title: 'Ethereal Recharge',
                description: '극한의 피로를 해소하고 신경계의 안정을 되찾는 3일 집중 정화 프로그램',
                duration: '3 Days / Intensive',
                priceEstimate: '500,000 KRW',
                focusArea: '신경계 안정 & 세포 재생',
                routine: [
                    '프리미엄 수액 테라피 (B-Complex)',
                    '딥 릴렉세이션 명상 세션',
                    '산소 챔버 코어 리커버리'
                ]
            },
            planB: {
                planId: 'B01',
                title: 'Metabolic Balance',
                description: '흐트러진 대사 리듬을 바로잡고 활력을 되찾는 7일 순환 밸런스 프로그램',
                duration: '7 Days / Daily',
                priceEstimate: '1,200,000 KRW',
                focusArea: '호르몬 밸런스 & 체질 개선',
                routine: [
                    '맞춤 영양 식단 프로토콜',
                    '항산화 항노화 영양 제재',
                    '1:1 림프 순환 케어'
                ]
            },
            planC: {
                planId: 'C01',
                title: 'Ultimate Bio-Hacking',
                description: '최상의 퍼포먼스를 유지하기 위한 한정판 30일 맞춤형 프리미엄 시그니처 관리',
                duration: '30 Days / Premium',
                priceEstimate: '3,500,000 KRW',
                focusArea: '항노화 정밀 설계 & 전신 리모델링',
                routine: [
                    '전담 원장 1:1 주기적 맞춤 처방',
                    '최첨단 재생 솔루션 풀 마운트',
                    '24/7 프라이빗 컨시어지 대기'
                ]
            }
        }
    };

    const handleFormNext = () => setFormStep(prev => prev + 1);
    const handleSubmitForm = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'gleemile 마스터가 당신의 상태를 정밀 분석 중입니다...',
                success: '분석이 완료되었습니다. 맞춤형 프로토콜을 확인하세요.',
                error: '분석 중 오류가 발생했습니다.'
            }
        );
        setTimeout(() => setStep('RESULT'), 2200);
    };

    const handleSubmitSelection = () => {
        toast.success('프로토콜 선택이 완료되었습니다. 컨시어지 상담이 예약됩니다.');
        setStep('SUBMITTED');
    };

    if (step === 'MAIN') {
        return (
            <div className="w-full flex flex-col items-center justify-center py-10 sm:py-20 bg-[#F9F7F2]">
                <div className="max-w-4xl w-full px-6 text-center space-y-8 md:space-y-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 md:space-y-4"
                    >
                        <Badge className="bg-[#D4AF37] text-black border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Limited Access
                        </Badge>
                        <h1 className="px-2 text-[2rem] sm:text-[3rem] font-black text-[#0B0D10] tracking-tight leading-[1.1] md:leading-none italic break-words md:text-4xl">
                            Secret <br className="sm:hidden" /> <span className="text-[#D4AF37] tracking-normal">Recovery</span> Lab
                        </h1>
                        <p className="text-base sm:text-xl text-[#0B0D10]/60 font-medium max-w-2xl mx-auto leading-relaxed">
                            이곳은 gleemile 원장의 정밀한 조율 아래, <br />
                            당신만을 위한 단 하나의 회복 알고리즘이 탄생하는 공간입니다.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        {[
                            { icon: <Activity className="w-6 h-6" />, label: 'Active Protocols', value: '12', color: 'bg-emerald-50 text-secondary' },
                            { icon: <BrainCircuit className="w-6 h-6" />, label: 'Youniqle Accuracy', value: '99.4%', color: 'bg-blue-50 text-primary' },
                            { icon: <Zap className="w-6 h-6" />, label: 'Waitlist', value: 'Premium', color: 'bg-amber-50 text-primary' },
                        ].map((stat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-5 md:p-8 rounded-[20px] md:rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-[#0B0D10]/5 flex flex-col items-center gap-3 md:gap-4"
                            >
                                <div className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl ${stat.color}`}>{stat.icon}</div>
                                <div className="text-center">
                                    <p className="text-[8px] md:text-[10px] font-black text-[#0B0D10]/30 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-lg md:text-3xl font-black text-[#0B0D10]">{stat.value}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <Button 
                        onClick={() => setStep('FORM')}
                        className="h-16 md:h-20 px-6 sm:px-12 w-full sm:w-auto bg-[#0B0D10] hover:bg-[#1A1D23] text-white rounded-[16px] md:rounded-[24px] text-sm sm:text-base md:text-lg font-black uppercase tracking-widest group transition-all justify-center"
                    >
                        시그니처 프로토콜 설계 시작하기
                        <ChevronRight className="ml-2 sm:ml-4 w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </div>
        );
    }

    if (step === 'FORM') {
        return (
            <div className="w-full flex justify-center py-10 sm:py-20 bg-[#F9F7F2]">
                <Card className="max-w-2xl w-full mx-6 p-6 sm:p-10 md:p-16 border-none shadow-[0_40px_100px_rgba(0,0,0,0.08)] rounded-[28px] sm:rounded-[48px] bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-[#F9F7F2]">
                        <motion.div 
                            className="h-full bg-[#D4AF37]" 
                            initial={{ width: '0%' }}
                            animate={{ width: `${(formStep / 3) * 100}%` }}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {formStep === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 md:space-y-10"
                            >
                                <div className="space-y-3 md:space-y-4">
                                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Step 01 / 03</p>
                                    <h2 className="text-2xl sm:text-4xl font-black text-[#0B0D10] tracking-tighter leading-[1.1] md:leading-[1.2]">
                                        당신이 지금 <br /> 가장 해결하고 싶은 <br /> 고민은 무엇인가요?
                                    </h2>
                                </div>
                                <RadioGroup value={formData.goal} onValueChange={(v) => setFormData({ ...formData, goal: v })} className="grid grid-cols-1 gap-3 md:gap-4">
                                    {[
                                        { id: 'burnout', label: '심각한 번아웃과 의욕 저하' },
                                        { id: 'sleep', label: '수면 장애 및 만성 피로' },
                                        { id: 'focus', label: '집중력 저하와 브레인 포그' },
                                        { id: 'antiaging', label: '피부 노화 및 컨디션 관리' }
                                    ].map((item) => (
                                        <div key={item.id} className={`flex items-center space-x-3 md:space-x-4 border-2 p-4 md:p-6 rounded-[16px] md:rounded-[24px] cursor-pointer transition-all ${formData.goal === item.id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-[#0B0D10]/5'}`} onClick={() => setFormData({ ...formData, goal: item.id })}>
                                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${formData.goal === item.id ? 'bg-[#D4AF37]' : 'bg-[#0B0D10]/10'}`} />
                                            <Label className="text-sm sm:text-lg font-bold text-[#0B0D10] cursor-pointer flex-1">{item.label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                <Button className="w-full h-14 sm:h-16 bg-[#0B0D10] text-white rounded-[16px] sm:rounded-[20px] font-black text-xs sm:text-sm uppercase tracking-widest disabled:opacity-20 justify-center" disabled={!formData.goal} onClick={handleFormNext}>다음 단계로</Button>
                            </motion.div>
                        )}

                        {formStep === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 md:space-y-10"
                            >
                                <div className="space-y-3 md:space-y-4">
                                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Step 02 / 03</p>
                                    <h2 className="text-2xl sm:text-4xl font-black text-[#0B0D10] tracking-tighter leading-[1.1] md:leading-[1.2]">
                                        생활 밸런스를 <br /> 파악해볼까요?
                                    </h2>
                                </div>
                                <div className="space-y-6 md:space-y-8">
                                    <div className="space-y-3 md:space-y-4">
                                        <div className="flex justify-between items-end">
                                            <Label className="text-xs sm:text-sm font-black text-[#0B0D10] uppercase tracking-widest opacity-40">평균 스트레스 지수</Label>
                                            <span className="font-black text-[#0B0D10] text-xl sm:text-2xl">{formData.stress}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            className="w-full h-2 bg-[#F9F7F2] rounded-full appearance-none cursor-pointer accent-[#D4AF37]" 
                                            value={formData.stress} 
                                            onChange={(e) => setFormData({ ...formData, stress: e.target.value })} 
                                            aria-label="스트레스 지수 조절"
                                        />
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        <div className="flex justify-between items-end">
                                            <Label className="text-xs sm:text-sm font-black text-[#0B0D10] uppercase tracking-widest opacity-40">평균 수면 시간</Label>
                                            <span className="font-black text-[#0B0D10] text-xl sm:text-2xl">{formData.sleep}시간</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="3" 
                                            max="12" 
                                            className="w-full h-2 bg-[#F9F7F2] rounded-full appearance-none cursor-pointer accent-[#D4AF37]" 
                                            value={formData.sleep} 
                                            onChange={(e) => setFormData({ ...formData, sleep: e.target.value })} 
                                            aria-label="평균 수면 시간 조절"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 md:gap-4">
                                    <Button variant="ghost" className="h-14 sm:h-16 flex-1 rounded-[16px] sm:rounded-[20px] font-black text-[#0B0D10]/30 border border-[#0B0D10]/5 justify-center" onClick={() => setFormStep(1)}>이전</Button>
                                    <Button className="h-14 sm:h-16 flex-[2] bg-[#0B0D10] text-white rounded-[16px] sm:rounded-[20px] font-black text-xs sm:text-sm uppercase tracking-widest justify-center" onClick={handleFormNext}>다음 단계로</Button>
                                </div>
                            </motion.div>
                        )}

                        {formStep === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 md:space-y-10"
                            >
                                <div className="space-y-3 md:space-y-4">
                                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Step 03 / 03</p>
                                    <h2 className="text-2xl sm:text-4xl font-black text-[#0B0D10] tracking-tighter leading-[1.1] md:leading-[1.2]">
                                        마지막으로 <br /> 운영을 위한 정보를 <br /> 입력해주세요.
                                    </h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-3 md:space-y-4">
                                        <Label className="text-xs sm:text-sm font-black text-[#0B0D10] uppercase tracking-widest opacity-40">월 가용 예산</Label>
                                        <RadioGroup value={formData.budget} onValueChange={(v) => setFormData({ ...formData, budget: v })} className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: '30', label: '~30만원' },
                                                { id: '70', label: '30~70만원' },
                                                { id: '150', label: '70~150만원' },
                                                { id: 'vip', label: '프리미엄 무제한' }
                                            ].map((b) => (
                                                <div key={b.id} className={`p-3 sm:p-4 border-2 rounded-2xl cursor-pointer text-center font-bold text-xs sm:text-sm transition-all ${formData.budget === b.id ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]' : 'border-[#0B0D10]/5 text-[#0B0D10]/40'}`} onClick={() => setFormData({ ...formData, budget: b.id })}>
                                                    {b.label}
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        <Label className="text-xs sm:text-sm font-black text-[#0B0D10] uppercase tracking-widest opacity-40">특이 사항 (알러지, 이전 병력 등)</Label>
                                        <Input placeholder="정밀 설계에 필요한 추가 정보를 알려주세요." className="h-14 sm:h-16 rounded-[16px] sm:rounded-[20px] bg-[#F9F7F2] border-none px-4 sm:px-6" value={formData.history} onChange={(e) => setFormData({ ...formData, history: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex gap-3 md:gap-4">
                                    <Button variant="ghost" className="h-14 sm:h-16 flex-1 rounded-[16px] sm:rounded-[20px] font-black text-[#0B0D10]/30 border border-[#0B0D10]/5 justify-center" onClick={() => setFormStep(2)}>이전</Button>
                                    <Button className="h-14 sm:h-16 flex-[2] bg-[#D4AF37] text-black rounded-[16px] sm:rounded-[20px] font-black text-xs sm:text-sm uppercase tracking-widest justify-center" onClick={handleSubmitForm}>gleemile 정밀 분석 시작</Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        );
    }

    if (step === 'RESULT') {
        return (
            <div className="w-full py-10 sm:py-20 bg-[#F9F7F2] px-4 sm:px-6">
                <div className="max-w-6xl mx-auto space-y-12 md:space-y-20">
                    <div className="text-center space-y-4 md:space-y-6">
                        <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-none px-4 py-1.5 font-black uppercase tracking-widest text-[9px] md:text-[10px]">Analysis Result</Badge>
                        <h1 className="font-black text-[#0B0D10] tracking-tighter leading-tight italic text-xl md:text-4xl">
                            Private <span className="text-[#D4AF37] tracking-normal">Solutions</span> for You
                        </h1>
                        <p className="text-sm sm:text-xl text-[#0B0D10]/60 max-w-3xl mx-auto font-medium leading-relaxed">{youniqlePlans.analysis}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {Object.entries(youniqlePlans.plans).map(([key, plan]) => (
                            <Card 
                                key={plan.planId} 
                                onClick={() => setSelectedPlan(plan.planId)}
                                className={`group cursor-pointer transition-all duration-500 rounded-[28px] sm:rounded-[40px] overflow-hidden flex flex-col border-4 ${selectedPlan === plan.planId ? 'border-[#D4AF37] bg-white shadow-2xl scale-[1.02]' : 'border-transparent bg-white/50 hover:border-[#D4AF37]/20 shadow-sm'}`}
                            >
                                <div className={`p-6 sm:p-10 space-y-4 sm:space-y-6 ${key === 'planC' ? 'bg-[#D4AF37]/5' : ''}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Protocol {key.slice(-1)}</span>
                                        <Badge className="bg-white border-[#0B0D10]/5 text-[#0B0D10]/40 text-[9px] px-3">{plan.duration}</Badge>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-[#0B0D10] leading-tight tracking-tighter">{plan.title}</h3>
                                    <p className="text-xs font-medium text-[#0B0D10]/50 leading-relaxed min-h-[40px]">{plan.description}</p>
                                </div>
                                <CardContent className="p-6 sm:p-10 space-y-6 sm:space-y-10 flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div className="bg-[#F9F7F2] rounded-2xl p-3 sm:p-4">
                                            <p className="text-[8px] sm:text-[9px] font-black text-[#0B0D10]/20 uppercase tracking-widest mb-1">Estimate</p>
                                            <p className="text-xs sm:text-sm font-black text-[#0B0D10] tracking-tight">{plan.priceEstimate}</p>
                                        </div>
                                        <div className="bg-[#F9F7F2] rounded-2xl p-3 sm:p-4">
                                            <p className="text-[8px] sm:text-[9px] font-black text-[#0B0D10]/20 uppercase tracking-widest mb-1">Focus</p>
                                            <p className="text-xs sm:text-sm font-black text-[#0B0D10] tracking-tight">{plan.focusArea}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] flex items-center gap-2">
                                            <ScrollText className="w-3 h-3" /> Daily Protocol
                                        </p>
                                        <ul className="space-y-3 sm:space-y-4">
                                            {plan.routine.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                                                    <span className="text-xs sm:text-sm font-bold text-[#0B0D10]/70 leading-tight">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className={`mt-auto pt-4 md:pt-8 flex justify-center transition-all ${selectedPlan === plan.planId ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0B0D10] text-white flex items-center justify-center shadow-lg">
                                            <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex flex-col items-center gap-4 sm:gap-6 pt-4">
                        <Button 
                            onClick={handleSubmitSelection}
                            disabled={!selectedPlan}
                            className="h-16 sm:h-20 px-8 sm:px-20 bg-[#0B0D10] text-white rounded-[16px] sm:rounded-[24px] font-black text-base sm:text-xl uppercase tracking-widest shadow-2xl transition-all hover:scale-105 disabled:opacity-20 w-full sm:w-auto justify-center"
                        >
                            컨시어지 상담 신청하기
                        </Button>
                        <p className="text-[9px] sm:text-[10px] font-black text-[#0B0D10]/30 uppercase tracking-[0.3em]">* 최종 상담 후 프로그램이 확정됩니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'SUBMITTED') {
        return (
            <div className="w-full min-h-[500px] sm:h-[600px] flex flex-col items-center justify-center text-center p-6 bg-[#F9F7F2]">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-[24px] sm:rounded-[40px] flex items-center justify-center shadow-2xl mb-8 sm:mb-10 border-4 border-[#D4AF37]/20">
                    <ShieldCheck className="w-8 h-8 sm:w-12 sm:h-12 text-[#D4AF37]" />
                </div>
                <div className="space-y-4 sm:space-y-6">
                    <h2 className="font-black text-[#0B0D10] tracking-tighter leading-none italic text-2xl sm:text-4xl md:text-4xl">
                        Protocol <span className="text-[#D4AF37] tracking-normal">Accepted.</span>
                    </h2>
                    <p className="text-base sm:text-xl text-[#0B0D10]/40 font-medium max-w-xl mx-auto leading-relaxed">
                        신청이 성공적으로 접수되었습니다. <br />
                        24시간 이내에 원장 전담 팀에서 <br />
                        <span className="text-[#D4AF37]">당신만을 위한 초대장</span>을 발송합니다.
                    </p>
                </div>
                <Button onClick={() => setStep('MAIN')} variant="ghost" className="mt-8 sm:mt-12 font-black text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-all justify-center">설계 다시 하기</Button>
            </div>
        );
    }

    return null;
}
