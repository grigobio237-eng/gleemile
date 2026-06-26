'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, MessageSquare, Heart, Plus, ArrowLeft, Send,
  X, Check, ChevronDown, ChevronUp, User, Award, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Comment {
  _id: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  content: string;
  createdAt: string;
}

interface CommunityPost {
  _id: string;
  title: string;
  content: string;
  category: 'free' | 'review' | 'question' | 'notice' | 'tip';
  authorId: { _id: string; name: string; image?: string; mileRole?: string };
  authorName: string;
  authorImage?: string;
  likes: string[]; // User IDs
  comments: Comment[];
  createdAt: string;
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 아코디언 상태 관리 (펼쳐진 게시글 ID 저장)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // 글쓰기 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'tip' | 'question'>('question');

  // 댓글 입력 상태 (postId -> comment text 매핑)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});

  // 카테고리 필터 상태
  const [filter, setFilter] = useState<'all' | 'tip' | 'question'>('all');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/mile/community?category=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('[Fetch community posts error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setFormLoading(true);

    try {
      const res = await fetch('/api/mile/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category }),
      });

      if (res.ok) {
        await fetchPosts();
        closeModal();
      } else {
        const errorData = await res.json();
        alert(errorData.error || '글 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('글 작성 중 에러가 발생했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 아코디언 토글 방지
    try {
      const res = await fetch('/api/mile/community/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // 로컬 상태 즉시 반영하여 최상의 반응성 구현
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              const currentUserId = session?.user?.id;
              if (!currentUserId) return post;
              
              let updatedLikes = [...post.likes];
              if (data.liked) {
                updatedLikes.push(currentUserId);
              } else {
                updatedLikes = updatedLikes.filter(id => id !== currentUserId);
              }

              return {
                ...post,
                likes: updatedLikes,
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    setCommentLoading(prev => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch('/api/mile/community/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: commentText }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // 로컬 상태에 댓글 즉시 주입하여 실시간 렌더링
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: [...post.comments, data.comment],
              };
            }
            return post;
          })
        );

        // 댓글 입력창 클리어
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      } else {
        alert('댓글 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('댓글 등록 오류가 발생했습니다.');
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentInputChange = (postId: string, val: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: val }));
  };

  const toggleAccordion = (postId: string) => {
    setExpandedPostId(prev => (prev === postId ? null : postId));
  };

  const closeModal = () => {
    setShowModal(false);
    setTitle('');
    setContent('');
    setCategory('question');
  };

  const getCategoryStyles = (cat: string) => {
    const map: Record<string, { label: string; bg: string; text: string; icon: any }> = {
      tip: { label: '💡 조언/팁', bg: 'bg-secondary-container text-emerald-800', text: 'text-secondary', icon: Award },
      question: { label: '❓ 질문/논의', bg: 'bg-pink-100 text-pink-800', text: 'text-pink-700', icon: HelpCircle },
      free: { label: '🗣️ 자유소통', bg: 'bg-primary-container text-blue-800', text: 'text-primary', icon: MessageSquare },
    };
    return map[cat] || { label: '기타', bg: 'bg-slate-100 text-obsidian', text: 'text-obsidian', icon: MessageSquare };
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    const map: Record<string, string> = {
      head_coach: '호스트/개설자',
      coach: '총무/조장',
      player: '팀원/스터디원',
      guardian: '청강생/외부 자문',
    };
    const label = map[role];
    if (!label) return null;

    const isStaff = role === 'leader' || role === 'director';
    return (
      <Badge className={`text-[10px] font-bold px-1.5 py-0 border-none ${
        isStaff ? 'bg-secondary-container text-secondary' : 'bg-slate-100 text-obsidian'
      }`}>
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  const currentUserId = session?.user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-background to-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        
        {/* 상단 네비게이션 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/mile/mypage" className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1">
              <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
            </Link>
            <h1 className="text-2xl font-black text-obsidian tracking-tight">팀 커뮤니티</h1>
          </div>
        </div>

        {/* 카테고리 필터 헤더 */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-line">
          {[
            { value: 'all', label: '전체 소통' },
            { value: 'tip', label: '💡 조언/팁' },
            { value: 'question', label: '❓ 질문/논의' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value as any)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                filter === item.value
                  ? 'bg-secondary text-white shadow-md shadow-indigo-100'
                  : 'text-slate hover:bg-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 게시글 목록 */}
        {posts.length === 0 ? (
          <Card className="rounded-[32px] border-none shadow-xl bg-white/70 backdrop-blur-sm">
            <CardContent className="p-12 text-center space-y-4">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 animate-pulse" />
              <p className="text-slate font-black text-base">아직 등록된 이야기가 없습니다</p>
              <p className="text-xs text-slate/70">첫 번째 질문이나 사용 팁을 올려 팀원들과 논의해 보세요!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isExpanded = expandedPostId === post._id;
              const hasLiked = currentUserId && post.likes.includes(currentUserId);
              const catStyles = getCategoryStyles(post.category);
              const CatIcon = catStyles.icon;

              return (
                <Card
                  key={post._id}
                  onClick={() => toggleAccordion(post._id)}
                  className={`rounded-[28px] border-none shadow-lg hover:shadow-xl bg-white transition-all duration-300 cursor-pointer overflow-hidden ${
                    isExpanded ? 'ring-2 ring-indigo-100' : ''
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    
                    {/* 작성자 정보 및 메타 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl overflow-hidden flex items-center justify-center text-slate font-black shadow-inner">
                          {post.authorImage ? (
                            <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={post.authorImage} alt={post.authorName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate/50" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-obsidian">{post.authorName}</span>
                            {getRoleBadge(post.authorId?.mileRole || (post as any).authorRole)}
                          </div>
                          <span className="text-[10px] text-foreground/70 font-medium">
                            {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      <Badge className={`${catStyles.bg} border-none font-black text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1`}>
                        <CatIcon className="w-3 h-3" /> {catStyles.label.split(' ')[1]}
                      </Badge>
                    </div>

                    {/* 제목 및 본문 요약 */}
                    <div className="space-y-1.5 text-left">
                      <h3 className="font-black text-obsidian text-base sm:text-lg leading-tight tracking-tight">
                        {post.title}
                      </h3>
                      <p className={`text-sm text-slate/85 leading-relaxed ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                        {post.content}
                      </p>
                    </div>

                    {/* 메트릭 및 펼치기 화살표 */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-slate">
                      <div className="flex items-center gap-3">
                        {/* 좋아요(공감) 버튼 */}
                        <button
                          onClick={(e) => handleToggleLike(post._id, e)}
                          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full transition-all ${
                            hasLiked 
                              ? 'bg-rose-50 text-rose-600 font-black' 
                              : 'hover:bg-slate-100 text-slate'
                          }`}
                        >
                          <Heart className={`w-4 h-4 transition-all ${hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate/60'}`} />
                          <span>공감 {post.likes.length}</span>
                        </button>

                        {/* 댓글 개수 */}
                        <span className="flex items-center gap-1 text-xs font-bold text-slate/80">
                          <MessageSquare className="w-4 h-4 text-slate/60" />
                          <span>댓글 {post.comments.length}</span>
                        </span>
                      </div>

                      {/* 아코디언 지시 화살표 */}
                      <span className="text-slate/40">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </span>
                    </div>

                    {/* 펼쳐졌을 때의 댓글 영역 (아코디언) */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-line space-y-4" onClick={(e) => e.stopPropagation()}>
                        
                        {/* 댓글 목록 */}
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          <p className="text-xs font-black text-slate text-left uppercase tracking-wider">의견 및 조언 스레드 ({post.comments.length})</p>
                          
                          {post.comments.length === 0 ? (
                            <p className="text-xs text-slate/50 text-center py-4 bg-surface rounded-2xl border border-dashed">
                              첫 번째 의견을 남겨 소통을 시작해보세요!
                            </p>
                          ) : (
                            <div className="space-y-2.5 text-left">
                              {post.comments.map((comment) => (
                                <div key={comment._id} className="bg-surface border border-line rounded-2xl p-3 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-xs text-obsidian">{comment.authorName}</span>
                                    <span className="text-[9px] text-foreground/70">
                                      {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate/90 leading-normal">{comment.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 댓글 입력 폼 */}
                        <form onSubmit={(e) => handleCreateComment(post._id, e)} className="flex gap-2">
                          <input
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                            placeholder="의견이나 질문에 답해 보세요..."
                            required
                            className="flex-1 h-10 px-3.5 rounded-xl border border-line text-xs focus:border-secondary/30 focus:outline-none transition-all text-text-primary"
                          />
                          <Button
                            type="submit"
                            disabled={!commentInputs[post._id]?.trim() || commentLoading[post._id]}
                            className="h-10 w-10 bg-secondary hover:bg-secondary text-white rounded-xl flex items-center justify-center p-0"
                          >
                            {commentLoading[post._id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 글쓰기 플로팅 버튼 (FAB) */}
      <button
        onClick={() => setShowModal(true)}
        title="글쓰기"
        aria-label="글쓰기"
        className="fixed bottom-6 right-6 w-14 h-14 bg-secondary hover:bg-secondary hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-300 transition-all duration-200 z-40"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* 글쓰기 모달 팝업 */}
      {showModal && (
        <div className="fixed inset-0 bg-obsidian/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <Card className="w-full max-w-md rounded-[32px] border-none shadow-2xl bg-white overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <CardContent className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-obsidian">새 조언 / 논의 작성</h3>
                <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8 rounded-full">
                  <X className="w-5 h-5 text-slate" />
                </Button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                
                {/* 카테고리 분류 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate tracking-wider uppercase">글 분류</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'question', label: '❓ 질문/논의' },
                      { value: 'tip', label: '💡 조언/노하우' },
                    ].map((cat) => {
                      const isSelected = category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value as any)}
                          className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-secondary/30 text-secondary ring-2 ring-indigo-100'
                              : 'bg-white text-foreground/70 border-line hover:bg-surface'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 제목 */}
                <div className="space-y-1.5">
                  <label htmlFor="postTitle" className="text-xs font-black text-slate tracking-wider uppercase">제목</label>
                  <input
                    id="postTitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="팀원들의 이목을 끌 수 있는 제목"
                    required
                    className="w-full h-11 px-3.5 rounded-2xl border border-line text-sm font-bold focus:border-secondary/30 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-text-primary"
                  />
                </div>

                {/* 본문 */}
                <div className="space-y-1.5">
                  <label htmlFor="postContent" className="text-xs font-black text-slate tracking-wider uppercase">본문 내용</label>
                  <textarea
                    id="postContent"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="조언할 노하우나 플랫폼 사용법, 혹은 팀원들의 피드백이 필요한 안건을 작성하세요."
                    required
                    className="w-full h-32 px-3.5 py-2.5 rounded-2xl border border-line text-sm resize-none focus:border-secondary/30 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-text-primary"
                  />
                </div>

                {/* 버튼 영역 */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={!title || !content || formLoading}
                    className="flex-1 h-12 rounded-2xl bg-secondary hover:bg-secondary text-white font-extrabold shadow-lg shadow-indigo-100 transition-all"
                  >
                    {formLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '게시하기'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="h-12 rounded-2xl hover:bg-surface border-line font-bold"
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
