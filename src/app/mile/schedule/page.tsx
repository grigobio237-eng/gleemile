'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Calendar, Plus, ArrowLeft, MapPin, Clock,
  Trash2, ChevronLeft, ChevronRight, X, Info
} from 'lucide-react';
import Link from 'next/link';

interface ScheduleEvent {
  _id: string;
  title: string;
  content: string;
  type: 'schedule';
  isPinned: boolean;
  eventDate: string; // ISO String
  eventTime?: string; // "HH:MM"
  eventLocation?: string;
  eventType?: 'training' | 'match' | 'meeting' | 'other';
  authorId: { name: string; avatar?: string };
  createdAt: string;
}

export default function SchedulePage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // 달력 년/월 탐색 상태
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0 ~ 11

  // 스케줄 등록 폼 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDateStr, setEventDateStr] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD
  const [eventTime, setEventTime] = useState('10:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState<'training' | 'match' | 'meeting' | 'other'>('training');

  const isDirectorOrLeader = (session?.user as any)?.mileRole === 'leader';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // type=schedule 파라미터를 사용해 팀의 일정 데이터만 조회
      const res = await fetch('/api/mile/announcements?type=schedule');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.announcements || []);
      }
    } catch (e) {
      console.error('[Fetch Schedule error]', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !eventDateStr) return;
    setFormLoading(true);

    try {
      const res = await fetch('/api/mile/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          type: 'schedule',
          eventDate: eventDateStr,
          eventTime,
          eventLocation,
          eventType,
          isPinned: false,
        }),
      });

      if (res.ok) {
        await fetchEvents();
        closeModal();
      } else {
        alert('일정 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('일정 등록 중 오류가 발생했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/mile/announcements?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchEvents();
      } else {
        alert('일정 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('일정 삭제 중 오류가 발생했습니다.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setTitle('');
    setContent('');
    setEventDateStr(new Date().toLocaleDateString('en-CA'));
    setEventTime('10:00');
    setEventLocation('');
    setEventType('training');
  };

  // Helper: 날짜 비교 (년-월-일만 비교)
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getLocalDateString = (dateObj: Date) => {
    return dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
  };

  // Helper: 일정 날짜를 로컬 Date 객체로 파싱
  const getEventDate = (dateStr: string) => {
    return new Date(dateStr);
  };

  // 캘린더 생성 로직
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const buildCalendarCells = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    const cells = [];
    
    // 이전 달 정보로 채우기
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // 이번 달 채우기
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
      });
    }

    // 다음 달 정보로 6주(42칸) 채우기
    const remainingCells = 42 - cells.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        date: new Date(nextYear, nextMonth, i),
        isCurrentMonth: false,
      });
    }

    return cells;
  };

  const nextMonthNav = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const prevMonthNav = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // 특정 날짜에 스케줄 리스트 가져오기
  const getEventsForDate = (date: Date) => {
    return events.filter(e => isSameDay(getEventDate(e.eventDate), date));
  };

  const getEventTypeLabel = (t?: string) => {
    const map: Record<string, string> = { training: '훈련', match: '경기', meeting: '미팅', other: '기타' };
    return map[t || ''] || t;
  };

  const getEventTypeColors = (t?: string) => {
    const map: Record<string, { bg: string; border: string; text: string; dot: string }> = {
      training: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-secondary', dot: 'bg-secondary' },
      match: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
      meeting: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-secondary', dot: 'bg-secondary' },
      other: { bg: 'bg-surface', border: 'border-line', text: 'text-obsidian', dot: 'bg-slate-400' },
    };
    return map[t || ''] || map.other;
  };

  const activeEvents = getEventsForDate(selectedDate);
  const calendarCells = buildCalendarCells();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-background to-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        {/* 상단 네비게이션 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/mile/mypage" className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1">
              <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
            </Link>
            <h1 className="text-2xl font-black text-obsidian tracking-tight">팀 스케줄</h1>
          </div>
        </div>

        {/* 캘린더 카드 */}
        <Card className="rounded-[32px] border-none shadow-2xl overflow-hidden bg-white">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* 달력 탐색 네비게이션 */}
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black text-obsidian">
                {currentYear}년 {currentMonth + 1}월
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={prevMonthNav} className="h-9 w-9 rounded-xl">
                  <ChevronLeft className="w-5 h-5 text-slate" />
                </Button>
                <Button variant="ghost" size="icon" onClick={nextMonthNav} className="h-9 w-9 rounded-xl">
                  <ChevronRight className="w-5 h-5 text-slate" />
                </Button>
              </div>
            </div>

            {/* 요일 행 */}
            <div className="grid grid-cols-7 text-center gap-1 text-xs font-bold text-slate">
              {weekDays.map((day, idx) => (
                <div key={idx} className={idx === 0 ? 'text-red-500' : idx === 6 ? 'text-primary' : ''}>
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarCells.map((cell, idx) => {
                const isSelected = isSameDay(cell.date, selectedDate);
                const isToday = isSameDay(cell.date, new Date());
                const dayEvents = getEventsForDate(cell.date);
                const hasEvents = dayEvents.length > 0;
                
                // 첫번째 이벤트의 타입 도트
                const firstEventType = dayEvents[0]?.eventType || 'other';
                const colors = getEventTypeColors(firstEventType);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`h-12 relative flex flex-col items-center justify-between py-1.5 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-secondary text-white font-bold shadow-lg shadow-purple-200'
                        : cell.isCurrentMonth
                        ? 'text-obsidian hover:bg-purple-50'
                        : 'text-gray-300 hover:bg-surface'
                    }`}
                  >
                    <span className={`text-sm ${isToday && !isSelected ? 'text-secondary font-extrabold border-b-2 border-purple-500' : ''}`}>
                      {cell.date.getDate()}
                    </span>
                    {/* 일정이 있는 경우 닷 뱃지 표시 */}
                    {hasEvents && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : colors.dot}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 선택된 날짜의 일정 목록 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate uppercase tracking-wider">
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
            </h3>
            <span className="text-xs text-slate font-medium bg-secondary-container/60 text-secondary px-2 py-0.5 rounded-full">
              총 {activeEvents.length}개
            </span>
          </div>

          {activeEvents.length === 0 ? (
            <Card className="rounded-[24px] border-none shadow-lg bg-white/70 backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-3">
                <Calendar className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-sm text-slate font-bold">등록된 일정이 없습니다</p>
                {isDirectorOrLeader && (
                  <p className="text-xs text-slate/70">우측 하단 + 버튼을 눌러 스케줄을 추가해 보세요</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeEvents.map((event) => {
                const colors = getEventTypeColors(event.eventType);
                return (
                  <Card key={event._id} className="rounded-[24px] border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${colors.bg} ${colors.text} border border-transparent font-black text-xs px-2 py-0.5 rounded-lg`}>
                            {getEventTypeLabel(event.eventType)}
                          </Badge>
                          {event.eventTime && (
                            <span className="flex items-center gap-1 text-xs text-slate font-bold">
                              <Clock className="w-3.5 h-3.5 text-slate/70" /> {event.eventTime}
                            </span>
                          )}
                        </div>
                        {isDirectorOrLeader && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSchedule(event._id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-obsidian text-base">{event.title}</h4>
                        <p className="text-sm text-slate/85 whitespace-pre-wrap leading-relaxed">{event.content}</p>
                      </div>

                      {event.eventLocation && (
                        <div className="flex items-center gap-1 text-xs text-slate font-medium bg-surface border border-line rounded-xl px-3 py-2 w-fit">
                          <MapPin className="w-3.5 h-3.5 text-slate/60" /> {event.eventLocation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 총무/조장 전용 등록 FAB */}
      {isDirectorOrLeader && (
        <button
          onClick={() => setShowModal(true)}
          title="스케줄 등록"
          aria-label="스케줄 등록"
          className="fixed bottom-6 right-6 w-14 h-14 bg-secondary hover:bg-secondary hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center shadow-xl shadow-purple-300 transition-all duration-200 z-40"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* 등록 모달 팝업 */}
      {showModal && (
        <div className="fixed inset-0 bg-obsidian/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <Card className="w-full max-w-md rounded-[32px] border-none shadow-2xl bg-white overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <CardContent className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-obsidian">새 스케줄 등록</h3>
                <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8 rounded-full">
                  <X className="w-5 h-5 text-slate" />
                </Button>
              </div>

              <form onSubmit={handleCreateSchedule} className="space-y-4">
                {/* 분류 선택 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate tracking-wider uppercase">일정 분류</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['training', 'match', 'meeting', 'other'] as const).map((et) => {
                      const colors = getEventTypeColors(et);
                      const isSelected = eventType === et;
                      return (
                        <button
                          key={et}
                          type="button"
                          onClick={() => setEventType(et)}
                          className={`py-2 rounded-xl text-xs font-black border transition-all ${
                            isSelected
                              ? `${colors.bg} ${colors.text} border-purple-500 ring-2 ring-purple-100`
                              : 'bg-white text-foreground/70 border-line hover:bg-surface'
                          }`}
                        >
                          {getEventTypeLabel(et)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 제목 */}
                <div className="space-y-1.5">
                  <label htmlFor="title" className="text-xs font-black text-slate tracking-wider uppercase">일정 제목</label>
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 오전 체력 단련 훈련"
                    required
                    className="w-full h-11 px-3.5 rounded-2xl border border-line text-sm font-bold focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all text-text-primary"
                  />
                </div>

                {/* 날짜 및 시간 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="eventDateStr" className="text-xs font-black text-slate tracking-wider uppercase">날짜</label>
                    <input
                      id="eventDateStr"
                      type="date"
                      title="일정 날짜"
                      value={eventDateStr}
                      onChange={(e) => setEventDateStr(e.target.value)}
                      required
                      className="w-full h-11 px-3 rounded-2xl border border-line text-sm font-bold focus:border-purple-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="eventTime" className="text-xs font-black text-slate tracking-wider uppercase">시간</label>
                    <input
                      id="eventTime"
                      type="time"
                      title="일정 시간"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full h-11 px-3 rounded-2xl border border-line text-sm font-bold focus:border-purple-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 장소 */}
                <div className="space-y-1.5">
                  <label htmlFor="eventLocation" className="text-xs font-black text-slate tracking-wider uppercase">활동 장소</label>
                  <input
                    id="eventLocation"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="예: 파주 종합운동장 B코트"
                    className="w-full h-11 px-3.5 rounded-2xl border border-line text-sm font-bold focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all text-text-primary"
                  />
                </div>

                {/* 상세 메모 */}
                <div className="space-y-1.5">
                  <label htmlFor="content" className="text-xs font-black text-slate tracking-wider uppercase">세부 메모 및 준비물</label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="일정 세부 내용이나 훈련 전 지참할 준비물을 적어주세요."
                    required
                    className="w-full h-24 px-3.5 py-2.5 rounded-2xl border border-line text-sm resize-none focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all text-text-primary"
                  />
                </div>

                {/* 버튼 영역 */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={!title || !content || formLoading}
                    className="flex-1 h-12 rounded-2xl bg-secondary hover:bg-secondary text-white font-extrabold shadow-lg shadow-purple-100 transition-all"
                  >
                    {formLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '스케줄 업로드'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="h-12 rounded-2xl hover:bg-surface border-line font-bold"
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
