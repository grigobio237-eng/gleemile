"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  calculateMonthlySalary, 
  calculateWeeklyHolidayAllowance, 
  calculateWeeklyHours, 
  isAboveMinimumWage, 
  MINIMUM_WAGE 
} from '@/lib/labor-calculator';
import dynamic from 'next/dynamic';
import { createLaborContract } from '@/lib/labor-service';
import { getLatestMinimumWage } from '@/lib/wage-sync-service';

const SignaturePadModal = dynamic(() => import('@/components/labor-shield/signature-pad-modal'), { ssr: false });


// 동적 계약서 스키마 생성기 (최저시급 반영)
const getContractSchema = (minWage: number) => z.object({
  employerName: z.string().min(2, '사업주(회사)명을 입력해주세요'),
  employerAddress: z.string().min(2, '사업장 주소를 입력해주세요'),
  employeeName: z.string().min(2, '근로자 이름을 입력해주세요'),
  employeePhone: z.string().min(10, '연락처를 정확히 입력해주세요'),
  startDate: z.string().min(2, '시작일을 입력해주세요'),
  endDate: z.string().optional(),
  workPlace: z.string().min(2, '근무 장소를 입력해주세요'),
  workDescription: z.string().min(2, '업무 내용을 입력해주세요'),
  contractType: z.enum(['FULL_TIME', 'PART_TIME']),
  hourlyWage: z.coerce.number().min(minWage, `최저시급(${minWage.toLocaleString()}원) 이상이어야 합니다.`),
  hoursPerDay: z.coerce.number().min(1).max(12),
  workDays: z.coerce.number().min(1).max(7),
  workDaysStr: z.string().min(1, '근무 요일을 입력해주세요 (예: 월,수,금)'),
  workHoursStr: z.string().min(1, '근무 시간을 입력해주세요 (예: 09:00~18:00)'),
  restHoursStr: z.string().min(1, '휴게 시간을 입력해주세요 (예: 12:00~13:00)'),
});

type ContractFormValues = z.infer<ReturnType<typeof getContractSchema>>;

