import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, FolderOpen, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BlockProps {
  role: string;
}

export function StudyMaterialArchiveBlock({ role }: BlockProps) {
  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-cyan-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">스터디 자료집 아카이브</p>
            <p className="text-[10px] font-bold text-slate-500">주차별 강의/기출문제</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-cyan-200 transition-colors">
          <FolderOpen className="w-8 h-8 text-cyan-400" />
          <div>
            <p className="font-bold text-sm text-obsidian">2주차: CS 네트워크 및 OS</p>
            <p className="text-[10px] text-slate-400">파일 3개 • 어제 업데이트</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-obsidian flex items-center gap-1.5 px-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> 금주 과제 제출 현황판
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg">
              <span className="text-xs font-bold text-slate-700">김현우</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg">
              <span className="text-xs font-bold text-slate-700">이수민</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg">
              <span className="text-xs font-bold text-slate-700">박준호</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg">
              <span className="text-xs font-bold text-slate-700">최유리</span>
              <Badge variant="outline" className="text-[8px] h-4 px-1 bg-slate-100 border-none text-slate-500">미제출</Badge>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
