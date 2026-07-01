'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, MoreHorizontal, Plus, Loader2, ArrowLeft, ArrowRight, CheckCircle2, Trash2, ChevronDown, ChevronUp, UserCircle2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { normalizeRole, isManagerOrHigher } from '@/types/role';

interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  urgent: boolean;
  createdAt: number;
  updatedAt?: any;
  updatedBy?: string;
  createdBy?: string;
}

export default function KanbanPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const { data: session } = useSession();

  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [members, setMembers] = useState<{id: string, name: string}[]>([]);
  const [userRole, setUserRole] = useState('guest');
  const [loading, setLoading] = useState(true);
  
  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskEndDate, setNewTaskEndDate] = useState('');
  const [newTaskUrgent, setNewTaskUrgent] = useState(false);
  
  // 기간 필터 상태: 'week' (7일), 'month' (30일), 'year' (365일)
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    if (!teamId || !session?.user?.id) return;

    // 역할 및 멤버 가져오기
    const fetchTeamData = async () => {
      try {
        const myMemberRef = doc(db, `teams/${teamId}/member_summaries/${session.user.id}`);
        const mySnap = await getDoc(myMemberRef);
        if (mySnap.exists()) {
          setUserRole(mySnap.data().role);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTeamData();

    // 접속 시 읽음 처리 (Mount)
    const updateLastRead = async () => {
      try {
        await setDoc(doc(db, `teams/${teamId}/memberMeta`, session.user.id), {
          lastReadKanbanAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Failed to update lastReadKanbanAt", error);
      }
    };
    updateLastRead();

    setLoading(true);
    let days = 7;
    if (dateFilter === 'month') days = 30;
    if (dateFilter === 'year') days = 365;
    
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const tasksRef = collection(db, `teams/${teamId}/kanban_tasks`);
    const q = query(tasksRef, where('createdAt', '>=', cutoffTime));

    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KanbanTask[];
      
      fetchedTasks.sort((a, b) => b.createdAt - a.createdAt);
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error("업무 로드 에러:", error);
      setLoading(false);
    });

    const membersRef = collection(db, `teams/${teamId}/member_summaries`);
    const unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
      const fetchedMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setMembers(fetchedMembers);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeMembers();
      updateLastRead();
    };
  }, [teamId, dateFilter, session?.user?.id]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!id || !teamId || !session?.user?.id) return;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    try {
      const taskRef = doc(db, `teams/${teamId}/kanban_tasks`, id);
      await updateDoc(taskRef, { 
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: session.user.id
      });
    } catch (error) {
      console.error("상태 업데이트 실패:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !teamId || !session?.user?.id) return;
    
    try {
      let assigneeName = '';
      if (newTaskAssignee) {
        const member = members.find(m => m.id === newTaskAssignee);
        if (member) assigneeName = member.name;
      }

      const tasksRef = collection(db, `teams/${teamId}/kanban_tasks`);
      await addDoc(tasksRef, {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        assigneeId: newTaskAssignee,
        assigneeName: assigneeName,
        startDate: newTaskStartDate,
        endDate: newTaskEndDate,
        status: 'todo',
        urgent: newTaskUrgent,
        createdAt: Date.now(),
        updatedAt: serverTimestamp(),
        updatedBy: session.user.id,
        createdBy: session.user.id
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssignee('');
      setNewTaskStartDate('');
      setNewTaskEndDate('');
      setNewTaskUrgent(false);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("업무 추가 실패:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('정말로 이 업무를 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, `teams/${teamId}/kanban_tasks`, id));
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const TaskCard = ({ task }: { task: KanbanTask }) => {
    const canDelete = task.createdBy === session?.user?.id || isManagerOrHigher(userRole) || !task.createdBy;

    return (
      <div 
        onClick={() => { setSelectedTask(task); setIsDetailModalOpen(true); }}
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col gap-3 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-start gap-2">
              <span className="text-sm font-bold text-obsidian leading-relaxed">{task.title}</span>
              {(() => {
                let isUrgent = task.urgent;
                if (!isUrgent && task.endDate && task.status !== 'done') {
                  const endDate = new Date(task.endDate);
                  endDate.setHours(23, 59, 59, 999);
                  const diffDays = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                  if (diffDays <= 2) isUrgent = true;
                }
                return isUrgent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-1.5 animate-pulse shadow-sm" title="긴급/마감임박" />
                ) : null;
              })()}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {task.assigneeName && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  <UserCircle2 className="w-3.5 h-3.5" />
                  {task.assigneeName}
                </div>
              )}
              {(task.startDate || task.endDate) && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {task.startDate || '?'} ~ {task.endDate || '?'}
                </div>
              )}
            </div>
          </div>
          
          {/* 상태 변경 드롭다운 버튼 */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-lg border border-slate-100">
                {task.status !== 'todo' && (
                  <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, 'todo')} className="text-xs font-bold py-2.5 cursor-pointer rounded-lg hover:bg-slate-50">
                    <LayoutDashboard className="w-3.5 h-3.5 mr-2 text-slate-400" /> To Do로 이동
                  </DropdownMenuItem>
                )}
                {task.status !== 'in_progress' && (
                  <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, 'in_progress')} className="text-xs font-bold py-2.5 cursor-pointer rounded-lg hover:bg-indigo-50 text-indigo-700">
                    <ArrowRight className="w-3.5 h-3.5 mr-2 text-indigo-500" /> 진행 중으로 이동
                  </DropdownMenuItem>
                )}
                {task.status !== 'done' && (
                  <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, 'done')} className="text-xs font-bold py-2.5 cursor-pointer rounded-lg hover:bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" /> 완료로 이동
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-xs font-bold py-2.5 cursor-pointer rounded-lg hover:bg-red-50 text-red-600">
                      <Trash2 className="w-3.5 h-3.5 mr-2 text-red-500" /> 업무 삭제
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* 헤더 네비게이션 */}
      <div className="bg-white border-b border-line sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push(`/mile/${teamId}/dashboard`)}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-black text-lg text-obsidian flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                업무현황
              </h1>
              <p className="text-xs font-bold text-slate-400 hidden sm:block">투명한 팀 공용 할 일 보드</p>
            </div>
          </div>

          {/* 날짜 선택 필터 */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[
              { label: '주간', value: 'week' },
              { label: '월간', value: 'month' },
              { label: '연간', value: 'year' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setDateFilter(tab.value as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  dateFilter === tab.value
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-obsidian hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        
        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-14 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm mb-6">
            <TabsTrigger value="todo" className="rounded-xl text-sm font-bold data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none transition-all">
              할 일 <span className="ml-1.5 bg-white text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px]">{tasks.filter(t => t.status === 'todo').length}</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="rounded-xl text-sm font-bold data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none transition-all">
              진행 중 <span className="ml-1.5 bg-white text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px]">{tasks.filter(t => t.status === 'in_progress').length}</span>
            </TabsTrigger>
            <TabsTrigger value="done" className="rounded-xl text-sm font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none transition-all">
              완료 <span className="ml-1.5 bg-white text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">{tasks.filter(t => t.status === 'done').length}</span>
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : (
            <>
              <TabsContent value="todo" className="space-y-3 mt-0 outline-none">
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                    <button className="w-full mb-4 py-3 text-sm text-indigo-500 font-bold bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 shadow-sm">
                      <Plus className="w-4 h-4" /> 새로운 업무 추가
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl p-6">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-black text-obsidian flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                        새로운 업무 추가
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">업무 제목</label>
                        <input 
                          type="text" 
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="예: 기획안 초안 작성 완료하기" 
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.nativeEvent.isComposing && newTaskTitle.trim()) {
                              e.preventDefault();
                              handleAddTask();
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">세부사항 <span className="font-normal text-slate-400">(선택)</span></label>
                        <textarea
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="업무에 대한 대략적인 설명이나 링크 등을 남겨주세요."
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium h-24 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500">시작일 <span className="font-normal text-slate-400">(선택)</span></label>
                          <input 
                            type="date" 
                            value={newTaskStartDate}
                            onChange={(e) => setNewTaskStartDate(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500">종료일 <span className="font-normal text-slate-400">(선택)</span></label>
                          <input 
                            type="date" 
                            value={newTaskEndDate}
                            onChange={(e) => setNewTaskEndDate(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">담당자 지정 <span className="font-normal text-slate-400">(선택)</span></label>
                        <select
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium bg-white"
                        >
                          <option value="">담당자 없음</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer bg-red-50 p-3 rounded-xl border border-red-100 mt-2">
                        <input 
                          type="checkbox" 
                          checked={newTaskUrgent}
                          onChange={(e) => setNewTaskUrgent(e.target.checked)}
                          className="w-4 h-4 rounded border-red-300 text-red-500 focus:ring-red-500 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-red-700">마감 임박 / 긴급 업무 (🔴 표시)</span>
                      </label>
                    </div>
                    <button 
                      onClick={handleAddTask}
                      disabled={!newTaskTitle.trim()}
                      className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      업무 등록하기
                    </button>
                  </DialogContent>
                </Dialog>

                {tasks.filter(t => t.status === 'todo').length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold bg-white rounded-xl border border-dashed border-slate-200">
                    해야 할 업무가 없습니다.
                  </div>
                )}
                {tasks.filter(t => t.status === 'todo').map(t => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </TabsContent>

              <TabsContent value="in_progress" className="space-y-3 mt-0 outline-none">
                {tasks.filter(t => t.status === 'in_progress').length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold bg-white rounded-xl border border-dashed border-slate-200">
                    현재 진행 중인 업무가 없습니다.
                  </div>
                )}
                {tasks.filter(t => t.status === 'in_progress').map(t => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </TabsContent>

              <TabsContent value="done" className="space-y-3 mt-0 outline-none">
                {tasks.filter(t => t.status === 'done').length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold bg-white rounded-xl border border-dashed border-slate-200">
                    완료된 업무가 없습니다.
                  </div>
                )}
                {tasks.filter(t => t.status === 'done').map(t => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </TabsContent>
            </>
          )}
        </Tabs>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-slate-600 font-bold">긴급 / 마감 임박 상태</span>
          </div>
        </div>

      </div>

      {/* 업무 상세 조회 모달 */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="w-[90vw] max-w-lg rounded-2xl p-0 overflow-hidden bg-white">
          {selectedTask && (
            <>
              <DialogHeader className="p-6 pb-0">
                <div className="flex items-start justify-between gap-4 pr-6">
                  <DialogTitle className="text-xl font-black text-obsidian leading-relaxed text-left">
                    {selectedTask.title}
                  </DialogTitle>
                </div>
                {(() => {
                  let isUrgent = selectedTask.urgent;
                  if (!isUrgent && selectedTask.endDate && selectedTask.status !== 'done') {
                    const endDate = new Date(selectedTask.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    const diffDays = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                    if (diffDays <= 2) isUrgent = true;
                  }
                  return isUrgent ? (
                    <div className="mt-3 flex items-center">
                      <div className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-full flex items-center gap-1.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        긴급 / 마감임박
                      </div>
                    </div>
                  ) : null;
                })()}
              </DialogHeader>
              <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-4">
                  {selectedTask.assigneeName && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400">담당자</p>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                        <UserCircle2 className="w-4 h-4" />
                        {selectedTask.assigneeName}
                      </div>
                    </div>
                  )}
                  {(selectedTask.startDate || selectedTask.endDate) && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400">일정</p>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {selectedTask.startDate || '?'} ~ {selectedTask.endDate || '?'}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400">세부사항</p>
                  {selectedTask.description ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 font-medium whitespace-pre-wrap border border-slate-100 leading-relaxed max-h-[30vh] overflow-y-auto">
                      {selectedTask.description}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100">작성된 세부사항이 없습니다.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
