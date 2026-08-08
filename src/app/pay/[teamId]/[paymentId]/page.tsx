export const runtime = 'edge';
import React from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NoShowBooking } from '@/types/merchant';
import TossPaymentWidget from '@/components/payments/TossPaymentWidget';

export const metadata = {
  title: '결제하기 | Gleemile',
};

export default async function PaymentPage({ params }: { params: Promise<{ teamId: string; paymentId: string }> }) {
  const { teamId, paymentId } = await params;
  
  const ref = doc(db, `teams/${teamId}/noshow_bookings`, paymentId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full">
          <p className="font-bold text-slate-800 text-lg mb-2">결제 정보를 찾을 수 없습니다.</p>
          <p className="text-sm text-slate-500">잘못된 링크이거나 만료된 청구서일 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const booking = snap.data() as NoShowBooking & { orderId: string };
  
  if (booking.status === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-600 text-xl font-black">✓</span>
          </div>
          <p className="font-bold text-slate-800 text-lg mb-2">이미 결제가 완료되었습니다.</p>
          <p className="text-sm text-slate-500">감사합니다.</p>
        </div>
      </div>
    );
  }

  // 만료 시간 체크
  const expiresAt = booking.expiresAt as any;
  if (expiresAt && (expiresAt.seconds ? new Date(expiresAt.seconds * 1000) : new Date(expiresAt)) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full">
          <p className="font-bold text-slate-800 text-lg mb-2">결제 기한이 만료되었습니다.</p>
          <p className="text-sm text-slate-500">매장에 문의하여 새로운 링크를 발급받아 주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-20">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[auto] sm:my-10 sm:rounded-3xl sm:shadow-xl sm:border border-slate-100 overflow-hidden flex flex-col">
        
        {/* 헤더 */}
        <div className="px-6 py-8 bg-slate-800 text-white text-center rounded-b-[2.5rem] relative">
          <p className="text-slate-300 text-sm font-medium mb-1">Gleemile 예약금 결제</p>
          <h1 className="text-3xl font-black">{booking.depositAmount.toLocaleString()}원</h1>
          <p className="text-slate-400 text-sm mt-3">{booking.serviceName} 예약금</p>
        </div>

        {/* 결제 위젯 */}
        <div className="flex-1 p-4 mt-2">
          <TossPaymentWidget 
            clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!}
            customerKey={paymentId} 
            amount={booking.depositAmount}
            orderId={booking.orderId}
            orderName={`${booking.serviceName} 예약금`}
            customerName={booking.clientName}
            teamId={teamId}
            paymentId={paymentId}
          />
        </div>
      </div>
    </div>
  );
}
