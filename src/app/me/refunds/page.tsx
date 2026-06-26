'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import CharacterImage from '@/components/ui/CharacterImage';
import Image from 'next/image';
import { 
  RotateCcw, 
  Calendar, 
  Package, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Search,
  X
} from 'lucide-react';

interface RefundItem {
  _id: string;
  orderId: string | {
    _id: string;
    orderNumber: string;
    items: Array<{
      productId: {
        _id: string;
        name: string;
        images: string[];
      };
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
  };
  orderNumber?: string;
  type: 'refund' | 'exchange';
  reason: string;
  reasonDetail?: string;
  details?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'pickup_requested' | 'pickup_completed' | 'inspecting' | 'cancelled';
  refundMethod: 'credit_card' | 'bank_transfer' | 'card' | 'account';
  bankAccount?: {
    bankName?: string;
    bank?: string;
    accountNumber: string;
    accountHolder: string;
  };
  refundAmount?: number;
  finalRefundAmount?: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  requestedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  pickupRequestedAt?: string;
  pickupCompletedAt?: string;
  inspectingAt?: string;
  pickupAddress?: {
    zipCode: string;
    address1: string;
    address2?: string;
    phone: string;
  };
  trackingNumber?: string;
  courierCompany?: string;
}

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '검토 중', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: '승인됨', color: 'bg-primary-container text-blue-800', icon: CheckCircle },
  rejected: { label: '거부됨', color: 'bg-red-100 text-red-800', icon: XCircle },
  completed: { label: '완료됨', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pickup_requested: { label: '수거 요청', color: 'bg-secondary-container text-purple-800', icon: Clock },
  pickup_completed: { label: '수거 완료', color: 'bg-secondary-container text-indigo-800', icon: Clock },
  inspecting: { label: '검수 중', color: 'bg-orange-100 text-orange-800', icon: Clock },
  cancelled: { label: '취소됨', color: 'bg-gray-100 text-obsidian', icon: XCircle },
};

const refundReasons: Record<string, string> = {
  change_of_mind: '단순 변심',
  defective_product: '상품 불량',
  wrong_product: '오배송',
  size_mismatch: '사이즈 불일치',
  different_from_image: '상품 상이',
  delivery_delay: '배송 지연',
  other: '기타',
};

