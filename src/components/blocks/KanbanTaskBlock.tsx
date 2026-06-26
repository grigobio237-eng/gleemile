import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BlockProps {
  role: string;
}

export function KanbanTaskBlock({ role }: BlockProps) {
  const [tasks, setTasks] = useState([
    { id: 1, title: '기획안 초안 작성', status: 'todo', urgent: true },
    { id: 2, title: '디자인 에셋 수집', status: 'in_progress', urgent: false },
    { id: 3, title: '시장 조사 데이터 취합', status: 'done', urgent: false },
  ]);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('taskId', id.toString());
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    const id = parseInt(e.dataTransfer.getData('taskId'));
    setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const Column = ({ title, status }: { title: string, status: string }) => (
    <div 
      className="flex-1 min-w-[120px] bg-slate-50 p-2 rounded-xl"
      onDrop={(e) => handleDrop(e, status)}
      onDragOver={handleDragOver}
    >
      <div className="text-xs font-bold text-slate-500 mb-2 px-1">{title}</div>
      <div className="space-y-2">
        {tasks.filter(t => t.status === status).map(t => (
          <div 
            key={t.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, t.id)}
            className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors"
          >
            <div className="flex justify-between items-start gap-1">
              <span className="text-xs font-bold text-obsidian line-clamp-2">{t.title}</span>
              {t.urgent && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1 animate-pulse" />}
            </div>
          </div>
        ))}
        <button className="w-full py-1 text-xs text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
          + 추가
        </button>
      </div>
    </div>
  );

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-obsidian leading-tight">주간 태스크 칸반</p>
            <p className="text-[10px] font-bold text-slate-500">모바일에서 길게 눌러 이동하세요</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-indigo-600"><MoreHorizontal className="w-5 h-5" /></button>
      </div>
      <CardContent className="p-3">
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
          <div className="snap-center shrink-0 w-[80%] md:w-auto md:flex-1"><Column title="To Do" status="todo" /></div>
          <div className="snap-center shrink-0 w-[80%] md:w-auto md:flex-1"><Column title="In Progress" status="in_progress" /></div>
          <div className="snap-center shrink-0 w-[80%] md:w-auto md:flex-1"><Column title="Done" status="done" /></div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] text-slate-500 font-bold">마감 임박 태스크</span>
        </div>
      </CardContent>
    </Card>
  );
}
