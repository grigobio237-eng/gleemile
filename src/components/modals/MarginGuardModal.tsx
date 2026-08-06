'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Scale, TrendingDown, TrendingUp, Target,
  Plus, Trash2, Loader2, ChevronDown, ChevronUp, BarChart3
} from 'lucide-react';
import {
  calculateMenuMargin, calculateBep,
  saveMarginSettings, getMarginSettings
} from '@/lib/merchant-service';
import type { MenuItem, MarginSettings } from '@/types/merchant';

interface MarginGuardModalProps {
  teamId: string;
  onClose: () => void;
}

type Tab = 'menu' | 'bep';

const DEFAULT_FIXED_COSTS = { rent: 0, utilities: 0, laborCost: 0, other: 0 };

export default function MarginGuardModal({ teamId, onClose }: MarginGuardModalProps) {
  const [tab, setTab] = useState<Tab>('menu');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 메뉴 탭
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', salePrice: '', ingredientCost: '', packagingCost: '',
    deliveryFeeRate: '10', platformFeeRate: '9', pgFeeRate: '3',
  });

  // BEP 탭
  const [fixedCosts, setFixedCosts] = useState(DEFAULT_FIXED_COSTS);
  const [bepResult, setBepResult] = useState({ monthlyBep: 0, dailyBep: 0 });

  useEffect(() => {
    (async () => {
      try {
        const settings = await getMarginSettings(teamId);
        if (settings) {
          setMenuItems(settings.menuItems || []);
          setFixedCosts(settings.fixedCosts || DEFAULT_FIXED_COSTS);
          setBepResult(calculateBep({ fixedCosts: settings.fixedCosts || DEFAULT_FIXED_COSTS }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [teamId]);

  const handleAddMenu = () => {
    const sale = Number(newItem.salePrice);
    const ingredient = Number(newItem.ingredientCost);
    const packaging = Number(newItem.packagingCost);
    if (!newItem.name || !sale) { alert('메뉴명과 판매가를 입력해주세요.'); return; }

    const { netProfit, netMarginRate } = calculateMenuMargin({
      name: newItem.name,
      salePrice: sale,
      ingredientCost: ingredient,
      packagingCost: packaging,
      deliveryFeeRate: Number(newItem.deliveryFeeRate),
      platformFeeRate: Number(newItem.platformFeeRate),
      pgFeeRate: Number(newItem.pgFeeRate),
    });

    const item: MenuItem = {
      id: `item_${Date.now()}`,
      name: newItem.name,
      salePrice: sale,
      ingredientCost: ingredient,
      packagingCost: packaging,
      deliveryFeeRate: Number(newItem.deliveryFeeRate),
      platformFeeRate: Number(newItem.platformFeeRate),
      pgFeeRate: Number(newItem.pgFeeRate),
      netProfit,
      netMarginRate,
    };

    setMenuItems((prev) => [...prev, item]);
    setNewItem({ name: '', salePrice: '', ingredientCost: '', packagingCost: '', deliveryFeeRate: '10', platformFeeRate: '9', pgFeeRate: '3' });
    setShowAddForm(false);
  };

  const handleFixedCostChange = useCallback((key: keyof typeof fixedCosts, value: string) => {
    const updated = { ...fixedCosts, [key]: Number(value) || 0 };
    setFixedCosts(updated);
    setBepResult(calculateBep({ fixedCosts: updated }));
  }, [fixedCosts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMarginSettings(teamId, { fixedCosts, menuItems });
      alert('저장되었습니다!');
    } catch (e) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const totalMonthlyRevenue = menuItems.reduce((s, m) => s + m.salePrice, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Margin-Guard</h2>
              <p className="text-xs text-slate-500">실질 마진율 · 손익분기점 계산기</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="닫기">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-6 pt-4 pb-3 shrink-0">
          {([['menu', '메뉴별 마진'], ['bep', 'BEP 대시보드']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === id ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : tab === 'menu' ? (
            <MenuTab
              menuItems={menuItems}
              setMenuItems={setMenuItems}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              newItem={newItem}
              setNewItem={setNewItem}
              onAddMenu={handleAddMenu}
            />
          ) : (
            <BepTab
              fixedCosts={fixedCosts}
              bepResult={bepResult}
              menuItems={menuItems}
              onChange={handleFixedCostChange}
            />
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuTab({ menuItems, setMenuItems, showAddForm, setShowAddForm, newItem, setNewItem, onAddMenu }: any) {
  return (
    <div className="space-y-4">
      {menuItems.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold text-sm">등록된 메뉴가 없습니다</p>
          <p className="text-slate-400 text-xs mt-1">메뉴를 추가해 실질 마진율을 확인하세요</p>
        </div>
      )}

      {menuItems.map((item: MenuItem) => (
        <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-black text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-500">판매가 {item.salePrice.toLocaleString()}원</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-black ${item.netMarginRate >= 20 ? 'bg-emerald-100 text-emerald-700' : item.netMarginRate >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                {item.netMarginRate >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {item.netMarginRate}%
              </div>
              <button onClick={() => setMenuItems((prev: MenuItem[]) => prev.filter(m => m.id !== item.id))} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-slate-400">순이익</p>
              <p className="font-black text-slate-700">{item.netProfit >= 0 ? '+' : ''}{item.netProfit.toLocaleString()}원</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-slate-400">플랫폼 수수료</p>
              <p className="font-black text-slate-700">{item.platformFeeRate}%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-slate-400">배달비율</p>
              <p className="font-black text-slate-700">{item.deliveryFeeRate}%</p>
            </div>
          </div>
        </div>
      ))}

      {showAddForm && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2">
          <p className="text-sm font-black text-orange-700">새 메뉴 추가</p>
          {[
            { key: 'name', label: '메뉴명', placeholder: '예: 떡볶이', type: 'text' },
            { key: 'salePrice', label: '판매가 (원)', placeholder: '15000', type: 'number' },
            { key: 'ingredientCost', label: '식재료비 (원)', placeholder: '5000', type: 'number' },
            { key: 'packagingCost', label: '포장재비 (원)', placeholder: '500', type: 'number' },
            { key: 'platformFeeRate', label: '플랫폼 수수료율 (%)', placeholder: '9', type: 'number' },
            { key: 'deliveryFeeRate', label: '배달비율 (%)', placeholder: '10', type: 'number' },
            { key: 'pgFeeRate', label: 'PG 수수료율 (%)', placeholder: '3', type: 'number' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-bold text-slate-600 mb-1 block">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(newItem as any)[key]}
                onChange={(e) => setNewItem((prev: any) => ({ ...prev, [key]: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">취소</button>
            <button onClick={onAddMenu} className="flex-[2] py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600">추가</button>
          </div>
        </div>
      )}

      {!showAddForm && (
        <button onClick={() => setShowAddForm(true)} className="w-full py-3 rounded-2xl border-2 border-dashed border-orange-300 text-orange-500 font-bold text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> 메뉴 추가
        </button>
      )}
    </div>
  );
}

function BepTab({ fixedCosts, bepResult, menuItems, onChange }: any) {
  const totalMonthlyBep = bepResult.monthlyBep;
  const avgMarginRate = menuItems.length
    ? menuItems.reduce((s: number, m: MenuItem) => s + m.netMarginRate, 0) / menuItems.length
    : 0;
  const requiredRevenue = avgMarginRate > 0
    ? Math.ceil(totalMonthlyBep / (avgMarginRate / 100))
    : 0;
  const dailyRequired = Math.ceil(requiredRevenue / 25);

  const progress = requiredRevenue > 0 ? Math.min((totalMonthlyBep / requiredRevenue) * 100, 100) : 0;

  return (
    <div className="space-y-5">
      {/* BEP 결과 카드 */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5" />
          <p className="font-black">손익분기점 (BEP)</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-xs font-medium opacity-80">일일 최소 매출</p>
            <p className="text-2xl font-black">{dailyRequired > 0 ? `${(dailyRequired / 10000).toFixed(1)}만원` : '-'}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-xs font-medium opacity-80">월 최소 매출</p>
            <p className="text-2xl font-black">{requiredRevenue > 0 ? `${(requiredRevenue / 10000).toFixed(0)}만원` : '-'}</p>
          </div>
        </div>
        {menuItems.length === 0 && (
          <p className="text-xs opacity-70 mt-2">* 메뉴를 먼저 등록하면 더 정확한 BEP가 계산됩니다.</p>
        )}
      </div>

      {/* 진행 게이지 */}
      {requiredRevenue > 0 && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <p className="text-xs font-bold text-slate-600 mb-2">고정비 / 목표 매출 비율</p>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">고정비 {(totalMonthlyBep / 10000).toFixed(0)}만원 / 목표 매출 {(requiredRevenue / 10000).toFixed(0)}만원</p>
        </div>
      )}

      {/* 고정비 입력 */}
      <div>
        <p className="text-sm font-black text-slate-700 mb-3">월 고정비 입력</p>
        <div className="space-y-3">
          {[
            { key: 'rent', label: '임대료 (월세)', icon: '🏠' },
            { key: 'utilities', label: '공공요금 (전기·가스)', icon: '⚡' },
            { key: 'laborCost', label: '인건비', icon: '👥' },
            { key: 'other', label: '기타 고정비', icon: '📦' },
          ].map(({ key, label, icon }) => (
            <div key={key} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-lg">{icon}</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-600">{label}</p>
                <input
                  type="number"
                  value={(fixedCosts as any)[key] || ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder="0"
                  className="w-full text-sm font-black text-slate-800 bg-transparent focus:outline-none mt-0.5"
                />
              </div>
              <span className="text-xs text-slate-400">원</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-700 font-medium">
          💡 평균 마진율 <strong>{avgMarginRate.toFixed(1)}%</strong> 기준으로 BEP가 계산됩니다.
          메뉴 탭에서 메뉴를 추가하면 더 정확한 계산이 가능합니다.
        </p>
      </div>
    </div>
  );
}
