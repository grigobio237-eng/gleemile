'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import type { ICalendarEvent } from '@/types/firebase';

interface BlockProps {
  teamId: string;
  role: string;
}

export function ScheduleBlock({ teamId, role }: BlockProps) {
  const isLeader = role === 'director' || role === 'manager';
  const [events, setEvents] = useState<ICalendarEvent[]>([]);

  useEffect(() => {
    if (!teamId) return;

    // 다가오는 일정 3개 구독 (Subcollection Partitioning 적용)
    const eventsRef = collection(db, 'teams', teamId, 'events');
    const q = query(eventsRef, orderBy('startTime', 'asc'), limit(3));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents: ICalendarEvent[] = [];
      snapshot.forEach((doc) => {
        fetchedEvents.push({ eventId: doc.id, ...doc.data() } as ICalendarEvent);
      });
      setEvents(fetchedEvents);
    });

    return () => unsubscribe();
  }, [teamId]);

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">팀 스케줄 (일정)</p>
            <p className="text-[10px] font-bold text-slate-500">다가오는 주요 일정</p>
          </div>
        </div>
        {isLeader && (
          <button className="text-blue-600 p-1.5 hover:bg-blue-100 rounded-md transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <CardContent className="p-0">
        {events.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-slate-400 font-medium">예정된 일정이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((ev) => (
              <div key={ev.eventId} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    ev.type === 'match' ? 'bg-red-100 text-red-700' :
                    ev.type === 'training' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {ev.type === 'match' ? 'MATCH' : ev.type === 'training' ? 'TRAINING' : 'REST'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-obsidian mb-2">{ev.title}</h4>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                  {/* For real rendering, format the Timestamp to Date string */}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{(ev.startTime as any)?.toDate ? (ev.startTime as any).toDate().toLocaleDateString() : '일정 미정'}</span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{ev.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
