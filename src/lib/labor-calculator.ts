/**
 * Gleemile Labor-Shield Calculator
 * 근로계약서 작성 및 규제 방어용 노무 계산 유틸리티
 */

// 2025/2026년 최저임금 (변동 가능성이 있으므로 상수로 분리)
export const MINIMUM_WAGE = 10030;

/**
 * 최저시급 준수 여부 검증
 * @param hourlyWage 시급
 * @param currentMinWage 현재 연도 최저시급 (기본값 FALLBACK)
 * @returns boolean 준수 여부
 */
export function isAboveMinimumWage(hourlyWage: number, currentMinWage: number = MINIMUM_WAGE): boolean {
  return hourlyWage >= currentMinWage;
}

/**
 * 주 소정근로시간 계산
 * @param hoursPerDay 일 소정근로시간
 * @param workDays 주 근무일수
 * @returns 주 소정근로시간
 */
export function calculateWeeklyHours(hoursPerDay: number, workDays: number): number {
  return hoursPerDay * workDays;
}

/**
 * 주휴수당 자동 계산
 * 주 15시간 이상 근무 시: (주간 소정근로시간 / 40) * 8 * 시급
 * 주 15시간 미만 근무 시: 0원
 * @param weeklyHours 주 소정근로시간
 * @param hourlyWage 시급
 * @returns 주휴수당 (원)
 */
export function calculateWeeklyHolidayAllowance(weeklyHours: number, hourlyWage: number): number {
  if (weeklyHours < 15) {
    return 0;
  }
  // 최대 주 40시간까지만 주휴수당 산정에 포함
  const cappedHours = Math.min(weeklyHours, 40);
  return Math.floor((cappedHours / 40) * 8 * hourlyWage);
}

/**
 * 예상 월급 산정
 * 1달 평균 주 수: 4.345주 적용
 * @param weeklyHours 주 소정근로시간
 * @param weeklyHolidayAllowance 주휴수당
 * @param hourlyWage 시급
 * @returns 예상 월급 (원)
 */
export function calculateMonthlySalary(
  weeklyHours: number,
  weeklyHolidayAllowance: number,
  hourlyWage: number
): number {
  const AVG_WEEKS_PER_MONTH = 4.345;
  
  const monthlyBasicSalary = weeklyHours * hourlyWage * AVG_WEEKS_PER_MONTH;
  const monthlyHolidayAllowance = weeklyHolidayAllowance * AVG_WEEKS_PER_MONTH;
  
  return Math.floor(monthlyBasicSalary + monthlyHolidayAllowance);
}
