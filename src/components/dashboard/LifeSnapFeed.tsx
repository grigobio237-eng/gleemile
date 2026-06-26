'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, ChevronDown, Activity, Brain, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const CATEGORIES = [
  { id: 'ALL', label: '전체', emoji: '🌟' },
  { id: 'MEAL', label: '음식', emoji: '🍱' },
  { id: 'HYDRATION', label: '수분', emoji: '💧' },
  { id: 'SKIN', label: '피부', emoji: '✨' },
  { id: 'SLEEP', label: '수면', emoji: '🛏️' },
  { id: 'ACTIVITY', label: '활동', emoji: '🏃' },
  { id: 'ROUTINE', label: '루틴', emoji: '💊' },
  { id: 'BODY', label: '바디', emoji: '🤕' },
  { id: 'MEDICAL_DOC', label: '병원 서류', emoji: '📄' },
  { id: 'OTHER', label: '기타', emoji: '📸' },
];

export default function LifeSnapFeed() {
  const [snaps, setSnaps] = useState<any[]>([]);
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentEndDate, setCurrentEndDate] = useState<Date>(new Date());
  const [hasMore, setHasMore] = useState(true);

  const fetchSnaps = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // If loading more, the new endDate is 7 days before the current endDate
      let fetchEndDate = currentEndDate;
      if (isLoadMore) {
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() - 7);
        fetchEndDate = newEndDate;
        setCurrentEndDate(newEndDate);
      }

      const res = await fetch(`/api/dashboard/snaps?category=${category}&endDate=${fetchEndDate.toISOString()}`);
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          if (isLoadMore) {
            setSnaps(prev => [...prev, ...result.data]);
            if (result.data.length === 0) {
                setHasMore(false); // No more data found in that 7 day period
            }
          } else {
            setSnaps(result.data);
            setCurrentEndDate(new Date()); // reset to now
            setHasMore(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch snaps', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Re-fetch when category changes
  useEffect(() => {
    setCurrentEndDate(new Date());
    fetchSnaps(false);
  }, [category]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}시 ${d.getMinutes()}분`;
  };

  const getCategoryEmoji = (catId: string) => CATEGORIES.find(c => c.id === catId)?.emoji || '📸';
  const getCategoryLabel = (catId: string) => CATEGORIES.find(c => c.id === catId)?.label || '기타';

  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteModal({ show: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      const res = await fetch(`/api/dashboard/snaps/${deleteModal.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSnaps(prev => prev.filter(snap => snap._id !== deleteModal.id));
        setDeleteModal({ show: false, id: null });
      } else {
        alert('삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Delete failed', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 relative">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModal({ show: false, id: null })}
              className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl border border-line flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center shadow-inner text-4xl">
                🗑️
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-obsidian tracking-tight text-xl">기록을 삭제할까요?</h3>
                <p className="text-sm text-slate/70 font-bold leading-relaxed px-4">
                  선택하신 기록은 데이터베이스에서 <span className="text-red-500">영구히 삭제</span>되며 복구할 수 없습니다.<br/>
                  또한 <span className="text-chapter-accent">7일 회복 챌린지</span> 데이터와 통계에도 즉시 반영됩니다.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteModal({ show: false, id: null })}
                  className="flex-1 h-14 rounded-2xl bg-mist text-slate font-black hover:bg-line transition-all"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-black hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                >
                  기록 삭제
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Filter - Horizontal Scroll for Mobile */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-2">
        <div className="flex gap-2 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black tracking-wider flex items-center gap-2 transition-all ${
                category === cat.id
                  ? 'bg-obsidian text-white shadow-md'
                  : 'bg-white text-slate/60 border border-line hover:border-obsidian/20'
              }`}
            >
              <span className="text-sm">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Area */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-chapter-accent" />
        </div>
      ) : snaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-[32px] border border-line">
          <div className="w-16 h-16 bg-mist rounded-full flex items-center justify-center text-3xl">📭</div>
          <p className="text-slate/60 font-bold text-sm">최근 7일간 기록된 스냅이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <AnimatePresence mode="popLayout">
              {snaps.map((snap) => (
                <motion.div
                  key={snap._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer relative"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteClick(e, snap._id)}
                    title="기록 삭제"
                    className="absolute top-1.5 right-1.5 z-20 w-7 h-7 bg-black/30 hover:bg-red-500 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Image Section - Mini Thumbnail */}
                  <div className="relative w-full aspect-square bg-mist overflow-hidden">
                    {snap.imageUrl ? (
                      <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={snap.imageUrl} alt="Snap" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">
                        {getCategoryEmoji(snap.category)}
                      </div>
                    )}
                    
                    <div className="absolute top-1.5 left-1.5">
                      <div className="bg-white/90 backdrop-blur text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm border border-line/10">
                        {getCategoryEmoji(snap.category)}
                      </div>
                    </div>
                    
                    {snap.score > 0 && (
                      <div className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-chapter-accent/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-lg">
                        {snap.score}
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-1.5 left-1.5 text-white/90 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDate(snap.createdAt).split(' ')[0]} {formatDate(snap.createdAt).split(' ')[1]}
                    </div>
                  </div>

                  {/* Content Section - Ultra Compact */}
                  <div className="p-2 space-y-1 flex-1 flex flex-col justify-center bg-mist/10">
                    <p className="text-[10px] font-bold text-obsidian leading-tight line-clamp-2 italic text-center px-1">
                      "{snap.summary}"
                    </p>
                    <p className="text-[8px] text-slate/40 font-bold text-center uppercase tracking-tighter">
                      {formatDate(snap.createdAt).split(' ')[0]} {formatDate(snap.createdAt).split(' ')[1]}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {hasMore && (
            <div className="pt-10 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchSnaps(true)}
                disabled={loadingMore}
                className="px-8 h-12 rounded-full border-2 border-line text-slate font-black text-xs tracking-widest hover:bg-mist transition-all flex items-center gap-2"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                더 보기
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
