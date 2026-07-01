'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Calendar, ArrowLeft, Send, Loader2, MapPin, Clock, AlignLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeRole, isManagerOrHigher } from '@/types/role';

export default function NewSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [loadingRole, setLoadingRole] = useState(true);
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!teamId || status === 'loading') return;
    if (!session?.user?.id) {
      router.replace('/');
      return;
    }

    const checkRole = async () => {
      try {
        let fetchedRole = 'guest';
        const myMemberRef = doc(db, `teams/${teamId}/member_summaries/${session.user.id}`);
        const mySnap = await getDoc(myMemberRef);
        
        if (mySnap.exists()) {
          fetchedRole = mySnap.data().role;
        } else {
          const teamSnap = await getDoc(doc(db, 'teams', teamId));
          if (teamSnap.exists() && teamSnap.data().ownerId === session.user.id) {
            fetchedRole = 'owner';
          }
        }
        
        const role = normalizeRole(fetchedRole);
        if (!isManagerOrHigher(role)) {
          alert('접근 권한이 없습니다.');
          router.replace(`/mile/${teamId}/schedule`);
          return;
        }
      } catch (error) {
        console.error('Role check failed', error);
      } finally {
        setLoadingRole(false);
      }
    };
    checkRole();
  }, [teamId, session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    
    setSubmitting(true);
    try {
      const dateTime = new Date(`${date}T${time}`);
      await addDoc(collection(db, `teams/${teamId}/schedules`), {
        title,
        dateTime: Timestamp.fromDate(dateTime),
        location: locationStr,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      router.push(`/mile/${teamId}/schedule`);
    } catch (error) {
      console.error('Failed to create schedule', error);
      alert('일정 등록에 실패했습니다.');
      setSubmitting(false);
    }
  };

  if (loadingRole || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans pb-24">
      <div className="max-w-2xl mx-auto pt-4 md:pt-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/mile/${teamId}/schedule`} className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors text-sm font-bold mb-2">
              <ArrowLeft className="w-4 h-4" /> 일정 목록
            </Link>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              새 일정 등록
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">일정 제목</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목을 입력하세요"
              className="text-lg py-6 font-bold border-slate-200 focus:border-indigo-500 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 날짜</label>
              <Input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="py-6 font-bold border-slate-200 focus:border-indigo-500 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 시간</label>
              <Input 
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="py-6 font-bold border-slate-200 focus:border-indigo-500 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> 장소 (선택)</label>
            <Input 
              value={locationStr}
              onChange={(e) => setLocationStr(e.target.value)}
              placeholder="장소를 입력하세요"
              className="py-6 border-slate-200 focus:border-indigo-500 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><AlignLeft className="w-3.5 h-3.5" /> 상세 안내 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="일정에 대한 상세 안내를 입력하세요"
              className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-y text-sm text-slate-700 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              disabled={submitting || !title.trim() || !date || !time}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-xl font-bold shadow-sm shadow-indigo-200 gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> 등록 중...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> 등록하기
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
