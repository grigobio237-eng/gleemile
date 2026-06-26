'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, ChevronRight, AlertCircle } from 'lucide-react';
import NoticeDetailModal from '@/components/ui/NoticeDetailModal';

interface Notice {
  _id: string;
  title: string;
  content: string;
  type: string;
  isImportant: boolean;
  createdAt: string;
  viewCount: number;
  images?: string[];
  attachments?: any[];
}

export default function NoticeTicker() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await fetch('/api/notices?limit=10');
      const data = await response.json();

      if (data.success) {
        const { pinnedNotices, notices: regularNotices } = data.data;
        
        // 중요 공지 우선, 그 다음 일반 공지 (최신순)
        const combined = [...(pinnedNotices || []), ...(regularNotices || [])];
        
        if (combined.length > 0) {
          setNotices(combined);
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error fetching notices for ticker:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isVisible || notices.length === 0) return null;

  return (
    <>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="relative w-full bg-background/80 backdrop-blur-md border-b border-line/50 text-text-secondary overflow-hidden z-[49]"
      >
        <div className="flex items-center h-8 md:h-10 px-2 md:px-4">
          {/* Ticker Container */}
          <div className="relative flex-1 overflow-hidden h-full flex items-center group">
            <div className="flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]">
              {/* Double items for infinite loop */}
              {[...notices, ...notices].map((notice, idx) => (
                <button
                  key={`${notice._id}-${idx}`}
                  onClick={() => setSelectedNotice(notice)}
                  className="inline-flex items-center gap-1.5 mx-4 md:mx-12 text-[10px] md:text-xs font-bold hover:text-primary transition-colors cursor-pointer tracking-tighter"
                >
                  {notice.isImportant && (
                    <AlertCircle className="w-2.5 h-2.5 text-rose-500 fill-rose-500/10 flex-shrink-0" />
                  )}
                  <span className={notice.isImportant ? "text-text-primary font-black" : "text-text-secondary/90"}>
                    {notice.title}
                  </span>
                  <ChevronRight className="w-2.5 h-2.5 opacity-20 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <NoticeDetailModal
        notice={selectedNotice}
        isOpen={!!selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </>
  );
}

