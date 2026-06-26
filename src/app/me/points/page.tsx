'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  Gift,
  User,
  Calendar,
  ArrowLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import Link from 'next/link';

interface PointTransaction {
  _id: string;
  type: 'earned' | 'used' | 'expired' | 'admin_grant' | 'admin_deduct';
  amount: number;
  description: string;
  balance: number;
  orderId?: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
  };
  createdAt: string;
  expiresAt?: string;
}

interface PointHistoryData {
  transactions: PointTransaction[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  stats: {
    totalEarned: number;
    totalUsed: number;
    totalExpired: number;
    totalAdminGrant: number;
    totalAdminDeduct: number;
  };
  currentBalance: number;
}

export default function PointHistoryPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<PointHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [error, setError] = useState('');

  const fetchPointHistory = async (page: number = 1, type: string = 'all') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (type !== 'all') params.append('type', type);

      const response = await fetch(`/api/points/history?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        setError('데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('포인트 내역 조회 오류:', error);
      setError('시스템 동기화 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPointHistory(currentPage, selectedType);
    } else if (status === 'unauthenticated') {
      setError('로그인이 필요합니다.');
      setLoading(false);
    }
  }, [status, currentPage, selectedType]);

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'earned': return { label: '획득', color: 'text-status-good', bg: 'bg-status-good/5' };
      case 'used': return { label: '사용', color: 'text-status-danger', bg: 'bg-status-danger/5' };
      case 'expired': return { label: '소멸', color: 'text-slate', bg: 'bg-mist' };
      case 'admin_grant': return { label: '지급', color: 'text-chapter-accent', bg: 'bg-chapter-accent/5' };
      case 'admin_deduct': return { label: '차감', color: 'text-status-amber', bg: 'bg-status-amber/5' };
      default: return { label: '기타', color: 'text-slate', bg: 'bg-mist' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chapter-accent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[40px] bg-white text-center p-12">
          <div className="w-20 h-20 bg-mist rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner text-4xl">⚠️</div>
          <h2 className="text-2xl font-black text-obsidian tracking-tight mb-2">데이터 오류</h2>
          <p className="text-slate font-medium mb-8">{error || '정보를 조회할 수 없습니다.'}</p>
          <Button asChild className="w-full h-14 rounded-2xl bg-obsidian text-mist font-black">
            <Link href="/me">마이페이지로 이동</Link>
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
            <p className="text-chapter-accent font-black uppercase tracking-[0.2em] text-[10px] mb-2">Rewards Ledger</p>
            <h1 className="font-black text-obsidian tracking-tighter text-xl">리워드 원장</h1>
            <p className="text-slate font-bold tracking-tight mt-1">{session?.user?.name} 유저의 포인트 유입 및 유출 기록입니다.</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-mist flex flex-col items-end min-w-[200px]">
            <p className="text-[10px] font-black text-slate uppercase tracking-widest mb-1 opacity-60">Available Points</p>
            <p className="font-black text-reward-gold tracking-tighter text-4xl">{data.currentBalance.toLocaleString()} <span className="text-lg">P</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: '누적 적립', amount: data.stats.totalEarned, color: 'text-status-good', icon: TrendingUp },
            { label: '누적 사용', amount: data.stats.totalUsed, color: 'text-status-danger', icon: TrendingDown },
            { label: '기간 소멸', amount: data.stats.totalExpired, color: 'text-slate', icon: Clock },
            { label: '시스템 지급', amount: data.stats.totalAdminGrant, color: 'text-chapter-accent', icon: Gift },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                <div className={`p-3 rounded-2xl bg-mist ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">{stat.label}</p>
                <p className={`text-xl font-black ${stat.color}`}>{stat.amount.toLocaleString()} P</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm rounded-[40px] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-4 border-b border-mist flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-black text-obsidian tracking-tighter">거래 기록 데이터</CardTitle>
            <Database className="w-6 h-6 text-slate opacity-20" />
          </CardHeader>
          <CardContent className="p-10 pt-8">
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList className="grid w-full grid-cols-6 h-14 bg-mist p-1 rounded-2xl mb-10">
                {[
                  { id: 'all', label: 'ALL' },
                  { id: 'earned', label: 'EARNED' },
                  { id: 'used', label: 'USED' },
                  { id: 'expired', label: 'EXPIRED' },
                  { id: 'admin_grant', label: 'GRANT' },
                  { id: 'admin_deduct', label: 'DEDUCT' },
                ].map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="rounded-xl font-black text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-obsidian data-[state=active]:shadow-sm transition-all uppercase">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedType} className="space-y-4 focus-visible:outline-none">
                {data.transactions.length === 0 ? (
                  <div className="text-center py-24 bg-mist/30 rounded-[32px] border-2 border-dashed border-line/50">
                    <Database className="h-12 w-12 mx-auto text-slate opacity-20 mb-4" />
                    <p className="text-slate font-bold">기록된 거래 데이터가 존재하지 않습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.transactions.map((transaction) => {
                      const style = getTransactionLabel(transaction.type);
                      return (
                        <div key={transaction._id} className="group relative bg-white border border-mist p-6 md:p-8 rounded-[32px] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl ${style.bg} ${style.color} flex items-center justify-center font-black text-xs`}>
                              {style.label}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-black text-obsidian tracking-tight">{transaction.description}</h4>
                                {transaction.orderId && (
                                  <Link href={`/orders/${transaction.orderId._id}`} className="inline-flex items-center gap-1 text-[10px] font-black text-chapter-accent bg-chapter-accent/5 px-2 py-0.5 rounded-full hover:bg-chapter-accent hover:text-mist transition-colors group">
                                    ORDER #{transaction.orderId.orderNumber}
                                    <ChevronRight className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                              <p className="text-[11px] font-bold text-slate flex items-center gap-2 opacity-50">
                                <Calendar className="h-3 w-3" />
                                {formatDate(transaction.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end md:items-end">
                            <p className={`text-2xl font-black tracking-tighter ${transaction.amount > 0 ? 'text-status-good' : 'text-status-danger'}`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} P
                            </p>
                            <p className="text-[11px] font-black text-slate opacity-40 uppercase tracking-widest mt-1">
                              Balance: {transaction.balance.toLocaleString()} P
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {data.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-12 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-10 px-4 rounded-xl border-line font-black text-xs"
                    >
                      PREV
                    </Button>
                    <div className="flex bg-mist p-1 rounded-xl">
                      {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-lg font-black text-xs ${currentPage === page ? 'bg-obsidian text-mist' : 'text-slate hover:bg-white'}`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(data.pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === data.pagination.totalPages}
                      className="h-10 px-4 rounded-xl border-line font-black text-xs"
                    >
                      NEXT
                    </Button>
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
