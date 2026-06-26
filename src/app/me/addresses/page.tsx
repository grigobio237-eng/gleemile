'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import UnifiedAddressSearch from '@/components/ui/UnifiedAddressSearch';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Home,
  Building2,
  Briefcase,
  X,
  Container,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface Address {
  _id?: string;
  label: string;
  recipient: string;
  phone: string;
  zip: string;
  addr1: string;
  addr2?: string;
  isDefault?: boolean;
}

export default function AddressesPage() {
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Address>({
    label: '기본 배송지',
    recipient: '',
    phone: '',
    zip: '',
    addr1: '',
    addr2: '',
    isDefault: false,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAddresses();
    }
  }, [status]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.user?.addresses || []);
        if (!formData.recipient && data.user?.name) {
          setFormData(prev => ({ ...prev, recipient: data.user.name }));
        }
      }
    } catch (error) {
      console.error('배송지 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.recipient || !formData.phone || !formData.zip || !formData.addr1) {
      alert('필수 보안 데이터를 모두 입력해주십시오.');
      return;
    }

    try {
      const addressData = {
        label: formData.label,
        recipient: formData.recipient,
        phone: formData.phone,
        zip: formData.zip,
        addr1: formData.addr1,
        addr2: formData.addr2 || '',
        isDefault: formData.isDefault,
      };

      let response;
      if (editingId) {
        response = await fetch('/api/addresses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addressId: editingId, ...addressData }),
        });
      } else {
        response = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressData),
        });
      }

      if (response.ok) {
        alert(editingId ? '프로토콜 주소가 수정되었습니다.' : '새로운 터미널 주소가 추가되었습니다.');
        setIsAdding(false);
        setEditingId(null);
        resetForm();
        fetchAddresses();
      } else {
        const errorData = await response.json();
        alert(errorData.error || '저장 프로토콜 중단');
      }
    } catch (error) {
      console.error('배송지 저장 오류:', error);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('이 주소 데이터를 말소하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/addresses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId }),
      });

      if (response.ok) {
        alert('데이터 삭제 완료.');
        fetchAddresses();
      }
    } catch (error) {
      console.error('배송지 삭제 오류:', error);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch('/api/addresses/default', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId }),
      });

      if (response.ok) {
        alert('기본 물류 터미널이 설정되었습니다.');
        fetchAddresses();
      }
    } catch (error) {
      console.error('기본 배송지 설정 오류:', error);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      recipient: address.recipient,
      phone: address.phone,
      zip: address.zip,
      addr1: address.addr1,
      addr2: address.addr2 || '',
      isDefault: address.isDefault || false,
    });
    setEditingId(address._id || null);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      label: '기본 배송지',
      recipient: session?.user?.name || '',
      phone: '',
      zip: '',
      addr1: '',
      addr2: '',
      isDefault: false,
    });
    setEditingId(null);
  };

  const getLabelIcon = (label: string) => {
    if (label.includes('집') || label.includes('홈')) return <Home className="h-4 w-4" />;
    if (label.includes('회사') || label.includes('직장')) return <Building2 className="h-4 w-4" />;
    return <Briefcase className="h-4 w-4" />;
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
          <p className="text-slate font-medium mb-8">주소 관리를 위해 인증 프로토콜이 필요합니다.</p>
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
            <p className="text-chapter-accent font-black uppercase tracking-[0.2em] text-[10px] mb-2">Logistics Control</p>
            <h1 className="font-black text-obsidian tracking-tighter text-xl">물류 터미널 관리</h1>
            <p className="text-slate font-bold tracking-tight mt-1">{session.user?.name} 유저의 활성 배송 거점 목록입니다.</p>
          </div>
          {!isAdding && addresses.length < 5 && (
            <Button onClick={() => setIsAdding(true)} className="h-14 px-8 rounded-2xl bg-obsidian text-mist font-black flex gap-2 shadow-xl shadow-obsidian/10">
              <Plus className="h-5 w-5" /> 배송 프로토콜 추가
            </Button>
          )}
          {!isAdding && addresses.length >= 5 && (
            <div className="text-right">
              <p className="text-sm font-bold text-status-danger mt-4">최대 5개의 물류 터미널까지만 등록할 수 있습니다.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {addresses.length === 0 && !isAdding ? (
            <div className="md:col-span-2 py-24 bg-white/50 border-2 border-dashed border-line rounded-[40px] text-center">
              <Container className="h-12 w-12 mx-auto text-slate opacity-20 mb-4" />
              <p className="text-slate font-bold">등록된 물류 터미널 정보가 없습니다.</p>
            </div>
          ) : (
            addresses.map((address, index) => (
              <Card key={index} className={`border-none shadow-sm rounded-[32px] overflow-hidden group hover:shadow-xl transition-all ${address.isDefault ? 'bg-white ring-2 ring-chapter-accent/20' : 'bg-white/80'}`}>
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-4 rounded-2xl ${address.isDefault ? 'bg-chapter-accent text-mist' : 'bg-mist text-slate'}`}>
                        {getLabelIcon(address.label)}
                      </div>
                      <div>
                        <h3 className="font-black text-obsidian tracking-tight text-xl">{address.label}</h3>
                        {address.isDefault && <Badge className="bg-chapter-accent/10 text-chapter-accent border-none font-black text-[9px] uppercase tracking-widest px-2 mt-1">Primary Gateway</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(address)} className="rounded-xl hover:bg-mist text-slate"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(address._id || index.toString())} className="rounded-xl hover:bg-status-danger/5 text-status-danger"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate uppercase tracking-widest opacity-40">Recipient</p>
                      <p className="text-lg font-bold text-obsidian">{address.recipient} <span className="text-sm font-medium opacity-60 ml-2">({address.phone})</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate uppercase tracking-widest opacity-40">Coordinates</p>
                      <p className="text-sm font-medium text-obsidian leading-relaxed">
                        <span className="bg-mist px-2 py-0.5 rounded text-[10px] font-black mr-2">[{address.zip}]</span>
                        {address.addr1} {address.addr2}
                      </p>
                    </div>
                  </div>

                  {!address.isDefault && (
                    <Button variant="outline" className="w-full h-12 rounded-xl border-line text-xs font-black hover:bg-mist transition-all" onClick={() => handleSetDefault(address._id || index.toString())}>
                      기본 터미널로 설정하기
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {isAdding && (
          <Card className="border-none shadow-2xl rounded-[48px] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-obsidian tracking-tighter">{editingId ? '프로토콜 수정' : '새 데이터 식별'}</h2>
                <p className="text-xs font-black text-slate uppercase tracking-widest mt-1">Terminal Identity Configuration</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); resetForm(); }} className="rounded-full hover:bg-mist h-12 w-12"><X className="h-6 w-6" /></Button>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate uppercase tracking-widest ml-1">터미널 식별 명칭</Label>
                  <Input value={formData.label} onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))} placeholder="예: 거점 센터, 서브 스테이션" className="h-14 rounded-2xl bg-mist/50 border-line" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate uppercase tracking-widest ml-1">수신 유저 명칭</Label>
                  <Input value={formData.recipient} onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))} placeholder="성함을 입력하십시오" className="h-14 rounded-2xl bg-mist/50 border-line" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate uppercase tracking-widest ml-1">유저 연락처</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="010-XXXX-XXXX" className="h-14 rounded-2xl bg-mist/50 border-line" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate uppercase tracking-widest ml-1">물류 좌표 설정</Label>
                  <UnifiedAddressSearch
                    provider="google"
                    onAddressSelect={(a) => {
                      setFormData(prev => ({ ...prev, zip: a.zonecode, addr1: a.address }));
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate uppercase tracking-widest ml-1">주소 원 데이터</Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input value={formData.zip} readOnly placeholder="ZIP" className="h-14 rounded-2xl bg-mist/50 border-line font-bold" />
                  <Input value={formData.addr1} readOnly placeholder="PRIMARY ADDR" className="h-14 md:col-span-3 rounded-2xl bg-mist/50 border-line font-bold" />
                </div>
                <Input value={formData.addr2} onChange={(e) => setFormData(prev => ({ ...prev, addr2: e.target.value }))} placeholder="상세 구역 (SUB-SECTOR)" className="h-14 rounded-2xl bg-mist/50 border-line" />
              </div>

              {addresses.length > 0 && !editingId && (
                <div className="flex items-center gap-3 bg-mist/30 p-4 rounded-2xl border border-line/30">
                  <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))} className="h-5 w-5 rounded border-line" />
                  <label htmlFor="isDefault" className="text-sm font-bold text-obsidian cursor-pointer select-none">이 좌표를 기본 물류 거점으로 설정합니다.</label>
                </div>
              )}

              <Button onClick={handleSave} className="w-full h-20 rounded-[32px] bg-obsidian text-mist font-black shadow-2xl hover:scale-[1.02] transition-all text-xl">
                데이터 전송 및 저장
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
