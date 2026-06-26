'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Users, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { createTeamWithUniqueCode, joinTeamWithCode } from '@/lib/firebase/teamService';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface TeamOnboardingFormProps {
  userId: string;
}

export function TeamOnboardingForm({ userId }: TeamOnboardingFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('join');
  const [isLoading, setIsLoading] = useState(false);

  // Create Form State
  const [teamName, setTeamName] = useState('');
  const [category, setCategory] = useState('hobby'); // 'sports' | 'hobby' | 'study' | 'business'

  // Join Form State
  const [teamCode, setTeamCode] = useState('');
  const [role, setRole] = useState<'member' | 'supporter'>('member');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await createTeamWithUniqueCode(userId, teamName, category);
      toast.success(`'${teamName}' 개설 완료! 초대 코드는 [${result.teamCode}] 입니다.`);
      router.push(`/mile/team/${result.teamId}`);
    } catch (error: any) {
      toast.error(error.message || '팀 개설에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) return;

    setIsLoading(true);
    try {
      const teamId = await joinTeamWithCode(userId, teamCode, role);
      toast.success('팀에 성공적으로 합류했습니다!');
      router.push(`/mile/team/${teamId}`);
    } catch (error: any) {
      toast.error(error.message || '가입에 실패했습니다. 코드를 다시 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-2xl bg-white overflow-hidden rounded-[2rem]">
      <div className="p-8 pb-6 text-center">
        <h2 className="text-2xl font-black text-obsidian tracking-tight mb-2">
          글리마일에 오신 것을<br/>환영합니다
        </h2>
        <p className="text-sm text-slate-500 font-medium">새로운 모임을 시작하거나 합류해보세요.</p>
      </div>

      {/* 럭셔리 탭 전환 */}
      <div className="px-6 mb-6">
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl relative">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all z-10 ${activeTab === 'join' ? 'text-obsidian' : 'text-slate-400 hover:text-slate-600'}`}
          >
            초대 코드 입력
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all z-10 ${activeTab === 'create' ? 'text-obsidian' : 'text-slate-400 hover:text-slate-600'}`}
          >
            새 팀 개설하기
          </button>
          {/* 탭 활성 인디케이터 (Framer Motion) */}
          <motion.div
            layoutId="activeTabIndicator"
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white shadow-sm rounded-xl"
            initial={false}
            animate={{ left: activeTab === 'join' ? '6px' : 'calc(50%)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      <CardContent className="px-6 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'join' ? (
            <motion.form 
              key="join"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleJoinTeam}
              className="space-y-6"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">초대 코드</label>
                <input 
                  type="text" 
                  placeholder="6자리 대문자/숫자 입력"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-base font-bold text-obsidian uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all outline-none"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">참여 역할 선택</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('member')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${role === 'member' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <User className={`w-6 h-6 mb-2 ${role === 'member' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${role === 'member' ? 'text-indigo-900' : 'text-slate-500'}`}>방원</span>
                    <span className="text-[10px] text-slate-400 mt-1">실제 참여 멤버</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('supporter')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${role === 'supporter' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <ShieldCheck className={`w-6 h-6 mb-2 ${role === 'supporter' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${role === 'supporter' ? 'text-indigo-900' : 'text-slate-500'}`}>참관인</span>
                    <span className="text-[10px] text-slate-400 mt-1">학부모 / 관전자</span>
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || teamCode.length < 6}
                className="w-full h-14 rounded-2xl bg-obsidian hover:bg-slate-800 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    합류하기 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.form>
          ) : (
            <motion.form 
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleCreateTeam}
              className="space-y-6"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">모임 이름</label>
                <input 
                  type="text" 
                  placeholder="멋진 모임 이름을 입력하세요"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-base font-bold text-obsidian placeholder:font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all outline-none"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">모임 성격</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sports', label: '스포츠 팀' },
                    { id: 'study', label: '스터디/클래스' },
                    { id: 'hobby', label: '취미/동호회' },
                    { id: 'business', label: '업무/프로젝트' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${category === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !teamName.trim()}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 개설하기
                  </>
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
