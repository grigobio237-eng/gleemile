'use client';

import React, { useState, useEffect } from 'react';
// Force refresh to resolve framer-motion reference issues
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Plus, Users, LayoutGrid, 
  ChevronRight, Copy, ExternalLink, Activity, Link as LinkIcon,
  LineChart, Search, Filter, MoreHorizontal, Send, MessageSquare
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import MessageTemplateModal from './MessageTemplateModal';
import { useRouter } from 'next/navigation';


interface Shop {
  _id: string;
  name: string;
  shopCode: string;
  category: string;
  leadCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function ShopManagement() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);

  const [loading, setLoading] = useState(true);
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopCategory, setNewShopCategory] = useState('medical');
  const [selectedShopForMessage, setSelectedShopForMessage] = useState<Shop | null>(null);


  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/navigator/shops');
      const data = await res.json();
      if (data.success) {
        setShops(data.shops);
      }
    } catch (error) {
      console.error('Failed to fetch shops', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName) return;

    try {
      const res = await fetch('/api/navigator/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newShopName, category: newShopCategory })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('신규 업소가 등록되었습니다.');
        setNewShopName('');
        setIsAddingShop(false);
        fetchShops();
      } else {
        toast.error(data.error || '등록에 실패했습니다.');
      }
    } catch (error) {
      toast.error('오류가 발생했습니다.');
    }
  };

  const openMessageModal = (shop: Shop) => {
    setSelectedShopForMessage(shop);
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-obsidian tracking-tighter">업소 및 리드 관리</h2>
          <p className="text-slate/60 font-medium">담당하고 계신 업소별 설문 현황과 고객 데이터를 확인하세요.</p>
        </div>
        <Button 
          onClick={() => setIsAddingShop(true)}
          className="bg-chapter-accent hover:bg-chapter-accent/90 text-white rounded-2xl h-14 px-8 font-black shadow-lg shadow-chapter-accent/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> 신규 업소 등록
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[32px] border-none bg-white shadow-sm p-8 flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate/40 uppercase tracking-widest mb-1">Active Shops</p>
            <p className="text-3xl font-black text-obsidian">{shops.length}</p>
          </div>
        </Card>
        <Card className="rounded-[32px] border-none bg-white shadow-sm p-8 flex items-center gap-6">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate/40 uppercase tracking-widest mb-1">Total Leads</p>
            <p className="text-3xl font-black text-obsidian">{shops.reduce((acc, s) => acc + s.leadCount, 0)}</p>
          </div>
        </Card>
        <Card className="rounded-[32px] border-none bg-white shadow-sm p-8 flex items-center gap-6">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-secondary">
            <LineChart className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate/40 uppercase tracking-widest mb-1">Conv. Rate</p>
            <p className="text-3xl font-black text-obsidian">--%</p>
          </div>
        </Card>
      </div>

      {/* Shop List Table-like Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate/40">Registered Establishments</h3>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate/40 hover:text-obsidian"><Search className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate/40 hover:text-obsidian"><Filter className="w-4 h-4" /></Button>
            </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4 bg-white/50 rounded-[40px] border border-dashed border-line">
            <div className="animate-spin w-10 h-10 border-4 border-chapter-accent/30 border-t-chapter-accent rounded-full mx-auto" />
            <p className="text-slate/40 font-bold">목록을 불러오는 중입니다...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[40px] border border-line shadow-sm space-y-6">
            <div className="w-20 h-20 bg-mist rounded-full flex items-center justify-center mx-auto text-slate/20">
              <LayoutGrid className="w-10 h-10" />
            </div>
            <div className="space-y-2">
                <p className="font-black text-obsidian text-xl">등록된 업소가 없습니다.</p>
                <p className="text-slate/40 font-medium">첫 번째 업소를 등록하고 설문 링크를 발송해 보세요.</p>
            </div>
            <Button onClick={() => setIsAddingShop(true)} variant="outline" className="rounded-xl font-bold">지금 바로 등록하기</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {shops.map((shop) => (
              <Card key={shop._id} className="group bg-white border border-line rounded-[32px] p-6 hover:shadow-xl hover:border-chapter-accent/30 transition-all duration-300 overflow-hidden relative">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Shop Info */}
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-16 h-16 bg-mist rounded-2xl flex items-center justify-center text-slate/40 group-hover:bg-chapter-accent/10 group-hover:text-chapter-accent transition-colors">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-obsidian text-xl">{shop.name}</h4>
                        <Badge className="bg-mist text-slate/60 hover:bg-mist border-none font-bold text-[10px] uppercase tracking-widest">{shop.category}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate/40">
                        <span>Code: <span className="text-obsidian">{shop.shopCode}</span></span>
                        <span>•</span>
                        <span>Created: {new Date(shop.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full lg:w-auto mt-4 lg:mt-0">
                    <div className="bg-mist/50 px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-line text-center min-w-[80px] md:min-w-[100px] flex-1 sm:flex-none">
                      <p className="text-[9px] md:text-[10px] font-black text-slate/40 uppercase tracking-widest mb-0.5">Leads</p>
                      <p className="text-base md:text-lg font-black text-obsidian">{shop.leadCount}</p>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-[2] sm:flex-none w-full sm:w-auto">
                        <Button 
                            onClick={() => openMessageModal(shop)}
                            className="bg-chapter-accent text-white hover:bg-chapter-accent/90 rounded-xl h-10 md:h-12 px-4 md:px-6 font-black flex items-center justify-center gap-2 shadow-lg shadow-chapter-accent/20 flex-1 sm:flex-none text-xs md:text-sm"
                        >
                            <Send className="w-4 h-4 shrink-0" /> <span className="truncate">상담 링크 발송</span>
                        </Button>

                        <Button 
                            onClick={() => router.push(`/navigator/shops/${shop._id}`)}
                            variant="secondary"
                            className="bg-obsidian text-white hover:bg-obsidian/90 rounded-xl h-10 md:h-12 px-3 md:px-5 font-bold flex items-center justify-center gap-2 flex-1 sm:flex-none text-xs md:text-sm"
                        >
                            <Activity className="w-4 h-4 shrink-0" /> 분석 <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>

                        <Button variant="ghost" size="sm" className="h-10 md:h-12 w-10 md:w-12 rounded-xl text-slate/30 shrink-0">
                            <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                    </div>
                  </div>
                </div>

                {/* Subtle Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-chapter-accent/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Shop Modal-like Overlay (Simplified for MVP) */}
      {isAddingShop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm" onClick={() => setIsAddingShop(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden"
          >
            <div className="p-10 space-y-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-obsidian tracking-tighter">신규 업소 등록</h3>
                <p className="text-slate/60 font-medium">관리하실 업소의 정보를 입력해 주세요.</p>
              </div>

              <form onSubmit={handleAddShop} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate/40 uppercase tracking-widest ml-1">Establishment Name</label>
                    <input 
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        placeholder="예: 강남 연세 피부과"
                        className="w-full h-16 px-6 bg-mist rounded-2xl border border-line focus:border-chapter-accent focus:ring-1 focus:ring-chapter-accent outline-none font-bold text-lg"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-slate/40 uppercase tracking-widest ml-1">Category</label>
                    <div className="grid grid-cols-2 gap-3">
                        {['medical', 'beauty', 'wellness', 'fitness'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setNewShopCategory(cat)}
                                className={`h-14 rounded-2xl border font-bold text-sm transition-all ${
                                    newShopCategory === cat 
                                    ? 'bg-obsidian border-obsidian text-white shadow-lg' 
                                    : 'bg-white border-line text-slate/60 hover:border-slate/30'
                                }`}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <Button 
                        type="button"
                        onClick={() => setIsAddingShop(false)}
                        variant="ghost" 
                        className="flex-1 h-16 rounded-2xl font-bold text-slate/40 hover:text-obsidian"
                    >
                        취소
                    </Button>
                    <Button 
                        type="submit"
                        className="flex-1 h-16 rounded-2xl bg-chapter-accent text-white font-black text-lg shadow-xl shadow-chapter-accent/20"
                    >
                        등록 완료
                    </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Message Template Modal */}
      <AnimatePresence>
        {selectedShopForMessage && (
          <MessageTemplateModal 
            shopCode={selectedShopForMessage.shopCode}
            shopName={selectedShopForMessage.name}
            onClose={() => setSelectedShopForMessage(null)}
          />
        )}
      </AnimatePresence>
    </div>

  );
}
