import React, { Suspense } from 'react';
import Link from 'next/link';

export const metadata = {
  title: '결제 대기중 | Gleemile',
};

function SuccessContent() {
  return (
    <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full mx-auto mt-20">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h1 className="font-black text-slate-800 text-xl mb-2">결제를 승인하고 있습니다</h1>
      <p className="text-sm text-slate-500 mb-6">잠시만 기다려 주세요...</p>
      
      {/* 클라이언트 사이드에서 API 라우트를 호출해 최종 승인 처리하는 로직 추가 필요 */}
      <PaymentConfirmClient />
    </div>
  );
}

export default function PaySuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-20 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}

// Client Component for calling API
import PaymentConfirmClient from './PaymentConfirmClient';
