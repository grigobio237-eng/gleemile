'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Edit,
  Save,
  X,
  History,
  Bell,
  RefreshCw,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface InventoryItem {
  productId: string;
  productName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
  productStatus: string;
  category: string;
  image: string;
  avgDailySales?: number;
  lastRestockDate?: string;
}

interface InventoryStats {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  overstocked: number;
  totalValue: number;
}

interface StockHistory {
  date: string;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  reason: string;
  newStock: number;
}

const statusLabels = {
  in_stock: '재고 충분',
  low_stock: '재고 부족',
  out_of_stock: '품절',
  overstocked: '재고 과다'
};

const statusColors = {
  in_stock: 'bg-green-100 text-green-800',
  low_stock: 'bg-yellow-100 text-yellow-800',
  out_of_stock: 'bg-red-100 text-red-800',
  overstocked: 'bg-primary-container text-blue-800'
};

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    adjustment: string;
    reason: string;
    minStock: string;
    maxStock: string;
  }>({
    adjustment: '',
    reason: '',
    minStock: '',
    maxStock: ''
  });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProductHistory, setSelectedProductHistory] = useState<{
    productName: string;
    history: StockHistory[];
  } | null>(null);
  const [alertsExpanded, setAlertsExpanded] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partner/inventory', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Add mock avgDailySales for demo
        const enrichedInventory = (data.inventory || []).map((item: InventoryItem) => ({
          ...item,
          avgDailySales: Math.floor(Math.random() * 5) + 1,
          lastRestockDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));
        setInventory(enrichedInventory);
        setStats(data.stats);
      } else {
        toast.error('재고 정보 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('재고 조회 오류:', error);
      toast.error('재고 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item.productId);
    setEditData({
      adjustment: '',
      reason: '',
      minStock: item.minStock.toString(),
      maxStock: item.maxStock.toString()
    });
  };

  const handleSave = async (productId: string) => {
    try {
      const adjustment = editData.adjustment ? parseInt(editData.adjustment) : undefined;
      const minStock = parseInt(editData.minStock);
      const maxStock = parseInt(editData.maxStock);

      if (isNaN(minStock) || isNaN(maxStock) || minStock < 0 || maxStock < 0) {
        toast.error('유효한 숫자를 입력해주세요.');
        return;
      }

      if (minStock > maxStock) {
        toast.error('최소 재고는 최대 재고보다 작아야 합니다.');
        return;
      }

      const response = await fetch(`/api/partner/inventory/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          adjustment,
          reason: editData.reason || '파트너 조정',
          minStock,
          maxStock
        }),
      });

      if (response.ok) {
        toast.success('재고가 업데이트되었습니다.');
        setEditingItem(null);
        fetchInventory();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '재고 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('재고 업데이트 오류:', error);
      toast.error('재고 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditData({
      adjustment: '',
      reason: '',
      minStock: '',
      maxStock: ''
    });
  };

  const handleViewHistory = (item: InventoryItem) => {
    // Mock history data
    const mockHistory: StockHistory[] = [
      { date: new Date().toISOString(), type: 'out', quantity: -2, reason: '주문 #ORD-001234', newStock: item.currentStock },
      { date: new Date(Date.now() - 86400000).toISOString(), type: 'out', quantity: -1, reason: '주문 #ORD-001233', newStock: item.currentStock + 2 },
      { date: new Date(Date.now() - 172800000).toISOString(), type: 'in', quantity: 50, reason: '재고 입고', newStock: item.currentStock + 3 },
      { date: new Date(Date.now() - 259200000).toISOString(), type: 'adjust', quantity: -5, reason: '재고 실사 조정', newStock: item.currentStock + 3 - 50 },
    ];
    setSelectedProductHistory({
      productName: item.productName,
      history: mockHistory
    });
    setHistoryDialogOpen(true);
  };

  // Calculate estimated depletion date
  const getDepletionDate = (item: InventoryItem): string | null => {
    if (!item.avgDailySales || item.avgDailySales === 0) return null;
    const daysUntilDepletion = Math.floor(item.availableStock / item.avgDailySales);
    if (daysUntilDepletion > 365) return null;
    const depletionDate = new Date();
    depletionDate.setDate(depletionDate.getDate() + daysUntilDepletion);
    return `${daysUntilDepletion}일 후 (${depletionDate.toLocaleDateString('ko-KR')})`;
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const lowStockItems = inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">재고 관리</h2>
          <p className="text-obsidian">상품 재고 현황을 모니터링하고 관리하세요</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 재고 부족 알림 배너 */}
      {lowStockItems.length > 0 && (
        <Card className="border-primary/30 bg-amber-50/50">
          <div
            className="cursor-pointer hover:bg-amber-50/80 transition-colors p-4"
            onClick={() => setAlertsExpanded(!alertsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-container/50 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-amber-900">재고 알림</h3>
                  <p className="text-sm text-primary">
                    {lowStockItems.length}개 상품의 재고가 부족하거나 품절입니다
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                {alertsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {alertsExpanded && (
            <CardContent className="pt-0 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockItems.slice(0, 6).map(item => (
                  <div
                    key={item.productId}
                    className={`flex items-center gap-3 p-3 rounded-xl ${item.status === 'out_of_stock' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-primary/30'
                      }`}
                  >
                    <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                      src={item.image}
                      alt={item.productName}
                      crossOrigin="anonymous"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={item.status === 'out_of_stock' ? 'bg-red-100 text-red-800' : 'bg-primary-container/50 text-amber-800'}>
                          {item.status === 'out_of_stock' ? '품절' : `${item.currentStock}개 남음`}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {lowStockItems.length > 6 && (
                <p className="text-sm text-primary mt-3 text-center">
                  +{lowStockItems.length - 6}개 상품 더 있음
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-obsidian">총 상품</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <div className="p-3 bg-primary-container rounded-xl">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-obsidian">재고 충분</p>
                  <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-obsidian">재고 부족</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-obsidian">품절</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="상품명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full bg-mist border-0"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="재고 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="in_stock">재고 충분</SelectItem>
                <SelectItem value="low_stock">재고 부족</SelectItem>
                <SelectItem value="out_of_stock">품절</SelectItem>
                <SelectItem value="overstocked">재고 과다</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 재고 목록 */}
      <div className="space-y-4">
        {filteredInventory.map((item) => (
          <Card key={item.productId} className={`border-0 shadow-md transition-all hover:shadow-lg ${item.status === 'out_of_stock' ? 'ring-2 ring-red-200' :
            item.status === 'low_stock' ? 'ring-2 ring-amber-200' : ''
            }`}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                    src={item.image}
                    alt={item.productName}
                    crossOrigin="anonymous"
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div>
                    <h3 className="font-semibold">{item.productName}</h3>
                    <p className="text-sm text-obsidian">{item.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={statusColors[item.status]}>
                        {statusLabels[item.status]}
                      </Badge>
                      {getDepletionDate(item) && (
                        <span className="text-xs text-orange-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          예상 소진: {getDepletionDate(item)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  {/* 재고 정보 */}
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-foreground/70">현재 재고</p>
                    <p className="font-bold text-xl">{item.currentStock}<span className="text-sm font-normal text-foreground/70">개</span></p>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <p className="text-xs text-foreground/70">예약</p>
                    <p className="font-medium text-orange-600">{item.reservedStock}</p>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <p className="text-xs text-foreground/70">가용</p>
                    <p className="font-medium text-green-600">{item.availableStock}</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-foreground/70">설정</p>
                    <p className="text-sm">
                      <span className="text-obsidian">{item.minStock}</span>
                      <span className="text-foreground/70 mx-1">-</span>
                      <span className="text-obsidian">{item.maxStock}</span>
                    </p>
                  </div>

                  {/* 액션 버튼 */}
                  {editingItem === item.productId ? (
                    <div className="flex items-center gap-2 p-3 bg-mist rounded-xl">
                      <div>
                        <Label className="text-xs">조정량</Label>
                        <Input
                          type="number"
                          value={editData.adjustment}
                          onChange={(e) => setEditData(prev => ({ ...prev, adjustment: e.target.value }))}
                          placeholder="+/-"
                          className="w-20 h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">최소</Label>
                        <Input
                          type="number"
                          value={editData.minStock}
                          onChange={(e) => setEditData(prev => ({ ...prev, minStock: e.target.value }))}
                          className="w-16 h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">최대</Label>
                        <Input
                          type="number"
                          value={editData.maxStock}
                          onChange={(e) => setEditData(prev => ({ ...prev, maxStock: e.target.value }))}
                          className="w-16 h-8"
                        />
                      </div>
                      <Button size="sm" onClick={() => handleSave(item.productId)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewHistory(item)}>
                        <History className="h-4 w-4 mr-1" />
                        히스토리
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4 mr-1" />
                        수정
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredInventory.length === 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-foreground/70 mx-auto mb-4" />
              <p className="text-foreground/70">검색 조건에 맞는 상품이 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 재고 히스토리 다이얼로그 */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>재고 입출고 내역</DialogTitle>
            <DialogDescription>
              {selectedProductHistory?.productName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {selectedProductHistory?.history.map((entry, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-mist rounded-xl">
                <div className={`p-2 rounded-lg ${entry.type === 'in' ? 'bg-green-100' :
                  entry.type === 'out' ? 'bg-red-100' : 'bg-primary-container'
                  }`}>
                  {entry.type === 'in' ? <TrendingUp className="h-4 w-4 text-green-600" /> :
                    entry.type === 'out' ? <TrendingDown className="h-4 w-4 text-red-600" /> :
                      <Edit className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{entry.reason}</p>
                  <p className="text-xs text-foreground/70">
                    {new Date(entry.date).toLocaleDateString('ko-KR')} {new Date(entry.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${entry.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                  </p>
                  <p className="text-xs text-foreground/70">재고: {entry.newStock}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
