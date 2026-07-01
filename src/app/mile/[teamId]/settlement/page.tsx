'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Receipt, Users, Plus, CheckCircle2, Circle, Loader2, Save, Settings, X, ChevronDown, Coins, CreditCard, Camera, FileText, Trash2 } from 'lucide-react';

import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocs, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TeamSettlement, settlementConverter, SettlementParticipant, GuestDeposit, ExpenseRecord, expenseConverter } from '@/types/settlement';
import { teamMemberConverter } from '@/types/team';
import { compressImageToWebP } from '@/lib/image';
import { normalizeRole } from '@/types/role';

interface ExpenseItemForm {
  id: string;
  title: string;
  amountStr: string;
  file: File | null;
  previewUrl: string | null;
}

export default function SettlementPage() {
  const { data: session } = useSession();
  const params = useParams();
  const teamId = params?.teamId as string || 'default-team';

  const [settlements, setSettlements] = useState<TeamSettlement[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');

  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalanceStr, setTempBalanceStr] = useState('');

  // 수입 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [perPersonAmount, setPerPersonAmount] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(0);
  
  const [teamMembers, setTeamMembers] = useState<{userId: string, name: string}[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState('member');

  const [guestDeposits, setGuestDeposits] = useState<GuestDeposit[]>([]);
  const [guestMemo, setGuestMemo] = useState('');
  const [guestAmountStr, setGuestAmountStr] = useState('');

  const [savedBankAccounts, setSavedBankAccounts] = useState<string[]>([]);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [isManageBankModalOpen, setIsManageBankModalOpen] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 다중 지출 폼 상태
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItemForm[]>([
    { id: 'initial_1', title: '', amountStr: '', file: null, previewUrl: null }
  ]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const loadData = async () => {
      try {
        const myMemberRef = collection(db, 'team_members');
        const myQ = query(myMemberRef, where('teamId', '==', teamId), where('userId', '==', session.user.id));
        const mySnap = await getDocs(myQ);
        if (!mySnap.empty) {
          setUserRole(normalizeRole(mySnap.docs[0].data().role));
        } else {
          setUserRole('owner');
        }

        const teamRef = doc(db, 'teams', teamId);
        const teamSnap = await getDoc(teamRef);
        if (teamSnap.exists()) {
          const data = teamSnap.data();
          setSavedBankAccounts(data.savedBankAccounts || []);
          setInitialBalance(data.initialBalance || 0);
        }
      } catch (e) {
        console.error('Failed to fetch team data:', e);
      }

      try {
        const membersRef = collection(db, 'team_members').withConverter(teamMemberConverter);
        const q = query(membersRef, where('teamId', '==', teamId), where('status', '==', 'active'));
        const snap = await getDocs(q);
        
        const fetchedMembers = [];
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          const userDocRef = doc(db, 'users', data.userId);
          const userSnap = await getDoc(userDocRef);
          const name = userSnap.exists() ? userSnap.data().name : `Member ${data.userId.substring(0, 4)}`;
          fetchedMembers.push({ userId: data.userId, name });
        }
        if (fetchedMembers.length === 0) {
          fetchedMembers.push(
            { userId: session.user.id || 'me', name: session.user.name || '나' },
            { userId: 'test_user_1', name: '김팀원' }
          );
        }
        setTeamMembers(fetchedMembers);
        setTargetCount(fetchedMembers.length);
      } catch (e) {
        console.error('Failed to fetch members:', e);
      }
    };

    loadData();

    const settlementsRef = collection(db, 'teams', teamId, 'settlements').withConverter(settlementConverter);
    const sQuery = query(settlementsRef, orderBy('createdAt', 'desc'));
    const unsubSettlements = onSnapshot(sQuery, (snapshot) => {
      const fetched: TeamSettlement[] = [];
      snapshot.forEach(doc => fetched.push(doc.data()));
      setSettlements(fetched);
    });

    const expensesRef = collection(db, 'teams', teamId, 'expenses').withConverter(expenseConverter);
    const eQuery = query(expensesRef, orderBy('expenseDate', 'desc'));
    const unsubExpenses = onSnapshot(eQuery, (snapshot) => {
      const fetched: ExpenseRecord[] = [];
      snapshot.forEach(doc => fetched.push(doc.data()));
      setExpenses(fetched);
      setLoading(false);
    });

    return () => {
      unsubSettlements();
      unsubExpenses();
    };
  }, [session, teamId]);

  // 자산 계산
  const totalIncome = settlements.reduce((acc, s) => {
    const memSum = s.participants.filter(p => p.isDeposited).length * s.perPersonAmount;
    const guestSum = (s.guestDeposits || []).reduce((gAcc, g) => gAcc + g.amount, 0);
    return acc + memSum + guestSum;
  }, 0);

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalAsset = initialBalance + totalIncome - totalExpense;

  const handleUpdateBalance = async () => {
    const num = parseInt(tempBalanceStr.replace(/[^0-9]/g, ''), 10) || 0;
    try {
      await updateDoc(doc(db, 'teams', teamId), { initialBalance: num });
      setInitialBalance(num);
      setIsEditingBalance(false);
    } catch (e) {
      console.error('Failed to update balance', e);
      alert('초기 자산금 업데이트 실패');
    }
  };

  // --- 수입 핸들러 ---
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) {
      setDisplayAmount('');
      setPerPersonAmount(0);
      return;
    }
    const numValue = parseInt(rawValue, 10);
    setPerPersonAmount(numValue);
    setDisplayAmount(numValue.toLocaleString());
  };

  const handleTargetCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setTargetCount(rawValue ? parseInt(rawValue, 10) : 0);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleGuestAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setGuestAmountStr(rawValue ? parseInt(rawValue, 10).toLocaleString() : '');
  };

  const addGuestDeposit = () => {
    const amount = parseInt(guestAmountStr.replace(/[^0-9]/g, ''), 10);
    if (!guestMemo || !amount) return;
    const newDeposit: GuestDeposit = {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      memo: guestMemo,
      createdAt: new Date()
    };
    setGuestDeposits([...guestDeposits, newDeposit]);
    setGuestMemo('');
    setGuestAmountStr('');
  };

  const removeGuestDeposit = (id: string) => {
    setGuestDeposits(guestDeposits.filter(d => d.id !== id));
  };

  const handleIncomeSubmit = async () => {
    const totalAmount = parseInt(displayAmount.replace(/[^0-9]/g, ''), 10) || 0;
    const count = selectedUserIds.size;

    if (!title || !totalAmount || count === 0 || !bankInfo) return alert('필수 항목을 모두 입력하고 참여자를 선택해주세요.');
    setFormLoading(true);
    try {
      // 1/N 단수 오차 보정 알고리즘
      const baseAmount = Math.floor(totalAmount / count);
      const remainder = totalAmount % count;

      let index = 0;
      const participants: SettlementParticipant[] = teamMembers
        .filter(m => selectedUserIds.has(m.userId))
        .map(member => {
          const finalAmount = baseAmount + (index < remainder ? 1 : 0);
          index++;
          return {
            userId: member.userId,
            name: member.name,
            isDeposited: false, // 이제 방금 정산 요청을 만든 것이므로 모두 미입금 상태
            depositedAt: null,
            amount: finalAmount
          };
        });

      const newRef = doc(collection(db, 'teams', teamId, 'settlements'));
      await setDoc(newRef, {
        id: newRef.id,
        title, 
        targetCount: count, 
        perPersonAmount: baseAmount, // 대표 금액으로 기본값 저장
        totalAmount: totalAmount,
        bankInfo, 
        status: 'IN_PROGRESS', 
        participants, 
        guestDeposits,
        authorId: { name: session?.user?.name || '관리자', avatar: session?.user?.image || null },
        createdAt: serverTimestamp()
      });

      setShowForm(false);
      setTitle(''); setDisplayAmount(''); setPerPersonAmount(0);
      setBankInfo(''); setSelectedUserIds(new Set()); setGuestDeposits([]);
    } catch (error) {
      console.error('수입 등록 오류:', error);
      alert('등록 실패');
    } finally {
      setFormLoading(false);
    }
  };

  // --- 지출 핸들러 (다중 항목) ---
  const handleExpenseItemChange = (id: string, field: keyof ExpenseItemForm, value: any) => {
    setExpenseItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'amountStr') {
          const rawValue = value.replace(/[^0-9]/g, '');
          return { ...item, amountStr: rawValue ? parseInt(rawValue, 10).toLocaleString() : '' };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleExpenseFileSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setExpenseItems(prev => prev.map(item => item.id === id ? { ...item, file, previewUrl: url } : item));
    }
  };

  const removeExpenseFile = (id: string) => {
    setExpenseItems(prev => prev.map(item => item.id === id ? { ...item, file: null, previewUrl: null } : item));
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { id: Math.random().toString(36).substr(2, 9), title: '', amountStr: '', file: null, previewUrl: null }]);
  };

  const removeExpenseItem = (id: string) => {
    if (expenseItems.length === 1) return; // 최소 1개는 유지
    setExpenseItems(prev => prev.filter(item => item.id !== id));
  };

  const handleMultiExpenseSubmit = async () => {
    // 유효성 검사
    const validItems = expenseItems.filter(item => item.title.trim() && item.amountStr);
    if (validItems.length === 0) return alert('최소 1개 이상의 지출 항목을 올바르게 입력해주세요. (항목명, 금액 필수)');

    setExpenseLoading(true);
    try {
      // 모든 valid items를 병렬로 업로드 및 저장
      const promises = validItems.map(async (item) => {
        const amount = parseInt(item.amountStr.replace(/[^0-9]/g, ''), 10);
        let receiptUrl = '';
        
        if (item.file) {
          const webpBlob = await compressImageToWebP(item.file);
          const storageRef = ref(storage, `teams/${teamId}/receipts/${Date.now()}_${item.id}.webp`);
          const snapshot = await uploadBytes(storageRef, webpBlob);
          receiptUrl = await getDownloadURL(snapshot.ref);
        }

        const newRef = doc(collection(db, 'teams', teamId, 'expenses'));
        return setDoc(newRef, {
          id: newRef.id,
          title: item.title,
          amount,
          expenseDate,
          receiptUrl,
          authorId: { name: session?.user?.name || '관리자', avatar: session?.user?.image || null },
          createdAt: serverTimestamp()
        });
      });

      await Promise.all(promises);

      setShowExpenseForm(false);
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpenseItems([{ id: 'initial_1', title: '', amountStr: '', file: null, previewUrl: null }]);
    } catch (e) {
      console.error('지출 등록 오류:', e);
      alert('지출 등록 중 오류가 발생했습니다.');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleAddBankAccount = async () => {
    if (!newBankAccount.trim()) return;
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, { savedBankAccounts: arrayUnion(newBankAccount.trim()) });
      setSavedBankAccounts(prev => [...prev, newBankAccount.trim()]);
      setNewBankAccount('');
    } catch (e) { console.error("Error", e); }
  };

  const handleDeleteBankAccount = async (account: string) => {
    if (!confirm('이 계좌를 삭제하시겠습니까?')) return;
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, { savedBankAccounts: arrayRemove(account) });
      setSavedBankAccounts(prev => prev.filter(a => a !== account));
    } catch (e) { console.error("Error", e); }
  };

  const isManager = userRole === 'owner' || userRole === 'manager';

  if (loading) return <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 pb-24 font-sans relative selection:bg-emerald-200">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-16">
        
        {/* 상단 네비게이션 및 자산 요약 */}
        <div>
          <Link href={`/mile/${teamId}/dashboard`} className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-4 font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
          </Link>
          
          <div className="bg-obsidian rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Coins className="w-32 h-32 text-white transform rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 font-bold text-sm flex items-center gap-2">우리 팀 총 자산</p>
                {isManager && (
                  <button onClick={() => { setIsEditingBalance(!isEditingBalance); setTempBalanceStr(initialBalance.toLocaleString()); }} className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors" title="이월금/초기 자산금 설정">
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <h2 className="text-3xl font-black text-white tracking-tight mb-6">₩ {totalAsset.toLocaleString()}</h2>
              
              {isEditingBalance && (
                <div className="bg-slate-800 rounded-xl p-3 flex gap-2 mb-4 animate-in fade-in slide-in-from-top-1 border border-slate-700">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">이전 모임 이월금 (초기 자본금)</label>
                    <input 
                      value={tempBalanceStr} 
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setTempBalanceStr(raw ? parseInt(raw, 10).toLocaleString() : '');
                      }}
                      className="w-full bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-700 outline-none focus:border-primary"
                      placeholder="금액 입력"
                    />
                  </div>
                  <Button onClick={handleUpdateBalance} className="self-end bg-primary hover:bg-primary/90 text-white h-[34px] px-4 font-bold rounded-lg text-xs">저장</Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold mb-1">총 수입 (회비+기타)</p>
                  <p className="text-emerald-400 font-black text-lg tracking-tight">+ ₩{totalIncome.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold mb-1">총 지출</p>
                  <p className="text-rose-400 font-black text-lg tracking-tight">- ₩{totalExpense.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-2xl">
          <button onClick={() => { setActiveTab('income'); setShowForm(false); }} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Coins className="w-4 h-4" /> 수입 (회비 걷기)
          </button>
          <button onClick={() => { setActiveTab('expense'); setShowExpenseForm(false); }} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <CreditCard className="w-4 h-4" /> 지출 (비용 쓰기)
          </button>
        </div>

        {/* ----------------- 수입(정산) 탭 ----------------- */}
        {activeTab === 'income' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {!showForm && isManager && (
              <Button onClick={() => setShowForm(true)} className="w-full h-14 rounded-2xl bg-white border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-black text-lg shadow-sm">
                <Plus className="w-5 h-5 mr-2" /> 수입 등록
              </Button>
            )}

            {showForm && (
              <Card className="rounded-3xl border-2 border-primary/20 shadow-2xl overflow-visible">
                <CardContent className="p-6 space-y-5 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-black text-lg text-obsidian flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-primary" /> 새 회비 등록
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate mb-1 block">정산 항목명</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 6월 24일 회식 비용" className="w-full h-12 px-4 rounded-xl border border-line text-sm font-bold bg-slate-50 focus:bg-white focus:border-primary outline-none" />
                  </div>
                  <div className="relative" ref={dropdownRef}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate block">입금 계좌 정보</label>
                      {isManager && (
                        <button onClick={() => setIsManageBankModalOpen(true)} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-primary transition-colors font-bold bg-slate-50 px-2 py-1 rounded-md">
                          <Settings className="w-3 h-3" /> 계좌 관리
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} onFocus={() => setIsBankDropdownOpen(true)} placeholder="카카오뱅크 3333-01..." className="w-full h-12 px-4 pr-10 rounded-xl border border-line text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none" />
                      <button onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                    {isBankDropdownOpen && savedBankAccounts.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                        {savedBankAccounts.map((account, idx) => (
                          <div key={idx} onClick={() => { setBankInfo(account); setIsBankDropdownOpen(false); }} className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-primary cursor-pointer border-b border-slate-50 last:border-0">{account}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-primary mb-1 block">총 정산액 (원)</label>
                      <input type="text" value={displayAmount} onChange={handleAmountChange} placeholder="0" className="w-full h-12 px-3 rounded-xl border-2 border-primary/30 text-lg font-black text-primary bg-emerald-50/50 outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate mb-1 block">목표 인원 (선택됨)</label>
                      <input type="text" value={selectedUserIds.size} disabled className="w-full h-12 px-3 rounded-xl border-2 border-slate-200 text-lg font-black bg-slate-100 text-slate-500 outline-none cursor-not-allowed" />
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate mb-2 block">N빵 참여자 선택 (클릭하여 포함/제외)</label>
                    <div className="bg-slate-50 p-2 rounded-xl max-h-32 overflow-y-auto space-y-1 mb-3">
                      {teamMembers.map(m => (
                        <div key={m.userId} onClick={() => toggleUserSelection(m.userId)} className={`flex gap-3 p-2 rounded-lg cursor-pointer border ${selectedUserIds.has(m.userId) ? 'bg-white border-primary' : 'border-transparent'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedUserIds.has(m.userId) ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                            {selectedUserIds.has(m.userId) && <CheckCircle2 className="w-2 h-2 text-white" />}
                          </div>
                          <span className={`text-sm ${selectedUserIds.has(m.userId) ? 'font-bold text-primary' : 'font-medium text-slate-600'}`}>{m.name}</span>
                        </div>
                      ))}
                    </div>

                    <label className="text-xs font-bold text-slate mb-2 block">기타 외부 입금 추가</label>
                    <div className="bg-white border border-slate-200 p-3 rounded-xl mb-3 space-y-2">
                      <input value={guestMemo} onChange={e => setGuestMemo(e.target.value)} placeholder="입금자명 또는 메모 (예: 외부인 홍길동)" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary bg-slate-50 focus:bg-white" />
                      <div className="flex gap-2">
                        <input value={guestAmountStr} onChange={handleGuestAmountChange} placeholder="금액 (원)" className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none text-right font-bold text-primary focus:border-primary bg-slate-50 focus:bg-white" />
                        <Button onClick={addGuestDeposit} className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm shrink-0">추가</Button>
                      </div>
                    </div>
                    {guestDeposits.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {guestDeposits.map(d => (
                          <div key={d.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="font-bold text-slate-700">{d.memo}</span><span className="font-black text-primary">₩ {d.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 flex flex-col gap-1.5 border border-emerald-100 mb-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold">총 예상 금액 ({selectedUserIds.size}명 기준)</span>
                      <span className="font-bold text-slate-700">₩ {(parseInt(displayAmount.replace(/[^0-9]/g, ''), 10) || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1 border-t border-emerald-100 pt-2">
                      <span className="text-slate-400 font-bold">1인당 분담금</span>
                      <span className="text-emerald-600 font-bold">
                        {selectedUserIds.size > 0 
                          ? `약 ₩ ${Math.floor((parseInt(displayAmount.replace(/[^0-9]/g, ''), 10) || 0) / selectedUserIds.size).toLocaleString()}` 
                          : '0'}
                      </span>
                    </div>
                  </div>

                  <Button onClick={handleIncomeSubmit} disabled={formLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-xl mt-4">
                    {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '수입 등록하기'}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4 pt-2">
              {settlements.map(s => {
                const totalCol = s.participants.filter(p=>p.isDeposited).reduce((acc, p) => acc + (p.amount || s.perPersonAmount), 0) + (s.guestDeposits||[]).reduce((a,b)=>a+b.amount,0);
                return (
                  <Card key={s.id} className="rounded-2xl shadow-sm border-none bg-white">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-black text-obsidian">{s.title}</h3>
                          <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge className={s.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                          {s.status === 'IN_PROGRESS' ? '진행 중' : '완료'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm items-end bg-slate-50 p-3 rounded-xl">
                        <span className="font-bold text-slate-500">목표: ₩ {s.totalAmount.toLocaleString()}</span>
                        <div className="text-right">
                          <p className="text-[10px] text-primary font-bold mb-0.5">현재 모인 금액</p>
                          <p className="text-lg font-black text-primary">₩ {totalCol.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* ----------------- 지출 탭 ----------------- */}
        {activeTab === 'expense' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {!showExpenseForm && isManager && (
              <Button onClick={() => setShowExpenseForm(true)} className="w-full h-14 rounded-2xl bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 font-black text-lg shadow-sm">
                <Plus className="w-5 h-5 mr-2" /> 지출 등록
              </Button>
            )}

            {showExpenseForm && (
              <Card className="rounded-3xl border-2 border-rose-200 shadow-2xl overflow-visible bg-white">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-black text-lg text-obsidian flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-rose-500" /> 일괄 지출 등록
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => { setShowExpenseForm(false); }} className="h-8 w-8 p-0 rounded-full text-slate-400">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate mb-1 block">공통 지출 날짜</label>
                    <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-line text-sm font-bold bg-slate-50 outline-none focus:border-rose-400" />
                  </div>

                  {/* 다중 지출 항목 리스트 */}
                  <div className="space-y-3">
                    {expenseItems.map((item, index) => (
                      <div key={item.id} className="relative bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-black text-slate-500">항목 {index + 1}</span>
                          {expenseItems.length > 1 && (
                            <button onClick={() => removeExpenseItem(item.id)} className="text-slate-400 hover:text-rose-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input 
                              value={item.title} 
                              onChange={(e) => handleExpenseItemChange(item.id, 'title', e.target.value)} 
                              placeholder="지출 항목명 (예: 1차 식대)" 
                              className="flex-1 min-w-0 h-12 px-4 rounded-xl border border-line text-sm font-bold focus:border-rose-400 outline-none" 
                            />
                            
                            <input 
                              type="file" accept="image/*" capture="environment"
                              ref={(el) => { fileInputRefs.current[item.id] = el; }}
                              onChange={(e) => handleExpenseFileSelect(item.id, e)}
                              className="hidden" 
                            />
                            
                            {!item.previewUrl ? (
                              <button 
                                onClick={() => fileInputRefs.current[item.id]?.click()}
                                className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0 border border-slate-200"
                                title="영수증 첨부"
                              >
                                <Camera className="w-5 h-5" />
                              </button>
                            ) : (
                              <div className="w-12 h-12 rounded-xl border-2 border-slate-300 relative overflow-hidden group shrink-0">
                                <img src={item.previewUrl} alt="Receipt" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => removeExpenseFile(item.id)}
                                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-end">
                            <label className="text-xs font-bold text-rose-400 mr-2">금액</label>
                            <input 
                              value={item.amountStr} 
                              onChange={(e) => handleExpenseItemChange(item.id, 'amountStr', e.target.value)} 
                              placeholder="0" 
                              className="w-32 h-12 px-4 rounded-xl border-2 border-rose-100 text-right text-base font-black text-rose-500 focus:border-rose-400 outline-none bg-white" 
                            />
                            <span className="text-sm font-bold text-rose-500 ml-2">원</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button onClick={addExpenseItem} className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl border border-dashed border-slate-300">
                    <Plus className="w-4 h-4 mr-1" /> 항목 하나 더 추가
                  </Button>

                  <Button onClick={handleMultiExpenseSubmit} disabled={expenseLoading} className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white font-black text-lg rounded-xl mt-4 shadow-lg shadow-rose-500/20">
                    {expenseLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : '선택된 항목 모두 등록'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 지출 카드 리스트 */}
            <div className="space-y-4 pt-2">
              {expenses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                  <CreditCard className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 font-bold text-sm">등록된 지출 내역이 없습니다</p>
                </div>
              ) : (
                expenses.map(e => (
                  <Card key={e.id} className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
                    <CardContent className="p-0 flex">
                      <div className="w-20 bg-slate-100 flex items-center justify-center shrink-0 border-r border-slate-100 relative">
                        {e.receiptUrl ? (
                          <img src={e.receiptUrl} alt="receipt" className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                          <FileText className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-obsidian text-sm">{e.title}</h3>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{e.expenseDate}</span>
                        </div>
                        <p className="text-lg font-black text-rose-500">- ₩ {e.amount.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

      </div>
      
      {/* 계좌 모달 (간소화) */}
      {isManageBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-black text-lg text-obsidian">계좌 관리</h3>
              <button onClick={() => setIsManageBankModalOpen(false)}><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            <div className="space-y-2 mb-4">
              {savedBankAccounts.map((acc, idx) => (
                <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100">
                  {acc} <button onClick={() => handleDeleteBankAccount(acc)} className="text-red-400">삭제</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newBankAccount} onChange={e => setNewBankAccount(e.target.value)} placeholder="은행명 계좌번호 예금주" className="flex-1 px-3 border border-slate-200 rounded-lg text-sm" />
              <Button onClick={handleAddBankAccount} className="bg-slate-800 px-3">추가</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
