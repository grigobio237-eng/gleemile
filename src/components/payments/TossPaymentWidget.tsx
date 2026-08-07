'use client';

import React, { useEffect, useRef, useState } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { Loader2 } from 'lucide-react';

interface TossPaymentWidgetProps {
  clientKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  teamId: string;
  paymentId: string;
}

export default function TossPaymentWidget({
  clientKey,
  customerKey,
  amount,
  orderId,
  orderName,
  customerName,
  teamId,
  paymentId,
}: TossPaymentWidgetProps) {
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance['renderPaymentMethods']> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

        const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
          '#payment-widget',
          { value: amount },
          { variantKey: 'DEFAULT' }
        );

        paymentWidget.renderAgreement(
          '#agreement',
          { variantKey: 'AGREEMENT' }
        );

        paymentWidgetRef.current = paymentWidget;
        paymentMethodsWidgetRef.current = paymentMethodsWidget;
        
        paymentMethodsWidget.on('ready', () => {
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading payment widget:', error);
      }
    })();
  }, [clientKey, customerKey, amount]);

  const handlePayment = async () => {
    const paymentWidget = paymentWidgetRef.current;
    if (!paymentWidget) return;

    const currentUrl = window.location.origin;
    
    try {
      await paymentWidget.requestPayment({
        orderId,
        orderName,
        customerName,
        successUrl: `${currentUrl}/pay/success?teamId=${teamId}&paymentId=${paymentId}`,
        failUrl: `${currentUrl}/pay/fail`,
      });
    } catch (error) {
      console.error('Payment request failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      )}
      
      <div id="payment-widget" className="w-full" />
      <div id="agreement" className="w-full mb-4" />
      
      <button
        onClick={handlePayment}
        disabled={loading}
        className="mt-auto w-full py-4 rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all disabled:opacity-50"
      >
        {amount.toLocaleString()}원 결제하기
      </button>
    </div>
  );
}
