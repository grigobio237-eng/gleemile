'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function FailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '결제 처리 중 오류가 발생했습니다.';
  const code = searchParams.get('code') || 'UNKNOWN_ERROR';

  return (
    <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full mx-auto mt-20 animate-in fade-in">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-red-600 text-3xl font-black">!</span>
      </div>
      <h1 className="font-black text-slate-800 text-xl mb-2">결제에 실패했습니다</h1>
      <p className="text-sm text-slate-500 mb-2">{message}</p>
      <p className="text-xs text-slate-400 mb-8 break-all">에러 코드: {code}</p>
      
      <button 
        onClick={() => window.history.back()}
        className="w-full px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
      >
        이전 페이지로 돌아가기
      </button>
    </div>
  );
}

export default function PayFailPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-20 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <FailContent />
      </Suspense>
    </div>
  );
}