export default function ContractForm() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formDataCache, setFormDataCache] = useState<ContractFormValues | null>(null);
  
  // 동적 최저시급 상태 (로딩 실패 시 Fallback 적용)
  const [dynamicMinWage, setDynamicMinWage] = useState(MINIMUM_WAGE);
  const [isWageLoading, setIsWageLoading] = useState(true);

  // 동적 스키마
  const contractSchema = useMemo(() => getContractSchema(dynamicMinWage), [dynamicMinWage]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    mode: 'onChange',
    defaultValues: {
      employerName: '',
      employerAddress: '',
      employeeName: '',
      employeePhone: '',
      startDate: new Date().toISOString().split('T')[0], // 오늘 날짜 
      workPlace: '',
      workDescription: '',
      contractType: 'PART_TIME',
      hourlyWage: MINIMUM_WAGE, // Fallback 초기값, 이후 useEffect에서 갱신됨
      hoursPerDay: 4,
      workDays: 5,
      workDaysStr: '월, 화, 수, 목, 금',
      workHoursStr: '09:00 ~ 18:00',
      restHoursStr: '12:00 ~ 13:00'
    }
  });

  // DB(Firestore)에서 최신 시급 불러오기
  useEffect(() => {
    async function fetchWage() {
      try {
        const wage = await getLatestMinimumWage();
        setDynamicMinWage(wage);
        // DB 최저시급이 Fallback과 다르다면 폼 초기값도 리셋 (비동기 로딩 완료 시점)
        if (wage !== MINIMUM_WAGE) {
          reset((formValues) => ({
            ...formValues,
            hourlyWage: Math.max(formValues.hourlyWage, wage)
          }));
        }
      } catch (e) {
        console.error("Failed to load min wage", e);
      } finally {
        setIsWageLoading(false);
      }
    }
    fetchWage();
  }, [reset]);

  // 실시간 값 관찰
  const hourlyWage = watch('hourlyWage');
  const hoursPerDay = watch('hoursPerDay');
  const workDays = watch('workDays');

  // 실시간 계산
  const metrics = useMemo(() => {
    const weeklyHours = calculateWeeklyHours(hoursPerDay || 0, workDays || 0);
    const weeklyHoliday = calculateWeeklyHolidayAllowance(weeklyHours, hourlyWage || 0);
    const monthlySalary = calculateMonthlySalary(weeklyHours, weeklyHoliday, hourlyWage || 0);
    const isMinWageOk = isAboveMinimumWage(hourlyWage || 0, dynamicMinWage);

    return { weeklyHours, weeklyHoliday, monthlySalary, isMinWageOk };
  }, [hourlyWage, hoursPerDay, workDays, dynamicMinWage]);

  const onSubmitForm = (data: ContractFormValues) => {
    // 폼이 유효하면 서명 모달을 띄운다
    setFormDataCache(data);
    setIsModalOpen(true);
  };

  const handleEmployerSignature = async (signatureDataUrl: string) => {
    if (!formDataCache) return;
    setIsSubmitting(true);
    
    try {
      const contractData = {
        ...formDataCache,
        workDays: formDataCache.workDaysStr,
        workHours: formDataCache.workHoursStr,
        restHours: formDataCache.restHoursStr,
        weeklyHours: metrics.weeklyHours,
        weeklyHolidayAllowance: metrics.weeklyHoliday
      };

      const result = await createLaborContract(teamId, contractData, signatureDataUrl);

      if (result.success) {
        toast.success('계약서가 성공적으로 생성 및 발송되었습니다.');
        router.push(`/mile/${teamId}/labor-shield`);
      } else {
        toast.error(`계약서 생성 실패: ${result.error}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('서버 통신 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center justify-between">
            <span>전자근로계약서 및 급여 산정기</span>
            {isWageLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">사업주 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>사업주(회사)명</Label>
                  <Input placeholder="(주)글리마일" {...register('employerName')} />
                  {errors.employerName && <p className="text-xs text-red-500">{errors.employerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>사업장 주소</Label>
                  <Input placeholder="서울시 강남구..." {...register('employerAddress')} />
                  {errors.employerAddress && <p className="text-xs text-red-500">{errors.employerAddress.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">근로자 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>근로자 성명</Label>
                  <Input placeholder="홍길동" {...register('employeeName')} />
                  {errors.employeeName && <p className="text-xs text-red-500">{errors.employeeName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>연락처 (SMS 발송용)</Label>
                  <Input placeholder="010-1234-5678" {...register('employeePhone')} />
                  {errors.employeePhone && <p className="text-xs text-red-500">{errors.employeePhone.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">근로 조건</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>근무 시작일</Label>
                  <Input type="date" {...register('startDate')} />
                  {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>근무 종료일 (옵션)</Label>
                  <Input type="date" {...register('endDate')} />
                </div>
                <div className="space-y-2">
                  <Label>근무 장소</Label>
                  <Input placeholder="본사 1층" {...register('workPlace')} />
                </div>
                <div className="space-y-2">
                  <Label>업무 내용</Label>
                  <Input placeholder="서빙 및 매장관리" {...register('workDescription')} />
                </div>
                <div className="space-y-2">
                  <Label>근무 요일 (텍스트)</Label>
                  <Input placeholder="월, 수, 금" {...register('workDaysStr')} />
                </div>
                <div className="space-y-2">
                  <Label>근무 시간 (텍스트)</Label>
                  <Input placeholder="09:00 ~ 18:00" {...register('workHoursStr')} />
                </div>
                <div className="space-y-2">
                  <Label>휴게 시간 (텍스트)</Label>
                  <Input placeholder="12:00 ~ 13:00" {...register('restHoursStr')} />
                </div>
                <div className="space-y-2">
                  <Label>근로 형태</Label>
                  <Controller
                    control={control}
                    name="contractType"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="형태 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PART_TIME">단시간 근로자 (알바)</SelectItem>
                          <SelectItem value="FULL_TIME">통상 근로자 (정규직)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-slate-50 rounded-lg border">
                <div className="col-span-3 mb-2 flex items-center justify-between">
                  <Label className="text-blue-600 font-bold flex items-center gap-2">
                    급여 자동 산정기
                  </Label>
                  <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                    올해 법정 최저시급: {dynamicMinWage.toLocaleString()}원
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>시급 (원)</Label>
                  <Input type="number" {...register('hourlyWage')} />
                  {errors.hourlyWage && <p className="text-xs text-red-500">{errors.hourlyWage.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>1일 근로 (시간)</Label>
                  <Input type="number" {...register('hoursPerDay')} />
                  {errors.hoursPerDay && <p className="text-xs text-red-500">{errors.hoursPerDay.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>1주 근무 (일)</Label>
                  <Input type="number" {...register('workDays')} />
                  {errors.workDays && <p className="text-xs text-red-500">{errors.workDays.message}</p>}
                </div>
              </div>
            </div>

            {/* 노무 가이드 피드백 영역 */}
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3 mt-6">
              <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                실시간 급여 산정 결과
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center bg-white p-3 rounded border">
                  <span className="text-slate-500">주 근로시간</span>
                  <span className="font-bold">{metrics.weeklyHours} 시간</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded border">
                  <span className="text-slate-500">주휴수당 (주)</span>
                  <span className="font-bold text-blue-600">
                    {metrics.weeklyHoliday > 0 ? `${metrics.weeklyHoliday.toLocaleString()} 원` : '미발생 (15시간 미만)'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-4 rounded-lg mt-2">
                <span className="text-emerald-900 font-medium">예상 월급 (주휴포함)</span>
                <span className="font-bold text-2xl text-emerald-600">{metrics.monthlySalary.toLocaleString()} 원</span>
              </div>

              {!metrics.isMinWageOk && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">
                    입력하신 시급이 법정 최저시급({dynamicMinWage.toLocaleString()}원)에 미달합니다!
                  </AlertDescription>
                </Alert>
              )}
              {metrics.weeklyHours >= 15 && metrics.weeklyHoliday > 0 && (
                <Alert className="py-2 bg-blue-50 border-blue-100">
                  <AlertDescription className="text-xs text-blue-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 주 15시간 이상 근무로 주휴수당 발생 대상입니다.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button type="submit" disabled={!isValid || isSubmitting || isWageLoading} className="w-full" size="lg">
              {isSubmitting || isWageLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {isSubmitting ? '계약서 생성 및 발송 중...' : '계약서 생성 및 서명 발송'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <SignaturePadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleEmployerSignature}
        title="사업주 서명"
        description="전자근로계약서에 첨부될 사업주(대표)님의 서명을 입력해 주세요."
      />
    </>
  );
}
