import React, { useState, useEffect } from 'react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Card, CardContent } from '@/components/ui/card';
import { UserCheck, CalendarClock, UserX, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import type { AttendanceEvent, RSVPStatus } from '@/types/attendance';

interface BlockProps {
  unreadCount?: number;
  role: string;
  teamId?: string;
  userId?: string;
}

export function ClassAttendanceBlock({ role, teamId, userId , unreadCount}: BlockProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Unknown';

  const [activeEvent, setActiveEvent] = useState<AttendanceEvent | null>(null);
  const [attendance, setAttendance] = useState<RSVPStatus | 'pending'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    
    const q = query(
      collection(db, `teams/${teamId}/attendance_events`),
      where('isActive', '==', true),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docData = snap.docs[0];
        setActiveEvent({ id: docData.id, ...docData.data() } as AttendanceEvent);
      } else {
        setActiveEvent(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  useEffect(() => {
    if (!teamId || !userId || !activeEvent) {
      if (!activeEvent) setAttendance('pending');
      return;
    }
    
    const rsvpRef = doc(db, `teams/${teamId}/attendance_events/${activeEvent.id}/rsvps`, userId);
    const unsubscribe = onSnapshot(rsvpRef, (snap) => {
      if (snap.exists()) {
        setAttendance(snap.data().status as RSVPStatus);
      } else {
        setAttendance('pending');
      }
    });

    return () => unsubscribe();
  }, [teamId, userId, activeEvent]);

  const handleRSVP = async (status: RSVPStatus) => {
    if (!teamId || !userId || !activeEvent) return;
    try {
      const rsvpRef = doc(db, `teams/${teamId}/attendance_events/${activeEvent.id}/rsvps`, userId);
      await setDoc(rsvpRef, {
        userId,
        userName,
        status,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  if (loading) {
    <div className="relative block">
      <NotificationBadge count={unreadCount} />
      <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
        <div className="h-32 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      </Card>
    </div>
  }

  return (
    <div className="relative block">
      <NotificationBadge count={unreadCount} />
      <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
        <Link href={teamId ? `/mile/${teamId}/attendance` : '#'}>
        <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-violet-50 to-white hover:bg-violet-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-obsidian leading-tight">참석 예약</p>
              <p className="text-[10px] font-bold text-slate-500">독립형 참석 예약 및 인원 관리</p>
            </div>
          </div>
        </div>
      </Link>
      <CardContent className="p-4 space-y-4">
        
        {!activeEvent ? (
          <div className="text-center py-6">
            <p className="text-xs font-bold text-slate-400">현재 활성화된 일정이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0">
                <span className="text-sm font-black text-obsidian leading-none">
                  {activeEvent.date ? activeEvent.date.split('-')[2] : '??'}
                </span>
              </div>
              <div className="w-full">
                <p className="font-bold text-sm text-obsidian">{activeEvent.title}</p>
                <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" /> {activeEvent.date} {activeEvent.time && `| ${activeEvent.time}`}
                  </p>
                  {activeEvent.location && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {activeEvent.location}
                    </p>
                  )}
                </div>
                {activeEvent.description && (
                  <p className="text-[10px] text-slate-400 mt-1 bg-white px-2 py-1 rounded border border-slate-100">
                    {activeEvent.description}
                  </p>
                )}
              </div>
            </div>

            {attendance === 'pending' ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-center text-slate-600 mb-1">이 모임에 참석하시나요?</p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleRSVP('present')}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold h-11 rounded-xl"
                  >
                    참석 예약
                  </Button>
                  <Button 
                    onClick={() => handleRSVP('absent')}
                    variant="outline" 
                    className="flex-1 border-slate-300 text-slate-600 font-bold h-11 rounded-xl"
                  >
                    불참
                  </Button>
                </div>
              </div>
            ) : attendance === 'absent' ? (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center border border-red-100 flex flex-col items-center gap-1 relative group cursor-pointer" onClick={() => handleRSVP('present')}>
                <UserX className="w-5 h-5" />
                <p className="text-xs font-bold">불참으로 접수되었습니다.</p>
                <div className="absolute inset-0 bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <p className="text-xs font-bold text-red-700">참석으로 변경하기</p>
                </div>
              </div>
            ) : attendance === 'no_show' ? (
              <div className="bg-slate-100 text-slate-500 p-3 rounded-xl text-center border border-slate-200 flex flex-col items-center gap-1">
                <UserX className="w-5 h-5" />
                <p className="text-xs font-bold">노쇼(No-show) 처리되었습니다.</p>
              </div>
            ) : (
              <div className="bg-green-50 text-green-700 p-3 rounded-xl text-center border border-green-100 relative group cursor-pointer" onClick={() => handleRSVP('absent')}>
                <p className="text-xs font-bold">참석 예약이 완료되었습니다.</p>
                <div className="absolute inset-0 bg-green-100 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <p className="text-xs font-bold text-green-700">불참으로 변경하기</p>
                </div>
              </div>
            )}
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
