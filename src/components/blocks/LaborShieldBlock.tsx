'use client';

import React, { useState, lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const LaborShieldModal = lazy(() => import('@/components/modals/LaborShieldModal'));

interface BlockProps {
  teamId?: string;
  role: string;
}

export function LaborShieldBlock({ teamId, role }: BlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="block w-full h-full">
        <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer relative group h-full">
          <CardContent className="p-4 h-full flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-obsidian text-[15px]">Labor-Shield</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">전자근로계약서 · 노무 방어</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={null}>
        {open && teamId && <LaborShieldModal teamId={teamId} onClose={() => setOpen(false)} />}
      </Suspense>
    </>
  );
}
