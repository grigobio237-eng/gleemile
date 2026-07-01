'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, increment, deleteDoc } from 'firebase/firestore';
import { X, Heart, MessageCircle, Send, Loader2, Trash2 } from 'lucide-react';
import type { CommunityPost, CommunityComment } from '@/types/community';
import { Button } from '@/components/ui/button';

interface ModalProps {
  post: CommunityPost;
  teamId: string;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}

export function CommunityPostModal({ post, teamId, currentUserId, currentUserName, onClose }: ModalProps) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  const isLiked = post.likedBy?.includes(currentUserId) || false;
  const likeCount = post.likedBy?.length || 0;

  // Listen to comments
  useEffect(() => {
    if (!post.id) return;
    
    const q = query(
      collection(db, `teams/${teamId}/community_posts/${post.id}/comments`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: CommunityComment[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as CommunityComment);
      });
      setComments(fetched);
      setLoadingComments(false);

      // Self-healing: if the actual comment length differs from post.commentCount, fix it
      if (post.commentCount !== fetched.length) {
        const postRef = doc(db, `teams/${teamId}/community_posts`, post.id!);
        updateDoc(postRef, { commentCount: fetched.length }).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [teamId, post.id, post.commentCount]);

  const handleToggleLike = async () => {
    if (!post.id) return;
    const postRef = doc(db, `teams/${teamId}/community_posts`, post.id);
    
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUserId)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(currentUserId)
        });
      }
    } catch (error) {
      console.error('Failed to toggle like', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post.id) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, `teams/${teamId}/community_posts/${post.id}/comments`), {
        postId: post.id,
        content: newComment,
        authorId: currentUserId,
        authorName: currentUserName,
        createdAt: serverTimestamp()
      });
      
      const postRef = doc(db, `teams/${teamId}/community_posts`, post.id);
      await updateDoc(postRef, {
        commentCount: increment(1)
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment', error);
      alert('댓글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post.id) return;
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, `teams/${teamId}/community_posts/${post.id}/comments`, commentId));
      
      const postRef = doc(db, `teams/${teamId}/community_posts`, post.id);
      await updateDoc(postRef, {
        commentCount: increment(-1)
      });
    } catch (error) {
      console.error('Failed to delete comment', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
          <div className="flex flex-col gap-1 pr-4">
            <h3 className="font-bold text-lg text-obsidian leading-tight">{post.title}</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>{post.authorName}</span>
              <span>•</span>
              <span>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전'}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Post Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[100px]">
            {post.content}
          </p>

          {/* Likes & Comments Count */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button 
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                isLiked ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              {likeCount}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-slate-50 text-slate-500">
              <MessageCircle className="w-4 h-4" />
              {comments.length}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-4">
            <h4 className="font-bold text-sm text-slate-700 flex items-center gap-1">
              <MessageCircle className="w-4 h-4" /> 댓글
            </h4>
            
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-xs font-bold text-slate-400 py-4">첫 댓글을 남겨보세요!</p>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">{comment.authorName}</span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전'}
                      </span>
                    </div>
                    <div className="flex items-end gap-2 group/comment">
                      <p className="text-sm text-slate-600 bg-white p-3 rounded-xl rounded-tl-none shadow-sm border border-slate-100 inline-block w-fit">
                        {comment.content}
                      </p>
                      {comment.authorId === currentUserId && comment.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id!)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover/comment:opacity-100 transition-all shrink-0"
                          title="삭제하기"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Comment Input */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleAddComment} className="flex items-center gap-2 relative">
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              disabled={submitting}
            />
            <button 
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="absolute right-1.5 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-[-2px]" />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
