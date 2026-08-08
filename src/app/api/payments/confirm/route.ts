export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NoShowBooking } from '@/types/merchant';

export async function POST(req: Request) {
  try {
    const { paymentKey, orderId, amount, teamId, paymentId } = await req.json();

    if (!paymentKey || !orderId || !amount || !teamId || !paymentId) {
      return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Firebase에서 주문 정보 확인
    const bookingRef = doc(db, `teams/${teamId}/noshow_bookings`, paymentId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingSnap.data() as NoShowBooking & { orderId: string };

    if (booking.orderId !== orderId) {
      return NextResponse.json({ message: 'Order ID mismatch' }, { status: 400 });
    }

    if (String(booking.depositAmount) !== String(amount)) {
      return NextResponse.json({ message: 'Amount mismatch' }, { status: 400 });
    }

    if (booking.status === 'paid') {
      return NextResponse.json({ message: 'Already paid' }, { status: 200 });
    }

    // 2. 토스페이먼츠 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      console.error('TOSS_SECRET_KEY is not defined');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    // Basic auth header (secretKey + ':')
    const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString('base64');

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encryptedSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Toss Payments Error:', data);
      return NextResponse.json({ message: data.message || 'Payment confirmation failed' }, { status: response.status });
    }

    // 3. 결제 승인 완료 후 DB 업데이트
    await updateDoc(bookingRef, {
      status: 'paid',
      paidAt: new Date(),
    });

    // 향후 카카오 알림톡 전송(결제 완료 안내) 로직 추가 가능

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Payment confirm error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
