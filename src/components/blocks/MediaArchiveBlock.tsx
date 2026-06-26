import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Film, PlayCircle, FileText, Music, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockProps {
  role: string;
}

export function MediaArchiveBlock({ role }: BlockProps) {
  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">합주 음원/영상 아카이브</p>
            <p className="text-[10px] font-bold text-slate-500">최근 업로드 된 미디어</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2 rounded-lg border-red-200 text-red-600 hover:bg-red-50">
          + 업로드
        </Button>
      </div>
      <CardContent className="p-3 space-y-3">
        
        {/* Item 1 */}
        <div className="group bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-red-200 transition-colors">
          <div className="flex gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <PlayCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-sm text-obsidian line-clamp-1">240625_합주_Take3.mp4</p>
              <p className="text-[10px] text-slate-400 mt-0.5">김드럼 업로드 • 용량 45MB</p>
            </div>
          </div>
          {/* Timeline comment */}
          <div className="bg-white p-2 rounded-lg border border-slate-200 mt-2">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 font-medium">
                <span className="text-red-500 font-bold mr-1">[01:23]</span>
                여기 코러스 넘어갈 때 베이스 살짝 밀리는 듯? 다음 합주 때 맞춰보자!
              </p>
            </div>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-red-200 transition-colors">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-xs text-obsidian">신곡_기타프로_최종.pdf</p>
            <p className="text-[10px] text-slate-400">이보컬 업로드</p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
