'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Image from 'next/image';

interface CommunityPostFormProps {
  postId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CommunityPostForm({ postId, onClose, onSuccess }: CommunityPostFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('free');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  const categories = [
    { id: 'free', label: '자유게시판' },
    { id: 'review', label: '회복 후기' },
    { id: 'question', label: '질문/답변' },
    { id: 'tip', label: 'gleemile 팁' },
  ];

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    setFetching(true);
    try {
      const response = await fetch(`/api/community/posts/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setTitle(data.post.title);
        setContent(data.post.content);
        setCategory(data.post.category);
        setImages(data.post.images || []);
      }
    } catch (error) {
      toast.error('게시글 정보를 불러오는데 실패했습니다.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setLoading(true);
    try {
      const url = postId ? `/api/community/posts/${postId}` : '/api/community/posts';
      const method = postId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category, images }),
      });

      if (response.ok) {
        toast.success(postId ? '수정되었습니다.' : '등록되었습니다.');
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to save post');
      }
    } catch (error) {
      toast.error('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    if (imageInput && !images.includes(imageInput)) {
      setImages([...images, imageInput]);
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-line flex items-center justify-between">
          <h2 className="text-2xl font-black text-obsidian tracking-tight">
            {postId ? '이야기 수정하기' : '소중한 이야기 나누기'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label="닫기">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {fetching ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-obsidian" />
            <p className="font-bold text-slate/60 uppercase tracking-widest text-xs">Loading Post Data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black text-obsidian uppercase tracking-widest">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                      category === cat.id 
                        ? 'bg-obsidian text-white shadow-lg' 
                        : 'bg-mist text-slate hover:bg-line/20'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-obsidian uppercase tracking-widest">제목</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="h-16 rounded-2xl border-line text-lg font-bold px-6"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-obsidian uppercase tracking-widest">내용</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="어떤 이야기를 나누고 싶으신가요?"
                className="w-full min-h-[300px] rounded-[32px] border border-line p-8 text-obsidian font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-chapter-accent/20 transition-all"
                required
              />
            </div>

            <div className="space-y-4 pb-4">
              <label className="text-xs font-black text-obsidian uppercase tracking-widest">이미지 추가 (URL)</label>
              <div className="flex gap-2">
                <Input 
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="이미지 주소를 입력하세요"
                  className="h-14 rounded-2xl border-line"
                />
                <Button type="button" onClick={addImage} className="h-14 px-6 rounded-2xl bg-mist text-obsidian hover:bg-line/20" aria-label="이미지 추가">
                  <ImageIcon className="w-5 h-5" />
                </Button>
              </div>
              
              {images.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-line group">
                      <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={url} alt="Uploaded" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="이미지 삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}

        <div className="p-8 bg-mist/30 border-t border-line flex gap-4">
          <Button variant="outline" onClick={onClose} className="h-16 px-8 rounded-2xl border-line font-bold flex-1">
            취소
          </Button>
          <Button 
            disabled={loading || !title || !content} 
            onClick={handleSubmit}
            className="h-16 px-12 rounded-2xl bg-chapter-accent text-white font-black flex-1 shadow-xl shadow-chapter-accent/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 mr-2" /> {postId ? '수정 완료' : '이야기 등록'}</>}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
