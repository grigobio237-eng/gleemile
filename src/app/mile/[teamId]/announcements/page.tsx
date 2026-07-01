'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Megaphone, ArrowLeft, Plus, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Announcement } from '@/types/announcement';
import { normalizeRole, isManagerOrHigher } from '@/types/role';

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('guest');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!teamId || !session?.user?.id) return;

    // Fetch role
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

    // Update lastReadAnnouncementAt
    const metadataRef = doc(db, `users/${session.user.id}/team_metadata`, teamId);
    setDoc(metadataRef, { lastReadAnnouncementAt: serverTimestamp() }, { merge: true });

    // Listen to announcements
    const q = query(
      collection(db, `teams/${teamId}/announcements`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Announcement[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId, session?.user?.id]);

  const canWrite = isManagerOrHigher(normalizeRole(userRole));

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans pb-24">
      <div className="max-w-3xl mx-auto pt-4 md:pt-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/mile/${teamId}/dashboard`} className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-bold mb-2">
              <ArrowLeft className="w-4 h-4" /> 대시보드
            </Link>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 text-indigo-600" />
              </div>
              공지사항
            </h1>
          </div>
          
          {canWrite && (
            <Link href={`/mile/${teamId}/announcements/new`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm gap-1 font-bold">
                <Plus className="w-4 h-4" /> 새 공지 작성
              </Button>
            </Link>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-500">등록된 공지사항이 없습니다</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedAnnouncement(item)}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-2"
              >
                {item.isImportant && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                )}
                <div className="flex items-center gap-3 truncate flex-1">
                  {item.isImportant && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black rounded shrink-0">중요</span>
                  )}
                  <h3 className="font-bold text-[15px] text-obsidian truncate">{item.title}</h3>
                </div>
                <div className="flex items-center gap-4 shrink-0 mt-2 md:mt-0">
                  <span className="text-xs font-bold text-slate-400">
                    작성자: {item.authorName}
                  </span>
                  <span className="text-xs font-bold text-slate-400 w-20 text-right">
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
              <div className="flex items-center gap-2 pr-4">
                {selectedAnnouncement.isImportant && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black rounded shrink-0">중요</span>
                )}
                <h3 className="font-bold text-lg text-obsidian leading-tight">{selectedAnnouncement.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedAnnouncement(null)} 
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedAnnouncement.content}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              <span className="text-xs font-bold text-slate-400">
                작성자: {selectedAnnouncement.authorName}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {selectedAnnouncement.createdAt?.toDate ? selectedAnnouncement.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
