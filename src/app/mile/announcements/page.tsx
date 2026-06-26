'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Megaphone, Calendar, Plus, ArrowLeft, Pin,
  AlertTriangle, Trash2, MapPin, Clock
} from 'lucide-react';
import Link from 'next/link';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'notice' | 'schedule' | 'urgent';
  isPinned: boolean;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventType?: string;
  authorId: { name: string; avatar?: string };
  createdAt: string;
}

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'notice' | 'schedule' | 'urgent'>('notice');
  const [isPinned, setIsPinned] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState('training');

  const isDirectorOrLeader = (session?.user as any)?.mileRole === 'leader';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/mile/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) return;
    setFormLoading(true);
    try {
      const res = await fetch('/api/mile/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, content, type, isPinned,
          eventDate: type === 'schedule' ? eventDate : undefined,
          eventTime: type === 'schedule' ? eventTime : undefined,
          eventLocation: type === 'schedule' ? eventLocation : undefined,
          eventType: type === 'schedule' ? eventType : undefined,
        }),
      });
      if (res.ok) {
        await fetchAnnouncements();
        resetForm();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/mile/announcements?id=${id}`, { method: 'DELETE' });
      await fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setTitle('');
    setContent('');
    setType('notice');
    setIsPinned(false);
    setEventDate('');
    setEventTime('');
    setEventLocation('');
  };

  const getTypeStyle = (t: string) => {
    const map: Record<string, { label: string; bg: string; text: string; icon: any }> = {
      notice: { label: '공지', bg: 'bg-primary-container', text: 'text-primary', icon: Megaphone },
      schedule: { label: '일정', bg: 'bg-secondary-container', text: 'text-secondary', icon: Calendar },
      urgent: { label: '긴급', bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
    };
    return map[t] || map.notice;
  };

  const getEventTypeLabel = (t?: string) => {
    const map: Record<string, string> = { training: '훈련', match: '경기', meeting: '미팅', other: '기타' };
    return map[t || ''] || t;
  };

  const filtered = filter === 'all'
    ? announcements
    : announcements.filter(a => a.type === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/mile/mypage" className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1">
              <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
            </Link>
            <h1 className="text-2xl font-black text-obsidian">팀 공지사항</h1>
          </div>
          {isDirectorOrLeader && (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1 rounded-xl bg-primary hover:bg-primary">
              <Plus className="w-4 h-4" /> 작성
            </Button>
          )}
        </div>

        {/* 필터 */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: '전체' },
            { value: 'urgent', label: '🔴 긴급' },
            { value: 'notice', label: '📢 공지' },
            { value: 'schedule', label: '📅 일정' },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="rounded-xl text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* 작성 폼 */}
        {showForm && (
          <Card className="rounded-2xl border-2 border-primary/30 shadow-xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-obsidian">새 공지 작성</h3>

              {/* 타입 선택 */}
              <div className="flex gap-2">
                {(['notice', 'schedule', 'urgent'] as const).map((t) => {
                  const style = getTypeStyle(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                        type === t ? `${style.bg} ${style.text}` : 'bg-gray-100 text-foreground/70'
                      }`}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                className="w-full h-11 px-3 rounded-xl border border-line text-sm font-bold"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                className="w-full h-24 px-3 py-2 rounded-xl border border-line text-sm resize-none"
              />

              {/* 스케줄 전용 필드 */}
              {type === 'schedule' && (
                <div className="space-y-3 bg-purple-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="eventDate" className="text-xs font-bold text-slate">날짜</label>
                      <input
                        id="eventDate"
                        type="date"
                        title="날짜 선택"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full h-10 px-2 rounded-lg border text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="eventTime" className="text-xs font-bold text-slate">시간</label>
                      <input
                        id="eventTime"
                        type="time"
                        title="시간 선택"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full h-10 px-2 rounded-lg border text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate">장소</label>
                    <input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="예: 잠실운동장" className="w-full h-10 px-3 rounded-lg border text-sm" />
                  </div>
                  <div className="flex gap-2">
                    {(['training', 'match', 'meeting', 'other'] as const).map((et) => (
                      <button key={et} onClick={() => setEventType(et)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                          eventType === et ? 'bg-secondary text-white' : 'bg-white text-foreground/70'
                        }`}>
                        {getEventTypeLabel(et)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
                <Pin className="w-4 h-4" /> 상단 고정
              </label>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!title || !content || formLoading}
                  className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary font-bold">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '게시하기'}
                </Button>
                <Button variant="outline" onClick={resetForm} className="rounded-xl">취소</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 공지사항 목록 */}
        {filtered.length === 0 ? (
          <Card className="rounded-2xl border-none shadow-xl">
            <CardContent className="p-10 text-center space-y-4">
              <Megaphone className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-slate font-bold">공지사항이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const style = getTypeStyle(a.type);
              const TypeIcon = style.icon;
              return (
                <Card key={a._id} className={`rounded-2xl border-none shadow-lg ${a.isPinned ? 'ring-2 ring-blue-300' : ''}`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`${style.bg} ${style.text} border-none font-bold text-xs`}>
                          <TypeIcon className="w-3 h-3 mr-1" /> {style.label}
                        </Badge>
                        {a.isPinned && <Pin className="w-3 h-3 text-primary" />}
                      </div>
                      {isDirectorOrLeader && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(a._id)} className="text-red-400 hover:text-red-600 h-7 w-7 p-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <h3 className="font-bold text-obsidian">{a.title}</h3>
                    <p className="text-sm text-slate whitespace-pre-wrap">{a.content}</p>

                    {a.type === 'schedule' && a.eventDate && (
                      <div className="flex flex-wrap gap-3 text-xs text-slate bg-purple-50 rounded-xl p-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(a.eventDate).toLocaleDateString('ko-KR')}
                        </span>
                        {a.eventTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.eventTime}</span>}
                        {a.eventLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.eventLocation}</span>}
                        {a.eventType && <Badge variant="outline" className="text-[10px]">{getEventTypeLabel(a.eventType)}</Badge>}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-foreground/70">
                      <span>{a.authorId?.name || '알 수 없음'}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
