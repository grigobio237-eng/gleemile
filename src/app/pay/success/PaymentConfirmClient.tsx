'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentConfirmClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const teamId = searchParams.get('teamId');
  const paymentId = searchParams.get('paymentId');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!paymentKey || !orderId || !amount || !teamId || !paymentId) {
      setStatus('error');
      setErrorMessage('결제 정보가 올바르지 않습니다.');
      return;
    }

    const confirmPayment = async () => {
      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount,
            teamId,
            paymentId,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.message || '결제 승인 중 오류가 발생했습니다.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('서버와의 통신에 실패했습니다.');
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount, teamId, paymentId]);

  if (status === 'success') {
    return (
      <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="font-black text-slate-800 text-2xl mb-2">결제가 완료되었습니다</h1>
        <p className="text-sm text-slate-500 mb-8">예약금이 성공적으로 처리되었습니다.</p>
        
        <button 
          onClick={() => window.close()} 
          className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
        >
          창 닫기
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="font-black text-slate-800 text-2xl mb-2">결제 승인 실패</h1>
        <p className="text-sm text-red-500 mb-8">{errorMessage}</p>
        
        <Link 
          href={`/pay/${teamId}/${paymentId}`}
          className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
        >
          다시 시도하기
        </Link>
      </div>
    );
  }

  return null;
}
