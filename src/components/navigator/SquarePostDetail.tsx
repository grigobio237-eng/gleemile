'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  MessageSquare, 
  Share2, 
  Trash2, 
  Edit3, 
  MoreVertical,
  ChevronLeft,
  Send,
  Eye,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface PostDetailProps {
  postId: string;
  onClose: () => void;
  onEdit: (postId: string) => void;
  onDeleteSuccess: () => void;
}

export default function SquarePostDetail({ postId, onClose, onEdit, onDeleteSuccess }: PostDetailProps) {
  const { data: session } = useSession();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  // @ts-ignore
  const currentUserId = session?.user?.id || session?.user?._id;

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/navigator/posts/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data);
      }
    } catch (error) {
      console.error('Failed to fetch post detail:', error);
      toast.error('상세 내용을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!post || isLiking) return;
    setIsLiking(true);
    try {
      const response = await fetch(`/api/navigator/posts/${postId}/like`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setPost((prev: any) => ({
          ...prev,
          likes: data.isLiked 
            ? [...prev.likes, currentUserId] 
            : prev.likes.filter((id: string) => id !== currentUserId)
        }));
      }
    } catch (error) {
      console.error('Like toggle failed:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const response = await fetch(`/api/navigator/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText })
      });

      if (response.ok) {
        const newComment = await response.json();
        setPost((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), newComment]
        }));
        setCommentText('');
        toast.success('댓글이 등록되었습니다.');
      }
    } catch (error) {
      console.error('Comment addition failed:', error);
      toast.error('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/navigator/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setPost((prev: any) => ({
          ...prev,
          comments: prev.comments.filter((c: any) => c._id !== commentId)
        }));
        toast.success('댓글이 삭제되었습니다.');
      }
    } catch (error) {
      console.error('Comment deletion failed:', error);
      toast.error('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/navigator/posts/${postId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('게시글이 삭제되었습니다.');
        onDeleteSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Post deletion failed:', error);
      toast.error('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const isLiked = post?.likes?.includes(currentUserId);
  const isAuthor = post?.authorId === currentUserId;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-obsidian"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl text-center">
            <p className="text-obsidian font-black">게시글을 찾을 수 없습니다.</p>
            <Button onClick={onClose} className="mt-4">닫기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-obsidian/40 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-3xl bg-white shadow-2xl flex flex-col h-full"
      >
        {/* Header - Fixed */}
        <div className="px-8 py-6 border-b border-line flex items-center justify-between shrink-0">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-slate font-black text-xs uppercase tracking-widest hover:text-obsidian transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Feed
          </button>
          
          <div className="flex items-center gap-3">
             {isAuthor && (
              <>
                <button 
                  onClick={() => onEdit(postId)}
                  className="w-10 h-10 bg-mist rounded-xl flex items-center justify-center text-slate hover:bg-obsidian hover:text-white transition-all shadow-sm"
                  aria-label="게시글 수정"
                  title="게시글 수정"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDeletePost}
                  className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  aria-label="게시글 삭제"
                  title="게시글 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button className="w-10 h-10 bg-mist rounded-xl flex items-center justify-center text-slate hover:bg-obsidian hover:text-white transition-all shadow-sm" aria-label="게시글 공유" title="게시글 공유">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 md:px-14 py-12 space-y-12 scrollbar-hide pb-32">
          {/* Post Title & Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge className="bg-chapter-accent/10 text-chapter-accent border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {post.category}
              </Badge>
              <div className="flex items-center gap-2 text-slate/40 text-[10px] font-bold">
                 <Calendar className="w-3 h-3" />
                 {new Date(post.createdAt).toLocaleDateString()}
                 <span className="mx-1">•</span>
                 <Eye className="w-3 h-3" />
                 조회 {post.viewCount || 0}
              </div>
            </div>
            <h1 className="font-serif text-obsidian tracking-tight leading-[1.1] text-4xl md:text-4xl">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-4 pt-4">
              <div className="w-12 h-12 rounded-2xl bg-mist border border-line relative overflow-hidden shrink-0">
                {post.authorImage ? (
                  <Image src={post.authorImage} alt={post.authorName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-slate uppercase">
                    {post.authorName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-black text-obsidian">{post.authorName}</p>
                <p className="text-xs font-bold text-slate/40 tracking-wider">Certified Navigator</p>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-8">
            {/* Images if any */}
            {post.images && post.images.length > 0 && (
              <div className="space-y-4">
                 {post.images.map((img: string, i: number) => (
                   <div key={i} className="relative aspect-[4/3] rounded-[32px] overflow-hidden border border-line shadow-sm">
                     <Image src={img} alt={`img-${i}`} fill className="object-cover" />
                   </div>
                 ))}
              </div>
            )}
            
            {/* Text Body */}
            <div className="text-lg text-slate/80 font-medium leading-[1.8] whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* Interaction Area */}
          <div className="pt-12 border-t border-line/10">
            <div className="flex items-center justify-between pb-12">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleLikeToggle}
                  className={`h-14 px-8 rounded-2xl flex items-center gap-3 font-black text-sm uppercase transition-all shadow-xl shadow-obsidian/5 ${
                    isLiked 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-mist text-obsidian hover:bg-line'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Like' : 'Support'} <span className="opacity-40">{post.likes?.length || 0}</span>
                </Button>
                <Button 
                  variant="ghost"
                  className="h-14 px-8 rounded-2xl flex items-center gap-3 font-black text-sm uppercase text-slate/60"
                >
                  <MessageSquare className="w-5 h-5" />
                  Comments <span className="opacity-40">{post.comments?.length || 0}</span>
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-8">
              <h3 className="text-xs font-black text-obsidian tracking-[0.2em] uppercase">Comments Feed</h3>
              
              <div className="space-y-6">
                {post.comments && post.comments.length > 0 ? post.comments.map((comment: any) => (
                  <div key={comment._id} className="group flex gap-4 p-6 rounded-3xl hover:bg-mist/30 border border-transparent hover:border-line/5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-mist border border-line shrink-0 relative overflow-hidden">
                      {comment.authorImage ? (
                        <Image src={comment.authorImage} alt={comment.authorName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate italic">
                          {comment.authorName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center justify-between">
                         <p className="text-sm font-black text-obsidian">{comment.authorName}</p>
                         <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-slate/50">{new Date(comment.createdAt).toLocaleDateString()}</span>
                           {(comment.authorId.toString() === currentUserId || session?.user?.role === 'admin') && (
                             <button 
                               onClick={() => handleDeleteComment(comment._id)}
                               className="p-1.5 text-slate/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                               aria-label="댓글 삭제"
                               title="댓글 삭제"
                             >
                                <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           )}
                         </div>
                       </div>
                       <p className="text-sm text-slate/70 font-medium leading-relaxed">
                         {comment.content}
                       </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate/50 font-bold uppercase tracking-widest text-center py-10 opacity-70">첫 번째 댓글을 남겨보세요</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Input Area - Sticky Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
           <form 
            onSubmit={handleAddComment}
            className="flex items-center gap-4 bg-white border border-line p-2 pl-6 rounded-[32px] shadow-2xl pointer-events-auto"
          >
            <Input 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="동료에게 의견을 남겨보세요..."
              className="flex-1 border-none focus-visible:ring-0 font-bold placeholder:text-slate/60 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
              aria-label="댓글 내용"
              title="댓글 내용"
            />
            <Button 
              type="submit"
              disabled={!commentText.trim() || isCommenting}
              className="w-12 h-12 rounded-[24px] bg-obsidian text-white flex items-center justify-center hover:scale-110 transition-transform p-0"
              aria-label="댓글 등록"
              title="댓글 등록"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
