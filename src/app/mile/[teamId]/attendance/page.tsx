'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, where, addDoc, updateDoc, serverTimestamp, setDoc, writeBatch, increment } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, UserCheck, CalendarClock, UserX, Plus, ChevronDown, ChevronUp, MapPin, AlignLeft, Users } from 'lucide-react';
import Link from 'next/link';
import type { AttendanceEvent, RSVPStatus, RSVP } from '@/types/attendance';
import { Button } from '@/components/ui/button';

function isManagerOrHigher(role: string) {
  return role === 'owner' || role === 'manager';
}

function AttendanceContent() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string;

  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('guest');
  
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hasCapacityLimit, setHasCapacityLimit] = useState(false);
  const [targetCapacity, setTargetCapacity] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [myNoShowCount, setMyNoShowCount] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    if (status === 'authenticated' && teamId) {
      fetchInitialData();
    }
  }, [status, teamId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (!session?.user?.id) return;
      
      // 1. Role Check
      let fetchedRole = 'guest';
      const myMemberRef = doc(db, `teams/${teamId}/member_summaries/${session.user.id}`);
      const mySnap = await getDoc(myMemberRef);
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists() && teamSnap.data().ownerId === session.user.id) {
        fetchedRole = 'owner';
      } else if (mySnap.exists()) {
        fetchedRole = mySnap.data().role;
      }
      setUserRole(fetchedRole);

      // 2. Fetch Events
      await fetchEvents();

      // 3. For members, compute total no_shows
      if (!isManagerOrHigher(fetchedRole)) {
        await computeMyNoShows(session.user.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    const q = query(
      collection(db, `teams/${teamId}/attendance_events`),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const fetched: AttendanceEvent[] = [];
    let activeId: string | null = null;
    snap.forEach(d => {
      const data = d.data() as AttendanceEvent;
      data.id = d.id;
      fetched.push(data);
      if (data.isActive && !activeId) activeId = data.id;
    });
    setEvents(fetched);
    if (activeId) {
      setSelectedEventId(activeId);
      await fetchRsvps(activeId);
    }
  };

  const computeMyNoShows = async (userId: string) => {
    let count = 0;
    // We have to query group or iterate events. To keep it simple, we iterate fetched events and check.
    // If the team has 1000 events this is slow, but acceptable for this stub.
    const allEventsQ = query(collection(db, `teams/${teamId}/attendance_events`));
    const allEventsSnap = await getDocs(allEventsQ);
    for (const evDoc of allEventsSnap.docs) {
      const rsvpDoc = await getDoc(doc(db, `teams/${teamId}/attendance_events/${evDoc.id}/rsvps/${userId}`));
      if (rsvpDoc.exists() && rsvpDoc.data().status === 'no_show') {
        count++;
      }
    }
    setMyNoShowCount(count);
  };

  const fetchRsvps = async (eventId: string) => {
    const q = query(collection(db, `teams/${teamId}/attendance_events/${eventId}/rsvps`));
    const snap = await getDocs(q);
    const fetched: RSVP[] = [];
    snap.forEach(d => {
      fetched.push(d.data() as RSVP);
    });
    setRsvps(fetched);
  };

  const handleSelectEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    await fetchRsvps(eventId);
  };

  const handleCreateEvent = async () => {
    if (!newTitle || !newDate || !teamId) return;
    if (hasCapacityLimit && !targetCapacity) return;
    setCreating(true);
    try {
      // Deactivate others
      const activeQ = query(collection(db, `teams/${teamId}/attendance_events`), where('isActive', '==', true));
      const activeSnap = await getDocs(activeQ);
      for (const d of activeSnap.docs) {
        await updateDoc(doc(db, `teams/${teamId}/attendance_events`, d.id), { isActive: false });
      }

      // Add new
      await addDoc(collection(db, `teams/${teamId}/attendance_events`), {
        title: newTitle,
        date: newDate,
        time: newTime || '',
        location: newLocation || '',
        description: newDescription || '',
        isActive: true,
        hasCapacityLimit,
        targetCapacity: hasCapacityLimit ? Number(targetCapacity) : null,
        presentCount: 0,
        createdAt: serverTimestamp()
      });

      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setNewLocation('');
      setNewDescription('');
      setHasCapacityLimit(false);
      setTargetCapacity('');
      setShowCreateForm(false);
      await fetchEvents();
    } catch (e) {
      console.error(e);
      alert('생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleMarkNoShow = async (eventId: string, userId: string) => {
    if (!confirm('해당 유저를 노쇼 처리하시겠습니까?')) return;
    try {
      await updateDoc(doc(db, `teams/${teamId}/attendance_events/${eventId}/rsvps/${userId}`), {
        status: 'no_show',
        updatedAt: serverTimestamp()
      });
      // refresh local rsvps
      setRsvps(prev => prev.map(r => r.userId === userId ? { ...r, status: 'no_show' } : r));
    } catch (e) {
      console.error(e);
      alert('처리에 실패했습니다.');
    }
  };

  const handleMyRSVP = async (eventId: string, status: RSVPStatus) => {
    if (!session?.user?.id) return;
    try {
      const rsvpRef = doc(db, `teams/${teamId}/attendance_events/${eventId}/rsvps/${session.user.id}`);
      const eventRef = doc(db, `teams/${teamId}/attendance_events/${eventId}`);
      
      const rsvpSnap = await getDoc(rsvpRef);
      const prevStatus = rsvpSnap.exists() ? rsvpSnap.data().status : null;
      
      if (prevStatus === status) return; // No change

      let countChange = 0;
      if (status === 'present' && prevStatus !== 'present') countChange = 1;
      else if (prevStatus === 'present' && status !== 'present') countChange = -1;

      // Check capacity
      if (countChange > 0) {
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const eventData = eventSnap.data() as AttendanceEvent;
          if (eventData.hasCapacityLimit && eventData.targetCapacity !== undefined) {
            if (eventData.presentCount >= eventData.targetCapacity) {
              alert('이 모임은 선착순 마감되었습니다.');
              return;
            }
          }
        }
      }

      const batch = writeBatch(db);
      batch.set(rsvpRef, {
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        status,
        updatedAt: serverTimestamp()
      });
      if (countChange !== 0) {
        batch.update(eventRef, {
          presentCount: increment(countChange)
        });
      }
      await batch.commit();

      await fetchRsvps(eventId);
      await fetchEvents();
    } catch (e) {
      console.error(e);
      alert('업데이트 실패');
    }
  };

  const isAdmin = isManagerOrHigher(userRole);

  const renderUnifiedView = () => {
    return (
      <div className="space-y-6">
        {isAdmin && (
          <div className="space-y-4">
            {!showCreateForm ? (
              <Button 
                onClick={() => setShowCreateForm(true)} 
                className="w-full bg-white text-violet-600 border border-violet-200 hover:bg-violet-50 font-bold h-12 rounded-2xl flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-5 h-5" /> 새 참석 조사 개설
              </Button>
            ) : (
              <Card className="rounded-2xl border border-violet-200 shadow-md bg-white">
                <div className="px-4 py-3 border-b border-line bg-violet-50">
                  <h3 className="font-black text-sm text-violet-800 flex items-center gap-1">새 참석 조사 개설</h3>
                </div>
                <CardContent className="p-4 space-y-3">
                  <input 
                    type="text" 
                    placeholder="모임 제목 (예: 정규 클래스 4회차)" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={newDate} 
                      onChange={e => setNewDate(e.target.value)}
                      className="w-1/2 text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <input 
                      type="time" 
                      value={newTime} 
                      onChange={e => setNewTime(e.target.value)}
                      className="w-1/2 text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="모임 장소 (예: 올림픽공원)" 
                    value={newLocation} 
                    onChange={e => setNewLocation(e.target.value)}
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <textarea
                    placeholder="모임 설명이나 공지사항을 간단히 적어주세요."
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    rows={2}
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                  />
                  <div className="flex items-center gap-6 py-2 border-y border-slate-100 my-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={!hasCapacityLimit} 
                        onChange={() => {
                          setHasCapacityLimit(false);
                          setTargetCapacity('');
                        }} 
                        className="accent-violet-600 w-4 h-4"
                      /> 
                      인원 제한 없음
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={hasCapacityLimit} 
                        onChange={() => setHasCapacityLimit(true)} 
                        className="accent-violet-600 w-4 h-4"
                      /> 
                      선착순 정원 제한
                    </label>
                  </div>
                  {hasCapacityLimit && (
                    <input 
                      type="number" 
                      placeholder="목표 인원 (명)" 
                      value={targetCapacity} 
                      onChange={e => setTargetCapacity(e.target.value)}
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
                      min="1"
                    />
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => setShowCreateForm(false)}
                      variant="outline"
                      className="flex-1 font-bold h-11 rounded-xl"
                    >
                      취소
                    </Button>
                    <Button 
                      onClick={handleCreateEvent}
                      disabled={!newTitle || !newDate || (hasCapacityLimit && !targetCapacity) || creating}
                      className="flex-[2] bg-violet-600 hover:bg-violet-700 text-white font-bold h-11 rounded-xl"
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin"/> : '새 참석 조사 등록'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!isAdmin && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-red-600">
              <UserX className="w-5 h-5" />
              <span className="font-black text-sm">내 누적 노쇼 횟수</span>
            </div>
            <span className="text-xl font-black text-red-600">{myNoShowCount}회</span>
          </div>
        )}

        <div className="space-y-3">
          {events.length > 0 ? (
            events.map(ev => {
              const isSelected = selectedEventId === ev.id;
              const isClosed = ev.hasCapacityLimit && ev.presentCount >= (ev.targetCapacity || 0);
              const myRsvp = rsvps.find(r => r.userId === session?.user?.id); // Only valid if selected, but we will fetch rsvps on click
              
              return (
                <Card key={ev.id} className={`rounded-2xl border transition-all overflow-hidden ${isSelected ? 'border-violet-400 shadow-md ring-2 ring-violet-50' : 'border-slate-200 shadow-sm hover:border-violet-300'}`}>
                  <div 
                    onClick={() => handleSelectEvent(ev.id)}
                    className="p-4 cursor-pointer bg-white"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-base text-obsidian flex items-center gap-2">
                          {ev.title} {ev.isActive && <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-md font-bold">진행중</span>}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <CalendarClock className="w-3.5 h-3.5" /> {ev.date} {ev.time}
                        </span>
                      </div>
                      {isClosed ? (
                        <span className="text-xs font-black bg-[#E05A47] text-white px-2 py-1 rounded-lg shadow-sm">마감</span>
                      ) : (
                        <span className="text-xs font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                          <Users className="w-3 h-3 inline-block mr-1" />
                          {ev.hasCapacityLimit ? `${ev.presentCount} / ${ev.targetCapacity}명` : `${ev.presentCount}명 참석`}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-center mt-2">
                      {isSelected ? <ChevronUp className="w-4 h-4 text-violet-400" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="border-t border-slate-100 bg-slate-50">
                      {/* 상세 행사 정보 */}
                      <div className="p-4 space-y-3 border-b border-white">
                        {ev.location && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-700">모임 장소</p>
                              <p className="text-slate-600">{ev.location}</p>
                            </div>
                          </div>
                        )}
                        {ev.description && (
                          <div className="flex items-start gap-2 text-sm">
                            <AlignLeft className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-700">안내 및 공지사항</p>
                              <p className="text-slate-600 whitespace-pre-wrap">{ev.description}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 내 예약 상태 및 버튼 */}
                      <div className="p-4 bg-white border-b border-slate-100">
                        {myRsvp ? (
                          <div className={`p-4 rounded-xl text-center border font-bold text-sm relative group cursor-pointer transition-all ${
                            myRsvp.status === 'present' ? 'bg-green-50 text-green-700 border-green-100' :
                            myRsvp.status === 'absent' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`} onClick={() => {
                            if (myRsvp.status !== 'no_show') {
                              handleMyRSVP(ev.id, myRsvp.status === 'present' ? 'absent' : 'present');
                            }
                          }}>
                            {myRsvp.status === 'present' ? '✅ 참석 예약이 완료되었습니다.' : myRsvp.status === 'absent' ? '❌ 불참으로 접수되었습니다.' : '⚠️ 노쇼 처리되었습니다.'}
                            {myRsvp.status !== 'no_show' && (
                              <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <span className="text-violet-600 font-black">상태 변경하기</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-center text-slate-600 mb-2">이 모임에 참석하시나요?</p>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleMyRSVP(ev.id, 'present')} 
                                disabled={isClosed}
                                className={`flex-1 font-black h-12 rounded-xl text-white ${isClosed ? 'bg-slate-300' : 'bg-violet-600 hover:bg-violet-700'}`}
                              >
                                {isClosed ? '마감됨' : '참석 예약'}
                              </Button>
                              <Button 
                                onClick={() => handleMyRSVP(ev.id, 'absent')} 
                                variant="outline" 
                                className="flex-1 border-slate-300 text-slate-600 h-12 rounded-xl font-black"
                              >
                                불참
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 참석 명단 */}
                      <div className="p-4 bg-slate-50">
                        <h4 className="text-xs font-black text-slate-500 mb-3 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> 응답한 멤버 명단
                        </h4>
                        {rsvps.length === 0 ? (
                          <p className="text-xs text-center text-slate-400 py-6 bg-white rounded-xl border border-slate-100">아직 응답한 멤버가 없습니다.</p>
                        ) : (
                          <div className="space-y-2">
                            {rsvps.map(rsvp => (
                              <div key={rsvp.userId} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-slate-700">{rsvp.userName}</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                    rsvp.status === 'present' ? 'bg-green-100 text-green-600' :
                                    rsvp.status === 'absent' ? 'bg-red-100 text-red-600' :
                                    'bg-slate-200 text-slate-600'
                                  }`}>
                                    {rsvp.status === 'present' ? '참석' : rsvp.status === 'absent' ? '불참' : '노쇼'}
                                  </span>
                                </div>
                                {isAdmin && rsvp.status === 'present' && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleMarkNoShow(ev.id, rsvp.userId); }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    노쇼 처리
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <CalendarClock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">등록된 참석 조사가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 pb-24 font-sans selection:bg-violet-200">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        <div>
          <Link href={`/mile/${teamId}/dashboard`} className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1">
            <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
          </Link>
          <h1 className="text-2xl font-black text-obsidian flex items-center gap-2 mt-2">
            <UserCheck className="w-6 h-6 text-violet-500" /> 
            {isAdmin ? '참석 현황 및 인원 관리' : '참석 예약 (RSVP)'}
          </h1>
          <p className="text-sm text-slate mt-1">
            {isAdmin ? '새로운 참석 조사를 개설하고 명단을 확정하세요.' : '예정된 모임에 참석 여부를 알려주세요.'}
          </p>
        </div>

        {renderUnifiedView()}
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6]" />}>
      <AttendanceContent />
    </Suspense>
  );
}
