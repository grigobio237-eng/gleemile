/**
 * Cognitive ACWR (Acute:Chronic Workload Ratio) 계산 유틸리티
 * 
 * - EWMA (지수 가중 이동 평균) 기반
 * - Acute (급성, 7일): lambda = 0.25
 * - Chronic (만성, 28일): lambda = 0.07
 */

export interface ACWRResult {
  acuteLoad: number;         // Acute EWMA
  chronicLoad: number;       // Chronic EWMA
  acwr: number;              // Acute / Chronic
  zone: 'undertrained' | 'optimal' | 'caution' | 'danger';
  zoneLabel: string;
  zoneColor: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  dailyLoads: { date: string; load: number }[];
}

export interface LoadEntry {
  date: string;
  load: number;
}

/**
 * EWMA 기반 ACWR 계산
 * @param loads - 과거부터 오늘까지의 일별 인지 부하 데이터
 * @returns ACWRResult
 */
export function calculateACWR(loads: LoadEntry[]): ACWRResult {
  // 날짜순 정렬 (오래된 순)
  const sorted = [...loads].sort((a, b) => a.date.localeCompare(b.date));

  let acl = 0;
  let ccl = 0;
  const lambdaAcute = 0.25;
  const lambdaChronic = 0.07;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (i === 0) {
        acl = entry.load;
        ccl = entry.load;
    } else {
        acl = lambdaAcute * entry.load + (1 - lambdaAcute) * acl;
        ccl = lambdaChronic * entry.load + (1 - lambdaChronic) * ccl;
    }
  }

  // ACWR 계산
  const acwr = ccl > 0 ? Math.round((acl / ccl) * 100) / 100 : 0;

  // 존 판별
  let zone: ACWRResult['zone'];
  let zoneLabel: string;
  let zoneColor: string;

  if (acwr < 0.8) {
    zone = 'undertrained';
    zoneLabel = '조직 소외 및 참여 동기 고갈 단계';
    zoneColor = '#3B82F6'; // blue
  } else if (acwr <= 1.3) {
    zone = 'optimal';
    zoneLabel = '최적 몰입 및 안전성 확립 단계';
    zoneColor = '#22C55E'; // green
  } else if (acwr <= 1.5) {
    zone = 'caution';
    zoneLabel = '과밀 소통 및 주의 요망 단계';
    zoneColor = '#F59E0B'; // yellow
  } else {
    zone = 'danger';
    zoneLabel = '심각한 인지적 번아웃 및 이탈 임박 단계';
    zoneColor = '#EF4444'; // red
  }

  // 트렌드 계산 (어제 대비 오늘 급성 부하 증감)
  let previousAcl = 0;
  if (sorted.length > 1) {
    let tempAcl = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
        if (i === 0) tempAcl = sorted[i].load;
        else tempAcl = lambdaAcute * sorted[i].load + (1 - lambdaAcute) * tempAcl;
    }
    previousAcl = tempAcl;
  }

  let trend: ACWRResult['trend'] = 'stable';
  if (acl > previousAcl * 1.05) {
    trend = 'increasing';
  } else if (acl < previousAcl * 0.95) {
    trend = 'decreasing';
  }

  // 일별 부하 차트 데이터 (최근 28일만 추출)
  const today = new Date();
  const dailyLoads = sorted.filter((e) => {
    const entryDate = new Date(e.date);
    const diffDays = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 28;
  });

  return {
    acuteLoad: Math.round(acl * 10) / 10,
    chronicLoad: Math.round(ccl * 10) / 10,
    acwr,
    zone,
    zoneLabel,
    zoneColor,
    trend,
    dailyLoads,
  };
}

/**
 * Mental Strain Index 기반 신호등 색상 반환
 * 1.0 ~ 2.0: 🟢 Green (최상)
 * 2.1 ~ 3.5: 🟡 Yellow (보통)
 * 3.6 ~ 5.0: 🔴 Red (위험)
 */
export function getWellnessTrafficLight(score: number): {
  color: 'green' | 'yellow' | 'red';
  label: string;
  emoji: string;
} {
  if (score <= 2.0) {
    return { color: 'green', label: '최상', emoji: '🟢' };
  } else if (score <= 3.5) {
    return { color: 'yellow', label: '보통', emoji: '🟡' };
  } else {
    return { color: 'red', label: '위험', emoji: '🔴' };
  }
}

/**
 * 날짜 포맷 유틸리티 (YYYY-MM-DD)
 */
export function getKSTDateString(date?: Date): string {
  const d = date || new Date();
  // 9시간 더해서 KST로 변환 (서버가 UTC일 경우)
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 60000 * 60));
  
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
