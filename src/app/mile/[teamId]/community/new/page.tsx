'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MessageSquare, ArrowLeft, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewCommunityPostPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !session?.user?.id) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, `teams/${teamId}/community_posts`), {
        title,
        content,
        authorId: session.user.id,
        authorName: session.user.name || '알 수 없음',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      router.push(`/mile/${teamId}/community`);
    } catch (error) {
      console.error('Failed to create post', error);
      alert('게시글 등록에 실패했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans pb-24">
      <div className="max-w-2xl mx-auto pt-4 md:pt-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/mile/${teamId}/community`} className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors text-sm font-bold mb-2">
              <ArrowLeft className="w-4 h-4" /> 커뮤니티 목록
            </Link>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              새 글 작성
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">제목</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              className="text-lg py-6 font-bold border-slate-200 focus:border-indigo-500 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="게시글 내용을 자유롭게 작성해주세요."
              className="w-full min-h-[300px] p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-y text-slate-700 leading-relaxed bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              disabled={submitting || !title.trim() || !content.trim()}
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