export default function MyRefundsPage() {
  const { data: session, status } = useSession();
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<RefundItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRefunds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filterStatus]);

  // 검색 debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'authenticated') {
        fetchRefunds();
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      const response = await fetch(`/api/refunds?${params.toString()}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // API 응답 형식: { success: true, data: { refunds: [...] } }
        const refundsData = data.data?.refunds || data.refunds || [];
        // orderId를 populate하기 위해 주문 정보도 함께 조회
        const refundsWithOrders = await Promise.all(
          refundsData.map(async (refund: any) => {
            if (refund.orderId && typeof refund.orderId === 'string') {
              try {
                const orderResponse = await fetch(`/api/orders/${refund.orderId}`, {
                  credentials: 'include',
                });
                if (orderResponse.ok) {
                  const orderData = await orderResponse.json();
                  return {
                    ...refund,
                    orderId: orderData.order || orderData,
                  };
                }
              } catch (error) {
                console.error('주문 정보 조회 오류:', error);
              }
            }
            return refund;
          })
        );
        
        // 검색 필터 적용
        let filteredRefunds = refundsWithOrders;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filteredRefunds = refundsWithOrders.filter((refund: any) => 
            refund.orderNumber?.toLowerCase().includes(query) ||
            (typeof refund.orderId === 'object' && refund.orderId?.orderNumber?.toLowerCase().includes(query)) ||
            refund.reasonDetail?.toLowerCase().includes(query)
          );
        }
        
        setRefunds(filteredRefunds);
      } else {
        console.error('환불 내역 조회 실패');
      }
    } catch (error) {
      console.error('환불 내역 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 환불 취소
  const handleCancelRefund = async (refundId: string) => {
    if (!confirm('환불 신청을 취소하시겠습니까? 취소 후에는 다시 신청하셔야 합니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/refunds/${refundId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        alert('환불 신청이 취소되었습니다.');
        fetchRefunds();
      } else {
        const errorData = await response.json();
        alert(errorData.error || '환불 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('환불 취소 오류:', error);
      alert('환불 취소 중 오류가 발생했습니다.');
    }
  };

  // 환불 상태 타임라인 생성
  const generateRefundTimeline = (refund: RefundItem) => {
    const timeline: Array<{ status: string; label: string; date?: string; description?: string }> = [];

    if (refund.requestedAt) {
      timeline.push({
        status: 'requested',
        label: '환불 신청',
        date: refund.requestedAt,
        description: '환불 신청이 접수되었습니다.',
      });
    }

    if (refund.status === 'approved' && refund.approvedAt) {
      timeline.push({
        status: 'approved',
        label: '승인됨',
        date: refund.approvedAt,
        description: '환불이 승인되었습니다.',
      });
    }

    if (refund.status === 'pickup_requested' && refund.pickupRequestedAt) {
      timeline.push({
        status: 'pickup_requested',
        label: '수거 요청',
        date: refund.pickupRequestedAt,
        description: '반품 상품 수거가 요청되었습니다.',
      });
    }

    if (refund.status === 'pickup_completed' && refund.pickupCompletedAt) {
      timeline.push({
        status: 'pickup_completed',
        label: '수거 완료',
        date: refund.pickupCompletedAt,
        description: '반품 상품이 수거되었습니다.',
      });
    }

    if (refund.status === 'inspecting' && refund.inspectingAt) {
      timeline.push({
        status: 'inspecting',
        label: '검수 중',
        date: refund.inspectingAt,
        description: '반품 상품 검수가 진행 중입니다.',
      });
    }

    if (refund.status === 'completed' && refund.completedAt) {
      timeline.push({
        status: 'completed',
        label: '완료',
        date: refund.completedAt,
        description: '환불 처리가 완료되었습니다.',
      });
    }

    if (refund.status === 'rejected' && refund.rejectedAt) {
      timeline.push({
        status: 'rejected',
        label: '거부됨',
        date: refund.rejectedAt,
        description: refund.rejectionReason || '환불이 거부되었습니다.',
      });
    }

    if (refund.status === 'cancelled' && refund.cancelledAt) {
      timeline.push({
        status: 'cancelled',
        label: '취소됨',
        date: refund.cancelledAt,
        description: '환불 신청이 취소되었습니다.',
      });
    }

    return timeline;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="text-obsidian mb-6">
              환불 내역을 확인하려면 로그인해주세요.
            </p>
            <Button asChild>
              <Link href="/auth/signin">로그인하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <CharacterImage
                src="/character/youniqle-2.png"
                alt="Youniqle 캐릭터"
                fill
                className="object-contain"
                sizes="80px"
              />
            </div>
          </div>
          <h1 className="font-bold text-obsidian mb-4 text-4xl">내 환불 내역</h1>
          <p className="text-obsidian text-xl">
            {session.user?.name}님의 환불/교환 신청 내역입니다
          </p>
        </div>

        {/* 필터 및 검색 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/70" />
              <Input
                placeholder="주문번호 또는 내용으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              전체
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
            >
              검토 중
            </Button>
            <Button
              variant={filterStatus === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('approved')}
            >
              승인됨
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('completed')}
            >
              완료
            </Button>
          </div>
        </div>

        {/* 환불 목록 */}
        {refunds.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-6">
                <RotateCcw className="h-16 w-16 text-foreground/70" />
              </div>
              <h3 className="font-semibold text-obsidian mb-2 text-xl">
                환불 내역이 없습니다
              </h3>
              <p className="text-obsidian mb-6">
                아직 환불/교환 신청 내역이 없습니다.
              </p>
              <Button asChild>
                <Link href="/orders">주문 내역 보기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {refunds.map((refund) => {
              const StatusIcon = statusLabels[refund.status].icon;
              return (
                <Card key={refund._id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <RotateCcw className="h-5 w-5 mr-2" />
                          {refund.type === 'refund' ? '환불' : '교환'} 신청
                        </CardTitle>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-obsidian">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(refund.createdAt).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            주문번호: {typeof refund.orderId === 'object' ? refund.orderId.orderNumber : refund.orderNumber || '-'}
                          </div>
                        </div>
                      </div>
                      <Badge className={statusLabels[refund.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusLabels[refund.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* 주문 상품 목록 */}
                    {typeof refund.orderId === 'object' && refund.orderId.items && (
                    <div className="space-y-3 mb-4">
                      <h4 className="font-semibold text-obsidian">주문 상품</h4>
                      {refund.orderId.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-surface rounded-lg">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            {item.productId.images && item.productId.images.length > 0 ? (
                              <Image
                                src={item.productId.images[0]}
                                alt={item.productId.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-foreground/70" />
                            )}
                          </div>
                          <div className="flex-1">
                            <Link 
                              href={`/products/${item.productId._id}`} 
                              className="font-medium text-obsidian hover:text-primary"
                            >
                              {item.productId.name}
                            </Link>
                            <p className="text-sm text-obsidian">
                              {item.quantity}개 × {item.price.toLocaleString()}원
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-obsidian">
                              {(item.quantity * item.price).toLocaleString()}원
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}

                    {/* 환불 정보 */}
                    <div className="space-y-2 mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm text-obsidian">환불 사유</span>
                        <span className="text-sm font-medium">
                          {refundReasons[refund.reason] || refund.reason}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-obsidian">환불 금액</span>
                        <span className="text-sm font-semibold text-primary">
                          {(refund.finalRefundAmount || refund.refundAmount || 0).toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-obsidian">환불 방법</span>
                        <span className="text-sm font-medium">
                          {refund.refundMethod === 'card' || refund.refundMethod === 'credit_card' 
                            ? '원결제 수단으로 환불' 
                            : '계좌이체 환불'}
                        </span>
                      </div>
                      {refund.bankAccount && (
                        <div className="mt-2 pt-2 border-t border-primary/30">
                          <p className="text-xs text-obsidian">환불 계좌</p>
                          <p className="text-sm font-medium">
                            {refund.bankAccount.bankName || refund.bankAccount.bank} {refund.bankAccount.accountNumber}
                          </p>
                          <p className="text-xs text-obsidian">예금주: {refund.bankAccount.accountHolder}</p>
                        </div>
                      )}
                      {refund.rejectionReason && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-red-800">거부 사유</p>
                              <p className="text-sm text-red-700">{refund.rejectionReason}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 상세 사유 및 이미지 */}
                    {(refund.details || refund.reasonDetail) && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-obsidian mb-1">상세 사유</p>
                        <p className="text-sm text-obsidian whitespace-pre-wrap">{refund.details || refund.reasonDetail}</p>
                      </div>
                    )}

                    {refund.images && refund.images.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-obsidian mb-2">증빙 이미지</p>
                        <div className="grid grid-cols-3 gap-2">
                          {refund.images.map((image, index) => (
                            <div key={index} className="relative">
                              <Image
                                src={image}
                                alt={`증빙 이미지 ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 환불 진행 상태 타임라인 */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-obsidian mb-3">환불 진행 상태</h4>
                      <div className="space-y-3">
                        {generateRefundTimeline(refund).map((item, index) => {
                          const isActive = index === generateRefundTimeline(refund).length - 1;
                          const ItemIcon = statusLabels[item.status]?.icon || Clock;
                          
                          return (
                            <div key={index} className="flex items-start space-x-3">
                              <div className={`flex-shrink-0 mt-1 ${isActive ? 'text-primary' : 'text-foreground/70'}`}>
                                <ItemIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className={`text-sm font-semibold ${isActive ? 'text-blue-900' : 'text-obsidian'}`}>
                                    {item.label}
                                  </p>
                                  {item.date && (
                                    <p className="text-xs text-foreground/70">
                                      {new Date(item.date).toLocaleString('ko-KR')}
                                    </p>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-obsidian">{item.description}</p>
                                )}
                                {index < generateRefundTimeline(refund).length - 1 && (
                                  <div className="mt-2 ml-2.5 h-6 w-0.5 bg-gray-200"></div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 수거 정보 */}
                    {refund.pickupAddress && (refund.status === 'pickup_requested' || refund.status === 'pickup_completed' || refund.status === 'inspecting') && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Truck className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-blue-900">수거지 정보</span>
                        </div>
                        <div className="text-sm text-blue-800">
                          <p>({refund.pickupAddress.zipCode}) {refund.pickupAddress.address1}</p>
                          {refund.pickupAddress.address2 && <p>{refund.pickupAddress.address2}</p>}
                          <p>연락처: {refund.pickupAddress.phone}</p>
                        </div>
                        {refund.trackingNumber && (
                          <div className="mt-2 pt-2 border-t border-primary/30">
                            <p className="text-xs text-primary">송장번호: {refund.trackingNumber}</p>
                            {refund.courierCompany && (
                              <p className="text-xs text-primary">택배사: {refund.courierCompany}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 처리 일시 */}
                    {refund.processedAt && (
                      <div className="text-xs text-foreground/70 mb-4">
                        처리 일시: {new Date(refund.processedAt).toLocaleString('ko-KR')}
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedRefund(refund)}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        상세 보기
                      </Button>
                      <Button
                        variant="outline"
                        asChild
                        className="flex items-center"
                      >
                        <Link href={`/orders/${typeof refund.orderId === 'object' ? refund.orderId._id : refund.orderId}`}>
                          주문 상세
                        </Link>
                      </Button>
                      {refund.status === 'pending' && (
                        <Button
                          variant="outline"
                          onClick={() => handleCancelRefund(refund._id)}
                          className="flex items-center text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          신청 취소
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 상세 보기 모달 */}
        {selectedRefund && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>환불 상세 정보</CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedRefund(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">환불 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-obsidian">신청 번호</p>
                      <p className="font-medium">{selectedRefund._id}</p>
                    </div>
                    <div>
                      <p className="text-obsidian">신청일</p>
                      <p className="font-medium">
                        {new Date(selectedRefund.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-obsidian">상태</p>
                      <Badge className={statusLabels[selectedRefund.status].color}>
                        {statusLabels[selectedRefund.status].label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-obsidian">환불 금액</p>
                      <p className="font-medium text-lg">{(selectedRefund.finalRefundAmount || selectedRefund.refundAmount || 0).toLocaleString()}원</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">환불 사유</h4>
                  <p className="text-sm text-obsidian mb-1">
                    {refundReasons[selectedRefund.reason] || selectedRefund.reason}
                  </p>
                  {(selectedRefund.details || selectedRefund.reasonDetail) && (
                    <p className="text-sm text-obsidian whitespace-pre-wrap">{selectedRefund.details || selectedRefund.reasonDetail}</p>
                  )}
                </div>

                {selectedRefund.images && selectedRefund.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">증빙 이미지</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedRefund.images.map((image, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={image}
                            alt={`증빙 이미지 ${index + 1}`}
                            width={300}
                            height={300}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

