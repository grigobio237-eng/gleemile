import { NextResponse } from 'next/server';
import { paymentService } from '@/services/payment';
import admin from 'firebase-admin';

// Firebase Admin 초기화 (Webhook에서는 서버 사이드 Admin 권한으로 DB 업데이트)
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
    const body = await req.json();

    // 1. Webhook 검증 로직 (포트원 Signature 검증 또는 단건 조회)
    const isValid = await paymentService.validateWebhook(body);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature or payload' }, { status: 400 });
    }

    const { paymentId, orderId, status, customData } = body;
    // customData 등을 통해 teamId를 넘겨받았다고 가정
    // 실제 결제 요청 시 orderId 포맷이나 customData 안에 식별자를 넣어둡니다.
    // 예시: customData: { teamId: "BWngdW..." }
    const teamId = customData?.teamId || 'unknown';

    const db = admin.firestore();

    // 2. 예약금 결제 완료 건 처리 (noshow_bookings)
    if (status === 'PAID') {
      // orderId 기반으로 예약 찾기 (혹은 문서 ID를 orderId로 사용했다면 직접 접근)
      const bookingQuery = await db.collection(`teams/${teamId}/noshow_bookings`)
        .where('paymentLinkUrl', '>=', '') // 간단한 예시 - 실제로는 orderId 필드 저장 필요 
        .get();

      // [Mock] Webhook 핸들링에서는 payload로 전달받은 orderId 문서를 찾아 업데이트합니다.
      // orderId 기반으로 문서를 찾아 status 업데이트
      const docs = await db.collection(`teams/${teamId}/noshow_bookings`).where('orderId', '==', orderId).get();
      
      if (!docs.empty) {
        const docRef = docs.docs[0].ref;
        await docRef.update({
          status: 'paid',
          paymentId: paymentId || 'mock_pay_id',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[Webhook] Updated booking ${docRef.id} to paid`);
      } else {
        // 예약금 외 구독 결제(merchant_profile) 등 다른 결제건일 수도 있음
        console.log(`[Webhook] No booking found for orderId: ${orderId}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
