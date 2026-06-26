'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Heart, 
  Eye, 
  Filter,
  MoreVertical,
  User,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Image from 'next/image';

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
  comments: any[];
  createdAt: string;
}

interface SquareBoardProps {
  onPostSelect: (postId: string) => void;
  onPostCreate: () => void;
}

export default function SquareBoard({ onPostSelect, onPostCreate }: SquareBoardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'knowhow', label: '영업 노하우' },
    { id: 'knowledge', label: '제품 지식' },
    { id: 'question', label: '질문/답변' },
    { id: 'daily', label: '일상' },
  ];

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const categoryParam = activeCategory !== 'all' ? `?category=${activeCategory}` : '';
      const response = await fetch(`/api/navigator/posts${categoryParam}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.authorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryLabel = (cat: string) => {
    return categories.find(c => c.id === cat)?.label || '기타';
  };

  return (
    <div className="space-y-8">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/60" />
          <Input 
            type="text" 
            placeholder="제목이나 작성자로 검색..." 
            className="pl-12 h-12 rounded-2xl border-line bg-white focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-mist/50 p-1 rounded-2xl border border-line flex-1 md:flex-none overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-white text-obsidian shadow-sm' 
                    : 'text-slate/60 hover:text-obsidian'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <Button 
            onClick={onPostCreate}
            className="h-12 px-6 rounded-2xl bg-obsidian text-white font-black flex items-center gap-2 hover:scale-[1.02] transition-transform shrink-0 shadow-lg shadow-obsidian/10"
          >
            <Plus className="w-5 h-5" /> 글쓰기
          </Button>
        </div>
      </div>

      {/* Post Grid/List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-obsidian"></div>
          <p className="text-sm font-bold text-slate/60 uppercase tracking-widest">Loading Square Feed...</p>
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={post._id}
              onClick={() => onPostSelect(post._id)}
              className="group bg-white rounded-[32px] border border-line hover:border-chapter-accent hover:shadow-2xl transition-all cursor-pointer overflow-hidden flex flex-col"
            >
              {/* Thumbnail Placeholder or First Image */}
              <div className="relative h-48 bg-mist overflow-hidden">
                {post.images && post.images.length > 0 ? (
                  <Image 
                    src={post.images[0]} 
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-slate/10" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/80 backdrop-blur-md text-obsidian border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {getCategoryLabel(post.category)}
                  </Badge>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col space-y-4">
                <div className="space-y-4">
                  <h3 className="font-serif text-obsidian line-clamp-2 leading-tight group-hover:text-chapter-accent transition-colors text-xl">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate/60 line-clamp-2 font-medium leading-relaxed">
                    {post.content.replace(/<[^>]*>?/gm, '')}
                  </p>
                </div>

                <div className="pt-6 mt-auto flex items-center justify-between border-t border-line/10">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-mist border border-line">
                      {post.authorImage ? (
                        <Image src={post.authorImage} alt={post.authorName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate">
                          {post.authorName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-obsidian">{post.authorName}</p>
                      <p className="text-[10px] font-bold text-slate/40">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate/60">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{post.likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{post.comments?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{post.viewCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-line rounded-[40px] py-24 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-mist rounded-full flex items-center justify-center text-4xl">📭</div>
          <div>
            <h3 className="font-black text-obsidian tracking-tight text-xl">작성된 게시글이 없습니다</h3>
            <p className="text-slate/70 font-bold">첫 번째 노하우를 공유하는 주인공이 되어보세요!</p>
          </div>
          <Button 
            onClick={onPostCreate}
            className="rounded-2xl h-14 px-8 border-obsidian text-obsidian hover:bg-mist"
            variant="outline"
          >
            첫 글 작성하기
          </Button>
        </div>
      )}
    </div>
  );
}
