'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Copy, Users, Shield, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { assignMemberRole } from '@/lib/firebase/teamService';
import { toast } from 'sonner';
import { IFirestoreTeamMember } from '@/types/firebase';

interface TeamInfo {
  team: {
    _id: string;
    teamName: string;
    teamCode: string;
    category: string;
  };
  membership: {
    role: string;
  };
}

export default function TeamSettingsClient({ teamInfo, currentUserId }: { teamInfo: TeamInfo; currentUserId: string }) {
  const [members, setMembers] = useState<IFirestoreTeamMember[]>([]);
  const isDirector = teamInfo.membership.role === 'director';

  useEffect(() => {
    // 실시간 멤버 목록 구독
    const q = query(collection(db, 'team_members'), where('teamId', '==', teamInfo.team._id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: IFirestoreTeamMember[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as IFirestoreTeamMember);
      });
      // 방장 -> 임원 -> 방원 -> 참관인 순 정렬
      const roleOrder = { director: 1, manager: 2, member: 3, supporter: 4 };
      fetched.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
      setMembers(fetched);
    });

    return () => unsubscribe();
  }, [teamInfo.team._id]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(teamInfo.team.teamCode);
      toast.success('초대 코드가 클립보드에 복사되었습니다.');
    } catch (e) {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'manager' | 'member' | 'supporter') => {
    if (!isDirector) {
      toast.error('방장만이 등급을 변경할 수 있습니다.');
      return;
    }
    
    try {
      await assignMemberRole(teamInfo.team._id, targetUserId, newRole, currentUserId);
      toast.success('멤버 등급이 성공적으로 변경되었습니다.');
    } catch (error: any) {
      toast.error(error.message || '등급 변경에 실패했습니다.');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'director': return <Shield className="w-4 h-4 text-purple-600" />;
      case 'manager': return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'supporter': return <Shield className="w-4 h-4 text-slate-400" />;
      default: return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:py-8 space-y-6 pb-20">
      
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/mile/team/${teamInfo.team._id}`} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-obsidian tracking-tight">모임 관제탑</h1>
          <p className="text-xs font-bold text-slate-500">방장 및 임원 전용 설정 페이지</p>
        </div>
      </div>

      {/* 초대 코드 위젯 */}
      <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-indigo-900 to-obsidian overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-left text-white">
            <h2 className="text-sm font-bold text-indigo-200 mb-1 tracking-wider uppercase">초대 코드 (Invite Code)</h2>
            <div className="text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100">
              {teamInfo.team.teamCode}
            </div>
            <p className="text-xs text-indigo-200/80 mt-2">이 코드를 공유하여 새로운 멤버를 초대하세요.</p>
          </div>
          <button 
            onClick={handleCopyCode}
            className="w-full md:w-auto px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center justify-center gap-2 text-white font-bold text-sm backdrop-blur-sm group"
          >
            <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>코드 복사하기</span>
          </button>
        </CardContent>
      </Card>

      {/* 멤버 명단 테이블 */}
      <Card className="rounded-2xl border-none shadow-lg bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-black text-obsidian text-sm">멤버 권한 관리</h3>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-line">
            총 {members.length}명
          </span>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-obsidian text-sm">
                        {/* 실제 프로덕션에서는 users/{userId}를 조인하거나 멤버 문서에 name 복제 필요 */}
                        User_{member.userId.substring(0, 4)}
                      </p>
                      {currentUserId === member.userId && (
                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase">Me</span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mt-0.5 flex items-center gap-1">
                      {getRoleIcon(member.role)} {member.role}
                    </p>
                  </div>
                </div>
                
                {/* 권한 위임 드롭다운 */}
                {member.role !== 'director' && (
                  <select 
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as any)}
                    disabled={!isDirector}
                    className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <option value="manager">임원 (Manager)</option>
                    <option value="member">방원 (Member)</option>
                    <option value="supporter">참관인 (Supporter)</option>
                  </select>
                )}
                {member.role === 'director' && (
                  <span className="text-xs font-black text-purple-600 px-2 py-1 bg-purple-50 rounded-lg">
                    방장 (Director)
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
