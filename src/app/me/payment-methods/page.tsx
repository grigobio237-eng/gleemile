'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Lock,
  ShieldCheck,
  X,
  CreditCard as CardIcon,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface PaymentMethod {
  _id?: string;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'other';
  isDefault?: boolean;
  last4?: string;
}

export default function PaymentMethodsPage() {
  const { data: session, status } = useSession();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<PaymentMethod>({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cardType: 'visa',
    isDefault: false,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPaymentMethods();
    }
  }, [status]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment-methods');
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('결제 수단 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0, len = v.length; i < len; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ').slice(0, 19);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      cardNumber: formatted,
    }));
  };

  const handleSave = async () => {
    if (!formData.cardNumber || !formData.cardHolder || !formData.expiryMonth || !formData.expiryYear) {
      alert('보안 프로토콜을 위해 모든 항목을 입력해주십시오.');
      return;
    }

    try {
      const cardNumberOnly = formData.cardNumber.replace(/\s/g, '');
      const last4 = cardNumberOnly.slice(-4);

      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cardNumber: cardNumberOnly,
          last4
        }),
      });

      if (response.ok) {
        alert('새로운 결제 터미널이 동기화되었습니다.');
        setIsAdding(false);
        resetForm();
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('결제 수단 저장 오류:', error);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!confirm('이 결제 자산을 영구적으로 말소하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/payment-methods`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (response.ok) {
        alert('데이터 삭제 완료.');
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('결제 수단 삭제 오류:', error);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/payment-methods/default', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (response.ok) {
        alert('기본 결제 수단이 재설정되었습니다.');
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('기본 결제 수단 설정 오류:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      cardNumber: '',
      cardHolder: '',
      expiryMonth: '',
      expiryYear: '',
      cardType: 'visa',
      isDefault: false,
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chapter-accent"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[40px] bg-white text-center p-12">
          <div className="w-20 h-20 bg-mist rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner text-4xl">🔒</div>
          <h2 className="text-2xl font-black text-obsidian tracking-tight mb-2">접근 권한 제한</h2>
          <p className="text-slate font-medium mb-8">결제 수단 관리를 위해 인증 프로토콜이 필요합니다.</p>
          <Button asChild className="w-full h-14 rounded-2xl bg-obsidian text-mist font-black">
            <Link href="/auth/signin">인증 시작</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="text-center md:text-left">
            <Button variant="ghost" asChild className="p-0 hover:bg-transparent text-slate hover:text-obsidian mb-4 transition-colors">
              <Link href="/me" className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
            <p className="text-chapter-accent font-black uppercase tracking-[0.2em] text-[10px] mb-2">Financial Protocol</p>
            <h1 className="font-black text-obsidian tracking-tighter text-xl">결제 수단 관리</h1>
            <p className="text-slate font-bold tracking-tight mt-1">{session?.user?.name} 유저의 승인된 결제 수단 목록입니다.</p>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="h-14 px-8 rounded-2xl bg-obsidian text-mist font-black flex gap-2 shadow-xl shadow-obsidian/10">
              <Plus className="h-5 w-5" /> 새 카드 등록
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {paymentMethods.length === 0 && !isAdding ? (
            <div className="md:col-span-2 py-24 bg-white/50 border-2 border-dashed border-line rounded-[40px] text-center">
              <CreditCard className="h-12 w-12 mx-auto text-slate opacity-20 mb-4" />
              <p className="text-slate font-bold">등록된 결제 데이터가 없습니다.</p>
            </div>
          ) : (
            paymentMethods.map((method) => (
              <Card key={method._id} className={`group relative border-none shadow-sm rounded-[42px] overflow-hidden transition-all duration-500 hover:shadow-2xl ${method.isDefault ? 'bg-obsidian text-mist' : 'bg-white text-obsidian'}`}>
                <CardContent className="p-10 space-y-12">
                  <div className="flex justify-between items-start">
                    <div className="p-4 rounded-2xl bg-chapter-accent/20">
                      <Lock className={`h-6 w-6 ${method.isDefault ? 'text-reward-gold' : 'text-chapter-accent'}`} />
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-reward-gold text-obsidian border-none font-black text-[9px] uppercase tracking-widest px-3">Primary Terminal</Badge>
                    )}
                  </div>

                  <div className="space-y-6">
                    <p className={`text-2xl font-black font-mono tracking-widest ${method.isDefault ? 'text-mist' : 'text-obsidian'}`}>
                      **** **** **** <span className={method.isDefault ? 'text-reward-gold' : 'text-chapter-accent'}>{method.last4}</span>
                    </p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Card Holder</p>
                        <p className="text-sm font-black uppercase tracking-tight">{method.cardHolder}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Expires</p>
                        <p className="text-sm font-black">{method.expiryMonth}/{method.expiryYear}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-mist/10">
                    {!method.isDefault && (
                      <Button variant="ghost" className="flex-1 h-12 rounded-xl text-[10px] font-black hover:bg-mist/5" onClick={() => handleSetDefault(method._id || '')}>
                        SET AS PRIMARY
                      </Button>
                    )}
                    <Button variant="ghost" className="h-12 w-12 rounded-xl text-status-danger hover:bg-status-danger/5" onClick={() => handleDelete(method._id || '')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {isAdding && (
          <Card className="border-none shadow-2xl rounded-[48px] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-obsidian tracking-tighter">보안 카드 등록</h2>
                <p className="text-xs font-black text-slate uppercase tracking-widest mt-1">Financial Asset Synchronization</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); resetForm(); }} className="rounded-full hover:bg-mist h-12 w-12"><X className="h-6 w-6" /></Button>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[32px] flex gap-4">
                <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                <div className="text-xs font-medium text-blue-800 leading-relaxed">
                  <p className="font-extrabold mb-1">엔드투엔드 암호화 적용</p>
                  <p>모든 금융 데이터는 파편화되어 안전한 볼트에 저장됩니다. 원본 카드번호는 시스템 내부적으로만 처리되며 노출되지 않습니다.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate uppercase tracking-widest ml-1">카드 번호</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate opacity-40" />
                    <Input value={formData.cardNumber} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" maxLength={19} className="h-16 pl-14 rounded-2xl bg-mist/50 border-line font-mono text-lg font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate uppercase tracking-widest ml-1">소유자 성함 (영문 권장)</Label>
                    <Input value={formData.cardHolder} onChange={(e) => setFormData(prev => ({ ...prev, cardHolder: e.target.value.toUpperCase() }))} placeholder="HONG GILDONG" className="h-16 rounded-2xl bg-mist/50 border-line font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate uppercase tracking-widest ml-1">만료 (월)</Label>
                      <Input value={formData.expiryMonth} onChange={(e) => setFormData(prev => ({ ...prev, expiryMonth: e.target.value.slice(0, 2) }))} placeholder="MM" maxLength={2} className="h-16 rounded-2xl bg-mist/50 border-line text-center font-bold" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate uppercase tracking-widest ml-1">만료 (년)</Label>
                      <Input value={formData.expiryYear} onChange={(e) => setFormData(prev => ({ ...prev, expiryYear: e.target.value.slice(0, 4) }))} placeholder="YYYY" maxLength={4} className="h-16 rounded-2xl bg-mist/50 border-line text-center font-bold" />
                    </div>
                  </div>
                </div>

                {paymentMethods.length > 0 && (
                  <div className="flex items-center gap-3 bg-mist/30 p-4 rounded-2xl border border-line/30">
                    <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))} className="h-5 w-5 rounded border-line" />
                    <label htmlFor="isDefault" className="text-sm font-bold text-obsidian cursor-pointer select-none">이 카드를 기본 결제 자산으로 설정합니다.</label>
                  </div>
                )}
              </div>

              <Button onClick={handleSave} className="w-full h-20 rounded-[32px] bg-obsidian text-mist font-black shadow-2xl hover:scale-[1.02] transition-all text-xl">
                보안 자산 동기화 완료
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
