'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  ShoppingCart
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    period: string;
    totalOrders: number;
    totalAttempts: number;
    totalRevenue: number;
    urgentOrders: number;
    failedPayments: number;
    refundRequests: number;
  };
  ordersByStatus: Record<string, number>;
  ordersByPaymentStatus: Record<string, number>;
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  partnerStats: Array<{
    partnerId: string;
    partnerName: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
  }>;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customer: {
      name: string;
      email: string;
    };
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
      partnerName: string;
    }>;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

const statusLabels = {
  pending: '주문 대기',
  confirmed: '주문 확인',
  preparing: '상품 준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '주문 취소'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-primary-container text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  shipped: 'bg-secondary-container text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const paymentStatusLabels = {
  pending: '결제 대기',
  paid: '결제완료',
  failed: '결제실패',
  refunded: '환불완료'
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-obsidian'
};

export default function OrderAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/analytics?period=${period}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('분석 데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">주문 분석 대시보드</h2>
          <p className="text-obsidian">실시간 주문 현황 및 성과 분석</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
              <SelectItem value="1y">최근 1년</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline">
            새로고침
          </Button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: '개요', icon: BarChart3 },
          { id: 'partners', label: '파트너 분석', icon: Users },
          { id: 'products', label: '상품 분석', icon: Package },
          { id: 'recent', label: '최근 주문', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-obsidian hover:text-obsidian'
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 개요 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-obsidian">총 주문</p>
                    <p className="text-2xl font-bold">{data.summary.totalOrders.toLocaleString()}</p>
                  </div>
                  <Package className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-obsidian">총 매출</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-obsidian">처리 대기</p>
                    <p className="text-2xl font-bold text-orange-600">{data.summary.urgentOrders}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-obsidian">결제 실패</p>
                    <p className="text-2xl font-bold text-red-600">{data.summary.failedPayments}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-obsidian">주문 시도</p>
                    <p className="text-2xl font-bold text-orange-400">{data.summary.totalAttempts.toLocaleString()}</p>
                    <p className="text-xs text-foreground/70 mt-1">
                      결제 단계 전환율: {data.summary.totalAttempts ? Math.round((data.summary.totalOrders / (data.summary.totalAttempts + data.summary.totalOrders)) * 100) : 0}%
                    </p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-orange-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-obsidian">환불 요청</p>
                    <p className="text-2xl font-bold text-obsidian">{data.summary.refundRequests}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-obsidian" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 상태별 분포 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>주문 상태별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.ordersByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[status as keyof typeof statusColors]}>
                          {statusLabels[status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>결제 상태별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.ordersByPaymentStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={paymentStatusColors[status as keyof typeof paymentStatusColors]}>
                          {paymentStatusLabels[status as keyof typeof paymentStatusLabels]}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 파트너 분석 탭 */}
      {activeTab === 'partners' && (
        <Card>
          <CardHeader>
            <CardTitle>파트너별 성과 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.partnerStats.map((partner, index) => (
                <div key={partner.partnerId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{partner.partnerName}</h3>
                      <p className="text-sm text-obsidian">평균 주문액: {formatCurrency(partner.avgOrderValue)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{partner.orders}건</p>
                    <p className="text-sm text-obsidian">{formatCurrency(partner.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 상품 분석 탭 */}
      {activeTab === 'products' && (
        <Card>
          <CardHeader>
            <CardTitle>인기 상품 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{product.productName}</h3>
                      <p className="text-sm text-obsidian">{product.orderCount}건 주문</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.totalQuantity}개</p>
                    <p className="text-sm text-obsidian">{formatCurrency(product.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 주문 탭 */}
      {activeTab === 'recent' && (
        <Card>
          <CardHeader>
            <CardTitle>최근 주문 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentOrders.map((order) => (
                <div key={order._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.orderNumber}</span>
                      <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge className={paymentStatusColors[order.paymentStatus as keyof typeof paymentStatusColors]}>
                        {paymentStatusLabels[order.paymentStatus as keyof typeof paymentStatusLabels]}
                      </Badge>
                    </div>
                    <span className="text-sm text-obsidian">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="text-sm text-obsidian">
                    <p>고객: {order.customer.name} ({order.customer.email})</p>
                    <p>상품: {order.items.map(item => `${item.productName} x${item.quantity}`).join(', ')}</p>
                    <p>파트너: {order.items.map(item => item.partnerName).join(', ')}</p>
                    <p className="font-medium">총액: {formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


