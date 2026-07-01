'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MessageSquare, ArrowLeft, Plus, Loader2, X, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CommunityPost } from '@/types/community';
import { normalizeRole } from '@/types/role';
import { CommunityPostModal } from '@/components/community/CommunityPostModal';

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('guest');
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

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

    // Update lastReadCommunityAt
    const metadataRef = doc(db, `users/${session.user.id}/team_metadata`, teamId);
    setDoc(metadataRef, { lastReadCommunityAt: serverTimestamp() }, { merge: true });

    // Listen to community posts
    const q = query(
      collection(db, `teams/${teamId}/community_posts`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: CommunityPost[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as CommunityPost);
      });
      setPosts(fetched);
      setLoading(false);

      setSelectedPost(prev => {
        if (!prev) return null;
        return fetched.find(p => p.id === prev.id) || null;
      });
    });

    return () => unsubscribe();
  }, [teamId, session]);

  const canWrite = normalizeRole(userRole) !== 'guest';

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 md:p-8 font-sans selection:bg-emerald-200">
      <div className="max-w-4xl mx-auto pt-4 md:pt-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/mile/${teamId}/dashboard`} className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-bold mb-2">
              <ArrowLeft className="w-4 h-4" /> 대시보드
            </Link>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
              </div>
              커뮤니티
            </h1>
          </div>
          
          {canWrite && (
            <Link href={`/mile/${teamId}/community/new`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm gap-1 font-bold">
                <Plus className="w-4 h-4" /> 글쓰기
              </Button>
            </Link>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-500">등록된 게시물이 없습니다</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedPost(item)}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 truncate flex-1">
                  <h3 className="font-bold text-[15px] text-obsidian truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.likedBy && item.likedBy.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                        <Heart className="w-3 h-3 fill-rose-500" />
                        {item.likedBy.length}
                      </div>
                    )}
                    {item.commentCount && item.commentCount > 0 ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                        <MessageCircle className="w-3 h-3 fill-indigo-500 text-indigo-500" />
                        {item.commentCount}
                      </div>
                    ) : null}
                  </div>
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
      {selectedPost && (
        <CommunityPostModal
          post={selectedPost}
          teamId={teamId}
          currentUserId={session?.user?.id || ''}
          currentUserName={session?.user?.name || '알 수 없음'}
          onClose={() => setSelectedPost(null)}
        />
      )}

    </div>
  );
}
