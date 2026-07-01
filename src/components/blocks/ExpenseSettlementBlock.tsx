import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { normalizeRole } from '@/types/role';

interface BlockProps {
  unreadCount?: number;
  role: string;
  teamId: string;
}

export function ExpenseSettlementBlock({ role, teamId, unreadCount }: BlockProps) {
  const [totalAsset, setTotalAsset] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initial = 0;
    let income = 0;
    let expense = 0;

    const teamUnsub = onSnapshot(doc(db, 'teams', teamId), (docSnap) => {
      if (docSnap.exists()) {
        initial = docSnap.data().initialBalance || 0;
        updateTotal();
      }
    });

    const incomeUnsub = onSnapshot(collection(db, 'teams', teamId, 'settlements'), (snap) => {
      let tempIncome = 0;
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const memSum = (data.participants || []).filter((p: any) => p.isDeposited).length * (data.perPersonAmount || 0);
        const guestSum = (data.guestDeposits || []).reduce((acc: number, g: any) => acc + g.amount, 0);
        tempIncome += memSum + guestSum;
      });
      income = tempIncome;
      updateTotal();
    });

    const expenseUnsub = onSnapshot(collection(db, 'teams', teamId, 'expenses'), (snap) => {
      let tempExpense = 0;
      snap.forEach(docSnap => {
        tempExpense += docSnap.data().amount || 0;
      });
      expense = tempExpense;
      updateTotal();
    });

    const updateTotal = () => {
      setTotalAsset(initial + income - expense);
      setLoading(false);
    };

    return () => {
      teamUnsub();
      incomeUnsub();
      expenseUnsub();
    };
  }, [teamId]);

  const isGuest = normalizeRole(role) === 'guest';

  const content = (
    <Card className={`rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white transition-all relative ${isGuest ? '' : 'hover:shadow-md hover:border-emerald-200'}`}>
      {/* 알림 뱃지: Deep Coral (#E05A47) */}
      {unreadCount !== undefined && unreadCount > 0 && (
        <div className="absolute top-2 right-2 bg-[#E05A47] text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce z-10">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
      <div className="px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">회비/비용 정산</p>
            <p className="text-[10px] text-slate-500 font-bold">N빵 정산과 회비 내역 공유.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isGuest ? (
            <span className="text-xs text-slate-400 font-bold">권한 없음</span>
          ) : loading ? (
            <div className="animate-pulse w-20 h-6 bg-slate-100 rounded-md"></div>
          ) : (
            <span className="font-black text-base text-emerald-600">
              ₩ {totalAsset.toLocaleString()}
            </span>
          )}
          {!isGuest && <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />}
        </div>
      </div>
    </Card>
  );

  return isGuest ? (
    <div className="block opacity-70">
      {content}
    </div>
  ) : (
    <Link href={`/mile/${teamId}/settlement`} className="block group">
      {content}
    </Link>
  );
}
