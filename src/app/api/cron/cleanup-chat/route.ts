import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export async function GET(req: Request) {
  try {
    // 1. CRON_SECRET 보안 검증 (헤더 검증 또는 쿼리스트링 수동 검증)
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    
    const isValidCron = 
      authHeader === `Bearer ${process.env.CRON_SECRET}` || 
      key === process.env.CRON_SECRET;

    if (!isValidCron) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. 만료 기준 계산 (30일 이전)
    const thirtyDaysAgoMs = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const expireTimestamp = admin.firestore.Timestamp.fromMillis(thirtyDaysAgoMs);

    // 3. 메시지 컬렉션 쿼리 (단일 인덱스만으로 효율적 조회를 위해 createdAt만 필터링 후 서버 메모리에서 걸러냄)
    // limit(500)으로 Vercel Timeout(최대 10초~60초) 방어벽 구축
    const messagesRef = adminDb.collectionGroup('messages');
    const snapshot = await messagesRef
      .where('createdAt', '<', expireTimestamp)
      .orderBy('createdAt', 'asc')
      .limit(500)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No expired messages found.', count: 0 });
    }

    let processedCount = 0;
    let deletedMediaCount = 0;
    let bypassedCount = 0;

    // 타임아웃 방지 및 데이터 일관성을 위한 배치 쓰기 트랜잭션
    const batch = adminDb.batch();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
    const bucket = adminStorage.bucket(bucketName);

    // 팀 멤버십 등급 조회 최적화를 위한 캐싱 Map
    const teamTierCache = new Map<string, string>();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // ⚠️ 텍스트 대화 영구 보존 원칙 (미디어 파일이 없는 경우, 또는 이미 만료 처리된 경우 패스)
      if (!data.attachmentUrl || data.attachmentUrl === 'expired') {
        continue;
      }

      // 문서 경로 파싱 (teams/{teamId}/messages/{messageId})
      const pathSegments = doc.ref.path.split('/');
      const teamIdIndex = pathSegments.indexOf('teams');
      
      if (teamIdIndex === -1) continue; // 올바르지 않은 경로 방어
      const teamId = pathSegments[teamIdIndex + 1] as string;
      if (!teamId) continue; // 타입 가드

      // 4. 멤버십 확장성 (BLACK 등급 Bypass)
      let teamTier = teamTierCache.get(teamId);
      if (!teamTier) {
        const teamDoc = await adminDb.collection('teams').doc(teamId).get();
        teamTier = (teamDoc.data()?.tier as string) || 'START'; // 기본값 START
        teamTierCache.set(teamId, teamTier as string);
      }

      if (teamTier === 'BLACK') {
        bypassedCount++;
        continue;
      }

      // 5. Firebase Storage 미디어 파일 삭제
      try {
        // 정규식을 통한 다운로드 URL에서 Storage Object Path 추출
        const urlMatch = data.attachmentUrl.match(/o\/(.+?)\?/);
        if (urlMatch && urlMatch[1]) {
          const filePath = decodeURIComponent(urlMatch[1]);
          await bucket.file(filePath).delete();
          deletedMediaCount++;
        }
      } catch (storageErr: any) {
        // 이미 파일이 지워졌을 경우(404 에러) 앱 크래시 방어
        if (storageErr.code !== 404) {
          console.error(`[Storage Deletion Failed] Doc ID: ${doc.id}`, storageErr);
        }
      }

      // 6. 하이브리드 원자적 업데이트 (텍스트는 교체하고 문서는 살림)
      batch.update(doc.ref, {
        attachmentUrl: 'expired',
        content: '기간이 만료된 미디어 파일입니다'
      });
      processedCount++;
    }

    // 최종 배치 집행
    if (processedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      message: 'Hybrid cleanup executed successfully',
      processedCount,
      deletedMediaCount,
      bypassedCount,
      totalScanned: snapshot.size
    });

  } catch (error) {
    console.error('CRON Cleanup Failed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
