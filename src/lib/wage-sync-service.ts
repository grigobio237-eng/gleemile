"use server";

import { adminDb } from '@/lib/firebase-admin';

const FALLBACK_MINIMUM_WAGE = 10030; // 2026 기본 하드코딩 값

interface MinimumWageDoc {
  year: number;
  hourly_wage: number;
  updated_at: string;
  last_sync_status: "SUCCESS" | "FAILED";
}

interface SyncMetaDoc {
  nextSyncDate: string;
}

/**
 * 외부 API (data.go.kr 등)에서 최저임금 데이터를 가져오는 함수 (또는 Mock)
 */
async function fetchWageFromAPI(year: number): Promise<number> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  
  // API 키가 없으면 안전하게 Fallback 모드로 동작
  if (!apiKey || apiKey.trim() === '') {
    console.log(`[WageSyncService] API Key not found. Using Mock data for ${year}.`);
    // Mock 로직 (2026년 이후 매년 300원씩 올랐다고 가정하는 등)
    if (year === 2026) return 10030;
    if (year === 2027) return 10330;
    return FALLBACK_MINIMUM_WAGE;
  }

  try {
    // 실제 API 호출 로직 (API 스펙 확정 전이므로 표준 Fetch 템플릿 작성)
    // const url = `https://api.data.go.kr/...&serviceKey=${apiKey}&year=${year}`;
    // const response = await fetch(url);
    // const data = await response.json();
    // return 추출된_시급;
    
    // API 연결 전까지 Mock 리턴
    return year === 2026 ? 10030 : FALLBACK_MINIMUM_WAGE;
  } catch (error) {
    console.error('[WageSyncService] API fetch failed:', error);
    throw new Error('API_FETCH_FAILED');
  }
}

/**
 * 1. 연도별 최저시급 DB 동기화
 */
export async function syncMinimumWage(year?: number) {
  const targetYear = year || new Date().getFullYear();
  let fetchedWage = FALLBACK_MINIMUM_WAGE;
  let status: "SUCCESS" | "FAILED" = "SUCCESS";

  try {
    fetchedWage = await fetchWageFromAPI(targetYear);
  } catch (error) {
    status = "FAILED";
    console.error(`[WageSyncService] Failed to fetch wage for ${targetYear}`);
  }

  try {
    const db = adminDb();
    const batch = db.batch();

    // 1) 연도별 최저시급 문서 Upsert
    const wageDocRef = db.collection('system_config').doc('minimum_wages').collection('years').doc(targetYear.toString());
    
    const wageData: MinimumWageDoc = {
      year: targetYear,
      hourly_wage: fetchedWage,
      updated_at: new Date().toISOString(),
      last_sync_status: status
    };
    
    // 이미 존재하는지 확인 후 병합 (Upsert)
    batch.set(wageDocRef, wageData, { merge: true });

    // 2) Sync 메타데이터 (다음 동기화 일정) 갱신
    const metaDocRef = db.collection('system_config').doc('minimum_wages');
    const now = new Date();
    
    let nextDate = new Date();
    if (status === 'SUCCESS') {
      // 성공 시 1개월 뒤 재시도
      nextDate.setMonth(now.getMonth() + 1);
    } else {
      // 실패 시 7일 뒤 재시도
      nextDate.setDate(now.getDate() + 7);
    }

    batch.set(metaDocRef, { nextSyncDate: nextDate.toISOString() }, { merge: true });

    await batch.commit();
    return { success: true, status, nextSyncDate: nextDate.toISOString() };
  } catch (error: any) {
    console.error('[WageSyncService] Firestore Sync Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 2. 현재 최저시급 조회 (Form 마운트 시 사용)
 */
export async function getLatestMinimumWage(year?: number): Promise<number> {
  const targetYear = year || new Date().getFullYear();

  try {
    const db = adminDb();
    const doc = await db.collection('system_config').doc('minimum_wages').collection('years').doc(targetYear.toString()).get();

    if (doc.exists) {
      const data = doc.data() as MinimumWageDoc;
      if (data && data.hourly_wage) {
        return data.hourly_wage;
      }
    }
    
    // DB에 데이터가 없으면 Fallback
    console.warn(`[WageSyncService] No DB data for ${targetYear}. Using Fallback.`);
    return FALLBACK_MINIMUM_WAGE;
  } catch (error) {
    console.error('[WageSyncService] getLatestMinimumWage Error:', error);
    // 조회 실패 시 무조건 Fallback 리턴 (에러 방지)
    return FALLBACK_MINIMUM_WAGE;
  }
}
