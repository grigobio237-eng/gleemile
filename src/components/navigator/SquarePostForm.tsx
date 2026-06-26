'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Image as ImageIcon, 
  Send, 
  Trash2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Image from 'next/image';

interface SquarePostFormProps {
  postId?: string; // If provided, edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export default function SquarePostForm({ postId, onClose, onSuccess }: SquarePostFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'knowhow',
    images: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'knowhow', label: '영업 노하우' },
    { id: 'knowledge', label: '제품 지식' },
    { id: 'question', label: '질문/답변' },
    { id: 'daily', label: '일상' },
  ];

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/navigator/posts/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          title: data.title,
          content: data.content,
          category: data.category,
          images: data.images || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch post for edit:', error);
      toast.error('기존 내용을 불러오지 못했습니다.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedImages = [...formData.images];

    try {
      for (const file of Array.from(files)) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('folder', 'navigator_square');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });

        if (response.ok) {
          const data = await response.json();
          uploadedImages.push(data.url);
        } else {
          toast.error(`${file.name} 업로드에 실패했습니다.`);
        }
      }
      setFormData(prev => ({ ...prev, images: uploadedImages }));
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = postId ? `/api/navigator/posts/${postId}` : '/api/navigator/posts';
      const method = postId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(postId ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.');
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || '게시글 처리에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Submit Error:', error);
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-obsidian/40 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-line flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif text-obsidian tracking-tight">
              {postId ? 'Edit Post' : 'New Story'}
            </h2>
            <p className="text-xs font-bold text-slate/40 uppercase tracking-widest">
              Share your professional insight
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-mist rounded-xl flex items-center justify-center text-slate hover:bg-obsidian hover:text-white transition-all"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {/* Category Selector */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-obsidian uppercase tracking-widest ml-1">게시글 분류</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${
                    formData.category === cat.id 
                      ? 'bg-chapter-accent text-white shadow-lg shadow-chapter-accent/20' 
                      : 'bg-mist/50 text-slate hover:bg-mist'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-4">
            <label htmlFor="post-title" className="text-[10px] font-black text-obsidian uppercase tracking-widest ml-1">제목</label>
            <Input 
              id="post-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="게시글 제목을 입력하세요"
              className="h-14 rounded-2xl border-line px-6 font-bold text-lg focus:ring-chapter-accent/20"
            />
          </div>

          {/* Content Area */}
          <div className="space-y-4">
            <label htmlFor="post-content" className="text-[10px] font-black text-obsidian uppercase tracking-widest ml-1">내용 (텍스트 전용)</label>
            <Textarea 
              id="post-content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="네비게이터 동료들과 공유하고 싶은 내용을 자유롭게 작성하세요..."
              className="min-h-[300px] rounded-2xl border-line p-6 font-medium leading-relaxed focus:ring-chapter-accent/20 resize-none"
            />
          </div>

          {/* Image Upload Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black text-obsidian uppercase tracking-widest">사진 첨부</label>
              <span className="text-[10px] font-bold text-slate/40 tracking-wider">최대 5장까지 추천</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-line group">
                  <Image src={img} alt={`upload-${idx}`} fill className="object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {formData.images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-line hover:border-chapter-accent hover:bg-chapter-accent/5 transition-all flex flex-col items-center justify-center text-slate hover:text-chapter-accent group"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chapter-accent"></div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              aria-label="사진 첨부"
              title="사진 첨부"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-8 border-t border-line bg-mist/5 flex gap-4">
          <Button 
            disabled={isSubmitting || isUploading}
            onClick={handleSubmit}
            className="flex-1 h-16 rounded-2xl bg-obsidian text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-obsidian/10 hover:scale-[1.02] transform transition-all group"
          >
            {isSubmitting ? 'Synchronizing...' : (
              <>
                Confirm and Post <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
