import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Firebase Admin 초기화
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export async function POST(req: Request) {
  try {
    const { title, body, url, targetUserIds } = await req.json();

    if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No target users provided' }, { status: 400 });
    }

    const db = admin.firestore();
    let tokens: string[] = [];

    // 타겟 유저들의 FCM 토큰 수집 (최대 500개씩 청크 처리가 필요할 수 있으나 MVP에서는 단순 처리)
    for (const userId of targetUserIds) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (data?.fcmTokens && Array.isArray(data.fcmTokens)) {
          tokens.push(...data.fcmTokens);
        }
      }
    }

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No valid tokens found' });
    }

    const message = {
      notification: {
        title: title || '새로운 알림',
        body: body || '새로운 메시지가 도착했습니다.',
      },
      data: {
        url: url || '/',
        click_action: url || '/',
      },
      tokens: [...new Set(tokens)], // 중복 제거
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // 실패한 토큰 정리 (선택 사항이나 권장)
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log('Failed tokens:', failedTokens);
      // 향후 유저 문서에서 failedTokens를 arrayRemove하는 배치 로직 추가 가능
    }

    return NextResponse.json({ success: true, successCount: response.successCount });
  } catch (error: any) {
    console.error('FCM Send Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
