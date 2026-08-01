import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { syncMinimumWage } from '@/lib/wage-sync-service';

export async function GET(req: Request) {
  try {
    // 1. CRON_SECRET 보안 검증 (헤더 검증 또는 쿼리스트링 수동 검증)
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    
    // 환경 변수에 CRON_SECRET이 설정되어 있다면 검증, 개발 환경을 위해 느슨하게 허용 가능
    if (process.env.CRON_SECRET) {
      const isValidCron = 
        authHeader === `Bearer ${process.env.CRON_SECRET}` || 
        key === process.env.CRON_SECRET;

      if (!isValidCron) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    // 2. 스케줄링 메타데이터 조회
    const db = adminDb();
    const metaDoc = await db.collection('system_config').doc('minimum_wages').get();
    
    const now = new Date();
    let shouldSync = true;

    if (metaDoc.exists) {
      const data = metaDoc.data();
      if (data?.nextSyncDate) {
        const nextDate = new Date(data.nextSyncDate);
        if (now < nextDate) {
          shouldSync = false;
        }
      }
    }

    if (!shouldSync) {
      return NextResponse.json({ 
        message: 'Sync not required yet.', 
        nextSyncDate: metaDoc.data()?.nextSyncDate 
      });
    }

    // 3. 동기화 실행 (올해 년도 기준)
    const currentYear = now.getFullYear();
    const result = await syncMinimumWage(currentYear);

    // 내년도 11~12월 즈음에는 내년도 시급도 같이 동기화하는 로직 추가 가능 (우선 올해만 진행)
    // if (now.getMonth() >= 10) { await syncMinimumWage(currentYear + 1); }

    return NextResponse.json({
      message: 'Minimum wage sync executed',
      result
    });

  } catch (error: any) {
    console.error('CRON Wage Sync Failed:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
