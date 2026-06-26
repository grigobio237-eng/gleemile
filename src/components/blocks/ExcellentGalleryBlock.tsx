import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Heart, Download, Crown } from 'lucide-react';

interface BlockProps {
  role: string;
}

export function ExcellentGalleryBlock({ role }: BlockProps) {
  const [likes, setLikes] = useState([12, 5, 8]);
  const [liked, setLiked] = useState([true, false, false]);

  const toggleLike = (index: number) => {
    const newLiked = [...liked];
    const newLikes = [...likes];
    if (newLiked[index]) {
      newLikes[index]--;
    } else {
      newLikes[index]++;
    }
    newLiked[index] = !newLiked[index];
    setLiked(newLiked);
    setLikes(newLikes);
  };

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-fuchsia-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-fuchsia-500 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">우수 갤러리 피드</p>
            <p className="text-[10px] font-bold text-slate-500">최다 좋아요 작품</p>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        
        {/* Banner (Most Liked) */}
        <div className="relative aspect-video bg-slate-800 w-full overflow-hidden group">
          <img src="https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80&w=600" alt="Best Gallery" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[10px] font-bold text-white">이달의 베스트 작품</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
            <div>
              <p className="text-white font-bold text-sm drop-shadow-md">추상화 실습 결과물</p>
              <p className="text-white/80 text-[10px] drop-shadow-md">작성자: 김민지</p>
            </div>
            <button onClick={() => toggleLike(0)} className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full hover:bg-white/30 transition-colors">
              <Heart className={`w-4 h-4 ${liked[0] ? 'fill-fuchsia-500 text-fuchsia-500' : 'text-white'}`} />
              <span className="text-xs font-bold text-white">{likes[0]}</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-white">
          <div className="relative aspect-square bg-slate-100 group overflow-hidden">
            <img src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=300" alt="Thumb 1" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button onClick={() => toggleLike(1)} className="p-2 bg-white/20 rounded-full hover:bg-fuchsia-500 transition-colors text-white">
                <Heart className={`w-4 h-4 ${liked[1] ? 'fill-white' : ''}`} />
              </button>
              <button className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors text-white">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="relative aspect-square bg-slate-100 group overflow-hidden">
            <img src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=300" alt="Thumb 2" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button onClick={() => toggleLike(2)} className="p-2 bg-white/20 rounded-full hover:bg-fuchsia-500 transition-colors text-white">
                <Heart className={`w-4 h-4 ${liked[2] ? 'fill-white' : ''}`} />
              </button>
              <button className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors text-white">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
