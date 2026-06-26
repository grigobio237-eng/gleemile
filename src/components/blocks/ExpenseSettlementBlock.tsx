import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Receipt, BellRing, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface BlockProps {
  role: string;
}

export function ExpenseSettlementBlock({ role }: BlockProps) {
  const [isPaid, setIsPaid] = useState(false);

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-lime-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">회비/비용 정산 모듈</p>
            <p className="text-[10px] font-bold text-slate-500">투명한 영수증 및 1/N 정산</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        
        {/* Receipt Widget */}
        <div className="bg-[#fcfbf9] border border-slate-200 rounded-xl p-4 relative overflow-hidden shadow-inner font-mono">
          <div className="absolute -top-2 left-4 right-4 flex justify-between">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-white border-b border-slate-200" />
            ))}
          </div>
          
          <div className="text-center mb-3 pt-2">
            <Receipt className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-500">6월 24일 회식 비용</p>
            <h3 className="text-xl font-black text-obsidian tracking-tighter">₩ 124,000</h3>
          </div>
          
          <div className="border-t border-dashed border-slate-300 my-2 pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">참여 인원</span>
              <span className="font-bold text-obsidian">8명</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="font-bold text-lime-700">1인당 정산 금액</span>
              <span className="font-black text-lime-700">₩ 15,500</span>
            </div>
          </div>
        </div>

        {/* Member Action */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <p className="text-xs font-bold text-obsidian">나의 입금 상태</p>
            <p className="text-[10px] text-slate-500">{isPaid ? '입금 확인 완료' : '미입금 (카카오뱅크 3333-01...)'}</p>
          </div>
          <div className="flex items-center gap-2">
            {isPaid && <span className="text-xs font-bold text-lime-600 flex items-center gap-1"><Check className="w-3 h-3"/> 완료</span>}
            <Switch checked={isPaid} onCheckedChange={setIsPaid} className="data-[state=checked]:bg-lime-500" />
          </div>
        </div>

        {/* Director Action */}
        {(role === 'director' || role === 'head_coach' || role === 'coach') && (
          <Button className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl gap-2 mt-2">
            <BellRing className="w-4 h-4" /> 미입금자 송금 알림 발송
          </Button>
        )}

      </CardContent>
    </Card>
  );
}
