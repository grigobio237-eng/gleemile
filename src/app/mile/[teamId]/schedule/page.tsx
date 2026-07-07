'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, ArrowLeft, Plus, Loader2, MapPin, Clock, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { SchedulePost } from '@/types/schedule';
import { normalizeRole, isManagerOrHigher } from '@/types/role';

export default function SchedulePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [posts, setPosts] = useState<SchedulePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('guest');

  useEffect(() => {
    if (!teamId || !session?.user?.id) return;

    // Fetch user role
    const fetchRole = async () => {
      const myMemberRef = doc(db, `teams/${teamId}/member_summaries/${session.user.id}`);
      const mySnap = await getDoc(myMemberRef);
      if (mySnap.exists()) {
        setUserRole(mySnap.data().role);
      } else {
        const teamSnap = await getDoc(doc(db, 'teams', teamId));
        if (teamSnap.exists() && teamSnap.data().ownerId === session.user.id) {
          setUserRole('owner');
        }
      }
    };
    fetchRole();

    // Update lastReadScheduleAt
    const metadataRef = doc(db, `users/${session.user.id}/team_metadata`, teamId);
    setDoc(metadataRef, { lastReadScheduleAt: serverTimestamp() }, { merge: true });

    // Listen to schedules, ascending by dateTime (closest first)
    const now = new Date();
    // We can show all schedules including past ones, but let's just order by dateTime asc
    const q = query(
      collection(db, `teams/${teamId}/schedules`),
      // Optionally where('dateTime', '>=', now) if we only want upcoming
      orderBy('dateTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: SchedulePost[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as SchedulePost);
      });
      setPosts(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId, session]);

  const handleDelete = async (scheduleId: string) => {
    if (!window.confirm('정말 이 일정을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, `teams/${teamId}/schedules`, scheduleId));
    } catch (error) {
      console.error('Failed to delete schedule', error);
      alert('일정 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center pb-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const normalizedRole = normalizeRole(userRole);
  const canWrite = isManagerOrHigher(normalizedRole);

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans pb-24">
      <div className="max-w-2xl mx-auto pt-4 md:pt-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/mile/${teamId}/dashboard`} className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors text-sm font-bold mb-2">
              <ArrowLeft className="w-4 h-4" /> 대시보드
            </Link>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" /> 일정 관리
            </h1>
          </div>
          {canWrite && (
            <Link href={`/mile/${teamId}/schedule/new`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-200 font-bold px-4 h-11 gap-1">
                <Plus className="w-4 h-4" /> 일정 추가
              </Button>
            </Link>
          )}
        </div>

        {/* Timeline List View */}
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-500">등록된 일정이 없습니다</h3>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-100 before:to-transparent">
            {posts.map((item) => {
              const date = item.dateTime?.toDate();
              const dateString = date ? date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) : '';
              const timeString = date ? date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
              const isPast = date ? date < new Date() : false;

              return (
                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Timeline marker */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#FAF9F6] ${isPast ? 'bg-slate-300' : 'bg-indigo-500'} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 md:translate-x-0 z-10`}>
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  
                  {/* Content Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-auto md:ml-0 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow group-hover:border-indigo-200">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-black ${isPast ? 'text-slate-400' : 'text-indigo-600'}`}>
                          {dateString}
                        </span>
                        <div className="flex items-center gap-2">
                          {isPast && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">완료됨</span>}
                          {canWrite && (
                            <>
                              <Link href={`/mile/${teamId}/schedule/new?editId=${item.id}`}>
                                <button className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="수정">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                              <button 
                                onClick={() => handleDelete(item.id!)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <h3 className={`font-bold text-lg ${isPast ? 'text-slate-500' : 'text-obsidian'}`}>{item.title}</h3>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{timeString}</span>
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-3 text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
