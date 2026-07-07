'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Megaphone, ArrowLeft, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function NewAnnouncementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const searchParams = useSearchParams();
  const editId = searchParams?.get('editId');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId || !teamId) return;
    const fetchAnnouncement = async () => {
      const docRef = doc(db, `teams/${teamId}/announcements`, editId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setContent(data.content || '');
        setIsImportant(data.isImportant || false);
      }
      setLoading(false);
    };
    fetchAnnouncement();
  }, [editId, teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !session?.user?.id) return;
    
    setSubmitting(true);
    try {
      if (editId) {
        await updateDoc(doc(db, `teams/${teamId}/announcements`, editId), {
          title,
          content,
          isImportant,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, `teams/${teamId}/announcements`), {
          title,
          content,
          isImportant,
          authorId: session.user.id,
          authorName: session.user.name || '관리자',
          createdAt: serverTimestamp()
        });
      }
      router.push(`/mile/${teamId}/announcements`);
    } catch (error) {
      console.error('Failed to save announcement', error);
      alert('공지사항 저장에 실패했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans pb-24">
      <div className="max-w-2xl mx-auto pt-4 md:pt-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/mile/${teamId}/announcements`} className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors text-sm font-bold mb-2">
              <ArrowLeft className="w-4 h-4" /> 공지사항 목록
            </Link>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              {editId ? '공지사항 수정' : '새 공지 작성'}
            </h1>
          </div>
        </div>

        {/* Form */}
        {loading ? (
          <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">제목</label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="공지사항 제목을 입력하세요" 
              className="font-medium bg-slate-50 focus-visible:ring-indigo-500"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">내용</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="멤버들에게 알릴 내용을 자세히 적어주세요."
              className="w-full min-h-[200px] p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between bg-rose-50 p-4 rounded-xl border border-rose-100">
            <div>
              <h4 className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4" /> 중요 공지 설정
              </h4>
              <p className="text-xs text-rose-500 mt-1 font-medium">눈에 잘 띄도록 특별한 스타일이 적용됩니다.</p>
            </div>
            <Switch checked={isImportant} onCheckedChange={setIsImportant} />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button 
              type="submit" 
              disabled={submitting || !title.trim() || !content.trim()} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 font-bold shadow-sm"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 등록 중...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> {editId ? '공지사항 수정하기' : '공지사항 등록하기'}</>
              )}
            </Button>
          </div>
        </form>
        )}

      </div>
    </div>
  );
}
