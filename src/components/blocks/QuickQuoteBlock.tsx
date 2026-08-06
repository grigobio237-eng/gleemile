'use client';

import React, { useState, lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const QuickQuoteModal = lazy(() => import('@/components/modals/QuickQuoteModal'));

interface BlockProps {
  teamId?: string;
  role: string;
}

export function QuickQuoteBlock({ teamId, role }: BlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="block w-full h-full">
        <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer relative group h-full">
          <CardContent className="p-4 h-full flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-obsidian text-[15px]">Quick-Quote</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">1분 사진 견적서 · AS 방어</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={null}>
        {open && teamId && <QuickQuoteModal teamId={teamId} onClose={() => setOpen(false)} />}
      </Suspense>
    </>
  );
}
