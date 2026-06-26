'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tag,
  Calendar,
  Percent,
  Banknote,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Ticket,
  ChevronRight,
  Download
} from 'lucide-react';

interface Coupon {
  _id: string;
  userId: string;
  couponId: {
    _id: string;
    code: string;
    name: string;
    description?: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    validFrom: string;
    validUntil: string;
  };
  code: string;
  status: 'available' | 'used' | 'expired';
  downloadedAt: string;
  validUntil: string;
  usedAt?: string;
}

interface CouponStats {
  available: number;
  used: number;
  expired: number;
}

export default function MyCouponsPage() {
  const { data: session, status } = useSession();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats>({ available: 0, used: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'used' | 'expired'>('all');

  useEffect(() => {
    if (session?.user) {
      fetchCoupons();
    }
  }, [session, activeTab]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }

      const response = await fetch(`/api/me/coupons?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
        setStats(data.stats || { available: 0, used: 0, expired: 0 });
      }
    } catch (error) {
      console.error('쿠폰 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCouponIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-5 w-5" />;
      case 'fixed': return <Banknote className="h-5 w-5" />;
      case 'free_shipping': return <Truck className="h-5 w-5" />;
      default: return <Tag className="h-5 w-5" />;
    }
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
          <p className="text-slate font-medium mb-8">인벤토리 확인을 위해 인증 프로토콜이 필요합니다.</p>
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
            <p className="text-chapter-accent font-black uppercase tracking-[0.2em] text-[10px] mb-2">Inventory Analysis</p>
            <h1 className="font-black text-obsidian tracking-tighter text-xl">쿠폰 인벤토리</h1>
            <p className="text-slate font-bold tracking-tight mt-1">{session.user?.name} 유저가 보유한 활성 혜택입니다.</p>
          </div>
          <Button variant="outline" onClick={fetchCoupons} className="h-12 px-6 rounded-xl border-line text-slate font-black flex gap-2 hover:bg-white transition-all">
            <RefreshCw className="h-4 w-4" />
            데이터 최신화
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: '사용가능', count: stats.available, icon: CheckCircle, color: 'text-status-good', bg: 'bg-status-good/5' },
            { label: '사용완료', count: stats.used, icon: Clock, color: 'text-slate', bg: 'bg-mist' },
            { label: '기간만료', count: stats.expired, icon: XCircle, color: 'text-status-danger', bg: 'bg-status-danger/5' },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate uppercase tracking-widest mb-1 opacity-60">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.count}</p>
                </div>
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-2xl rounded-[40px] bg-obsidian text-mist overflow-hidden mb-12 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-reward-gold/10 blur-[100px] rounded-full -translate-y-32 translate-x-32" />
          <CardContent className="p-10 md:p-14 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">새로운 혜택이 기다리고 있습니다</h3>
              <p className="text-sm font-medium opacity-60">추가적인 회복 프로토콜을 인벤토리에 할당하십시오.</p>
            </div>
            <Button asChild className="h-16 px-10 rounded-2xl bg-reward-gold text-obsidian font-black text-lg hover:scale-105 transition-all shadow-xl shadow-reward-gold/10">
              <Link href="/coupons" className="flex items-center gap-2">
                <Download className="h-5 w-5" /> 쿠폰 다운로드 센터
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[40px] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-4 border-b border-mist">
            <CardTitle className="text-2xl font-black text-obsidian tracking-tighter">프로토콜 리스트</CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-8">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-4 h-14 bg-mist p-1 rounded-2xl mb-10">
                {[
                  { id: 'all', label: 'ALL', total: stats.available + stats.used + stats.expired },
                  { id: 'available', label: 'AVAILABLE', total: stats.available },
                  { id: 'used', label: 'USED', total: stats.used },
                  { id: 'expired', label: 'EXPIRED', total: stats.expired },
                ].map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="rounded-xl font-black text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-obsidian data-[state=active]:shadow-sm transition-all uppercase">
                    {tab.label} <span className="ml-1 opacity-40">({tab.total})</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="space-y-6 focus-visible:outline-none">
                {coupons.length === 0 ? (
                  <div className="text-center py-24 bg-mist/30 rounded-[32px] border-2 border-dashed border-line/50">
                    <Ticket className="h-12 w-12 mx-auto text-slate opacity-20 mb-4" />
                    <h3 className="font-black text-obsidian tracking-tight mb-2 text-xl">기록된 데이터가 없습니다</h3>
                    <p className="text-slate font-medium text-sm mb-8 opacity-60 italic">선택하신 카테고리에 해당하는 쿠폰이 존재하지 않습니다.</p>
                    <Button asChild variant="outline" className="rounded-xl border-line font-black text-xs hover:bg-white px-8">
                      <Link href="/coupons">쿠폰함 채우기</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {coupons.map((coupon) => (
                      <Card key={coupon._id} className={`border-none shadow-sm rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-xl group ${coupon.status !== 'available' ? 'opacity-50 grayscale' : 'bg-white'}`}>
                        <div className="p-8 space-y-6">
                          <div className="flex justify-between items-start">
                            <div className={`p-4 rounded-2xl ${coupon.status === 'available' ? 'bg-mist text-chapter-accent group-hover:bg-chapter-accent group-hover:text-mist' : 'bg-mist text-slate'
                              } transition-colors`}>
                              {getCouponIcon(coupon.couponId.type)}
                            </div>
                            <Badge className={`border-none font-black text-[9px] uppercase tracking-widest px-3 ${coupon.status === 'available' ? 'bg-status-good/10 text-status-good' :
                                coupon.status === 'used' ? 'bg-slate/10 text-slate' : 'bg-status-danger/10 text-status-danger'
                              }`}>
                              {coupon.status === 'available' ? 'Active' : coupon.status === 'used' ? 'Used' : 'Expired'}
                            </Badge>
                          </div>

                          <div>
                            <h3 className="font-black text-obsidian tracking-tight line-clamp-1 text-xl">{coupon.couponId.name}</h3>
                            <p className="text-3xl font-black text-chapter-accent tracking-tighter mt-1">
                              {coupon.couponId.type === 'percentage' ? `${coupon.couponId.value}%` : coupon.couponId.type === 'fixed' ? `${coupon.couponId.value.toLocaleString()}원` : 'FREE'}
                              <span className="text-xs font-bold text-slate ml-2 opacity-60">DISCOUNT</span>
                            </p>
                          </div>

                          <div className="bg-mist/50 p-4 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate">
                              <Tag className="w-3 h-3" />
                              <span className="opacity-50">CODE:</span>
                              <span className="text-obsidian select-all">{coupon.code}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate">
                              <Calendar className="w-3 h-3" />
                              <span className="opacity-50">PERIOD:</span>
                              <span className="text-obsidian">{formatDate(coupon.validUntil)} 까지</span>
                            </div>
                          </div>

                          {coupon.status === 'available' && (
                            <Button asChild className="w-full h-14 rounded-2xl bg-obsidian text-mist font-black text-sm shadow-lg shadow-obsidian/10 transition-all hover:-translate-y-1">
                              <Link href="/products" className="flex items-center justify-center gap-2">
                                쿠폰 사용하기 <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
