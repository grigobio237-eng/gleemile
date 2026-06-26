'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Calendar, Link as LinkIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface NoticeDetailModalProps {
  notice: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NoticeDetailModal({ notice, isOpen, onClose }: NoticeDetailModalProps) {
  if (!notice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 rounded-[32px] border-none bg-mist/95 backdrop-blur-xl shadow-2xl scale-in-center">
        <div className="overflow-y-auto max-h-[85vh] custom-scrollbar">
          {/* Header Image or Colored Banner */}
          <div className={`h-32 w-full ${notice.type === 'important' ? 'bg-gradient-to-r from-rose-500/10 to-rose-400/5' : 'bg-gradient-to-r from-primary/10 to-primary/5'} flex items-end px-8 pb-6`}>
             <div className="flex items-center gap-2">
                <Badge variant={notice.type === 'important' ? "destructive" : "outline"} className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {notice.type === 'important' ? 'Important' : 'Notice'}
                </Badge>
                {notice.type === 'important' && <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />}
             </div>
          </div>

          <div className="px-8 pt-6 pb-12">
            <DialogHeader className="text-left mb-8">
              <DialogTitle className="text-2xl md:text-3xl font-serif text-obsidian leading-tight tracking-tight">
                {notice.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-slate/50 text-xs mt-3">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(notice.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                <span className="w-1 h-1 rounded-full bg-slate/20 mx-1" />
                조회수 {notice.viewCount || 0}
              </DialogDescription>
            </DialogHeader>

            {/* Content Area */}
            <div className="space-y-8">
              {/* Content Text */}
              <div className="text-slate/80 leading-relaxed text-sm md:text-base whitespace-pre-wrap font-medium">
                {notice.content}
              </div>

              {/* Images */}
              {notice.images && notice.images.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  {notice.images.map((img: string, idx: number) => (
                    <motion.img
                      key={idx}
                      src={img}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      alt={`Reference ${idx + 1}`}
                      className="w-full rounded-2xl shadow-md border border-white/20"
                    />
                  ))}
                </div>
              )}

              {/* Attachments */}
              {notice.attachments && notice.attachments.length > 0 && (
                <div className="bg-white/50 rounded-2xl p-6 border border-line/30 space-y-3">
                  <h4 className="text-xs font-black text-slate/40 flex items-center gap-2 uppercase tracking-widest">
                    <FileText className="w-3.5 h-3.5" /> Attachments
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {notice.attachments.map((file: any, idx: number) => (
                      <a
                        key={idx}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-mist rounded-xl border border-line/50 hover:border-primary/50 hover:bg-white transition-all group"
                      >
                        <LinkIcon className="w-4 h-4 text-slate/40 group-hover:text-primary" />
                        <span className="text-sm font-semibold text-slate/70 group-hover:text-obsidian truncate max-w-[200px]">
                          {file.fileName || '첨부파일'}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-end">
                <Button 
                    onClick={onClose}
                    variant="outline"
                    className="rounded-full px-8 py-6 border-obsidian/10 text-obsidian hover:bg-obsidian hover:text-mist transition-all font-bold"
                >
                    확인 및 닫기
                </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

