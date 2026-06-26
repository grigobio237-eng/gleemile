'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, MessageSquare, Eye, Share2, MoreVertical, Edit2, Trash2, ArrowLeft, Loader2, Send, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface Comment {
  _id: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  content: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  images: string[];
  viewCount: number;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

interface CommunityPostDetailProps {
  postId: string;
  onClose: () => void;
  onEdit: (postId: string) => void;
  onDeleteSuccess: () => void;
}

export default function CommunityPostDetail({ postId, onClose, onEdit, onDeleteSuccess }: CommunityPostDetailProps) {
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/community/posts/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
        // Track view
        fetch(`/api/community/posts/${postId}/track-view`, { method: 'POST' });
      }
    } catch (error) {
      toast.error('정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!session) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setPost(prev => prev ? { ...prev, likes: data.likes } : null);
      }
    } catch (error) {
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      if (response.ok) {
        const data = await response.json();
        setPost(prev => prev ? { ...prev, comments: data.comments } : null);
        setCommentText('');
      }
    } catch (error) {
      toast.error('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('삭제되었습니다.');
        onDeleteSuccess();
        onClose();
      }
    } catch (error) {
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const isAuthor = session?.user && (post?.authorId === (session.user as any).id || post?.authorId === (session.user as any)._id);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-obsidian" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-mist flex flex-col md:flex-row"
    >
      {/* Mobile Top Nav */}
      <div className="md:hidden p-4 bg-white border-b border-line flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="뒤로 가기"><ArrowLeft className="w-6 h-6" /></Button>
        <div className="flex gap-2">
          {isAuthor && (
            <>
              <Button variant="ghost" size="icon" onClick={() => onEdit(post._id)} aria-label="수정"><Edit2 className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-500" aria-label="삭제"><Trash2 className="w-5 h-5" /></Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-white md:bg-mist">
        <div className="max-w-4xl mx-auto md:py-20 md:px-6">
          <div className="bg-white md:rounded-[40px] shadow-sm overflow-hidden min-h-full">
            {/* Header */}
            <div className="p-8 md:p-12 border-b border-line/5 pb-8">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-chapter-accent/10 text-chapter-accent border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {post.category}
                </Badge>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate/40 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
              <h1 className="font-serif text-obsidian leading-tight tracking-tight mb-8 text-3xl md:text-4xl">
                {post.title}
              </h1>
              
              <div className="flex items-center justify-between border-t border-line/10 pt-8">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-mist border border-line">
                    {post.authorImage ? (
                      <Image src={post.authorImage} alt={post.authorName} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-slate text-lg">{post.authorName.charAt(0)}</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-obsidian">{post.authorName}</p>
                    <p className="text-xs font-bold text-slate/40 uppercase tracking-widest">Member</p>
                  </div>
                </div>

                <div className="hidden md:flex gap-4">
                  {isAuthor && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onEdit(post._id)} className="rounded-xl border-line font-bold">수정</Button>
                      <Button variant="outline" size="sm" onClick={handleDelete} className="rounded-xl border-line font-bold text-red-500">삭제</Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-mist/50" aria-label="닫기"><X className="w-5 h-5" /></Button>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-8 md:p-12 space-y-12">
              <div className="text-lg text-slate/80 leading-relaxed font-medium whitespace-pre-wrap">
                {post.content}
              </div>

              {post.images && post.images.length > 0 && (
                <div className="space-y-6">
                  {post.images.map((url, idx) => (
                    <div key={idx} className="relative w-full rounded-[32px] overflow-hidden border border-line bg-mist">
                      <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={url} alt={`Post image ${idx}`} className="w-full h-auto" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="p-8 md:px-12 md:pb-12 flex items-center gap-6 border-t border-line/5">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
                  post.likes.includes((session?.user as any)?.id || (session?.user as any)?._id)
                    ? 'bg-red-50 text-red-500 font-bold'
                    : 'bg-mist text-slate font-bold hover:bg-line/20'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.likes.includes((session?.user as any)?.id || (session?.user as any)?._id) ? 'fill-current' : ''}`} />
                {post.likes.length}
              </button>
              
              <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-mist text-slate font-bold">
                <MessageSquare className="w-5 h-5" />
                {post.comments.length}
              </div>

              <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-mist text-slate font-bold">
                <Eye className="w-5 h-5" />
                {post.viewCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Area (Desktop) / Bottom Area (Mobile): Comments */}
      <div className="w-full md:w-96 bg-mist border-l border-line/10 flex flex-col h-full">
        <div className="p-6 md:p-8 bg-white border-b border-line/10 flex items-center justify-between">
          <h3 className="font-black text-obsidian tracking-tight flex items-center gap-2">
            댓글 <span className="text-chapter-accent">{post.comments.length}</span>
          </h3>
          <div className="hidden md:block">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label="닫기"><ArrowLeft className="w-5 h-5" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-white md:bg-mist/30">
          {post.comments.map((comment) => (
            <div key={comment._id} className="group">
              <div className="flex gap-4">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-mist border border-line shrink-0">
                  {comment.authorImage ? (
                    <Image src={comment.authorImage} alt={comment.authorName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-slate text-[10px]">{comment.authorName.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-obsidian">{comment.authorName}</span>
                    <span className="text-[10px] font-bold text-slate/40 tracking-tight">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate/80 font-medium leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {post.comments.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="text-4xl">💭</div>
              <p className="text-xs font-bold text-slate/40 uppercase tracking-widest">No comments yet</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 md:p-8 bg-white border-t border-line/10">
          <form onSubmit={handleComment} className="relative">
            <textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={session ? "따뜻한 댓글을 남겨보세요..." : "로그인이 필요합니다."}
              disabled={!session || submittingComment}
              className="w-full h-32 rounded-2xl border border-line p-4 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-chapter-accent/20 transition-all resize-none"
            />
            <button 
              type="submit"
              disabled={!commentText.trim() || submittingComment}
              className="absolute bottom-4 right-4 p-2 bg-chapter-accent text-white rounded-xl shadow-lg shadow-chapter-accent/20 disabled:bg-slate/20 disabled:shadow-none transition-all"
              aria-label="댓글 전송"
            >
              {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
