import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserCheck, MapPin, CalendarClock, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockProps {
  role: string;
}

export function ClassAttendanceBlock({ role }: BlockProps) {
  const [attendance, setAttendance] = useState<'pending' | 'present' | 'absent'>('pending');

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-violet-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">수강 등록/출석부</p>
            <p className="text-[10px] font-bold text-slate-500">노쇼 방지 및 출석 체크</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        
        {/* Next Session Info */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-red-500 uppercase">Jun</span>
            <span className="text-sm font-black text-obsidian leading-none">28</span>
          </div>
          <div>
            <p className="font-bold text-sm text-obsidian">정규 클래스 4회차</p>
            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <CalendarClock className="w-3 h-3" /> 19:00 ~ 21:00
            </p>
          </div>
        </div>

        {/* Action Area */}
        {attendance === 'pending' ? (
          <div className="space-y-2">
            <p className="text-xs font-bold text-center text-slate-600 mb-1">내일 모임에 참석하시나요?</p>
            <div className="flex gap-2">
              <Button 
                onClick={() => setAttendance('present')}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold h-11 rounded-xl"
              >
                참석 예약
              </Button>
              <Button 
                onClick={() => setAttendance('absent')}
                variant="outline" 
                className="flex-1 border-slate-300 text-slate-600 font-bold h-11 rounded-xl"
              >
                불참
              </Button>
            </div>
          </div>
        ) : attendance === 'absent' ? (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center border border-red-100 flex flex-col items-center gap-1">
            <UserX className="w-5 h-5" />
            <p className="text-xs font-bold">불참으로 처리되었습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-green-50 text-green-700 p-2 rounded-xl text-center border border-green-100">
              <p className="text-xs font-bold">참석이 예약되어 있습니다.</p>
            </div>
            {/* GPS Check-in */}
            <Button className="w-full bg-obsidian hover:bg-slate-800 text-white h-12 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-black/10 transition-transform active:scale-95">
              <MapPin className="w-5 h-5 text-green-400" />
              모임 장소 도착 (QR 출석)
            </Button>
            <p className="text-[10px] text-center text-slate-400">장소 반경 100m 이내에서만 활성화됩니다.</p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
